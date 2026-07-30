import React from 'react';
import type { Meta } from '@storybook/react-webpack5';
import { FormRenderer } from '@data-driven-forms/react-form-renderer';
import {
  FormTemplate,
  componentMapper,
} from '@data-driven-forms/pf4-component-mapper';
import { Card, CardBody, Content, Title } from '@patternfly/react-core';
import { HttpResponse, http } from 'msw';
import NotificationEventCard from './NotificationEventCard';
import { NOTIFICATION_EVENT_CARD } from './componentTypes';

const notificationPreferencesSchemaHandler = http.get(
  '/api/notifications/:apiVersion/user-config/notification-event-type-preference',
  () =>
    HttpResponse.json({
      bundles: {
        rhel: {
          label: 'Red Hat Enterprise Linux',
          applications: {
            compliance: {
              label: 'Compliance',
              eventTypes: [],
            },
          },
        },
      },
    })
);

const meta = {
  title: 'Notifications/User preferences/NotificationEventCard',
  component: NotificationEventCard,
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [notificationPreferencesSchemaHandler],
    },
    docs: {
      description: {
        component: `Simplified card component for notification event preferences. Each card represents a single event type with:
        - **Card header**: Event name with conditional severity badge (shown only when at least one option is selected)
        - **Card body**: Simple checkboxes for each subscription type (Instant email, Daily digest, etc.)

        This simplified design replaces the previous table-based layout with a cleaner checkbox interface and per-event severity indicators. Severity labels match the notifications-frontend event log styling with tooltips.`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 360, maxWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NotificationEventCard>;

export default meta;

export const SingleEvent = {
  render: () => (
    <Card>
      <CardBody>
        <Content>
          <Title headingLevel="h2">Event notification preferences</Title>
          <p>
            Select how you would like to receive notifications for each event.
            The severity badge appears when at least one option is selected.
          </p>
        </Content>
        <FormRenderer
          componentMapper={{
            ...componentMapper,
            [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
          }}
          FormTemplate={FormTemplate}
          schema={{
            fields: [
              {
                name: 'bundles[rhel].applications[compliance].eventTypes[POLICY_FAILED]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'POLICY_FAILED',
                eventLabel: 'Policy failed to upload',
                severity: 'IMPORTANT',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    initialValue: false,
                  },
                  {
                    name: 'DAILY',
                    label: 'Daily digest email',
                    initialValue: false,
                  },
                ],
                bundle: 'rhel',
                app: 'compliance',
                initialValue: {
                  INSTANT: false,
                  DAILY: false,
                },
              },
            ],
          }}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </CardBody>
    </Card>
  ),
};

export const MultipleEvents = {
  render: () => (
    <Card>
      <CardBody>
        <Content>
          <Title headingLevel="h2">Multiple event notifications</Title>
          <p>
            Each event card has independent state. Severity badges are shown
            only when at least one option is selected for that event.
          </p>
        </Content>
        <FormRenderer
          componentMapper={{
            ...componentMapper,
            [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
          }}
          FormTemplate={FormTemplate}
          schema={{
            fields: [
              {
                name: 'bundles[rhel].applications[compliance].eventTypes[POLICY_FAILED]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'POLICY_FAILED',
                eventLabel: 'Policy failed to upload',
                severity: 'IMPORTANT',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    initialValue: false,
                  },
                  {
                    name: 'DAILY',
                    label: 'Daily digest email',
                    initialValue: false,
                  },
                ],
                bundle: 'rhel',
                app: 'compliance',
                initialValue: {
                  INSTANT: false,
                  DAILY: false,
                },
              },
              {
                name: 'bundles[rhel].applications[compliance].eventTypes[SYSTEM_NONCOMPLIANT]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'SYSTEM_NONCOMPLIANT',
                eventLabel: 'System is noncompliant to SCAP policy',
                severity: 'CRITICAL',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    initialValue: true,
                  },
                  {
                    name: 'DAILY',
                    label: 'Daily digest email',
                    initialValue: false,
                  },
                ],
                bundle: 'rhel',
                app: 'compliance',
                initialValue: {
                  INSTANT: true,
                  DAILY: false,
                },
              },
              {
                name: 'bundles[rhel].applications[compliance].eventTypes[REPORT_UPLOADED]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'REPORT_UPLOADED',
                eventLabel: 'Report uploaded successfully',
                severity: 'MODERATE',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    initialValue: false,
                  },
                  {
                    name: 'DAILY',
                    label: 'Daily digest email',
                    initialValue: false,
                  },
                ],
                bundle: 'rhel',
                app: 'compliance',
                initialValue: {
                  INSTANT: false,
                  DAILY: false,
                },
              },
            ],
          }}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </CardBody>
    </Card>
  ),
};

