import React, { useEffect, useRef, useState } from 'react';
import omit from 'lodash/omit';
import { useFlag } from '@unleash/proxy-client-react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useKesselRbacAccess } from '../../Utilities/kesselRbac';
import { useCustomThreshold } from '../../Utilities/hooks/useCustomThreshold';
import { useIsOrgAdmin } from '../../Utilities/hooks/useIsOrgAdmin';
import { FormRenderer } from '@data-driven-forms/react-form-renderer';
import { componentMapper } from '@data-driven-forms/pf4-component-mapper';
import { Bullseye, Button, Popover, Spinner } from '@patternfly/react-core';
import {
  SeverityCriticalIcon,
  SeverityImportantIcon,
  SeverityMinorIcon,
  SeverityModerateIcon,
  SeverityNoneIcon,
} from '@patternfly/react-icons';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { useNotifications } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { ScalprumComponent } from '@scalprum/react-core';
import { useDispatch, useSelector } from 'react-redux';
import { useStore } from 'react-redux';
import {
  getNotificationsSchema,
  saveNotificationValues,
} from '../../redux/actions/notifications-actions';
import { saveEmailValues } from '../../redux/actions/email-actions';
import { calculateEmailConfig } from '../../Utilities/functions';
import {
  BULK_SELECT_BUTTON,
  BulkSelectButton,
  DATA_LIST,
  DESCRIPTIVE_CHECKBOX,
  DataListLayout,
  DescriptiveCheckbox,
  FORM_TABS,
  INPUT_GROUP,
  InputGroup,
  LOADER,
  Loader,
  NOTIFICATION_EVENT_CARD,
  NotificationEventCard,
  TAB_GROUP,
} from '../../SmartComponents/FormComponents';
import { stripSeverityGridUiFromEventTypes } from '../../SmartComponents/FormComponents/severityUtils';
import { PLATFORM_NOTIFICATIONS_SEVERITY_FLAG } from '../../Utilities/featureFlags';
import config from '../../config/config.json';
import FormTabs from './Tabs';
import FormTabGroup from './TabGroup';
import { prepareFields } from './utils';
import FormTemplate from './NotificationTemplate';
import './notifications.scss';
import { useLoadModule, useRemoteHook } from '@scalprum/react-core';

const SEVERITY_LEARN_MORE_URL =
  'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/html-single/configuring_notifications_on_the_red_hat_hybrid_cloud_console/index#con-notif-severity_notif-config-intro';

const severityTerms = [
  {
    label: 'Critical',
    icon: SeverityCriticalIcon,
    color: 'var(--pf-t--global--icon--color--severity--critical--default)',
    description:
      'Urgent notification about an event with impact to your systems',
  },
  {
    label: 'Important',
    icon: SeverityImportantIcon,
    color: 'var(--pf-t--global--icon--color--severity--important--default)',
    description: 'Errors or other events that may impact your systems',
  },
  {
    label: 'Moderate',
    icon: SeverityModerateIcon,
    color: 'var(--pf-t--global--icon--color--severity--moderate--default)',
    description: 'Warning',
  },
  {
    label: 'Low',
    icon: SeverityMinorIcon,
    color: 'var(--pf-t--global--icon--color--severity--minor--default)',
    description: 'Information only',
  },
  {
    label: 'None',
    icon: SeverityNoneIcon,
    color: 'var(--pf-t--global--icon--color--severity--none--default)',
    description: 'No security-related impact for this notification',
  },
];

