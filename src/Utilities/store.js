import { createContext } from 'react';
import ReducerRegistry, {
  applyReducerHash,
} from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import promiseMiddleware from 'redux-promise-middleware';
import emailReducer, {
  emailInitialState,
} from '../redux/reducers/email-reducer';
import notificationsReducer, {
  notificationsInitialState,
} from '../redux/reducers/notifications-reducer';

export const RegistryContext = createContext({
  getRegistry: () => {},
});

const middlewares = [promiseMiddleware];

if (process.env.NODE_ENV !== 'production') {
  // Development only — excluded from production bundles by webpack dead-code elimination
  // eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
  const reduxLogger = require('redux-logger').default;
  if (typeof reduxLogger === 'function') {
    middlewares.push(reduxLogger);
  }
}

export const registry = new ReducerRegistry({}, middlewares);

registry.register({
  emailReducer: applyReducerHash(emailReducer, emailInitialState),
  notificationsReducer: applyReducerHash(
    notificationsReducer,
    notificationsInitialState
  ),
});

export default registry;
