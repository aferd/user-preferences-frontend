import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Form, RendererContext } from '@data-driven-forms/react-form-renderer';
import NotificationEventCard from './NotificationEventCard';
import type { SubscriptionField } from './NotificationEventCard';

const sampleFields: SubscriptionField[] = [
  {
    name: 'INSTANT',
    label: 'Instant email',
    initialValue: false,
    disabled: false,
  },
  {
    name: 'DAILY',
    label: 'Daily digest email',
    initialValue: false,
    disabled: false,
  },
];

describe('NotificationEventCard tests', () => {
  const afterChangeMock = jest.fn();

  afterEach(() => {
    afterChangeMock.mockReset();
  });

  it('should render with event label', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="POLICY_FAILED"
              eventLabel="Policy failed"
              subscriptionFields={sampleFields}
              bundle="rhel"
              app="compliance"
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    expect(screen.getByText('Policy failed')).toBeInTheDocument();
  });

  it('should render checkboxes for each field', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="POLICY_FAILED"
              eventLabel="Policy failed"
              subscriptionFields={sampleFields}
              bundle="rhel"
              app="compliance"
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    expect(screen.getByLabelText('Instant email')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily digest email')).toBeInTheDocument();
  });

  it('should show severity badge even when no options are selected', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="POLICY_FAILED"
              eventLabel="Policy failed"
              severity="CRITICAL"
              subscriptionFields={sampleFields}
              bundle="rhel"
              app="compliance"
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should not show severity badge for undefined severity', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="POLICY_FAILED"
              eventLabel="Policy failed"
              severity="UNDEFINED"
              subscriptionFields={sampleFields}
              bundle="rhel"
              app="compliance"
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    expect(screen.queryByText('Undefined')).not.toBeInTheDocument();
  });

  it('should show severity badge when at least one option is selected', () => {
    const initialValue = {
      INSTANT: true,
      DAILY: false,
    };

    render(
      <Form
        onSubmit={() => undefined}
        initialValues={{ 'test-event': initialValue }}
      >
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="POLICY_FAILED"
              eventLabel="Policy failed"
              severity="CRITICAL"
              subscriptionFields={sampleFields}
              bundle="rhel"
              app="compliance"
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should handle checkbox changes', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="POLICY_FAILED"
              eventLabel="Policy failed"
              subscriptionFields={sampleFields}
              bundle="rhel"
              app="compliance"
              afterChange={afterChangeMock}
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    const instantCheckbox = screen.getByLabelText('Instant email');
    fireEvent.click(instantCheckbox);

    expect(afterChangeMock).toHaveBeenCalled();
  });

  it('should render description when provided', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="CUSTOM_THRESHOLD"
              eventLabel="Usage at custom percentage"
              subscriptionFields={sampleFields}
              bundle="subscriptions"
              app="usage"
              description="Custom percentage has been set to 85%"
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    expect(
      screen.getByText('Custom percentage has been set to 85%')
    ).toBeInTheDocument();
  });

  it('should render help icon with tooltip for non-admin', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="CUSTOM_THRESHOLD"
              eventLabel="Usage at custom percentage"
              subscriptionFields={sampleFields}
              bundle="subscriptions"
              app="usage"
              helpText="Please contact your admin if you have any question regarding the custom percentage."
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    // Help icon should be present
    const helpIcon = screen.getByRole('img', { hidden: true });
    expect(helpIcon).toBeInTheDocument();
  });

  it('should render help icon with tooltip for admin', () => {
    render(
      <Form onSubmit={() => undefined}>
        {(props) => (
          <RendererContext.Provider
            value={
              {
                formOptions: {
                  internalRegisterField: () => undefined,
                  internalUnRegisterField: () => undefined,
                } as any,
              } as any
            }
          >
            <NotificationEventCard
              name="test-event"
              eventName="CUSTOM_THRESHOLD"
              eventLabel="Usage at custom percentage"
              subscriptionFields={sampleFields}
              bundle="subscriptions"
              app="usage"
              helpText="The custom percentage can be updated through Configure Events page."
              {...(props as any)}
            />
          </RendererContext.Provider>
        )}
      </Form>
    );

    // Help icon should be present
    const helpIcon = screen.getByRole('img', { hidden: true });
    expect(helpIcon).toBeInTheDocument();
  });
});
