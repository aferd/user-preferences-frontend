import React from 'react';
import { Skeleton } from '@redhat-cloud-services/frontend-components/Skeleton';
import { getEmailSchema } from '../redux/actions/email-actions';
import { loaderField } from './constants';

export const getSchema = (app) =>
  !app || !app.loaded ? loaderField : app.schema;

const withNegatedFunction = (booleanFunctions) => {
  return {
    ...booleanFunctions,
    ...Object.fromEntries(
      Object.keys(booleanFunctions).map((methodName) => [
        `!${methodName}`,
        (...args) => !booleanFunctions[methodName](...args),
      ])
    ),
  };
};

const hasLoosePermissions = async (
  permissions = [],
  { isKesselEnabled = false, kesselMappedPermissions = [] } = {}
) => {
  if (isKesselEnabled) {
    const { mapV1PermissionToKesselRelation } = await import(
      './kesselWorkspaceRelations'
    );

    return permissions.some((v1Permission) => {
      const kesselRelation = mapV1PermissionToKesselRelation(v1Permission);

      if (kesselRelation === 'UNMIGRATED') {
        return true;
      }

      if (kesselRelation === null) {
        return false;
      }

      return !!kesselMappedPermissions.find(
        ({ permission }) => permission === v1Permission
      );
    });
  } else {
    const userPermissions = await insights.chrome.getUserPermissions();
    return permissions.some((item) =>
      userPermissions?.find(({ permission }) => permission === item)
    );
  }
};

export const visibilityFunctions = withNegatedFunction({
  ...insights.chrome?.visibilityFunctions,
  hasLoosePermissions,
});

export const calculatePermissions = (permissions, rbacContext = {}) =>
  Promise.all(
    [permissions].flat().map(({ method, args }) => {
      const fn = visibilityFunctions?.[method];
      if (!fn) return false;
      const isPermissionCheck =
        method === 'hasLoosePermissions' || method === '!hasLoosePermissions';
      return isPermissionCheck
        ? fn(...(args || []), rbacContext)
        : fn(...(args || []));
    })
  ).then((visibility) => visibility.every(Boolean));

export const calculateEmailConfig = (
  { 'email-preference': config } = { 'email-preference': {} },
  dispatch = () => {},
  rbacContext = {}
) =>
  Object.entries(config)
    .map(
      ([
        key,
        { permissions, url, apiName, apiVersion, localFile, ...rest },
      ]) => {
        const isVisible = permissions
          ? calculatePermissions(permissions, rbacContext)
          : true;
        (async () => {
          const schemaVisible = await Promise.resolve(isVisible);
          if (schemaVisible) {
            if (localFile) {
              const newMapper = (await import(`../config/${localFile}`))
                .default;
              dispatch(getEmailSchema({ schema: newMapper, application: key }));
            } else {
              dispatch(
                getEmailSchema({ application: key, url, apiName, apiVersion })
              );
            }
          } else {
            dispatch(
              getEmailSchema({
                schema: Promise.resolve(),
                application: key,
              })
            );
          }
        })();

        return {
          [key]: {
            localFile,
            isVisible,
            url,
            apiName,
            apiVersion,
            ...rest,
          },
        };
      }
    )
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

export const getSection = (
  key,
  schema = {},
  storeSchema,
  success = () => {}
) => {
  if (schema.isVisible === true) {
    return {
      label: schema?.title,
      name: key,
      fields: schema?.fields || getSchema(storeSchema),
    };
  } else {
    Promise.resolve(schema.isVisible).then(success);

    return {
      label: <Skeleton />,
      name: key,
      fields: loaderField,
    };
  }
};

export const concatApps = (apps = []) => {
  return `${apps.slice(0, apps.length - (apps.length > 1)).join(', ')}${
    apps.length >= 2 ? ` and ${apps[apps.length - 1]}` : ''
  }`;
};

export const distributeSuccessError = (promisses = []) => {
  return Promise.allSettled(promisses.map(({ promise }) => promise)).then(
    (apps) => {
      return apps.reduce(
        (acc, { value }, index) => ({
          ...acc,
          [value ? 'success' : 'error']: [
            ...acc[value ? 'success' : 'error'],
            promisses[index]?.meta?.title,
          ],
        }),
        { success: [], error: [] }
      );
    }
  );
};

export const dispatchMessages = (
  addNotification = () => undefined,
  success = [],
  error = []
) => {
  if (error.length !== 0 && success.length !== 0) {
    addNotification({
      dismissable: false,
      variant: 'success',
      title: `Email preferences for ${concatApps(success)} successfully saved`,
    });

    addNotification({
      dismissable: false,
      variant: 'danger',
      title: `Email preferences for ${concatApps(error)} unsuccessfully saved`,
    });
  }

  if (error.length === 0 && success.length !== 0) {
    addNotification({
      dismissable: false,
      variant: 'success',
      title: 'Preferences successfully saved',
    });
  }

  if (error.length !== 0 && success.length === 0) {
    addNotification({
      dismissable: false,
      variant: 'danger',
      title: 'Preferences unsuccessfully saved',
    });
  }
};
