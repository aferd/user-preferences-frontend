import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { HttpResponse, http } from 'msw';
import Notifications from './Notifications';
import { userPrefInitialState } from './testData';

const notificationsBundles = userPrefInitialState.notificationsReducer.bundles;
const advisorEmailSchema = userPrefInitialState.emailReducer.advisor.schema;

// Kessel API handlers for RBAC v2
const kesselApiHandlers = [
  // Mock workspace endpoint
  http.get('/api/rbac/v2/workspaces/', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    if (type === 'default') {
      return HttpResponse.json({
        data: [
          {
            id: 'default-workspace-123',
            name: 'Default Workspace',
            type: 'default',
            created: '2024-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
          },
        ],
        meta: { count: 1 },
      });
    }
    return HttpResponse.json({ data: [], meta: { count: 0 } });
  }),
  // Mock permission check endpoint (checkself) - note: uses /api/kessel/v1beta2
  http.post('/api/kessel/v1beta2/checkself', async ({ request }) => {
    const body: any = await request.json();
    const relation = body?.relation || '';

    // Grant all permissions for this mock
    const allowedRelations = [
      'insights_all',
      'insights_read',
      'advisor_all',
      'advisor_read',
      'advisor_rules_read',
      'user_preferences_all',
      'user_preferences_read',
    ];

    const allowed = allowedRelations.includes(relation)
      ? 'ALLOWED_TRUE'
      : 'ALLOWED_FALSE';

    return HttpResponse.json({ allowed });
  }),
];

const apiHandlers = [
  ...kesselApiHandlers,
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

The Unleash flag \`platform.notifications.severity\` controls both the severity help copy in the page subtitle and whether event types that expose a severity grid render the **Severity × Frequency** table (when the API schema matches).

Subtitle severity terms use six PatternFly tiers; the **Low** term uses the minor severity icon. The severity popover header uses PatternFly layout and spacing utilities (\`pf-v6-u-display-flex\`, \`pf-v6-u-ml-sm\`, etc.) so spacing follows [design foundations](https://www.patternfly.org/design-foundations/about-design-foundations) tokens.

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
} satisfies Meta<typeof Notifications>;

export default meta;

export const Default = {
  name: 'With severity flag on',
  render: () => <Notifications />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(
      /Possible notification severity levels include/i,
      {},
      { timeout: 10000 }
    );
    await expect(
      canvas.getByRole('button', { name: 'Critical' })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Important' })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Moderate' })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: 'Low' })
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('button', { name: /^None$/ })
    ).toBeInTheDocument();
  },
} satisfies StoryObj<typeof meta>;

export const SeverityHelpOff = {
  name: 'With severity flag off',
  render: () => <Notifications />,
  parameters: {
    featureFlags: {
      'platform.notifications.severity': false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Event notifications', {}, { timeout: 10000 });
    expect(
      canvas.queryByText(/Possible notification severity levels include/i)
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByRole('button', { name: 'Critical' })
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByRole('button', { name: 'Low' })
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByRole('button', { name: /^None$/ })
    ).not.toBeInTheDocument();
    expect(
      canvas.queryByRole('button', { name: 'Undefined' })
    ).not.toBeInTheDocument();
  },
} satisfies StoryObj<typeof meta>;

export const RbacV2Org = {
  name: 'With RBAC v2 (Kessel)',
  render: () => <Notifications />,
  parameters: {
    featureFlags: {
      'platform.chrome.kessel': true,
      'platform.notifications.severity': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(
      /Possible notification severity levels include/i,
      {},
      { timeout: 10000 }
    );
    // Verify page loads correctly with Kessel permissions
    await expect(
      canvas.getByRole('button', { name: 'Critical' })
    ).toBeInTheDocument();
  },
} satisfies StoryObj<typeof meta>;
