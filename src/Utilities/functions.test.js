import {
  calculateEmailConfig,
  calculatePermissions,
  concatApps,
  dispatchMessages,
  distributeSuccessError,
  getSchema,
  getSection,
  visibilityFunctions,
} from './functions';
import { loaderField } from './constants';
import { mock } from '../__mock__/schemaLoader';
import { render } from '@testing-library/react';

describe('getSchema', () => {
  it('should return loader', () => {
    const loader = getSchema();
    expect(loader).toMatchObject(loaderField);
  });

  it('should return loader if not loaded', () => {
    const loader = getSchema({ loaded: false });
    expect(loader).toMatchObject(loaderField);
  });

  it('should return schema', () => {
    const schema = { fields: [] };
    const loaded = getSchema({ loaded: true, schema });
    expect(loaded).toMatchObject(schema);
  });
});

describe('getSection', () => {
  it('should return visible schema', () => {
    const section = getSection('first', { isVisible: true });
    expect(section).toMatchObject({ name: 'first', fields: loaderField });
  });

  it('should return visible schema from store', () => {
    const schema = { fields: [] };
    const section = getSection(
      'first',
      { isVisible: true, title: 'Some title' },
      { loaded: true, schema }
    );
    expect(section).toMatchObject({
      label: 'Some title',
      name: 'first',
      fields: schema,
    });
  });

  it('should return loader', () => {
    const section = getSection();
    const { container } = render(section.label);
    expect(container).toMatchSnapshot();
    expect(section).toMatchObject({ fields: loaderField });
  });

  it('should call success function', async () => {
    const success = jest.fn();
    const section = getSection('first', { isVisible: false }, {}, success);
    expect(section).toMatchObject({
      name: 'first',
      fields: loaderField,
    });
    await success();
    expect(success).toHaveBeenCalled();
  });
});

describe('negatedFunctions', () => {
  it('should negate all base functions', async () => {
    expect(visibilityFunctions).toHaveProperty('!something');
  });

  it('should negate the original function', async () => {
    expect(visibilityFunctions['!something'](true)).toBe(false);
    expect(visibilityFunctions['!something'](false)).toBe(true);
    expect(visibilityFunctions['!something']()).toBe(true);
  });
});

describe('calculatePermissions', () => {
  it('should check visibility of one function', async () => {
    const isVisible = await calculatePermissions({
      method: 'something',
    });
    expect(isVisible).toBe(false);
  });

  it('should check visibility of one function in its negated form', async () => {
    const isVisible = await calculatePermissions({
      method: '!something',
    });
    expect(isVisible).toBe(true);
  });

  it('should check visibility of array of functions', async () => {
    const isVisible = await calculatePermissions([
      {
        method: 'something',
      },
      {
        method: 'something',
        args: [true],
      },
    ]);
    expect(isVisible).toBe(false);
  });

  it('should calculate visible for one function', async () => {
    const isVisible = await calculatePermissions([
      {
        method: 'something',
        args: [true],
      },
    ]);
    expect(isVisible).toBe(true);
  });
});

describe('calculateEmailConfig', () => {
  it('should not throw error', async () => {
    const result = await calculateEmailConfig();
    expect(result).toMatchObject({});
  });

  it('should calculate schema with permissions - false', async () => {
    mock.onGet('/api*').reply(200, {});
    const result = await calculateEmailConfig({
      'email-preference': {
        test: {
          permissions: { method: 'something' },
        },
      },
    });
    expect(await result.test.isVisible).toBe(false);
  });

  it('should calculate schema with permissions - true', async () => {
    mock.onGet('/api/test/v1/user-config/email-preference').reply(200, {});
    const result = await calculateEmailConfig({
      'email-preference': {
        test: {
          permissions: { method: 'something', args: [true] },
        },
      },
    });
    const isVisible = await result.test.isVisible;
    expect(isVisible).toBe(true);
  });

  it('should request localFile', async () => {
    mock.onGet('/api/test/v1/user-config/email-preference').reply(200, {});
    const dispatch = jest.fn();
    await calculateEmailConfig(
      {
        'email-preference': {
          test: {},
        },
      },
      dispatch
    );
    expect(dispatch).toHaveBeenCalled();
    expect(dispatch.mock.calls[0][0]).toMatchObject({
      meta: {
        appName: 'test',
      },
    });
  });

  it('should request localFile', async () => {
    const dispatch = jest.fn();
    await calculateEmailConfig(
      {
        'email-preference': {
          test: {
            localFile: 'data/general.json',
          },
        },
      },
      dispatch
    );
    setTimeout(() => {
      expect(dispatch).toHaveBeenCalled();
      expect(dispatch.mock.calls[0][0]).toMatchObject({
        payload: {},
        meta: {
          appName: 'test',
        },
      });
    });
  });
});

describe('concatApps', () => {
  it('should concat no app', () => {
    const apps = concatApps();
    expect(apps).toBe('');
  });

  it('should concat one app', () => {
    const apps = concatApps(['one']);
    expect(apps).toBe('one');
  });

  it('should concat two apps', () => {
    const apps = concatApps(['one', 'two']);
    expect(apps).toBe('one and two');
  });

  it('should concat multiple apps', () => {
    const apps = concatApps(['one', 'two', 'three']);
    expect(apps).toBe('one, two and three');
  });
});

