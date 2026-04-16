import React from 'react';
import { HttpResponse, http } from 'msw';
import Notifications from './Notifications';
import { userPrefInitialState } from './testData';

const notificationsBundles = userPrefInitialState.notificationsReducer.bundles;
const advisorEmailSchema = userPrefInitialState.emailReducer.advisor.schema;

const apiHandlers = [
  http.get(
    /\/api\/notifications\/v1\/user-config\/notification-event-type-preference$/,
    () =>
      HttpResponse.json({
        bundles: notificationsBundles,
      })
  ),
  http.get(/\/api\/insights\/v1\/user-config\/email-preference$/, () =>
    HttpResponse.json(advisorEmailSchema)
  ),
];

const meta = {
  title: 'Pages/My Notifications',
  component: Notifications,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Renders the **My Notifications** preferences page (same component as production).

Uses MSW to mock notification and email schema APIs. The global Storybook preview supplies Redux, Chrome, feature flags (\`useFlag\`), and \`NotificationsProvider\`. \`@scalprum/react-core\` is aliased in Storybook to a noop shim (no module federation).

**Note:** Redux state is the shared registry store; reload the Storybook canvas if another story left stale data.
        `,
      },
    },
    msw: {
      handlers: apiHandlers,
    },
    featureFlags: {
      'platform.notifications.severity': true,
    },
  },
};

export default meta;

export const Default = {
  name: 'With severity help',
  render: () => <Notifications />,
};

export const SeverityHelpOff = {
  name: 'Severity help hidden (flag off)',
  render: () => <Notifications />,
  parameters: {
    featureFlags: {
      'platform.notifications.severity': false,
    },
  },
};
