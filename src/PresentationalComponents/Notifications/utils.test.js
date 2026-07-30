import { prepareFields } from './utils';
import {
  NOTIFICATION_EVENT_CARD,
  TAB_GROUP,
} from '../../SmartComponents/FormComponents/componentTypes';

describe('prepareFields', () => {
  it('does not emit expandable event card when enableSeveritySubscriptionGrid is false', () => {
    const notifPref = {
      rhel: {
        label: 'RHEL',
        applications: {
          compliance: {
            label: 'Compliance',
            eventTypes: [
              {
                name: 'POLICY_FAILED',
                label: 'Policy failed',
                fields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    severities: [
                      {
                        name: 'CRITICAL',
                        initialValue: false,
                        disabled: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = prepareFields(notifPref, {}, {}, false);
    const tab = result[0].fields[0];
    const eventInput = tab.fields.find((f) => f.name === 'event-notifications');
    const eventField = eventInput.fields[0];
    expect(eventField.component).not.toBe(NOTIFICATION_EVENT_CARD);
  });

  it('converts boolean fields to simple checkbox structure when flag is on', () => {
    const notifPref = {
      rhel: {
        label: 'RHEL',
        applications: {
          repositories: {
            label: 'Repositories',
            eventTypes: [
              {
                name: 'REPOSITORY_CREATED',
                label: 'Repository created',
                fields: [
                  {
                    name: 'bundles[rhel].applications[repositories].eventTypes[REPOSITORY_CREATED].emailSubscriptionTypes[INSTANT]',
                    label: 'Instant notification',
                    initialValue: true,
                    isDisabled: false,
                    severities: [
                      { name: 'CRITICAL', initialValue: false, disabled: true },
                      {
                        name: 'IMPORTANT',
                        initialValue: true,
                        disabled: false,
                      },
                      { name: 'MODERATE', initialValue: false, disabled: true },
                      { name: 'LOW', initialValue: false, disabled: true },
                      { name: 'NONE', initialValue: false, disabled: true },
                      {
                        name: 'UNDEFINED',
                        initialValue: false,
                        disabled: true,
                      },
                    ],
                  },
                  {
                    name: 'bundles[rhel].applications[repositories].eventTypes[REPOSITORY_CREATED].emailSubscriptionTypes[DRAWER]',
                    label: 'Drawer notification',
                    initialValue: false,
                    isDisabled: false,
                    severities: [
                      { name: 'CRITICAL', initialValue: false, disabled: true },
                      {
                        name: 'IMPORTANT',
                        initialValue: false,
                        disabled: false,
                      },
                      { name: 'MODERATE', initialValue: false, disabled: true },
                      { name: 'LOW', initialValue: false, disabled: true },
                      { name: 'NONE', initialValue: false, disabled: true },
                      {
                        name: 'UNDEFINED',
                        initialValue: false,
                        disabled: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = prepareFields(notifPref, {}, {}, true);
    const tab = result[0].fields[0];
    const eventInput = tab.fields.find((f) => f.name === 'event-notifications');
    const cardField = eventInput.fields[0];

    expect(cardField.component).toBe(NOTIFICATION_EVENT_CARD);
    expect(cardField.eventName).toBe('REPOSITORY_CREATED');
    expect(cardField.eventLabel).toBe('Repository created');
    expect(cardField.severity).toBe('IMPORTANT');
    expect(cardField.subscriptionFields).toHaveLength(2);

    // First field: INSTANT
    expect(cardField.subscriptionFields[0].name).toBe('INSTANT');
    expect(cardField.subscriptionFields[0].label).toBe('Instant notification');
    expect(cardField.subscriptionFields[0].initialValue).toBe(true);
    expect(cardField.subscriptionFields[0].disabled).toBe(false);

    // Second field: DRAWER
    expect(cardField.subscriptionFields[1].name).toBe('DRAWER');
    expect(cardField.subscriptionFields[1].label).toBe('Drawer notification');
    expect(cardField.subscriptionFields[1].initialValue).toBe(false);
    expect(cardField.subscriptionFields[1].disabled).toBe(false);

    // Verify initial value structure
    expect(cardField.initialValue.INSTANT).toBe(true);
    expect(cardField.initialValue.DRAWER).toBe(false);
  });

  it('should emit expandable event card when flag is on', () => {
    const notifPref = {
      rhel: {
        label: 'RHEL',
        applications: {
          compliance: {
            label: 'Compliance',
            eventTypes: [
              {
                name: 'POLICY_FAILED',
                label: 'Policy failed',
                fields: [
                  {
                    name: 'bundles[rhel].applications[compliance].eventTypes[POLICY_FAILED].emailSubscriptionTypes[INSTANT]',
                    label: 'Instant email',
                    initialValue: false,
                    severities: [
                      {
                        name: 'CRITICAL',
                        initialValue: false,
                        disabled: false,
                      },
                      {
                        name: 'IMPORTANT',
                        initialValue: false,
                        disabled: true,
                      },
                      { name: 'MODERATE', initialValue: false, disabled: true },
                      { name: 'LOW', initialValue: false, disabled: true },
                      { name: 'NONE', initialValue: false, disabled: true },
                      {
                        name: 'UNDEFINED',
                        initialValue: false,
                        disabled: true,
                      },
                    ],
                  },
                  {
                    name: 'bundles[rhel].applications[compliance].eventTypes[POLICY_FAILED].emailSubscriptionTypes[DAILY]',
                    label: 'Daily digest email',
                    initialValue: true,
                    severities: [
                      {
                        name: 'CRITICAL',
                        initialValue: false,
                        disabled: false,
                      },
                      {
                        name: 'IMPORTANT',
                        initialValue: false,
                        disabled: true,
                      },
                      { name: 'MODERATE', initialValue: false, disabled: true },
                      { name: 'LOW', initialValue: false, disabled: true },
                      { name: 'NONE', initialValue: false, disabled: true },
                      {
                        name: 'UNDEFINED',
                        initialValue: false,
                        disabled: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = prepareFields(notifPref, {}, {}, true);
    const tab = result[0].fields[0];
    expect(tab.component).toBe(TAB_GROUP);
    const eventInput = tab.fields.find((f) => f.name === 'event-notifications');
    const cardField = eventInput.fields[0];
    expect(cardField.component).toBe(NOTIFICATION_EVENT_CARD);
    expect(cardField.name).toBe(
      'bundles[rhel].applications[compliance].eventTypes[POLICY_FAILED]'
    );
    expect(cardField.eventName).toBe('POLICY_FAILED');
    expect(cardField.eventLabel).toBe('Policy failed');
    expect(cardField.severity).toBe('CRITICAL');
    expect(cardField.subscriptionFields).toHaveLength(2);
    expect(cardField.initialValue.INSTANT).toBe(false);
    expect(cardField.initialValue.DAILY).toBe(true);
  });

  it('omits per-field description on legacy event notification fields', () => {
    const notifPref = {
      rhel: {
        label: 'RHEL',
        applications: {
          advisor: {
            label: 'Test',
            eventTypes: [
              {
                name: 'testName',
                label: 'testLabel',
                fields: [
                  {
                    label: 'Instant notification',
                    description: 'Instant description',
                    component: 'descriptiveCheckbox',
                  },
                  {
                    label: 'Drawer notification',
                    description: 'Drawer description',
                    component: 'descriptiveCheckbox',
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const emailPref = {
      advisor: {
        schema: [
          {
            fields: [
              {
                name: 'is_subscribed',
                label: 'Weekly Report',
                title: 'Weekly report',
                description:
                  "Subscribe to this account's Test Weekly Report email",
                helperText:
                  "User-specific setting to subscribe a user to the account's weekly reports email",
                component: 'descriptiveCheckbox',
                isRequired: true,
                initialValue: false,
                isDisabled: false,
              },
            ],
          },
        ],
        loaded: true,
      },
    };
    const emailConfig = {
      advisor: {
        isVisible: {},
        url: '/test/',
        apiName: 'name',
        bundle: 'rhel',
        title: 'test',
      },
    };
    const result = prepareFields(notifPref, emailPref, emailConfig, false);
    const advisorTab = result[0].fields[0];
    const [, emailReportsGroup, eventNotificationsGroup] = advisorTab.fields;

    const weeklyReportField = emailReportsGroup.fields[0];
    expect(weeklyReportField.label).toBe('Weekly Report');

    const eventTypeGroup = eventNotificationsGroup.fields[0];
    const [instantField, drawerField] = eventTypeGroup.fields;
    expect(instantField.description).toBeUndefined();
    expect(drawerField.description).toBeUndefined();
  });

  it('sets non-admin help text for custom threshold when isOrgAdmin is false', () => {
    const notifPref = {
      subscriptions: {
        label: 'Subscriptions',
        applications: {
          usage: {
            label: 'Usage',
            eventTypes: [
              {
                name: 'CUSTOM_THRESHOLD',
                label: 'Custom subscription threshold exceeded',
                fields: [
                  {
                    name: 'bundles[subscriptions].applications[usage].eventTypes[CUSTOM_THRESHOLD].emailSubscriptionTypes[INSTANT]',
                    label: 'Instant notification',
                    severities: [
                      {
                        name: 'MODERATE',
                        initialValue: false,
                        disabled: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = prepareFields(
      notifPref,
      {},
      {},
      true,
      85,
      false // isOrgAdmin = false
    );
    const tab = result[0].fields[0];
    const eventInput = tab.fields.find((f) => f.name === 'event-notifications');
    const eventCard = eventInput.fields[0];

    expect(eventCard.eventLabel).toBe('Usage at custom percentage');
    expect(eventCard.description).toBe('Custom percentage has been set to 85%');
    expect(eventCard.helpText).toBe(
      'Please contact your admin if you have any question regarding the custom percentage.'
    );
  });

  it('sets admin help text for custom threshold when isOrgAdmin is true', () => {
    const notifPref = {
      subscriptions: {
        label: 'Subscriptions',
        applications: {
          usage: {
            label: 'Usage',
            eventTypes: [
              {
                name: 'CUSTOM_THRESHOLD',
                label: 'Custom subscription threshold exceeded',
                fields: [
                  {
                    name: 'bundles[subscriptions].applications[usage].eventTypes[CUSTOM_THRESHOLD].emailSubscriptionTypes[INSTANT]',
                    label: 'Instant notification',
                    severities: [
                      {
                        name: 'MODERATE',
                        initialValue: false,
                        disabled: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = prepareFields(
      notifPref,
      {},
      {},
      true,
      85,
      true // isOrgAdmin = true
    );
    const tab = result[0].fields[0];
    const eventInput = tab.fields.find((f) => f.name === 'event-notifications');
    const eventCard = eventInput.fields[0];

    expect(eventCard.eventLabel).toBe('Usage at custom percentage');
    expect(eventCard.description).toBe('Custom percentage has been set to 85%');
    expect(eventCard.helpText).toBe(
      'The custom percentage can be updated through Configure Events page.'
    );
  });
});