/* eslint-disable react/prop-types */
const SeverityHelpTerm = ({
  label,
  icon: SeverityIcon,
  color,
  description,
}) => (
  <Popover
    headerContent={
      <span className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-flex-nowrap">
        <SeverityIcon
          color={color}
          className="pf-v6-u-display-inline-flex pf-v6-u-flex-shrink-0"
        />
        <span className="pf-v6-u-m-0 pf-v6-u-ml-sm">{label} severity</span>
      </span>
    }
    bodyContent={description}
    footerContent={
      <a
        href={SEVERITY_LEARN_MORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more
      </a>
    }
  >
    <Button
      variant="link"
      isInline
      className="pref-notifications--severity-term"
      icon={
        <SeverityIcon
          color={color}
          className="pf-v6-u-display-inline-flex pf-v6-u-flex-shrink-0"
        />
      }
    >
      {label}
    </Button>
  </Popover>
);
/* eslint-enable react/prop-types */

/* eslint-disable react/prop-types */
const NotificationsVAButton = () => {
  const { hookResult: vaHookResult, loading: vaLoading } = useRemoteHook({
    scope: 'virtualAssistant',
    module: './state/globalState',
    importName: 'useVirtualAssistant',
  });

  const [Models] = useLoadModule(
    {
      scope: 'virtualAssistant',
      module: './state/globalState',
      importName: 'Models',
    },
    {}
  );

  return (
    <Button
      onClick={() => {
        if (!vaLoading && Models) {
          const [, setState] = vaHookResult || [];
          setState({
            isOpen: true,
            currentModel: Models?.VA,
            message:
              'Contact my organization administrator to update which notifications I receive',
          });
        }
      }}
      variant="link"
      isInline
    >
      Contact your Organization Administrator
    </Button>
  );
};
/* eslint-enable react/prop-types */

const Notifications = () => {
  const platformNotificationsSeverity = useFlag(
    PLATFORM_NOTIFICATIONS_SEVERITY_FLAG
  );
  const isVAEnabled = useFlag('platform.va.environment.enabled');
  const isV2Org = useFlag('platform.rbac.workspaces');
  const { auth } = useChrome();
  const { permissions: kesselMappedPermissions } = useKesselRbacAccess();
  const { threshold: customThreshold } = useCustomThreshold();
  const { isOrgAdmin } = useIsOrgAdmin();
  const dispatch = useDispatch();
  const { addNotification } = useNotifications();
  const titleRef = useRef(null);
  const [emailConfig, setEmailConfig] = useState({});
  const store = useStore();

  const emailPref = useSelector(({ emailReducer }) => emailReducer);
  const { bundles: notifPref, loaded } = useSelector(
    ({ notificationsReducer }) => ({
      ...notificationsReducer,
      bundles: Object.entries(notificationsReducer?.bundles || {})?.reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value,
        }),
        {}
      ),
    })
  );

  useEffect(() => {
    (async () => {
      await auth.getUser();
      setEmailConfig(
        calculateEmailConfig(config, dispatch, {
          isV2Org,
          kesselMappedPermissions,
        })
      );
      dispatch(getNotificationsSchema());
    })();
  }, []);

  const saveValues = (values, formApi) => {
    const notificationValues = {
      bundles: Object.entries(values.bundles).reduce(
        (acc, [bundleName, bundleData]) => ({
          ...acc,
          [bundleName]: {
            applications: Object.entries(bundleData.applications).reduce(
              (acc, [appName, appData]) => ({
                ...acc,
                [appName]: {
                  eventTypes: stripSeverityGridUiFromEventTypes(
                    omit(appData.eventTypes, BULK_SELECT_BUTTON)
                  ),
                },
              }),
              {}
            ),
          },
        }),
        {}
      ),
    };
    const promises = [dispatch(saveNotificationValues(notificationValues))];
    const submitEmail = formApi.getState().dirtyFields['is_subscribed'];
    // temporary submitting of RHEL Advisor email pref.
    if (submitEmail) {
      const { url, apiName } = emailConfig['advisor'];
      const action = saveEmailValues({
        application: 'advisor',
        values: { is_subscribed: values.is_subscribed },
        url,
        apiName,
      });
      promises.push(dispatch(action));
    }
    Promise.all(promises)
      .then(() => {
        submitEmail &&
          setEmailConfig(
            calculateEmailConfig(config, dispatch, {
              isV2Org,
              kesselMappedPermissions,
            })
          );
        dispatch(getNotificationsSchema());
        addNotification({
          dismissable: true,
          variant: 'success',
          title: 'Notification preferences successfully saved',
        });
      })
      .catch(() => {
        addNotification({
          dismissable: true,
          variant: 'danger',
          title: 'Notification preferences unsuccessfully saved',
        });
      });
  };

  return loaded && Object.values(emailPref).every((value) => value.loaded) ? (
    <div id="notifications-container" className="pref-notifications--container">
      <div className="pref-notifications--wrapper">
        <div id="notifications-grid" className="pref-notifications--grid">
          <div ref={titleRef} className="pref-notifications--head">
            <PageHeader
              title="My Notifications"
              subtitle={
                <>
                  Opt in or out of receiving notifications, and choose how you
                  want to be notified. Your Organization Administrator has
                  configured which notifications you can or can{"'"}t receive on
                  their end.{' '}
                  {isVAEnabled ? (
                    <NotificationsVAButton />
                  ) : (
                    'Contact your Organization Administrator'
                  )}{' '}
                  to have these settings updated.
                  <br></br>
                  {platformNotificationsSeverity && (
                    <>
                      <br />
                      Possible notification severity levels include{' '}
                      {severityTerms.map((term, index) => (
                        <React.Fragment key={term.label}>
                          {index > 0 &&
                            index < severityTerms.length - 1 &&
                            ', '}
                          {index === severityTerms.length - 1 && ', and '}
                          <SeverityHelpTerm {...term} />
                        </React.Fragment>
                      ))}
                      .{' '}
                      <a
                        href={SEVERITY_LEARN_MORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn more
                      </a>
                    </>
                  )}
                </>
              }
            >
              <ScalprumComponent
                module="./ConnectedTimeConfig"
                scope="notifications"
                store={store}
              />
            </PageHeader>
          </div>

          <FormRenderer
            componentMapper={{
              ...componentMapper,
              [DESCRIPTIVE_CHECKBOX]: DescriptiveCheckbox,
              [BULK_SELECT_BUTTON]: BulkSelectButton,
              [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
              [LOADER]: Loader,
              [DATA_LIST]: DataListLayout,
              [INPUT_GROUP]: InputGroup,
              [FORM_TABS]: FormTabs,
              [TAB_GROUP]: FormTabGroup,
            }}
            FormTemplate={FormTemplate}
            schema={{
              fields: [
                {
                  component: FORM_TABS,
                  name: 'notifTabs',
                  titleRef,
                  bundles: notifPref,
                  fields: prepareFields(
                    notifPref,
                    emailPref,
                    emailConfig,
                    platformNotificationsSeverity,
                    customThreshold,
                    isOrgAdmin
                  ),
                },
              ],
            }}
            onSubmit={saveValues}
          />
        </div>
      </div>
    </div>
  ) : (
    <Bullseye>
      <Spinner />
    </Bullseye>
  );
};

export default Notifications;