export const WithDisabledOptions = {
  render: () => (
    <Card>
      <CardBody>
        <Content>
          <Title headingLevel="h2">Event with disabled options</Title>
          <p>
            Some notification options may be disabled based on service
            configuration or permission settings.
          </p>
        </Content>
        <FormRenderer
          componentMapper={{
            ...componentMapper,
            [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
          }}
          FormTemplate={FormTemplate}
          schema={{
            fields: [
              {
                name: 'bundles[openshift].applications[cluster-manager].eventTypes[CLUSTER_DEGRADED]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'CLUSTER_DEGRADED',
                eventLabel: 'Cluster degraded',
                severity: 'CRITICAL',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    initialValue: true,
                  },
                  {
                    name: 'DAILY',
                    label: 'Daily digest email',
                    initialValue: false,
                    disabled: true,
                  },
                ],
                bundle: 'openshift',
                app: 'cluster-manager',
                initialValue: {
                  INSTANT: true,
                  DAILY: false,
                },
              },
            ],
          }}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </CardBody>
    </Card>
  ),
};

export const SeverityBadgeVisibility = {
  render: () => (
    <Card>
      <CardBody>
        <Content>
          <Title headingLevel="h2">Severity badge visibility</Title>
          <p>
            The severity badge only appears when at least one notification
            option is selected. Try toggling the checkboxes to see the badge
            appear and disappear.
          </p>
        </Content>
        <FormRenderer
          componentMapper={{
            ...componentMapper,
            [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
          }}
          FormTemplate={FormTemplate}
          schema={{
            fields: [
              {
                name: 'bundles[rhel].applications[advisor].eventTypes[NEW_RECOMMENDATION]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'NEW_RECOMMENDATION',
                eventLabel: 'New recommendation available',
                severity: 'LOW',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant email',
                    initialValue: false,
                  },
                  {
                    name: 'DAILY',
                    label: 'Daily digest email',
                    initialValue: false,
                  },
                ],
                bundle: 'rhel',
                app: 'advisor',
                initialValue: {
                  INSTANT: false,
                  DAILY: false,
                },
              },
            ],
          }}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </CardBody>
    </Card>
  ),
};

export const WithDescriptionAndHelpIcon = {
  render: () => (
    <Card>
      <CardBody>
        <Content>
          <Title headingLevel="h2">
            Usage at custom percentage (non-admin view)
          </Title>
          <p>
            This example demonstrates the usage at custom percentage event for
            non-admin users with a help icon that tells them to contact their
            admin.
          </p>
        </Content>
        <FormRenderer
          componentMapper={{
            ...componentMapper,
            [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
          }}
          FormTemplate={FormTemplate}
          schema={{
            fields: [
              {
                name: 'bundles[subscriptions].applications[usage].eventTypes[CUSTOM_THRESHOLD]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'CUSTOM_THRESHOLD',
                eventLabel: 'Usage at custom percentage',
                severity: 'MODERATE',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant notification',
                    initialValue: false,
                  },
                  {
                    name: 'DRAWER',
                    label: 'Drawer notification',
                    initialValue: false,
                  },
                ],
                bundle: 'subscriptions',
                app: 'usage',
                initialValue: {
                  INSTANT: false,
                  DRAWER: false,
                },
                description: 'Custom percentage has been set to 85%',
                helpText:
                  'Please contact your admin if you have any question regarding the custom percentage.',
              },
            ],
          }}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </CardBody>
    </Card>
  ),
};

export const WithDescriptionAndHelpIconAdmin = {
  render: () => (
    <Card>
      <CardBody>
        <Content>
          <Title headingLevel="h2">
            Usage at custom percentage (admin view)
          </Title>
          <p>
            This example demonstrates the usage at custom percentage event for
            admin users with a help icon that directs them to Configure Events
            page.
          </p>
        </Content>
        <FormRenderer
          componentMapper={{
            ...componentMapper,
            [NOTIFICATION_EVENT_CARD]: NotificationEventCard,
          }}
          FormTemplate={FormTemplate}
          schema={{
            fields: [
              {
                name: 'bundles[subscriptions].applications[usage].eventTypes[CUSTOM_THRESHOLD]',
                component: NOTIFICATION_EVENT_CARD,
                eventName: 'CUSTOM_THRESHOLD',
                eventLabel: 'Usage at custom percentage',
                severity: 'MODERATE',
                subscriptionFields: [
                  {
                    name: 'INSTANT',
                    label: 'Instant notification',
                    initialValue: false,
                  },
                  {
                    name: 'DRAWER',
                    label: 'Drawer notification',
                    initialValue: false,
                  },
                ],
                bundle: 'subscriptions',
                app: 'usage',
                initialValue: {
                  INSTANT: false,
                  DRAWER: false,
                },
                description: 'Custom percentage has been set to 85%',
                helpText:
                  'The custom percentage can be updated through Configure Events page.',
              },
            ],
          }}
          onSubmit={(values) => console.log('Form submitted:', values)}
        />
      </CardBody>
    </Card>
  ),
};
