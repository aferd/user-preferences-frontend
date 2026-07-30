import React from 'react';
import omit from 'lodash/omit';
import { InfoCircleIcon } from '@patternfly/react-icons';
import {
  BULK_SELECT_BUTTON,
  INPUT_GROUP,
  NOTIFICATION_EVENT_CARD,
  TAB_GROUP,
} from '../../SmartComponents/FormComponents/componentTypes';
import {
  buildBulkSeverityGridValue,
  isEventTypePreferenceOn,
  isSeverityGridValue,
} from '../../SmartComponents/FormComponents/severityUtils';
import {
  CLUSTER_MANAGER_URL,
  isClusterManager,
} from '../../Utilities/clusterManagerConstants';

const readEventTypeFieldValue = (values, field) => {
  const m = field.match(
    /^bundles\[([^\]]+)\]\.applications\[([^\]]+)\]\.eventTypes\[([^\]]+)\]$/
  );
  if (!m) {
    return undefined;
  }
  const [, bundle, app, evt] = m;
  return values?.bundles?.[bundle]?.applications?.[app]?.eventTypes?.[evt];
};

// update bulk select button's state after every change
const afterChange = (formOptions, newValue, bundle, app) => {
  if (!newValue) {
    formOptions.change(
      `bundles[${bundle}].applications[${app}].eventTypes[${BULK_SELECT_BUTTON}]`,
      true
    );
  } else {
    const allChecked = Object.entries(
      formOptions.getState().values.bundles?.[bundle]?.applications?.[app]
        .eventTypes || {}
    ).every(
      ([key, value]) =>
        key === BULK_SELECT_BUTTON || isEventTypePreferenceOn(value)
    );
    if (
      allChecked &&
      ((bundle !== 'rhel' && app !== 'advisor') ||
        formOptions.getState().values['is_subscribed'])
    ) {
      formOptions.change(
        `bundles[${bundle}].applications[${app}].eventTypes[${BULK_SELECT_BUTTON}]`,
        false
      );
    }
  }
};

/**
 * @param {Record<string, unknown>} notifPref
 * @param {Record<string, unknown>} emailPref
 * @param {Record<string, unknown>} emailConfig
 * @param {boolean} [enableSeveritySubscriptionGrid=false] Unleash `platform.notifications.severity` — when true, event types that expose a severity grid render the severity subscription grid component.
 * @param {number} [customThreshold] Custom threshold percentage from org preferences
 * @param {boolean} [isOrgAdmin=false] Whether the user is an organization administrator
 */
