import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// We need to test the SeverityHelpTerm component and severity data which are
// internal to Notifications.js. Since they aren't exported, we test them
// through the rendered output by importing the full Notifications component
// in a minimal setup, or by extracting and testing the rendered DOM directly.
// For better testability, we'll test the rendered output expectations.

const mockUseFlag = jest.fn().mockReturnValue(true);
jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: (...args) => mockUseFlag(...args),
}));

// Mock the dependencies that Notifications needs
jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => {
  return () => ({
    chromeHistory: {
      push: jest.fn(),
      block: jest.fn(() => jest.fn()),
    },
    auth: { getUser: () => Promise.resolve() },
  });
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({}),
}));

jest.mock('@scalprum/react-core', () => ({
  ScalprumComponent: () => null,
  useLoadModule: () => [null],
  useRemoteHook: () => ({ hookResult: null, loading: true }),
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector) =>
    selector({
      emailReducer: {},
      notificationsReducer: { bundles: {}, loaded: true },
    }),
  useStore: () => ({}),
}));

jest.mock('@data-driven-forms/react-form-renderer', () => ({
  FormRenderer: () => <div data-testid="form-renderer" />,
}));

jest.mock('@data-driven-forms/pf4-component-mapper', () => ({
  componentMapper: {},
}));

jest.mock(
  '@redhat-cloud-services/frontend-components-notifications/hooks',
  () => ({
    useNotifications: () => ({ addNotification: jest.fn() }),
  })
);

jest.mock('@patternfly/react-component-groups/dist/dynamic/PageHeader', () => {
  // eslint-disable-next-line react/prop-types
  const PageHeader = ({ title, subtitle, children }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  );
  PageHeader.displayName = 'PageHeader';
  return { __esModule: true, default: PageHeader };
});

jest.mock('../../Utilities/functions', () => ({
  calculateEmailConfig: () => ({}),
}));

jest.mock('../../redux/actions/notifications-actions', () => ({
  getNotificationsSchema: () => ({
    type: 'GET_NOTIFICATIONS_SCHEMA',
    payload: Promise.resolve({ bundles: {} }),
  }),
  saveNotificationValues: jest.fn(),
}));

jest.mock('../../redux/actions/email-actions', () => ({
  saveEmailValues: jest.fn(),
}));

import Notifications from './Notifications';
import { MemoryRouter } from 'react-router-dom';

const renderNotifications = () =>
  render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>
  );

describe('Severity help terms in Notifications header', () => {
  it('renders all four severity terms', () => {
    renderNotifications();

    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders the severity description sentence', () => {
    renderNotifications();

    expect(
      screen.getByText(/Possible notification severity levels include/)
    ).toBeInTheDocument();
  });

  it('renders the Learn more link with correct URL', () => {
    renderNotifications();

    const learnMoreLink = screen.getByRole('link', { name: 'Learn more' });
    expect(learnMoreLink).toBeInTheDocument();
    expect(learnMoreLink).toHaveAttribute(
      'href',
      expect.stringContaining('con-notif-severity')
    );
    expect(learnMoreLink).toHaveAttribute('target', '_blank');
    expect(learnMoreLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders severity terms as buttons with dashed underline class', () => {
    renderNotifications();

    const criticalButton = screen.getByRole('button', { name: /Critical/i });
    expect(criticalButton).toHaveClass('pref-notifications--severity-term');

    const importantButton = screen.getByRole('button', { name: /Important/i });
    expect(importantButton).toHaveClass('pref-notifications--severity-term');

    const moderateButton = screen.getByRole('button', { name: /Moderate/i });
    expect(moderateButton).toHaveClass('pref-notifications--severity-term');

    const lowButton = screen.getByRole('button', { name: /Low/i });
    expect(lowButton).toHaveClass('pref-notifications--severity-term');
  });

  it('opens a popover when a severity term is clicked', async () => {
    renderNotifications();

    const criticalButton = screen.getByRole('button', { name: /Critical/i });
    fireEvent.click(criticalButton);

    await waitFor(() => {
      expect(screen.getByText('Critical severity')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Urgent notification about an event with impact/)
    ).toBeInTheDocument();
  });

  it('shows correct description in Important popover', async () => {
    renderNotifications();

    const importantButton = screen.getByRole('button', {
      name: /Important/i,
    });
    fireEvent.click(importantButton);

    await waitFor(() => {
      expect(screen.getByText('Important severity')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Errors or other events that may impact/)
    ).toBeInTheDocument();
  });

  it('shows correct description in Moderate popover', async () => {
    renderNotifications();

    const moderateButton = screen.getByRole('button', { name: /Moderate/i });
    fireEvent.click(moderateButton);

    await waitFor(() => {
      expect(screen.getByText('Moderate severity')).toBeInTheDocument();
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('shows correct description in Low popover', async () => {
    renderNotifications();

    const lowButton = screen.getByRole('button', { name: /Low/i });
    fireEvent.click(lowButton);

    await waitFor(() => {
      expect(screen.getByText('Low severity')).toBeInTheDocument();
    });

    expect(screen.getByText('Information only')).toBeInTheDocument();
  });

  it('popover footer contains a Learn more link', async () => {
    renderNotifications();

    const criticalButton = screen.getByRole('button', { name: /Critical/i });
    fireEvent.click(criticalButton);

    await waitFor(() => {
      expect(screen.getByText('Critical severity')).toBeInTheDocument();
    });

    // The popover should have its own Learn more link
    const learnMoreLinks = screen.getAllByText('Learn more');
    expect(learnMoreLinks.length).toBeGreaterThanOrEqual(2); // one in header, one in popover
  });

  it('preserves existing header text', () => {
    renderNotifications();

    expect(
      screen.getByText(/Opt in or out of receiving notifications/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Contact your Organization Administrator/,
      })
    ).toBeInTheDocument();
  });
});

describe('Severity help terms hidden when feature flag is off', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(false);
  });

  afterEach(() => {
    mockUseFlag.mockReturnValue(true);
  });

  it('does not render severity terms when flag is disabled', () => {
    renderNotifications();

    expect(
      screen.queryByText(/Possible notification severity levels/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Critical/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Important/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Moderate/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Low/i })
    ).not.toBeInTheDocument();
  });

  it('preserves existing header text when flag is off', () => {
    renderNotifications();

    expect(
      screen.getByText(/Opt in or out of receiving notifications/)
    ).toBeInTheDocument();
  });
});
