// Re-export useChrome from context-providers for webpack alias.
// App code uses default import: import useChrome from '.../useChrome'
import { useChrome } from '../context-providers';

export { useChrome };
export default useChrome;