export const prepareFields = (
  notifPref,
  emailPref,
  emailConfig,
  enableSeveritySubscriptionGrid = false,
  customThreshold,
  isOrgAdmin = false
) =>
  Object.entries(notifPref).reduce((acc, [bundleKey, bundleData]) => {
    return [
      ...acc,
      {
        title: bundleData?.label,
        name: bundleKey,
        fields: Object.entries(bundleData.applications).reduce(
          (acc, [appKey, appData]) => {
            let selectAllActive = true;
            const fields = [
              ...Object.entries(emailPref).reduce(
                (acc, [emailSectionKey, emailSectionValue]) => [
                  ...acc,
                  ...(emailSectionKey === appKey &&
                  emailConfig[emailSectionKey]?.bundle === bundleKey &&
                  emailSectionValue.schema.length !== 0
                    ? [
                        {
                          label: 'Reports',
                          name: 'email-reports',
                          component: INPUT_GROUP,
                          level: 1,
                          fields: emailSectionValue.schema[0]?.fields?.map(
                            (field) => {
                              selectAllActive =
                                selectAllActive && field.initialValue;
                              return {
                                ...field,
                                afterChange: (formOptions, checked) =>
                                  afterChange(
                                    formOptions,
                                    checked,
                                    bundleKey,
                                    appKey
                                  ),
                              };
                            }
                          ),
                        },
                      ] || []
                    : []),
                ],
                []
              ),
              {
                label: 'Event notifications',
                description: isClusterManager(bundleKey, appKey) ? (
                  <>
                    <InfoCircleIcon
                      color="var(--pf-t--global--icon--color--status--info--default)"
                      style={{ marginRight: 'var(--pf-t--global--spacer--sm)' }}
                    />
                    Preferences for OpenShift notifications are currently being
                    managed for individual clusters in the{' '}
                    <a href={CLUSTER_MANAGER_URL}>Cluster Manager</a> service.
                  </>
                ) : (
                  'Select how would you like to receive notifications for each event.'
                ),
                name: 'event-notifications',
                component: INPUT_GROUP,
                level: 1,
                fields: [
                  ...appData.eventTypes
                    .slice()
                    .sort((a, b) => {
                      // Check if events are threshold-related
                      const aIsCustomThreshold =
                        a.label?.toLowerCase().includes('custom') &&
                        a.label?.toLowerCase().includes('threshold');
                      const bIsCustomThreshold =
                        b.label?.toLowerCase().includes('custom') &&
                        b.label?.toLowerCase().includes('threshold');
                      const aIsThreshold = a.label
                        ?.toLowerCase()
                        .includes('threshold');
                      const bIsThreshold = b.label
                        ?.toLowerCase()
                        .includes('threshold');

                      // If both are threshold events, put regular before custom
                      if (aIsThreshold && bIsThreshold) {
                        if (aIsCustomThreshold && !bIsCustomThreshold) return 1;
                        if (!aIsCustomThreshold && bIsCustomThreshold)
                          return -1;
                      }

                      // Keep original order for non-threshold events
                      return 0;
                    })
                    .map((eventType, idx) => {
                      if (enableSeveritySubscriptionGrid) {
                        // Extract event severity from first field's severities array
                        // Find the enabled (not disabled) severity level
                        let eventSeverity;
                        if (eventType.fields?.[0]?.severities) {
                          const enabledSeverity =
                            eventType.fields[0].severities.find(
                              (s) => !s.disabled && s.name !== 'UNDEFINED'
                            );
                          eventSeverity = enabledSeverity?.name;
                        }

                        // Map fields to simple subscription field structure
                        // Extract just the subscription type (INSTANT, DRAWER, etc.) from the nested path
                        const subscriptionFields = eventType.fields.map((f) => {
                          // Extract subscription type from name like "bundles[...].emailSubscriptionTypes[INSTANT]"
                          const match = f.name?.match(
                            /emailSubscriptionTypes\[([^\]]+)\]/
                          );
                          const subscriptionType = match
                            ? match[1]
                            : f.name || `field-${idx}`;

                          return {
                            name: subscriptionType,
                            label:
                              f.label || f.title || f.name || 'Notification',
                            initialValue: Boolean(f.initialValue),
                            disabled: Boolean(f.isDisabled || f.disabled),
                          };
                        });

                        // Build initial value as simple object {INSTANT: bool, DRAWER: bool}
                        const initialValue = subscriptionFields.reduce(
                          (acc, f) => {
                            acc[f.name] = f.initialValue;
                            selectAllActive = selectAllActive && f.initialValue;
                            return acc;
                          },
                          {}
                        );

                        // Check if this is a custom threshold event and add description/helpText
                        const isCustomThreshold =
                          eventType.label?.toLowerCase().includes('custom') &&
                          eventType.label?.toLowerCase().includes('threshold');

                        const cardProps = {
                          name: `bundles[${bundleKey}].applications[${appKey}].eventTypes[${eventType.name}]`,
                          component: NOTIFICATION_EVENT_CARD,
                          eventName: eventType.name,
                          eventLabel: isCustomThreshold
                            ? 'Usage at custom percentage'
                            : eventType.label,
                          severity: eventSeverity,
                          subscriptionFields,
                          bundle: bundleKey,
                          app: appKey,
                          initialValue,
                          afterChange: (formOptions, checked) =>
                            afterChange(
                              formOptions,
                              checked,
                              bundleKey,
                              appKey
                            ),
                        };

                        // Add custom threshold-specific properties
                        if (
                          isCustomThreshold &&
                          customThreshold !== undefined
                        ) {
                          cardProps.description = `Custom percentage has been set to ${customThreshold}%`;
                          cardProps.helpText = isOrgAdmin
                            ? 'The custom percentage can be updated through Configure Events page.'
                            : 'Please contact your admin if you have any question regarding the custom percentage.';
                        }

                        return cardProps;
                      }
                      // Fallback to old layout when feature flag is off
                      return {
                        label: eventType.label,
                        name: `${eventType.name}-${idx}`,
                        component: INPUT_GROUP,
                        fields: eventType.fields.map((field) => {
                          selectAllActive =
                            selectAllActive && field.initialValue;
                          return {
                            ...omit(field, ['description']),
                            afterChange: (formOptions, checked) =>
                              afterChange(
                                formOptions,
                                checked,
                                bundleKey,
                                appKey
                              ),
                          };
                        }),
                      };
                    }),
                ],
              },
            ];
            return [
              ...acc,
              {
                name: appKey,
                bundle: bundleKey,
                label: appData.label,
                component: TAB_GROUP,
                fields: [
                  {
                    name: `bundles[${bundleKey}].applications[${appKey}].eventTypes[${BULK_SELECT_BUTTON}]`,
                    section: appKey,
                    initialValue: !selectAllActive,
                    component: BULK_SELECT_BUTTON,
                    onClick: (formOptions, input) => {
                      formOptions.batch(() => {
                        const values = formOptions.getState().values;
                        formOptions.getRegisteredFields().forEach((field) => {
                          if (
                            ((field.includes(bundleKey) &&
                              field.includes(appKey)) ||
                              (field === 'is_subscribed' && // a temporary condition for RHEL Advisor email pref.
                                bundleKey === 'rhel' &&
                                appKey == 'advisor')) &&
                            !field.includes(BULK_SELECT_BUTTON)
                          ) {
                            const current = readEventTypeFieldValue(
                              values,
                              field
                            );
                            let next = input.value;
                            if (isSeverityGridValue(current)) {
                              next = buildBulkSeverityGridValue(
                                current,
                                input.value
                              );
                            } else if (current && typeof current === 'object') {
                              // Handle simple object structure {INSTANT: bool, DAILY: bool}
                              next = Object.keys(current).reduce((acc, key) => {
                                acc[key] = input.value;
                                return acc;
                              }, {});
                            }
                            formOptions.change(field, next);
                          }
                        });
                      });
                      input.onChange(!input.value);
                    },
                  },
                  ...fields,
                ],
              },
            ];
          },
          []
        ),
      },
    ];
  }, []);