describe('distributeSuccessError', () => {
  const promiseSuccess = { promise: Promise.resolve(3) };
  let promiseError;
  try {
    promiseError = {
      promise: new Promise((resolve, reject) => setTimeout(reject, 100, 'foo')),
    };
  } catch (e) {
    (() => {})();
  }

  it('should not fail with empty', async () => {
    const { success, error } = await distributeSuccessError();
    expect(success.length).toBe(0);
    expect(error.length).toBe(0);
  });

  it('should not fail with false', async () => {
    const { success, error } = await distributeSuccessError([false]);
    expect(success.length).toBe(0);
    expect(error.length).toBe(1);
  });

  it('should have one success and error', async () => {
    const { success, error } = await distributeSuccessError([
      promiseSuccess,
      promiseError,
    ]);
    expect(success.length).toBe(1);
    expect(error.length).toBe(1);
  });

  it('should have 2 successes and no error', async () => {
    const { success, error } = await distributeSuccessError([
      promiseSuccess,
      promiseSuccess,
    ]);
    expect(success.length).toBe(2);
    expect(error.length).toBe(0);
  });

  it('should have 2 errors and no success', async () => {
    const { success, error } = await distributeSuccessError([
      promiseError,
      promiseError,
    ]);
    expect(success.length).toBe(0);
    expect(error.length).toBe(2);
  });
});

describe('dispatchMessages', () => {
  it('should not fail with no parameters', () => {
    const addNotification = jest.fn();
    dispatchMessages();
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('should not fail with no messages', () => {
    const addNotification = jest.fn();
    dispatchMessages(addNotification);
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('should dispatch one success', () => {
    const addNotification = jest.fn();
    dispatchMessages(addNotification, ['some', 'message', 'multiple']);
    expect(addNotification).toHaveBeenCalled();
    expect(addNotification.mock.calls[0][0]).toMatchObject({
      dismissable: false,
      title: 'Preferences successfully saved',
      variant: 'success',
    });
  });

  it('should dispatch one danger', () => {
    const addNotification = jest.fn();
    dispatchMessages(addNotification, [], ['some', 'message', 'multiple']);
    expect(addNotification).toHaveBeenCalled();
    expect(addNotification.mock.calls[0][0]).toMatchObject({
      dismissable: false,
      title: 'Preferences unsuccessfully saved',
      variant: 'danger',
    });
  });

  it('should dispatch one danger and one error', () => {
    const addNotification = jest.fn();
    dispatchMessages(
      addNotification,
      ['some', 'message', 'multiple'],
      ['some', 'message', 'multiple']
    );
    expect(addNotification).toHaveBeenCalled();
    expect(addNotification.mock.calls[0][0]).toMatchObject({
      dismissable: false,
      title:
        'Email preferences for some, message and multiple successfully saved',
      variant: 'success',
    });
    expect(addNotification.mock.calls[1][0]).toMatchObject({
      dismissable: false,
      title:
        'Email preferences for some, message and multiple unsuccessfully saved',
      variant: 'danger',
    });
  });
});

describe('hasLoosePermissions with v2 (Kessel)', () => {
  const v2Context = {
    isKesselEnabled: true,
    kesselMappedPermissions: [
      { permission: 'advisor:*:read', resourceDefinitions: [] },
      { permission: 'user-preferences:*:write', resourceDefinitions: [] },
    ],
  };

  it('uses Kessel permissions for v2 org', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['advisor:*:read'],
      v2Context
    );
    expect(result).toBe(true);
  });

  it('returns false when permission not in Kessel list', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['advisor:*:*'],
      v2Context
    );
    expect(result).toBe(false);
  });

  it('returns true if any permission matches', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['advisor:*:*', 'advisor:*:read'],
      v2Context
    );
    expect(result).toBe(true);
  });

  it('returns false when none of multiple permissions match', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['other:*:read', 'another:*:write', 'missing:*:delete'],
      v2Context
    );
    expect(result).toBe(false);
  });

  it('returns false with empty Kessel permissions array', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['advisor:*:read'],
      { isKesselEnabled: true, kesselMappedPermissions: [] }
    );
    expect(result).toBe(false);
  });

  it('grants permissions for unmigrated apps (insights)', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['insights:*:*'],
      v2Context
    );
    expect(result).toBe(true);
  });

  it('grants insights permissions even without Kessel perms', async () => {
    const result = await visibilityFunctions.hasLoosePermissions(
      ['insights:*:read'],
      { isKesselEnabled: true, kesselMappedPermissions: [] }
    );
    expect(result).toBe(true);
  });
});

describe('hasLoosePermissions with v1 (legacy)', () => {
  beforeEach(() => {
    global.insights.chrome.getUserPermissions.mockResolvedValue([
      { permission: 'insights:*:*', resourceDefinitions: [] },
      { permission: 'advisor:*:read', resourceDefinitions: [] },
    ]);
  });

  it('uses legacy getUserPermissions for v1 org', async () => {
    const result = await visibilityFunctions.hasLoosePermissions([
      'advisor:*:read',
    ]);
    expect(result).toBe(true);
    expect(global.insights.chrome.getUserPermissions).toHaveBeenCalled();
  });

  it('returns false when permission not in v1 list', async () => {
    const result = await visibilityFunctions.hasLoosePermissions([
      'other:*:read',
    ]);
    expect(result).toBe(false);
  });
});
