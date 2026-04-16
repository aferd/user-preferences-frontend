/**
 * Storybook shim: real @scalprum/react-core touches webpack share scope (module
 * federation), which is not initialized in Storybook — use this via webpack alias.
 */
import React from 'react';

export function ScalprumProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function ScalprumComponent() {
  return null;
}

export function useLoadModule() {
  return [null];
}

export function useRemoteHook() {
  return { hookResult: null, loading: true };
}

export default ScalprumProvider;
