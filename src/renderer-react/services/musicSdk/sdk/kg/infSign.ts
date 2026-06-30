// Use ?raw to prevent Vite from wrapping the UMD module in its module system,
// which would prevent infSign from being set on globalThis in production builds.
import vendorCode from './vendors/infSign.min.js?raw';

new Function(vendorCode)();

type InfSign = (
  params: Record<string, unknown>,
  body: unknown,
  options: Record<string, unknown>,
) => void;

const infSign = (globalThis as typeof globalThis & { infSign?: InfSign }).infSign;

if (!infSign) {
  throw new Error('infSign vendor failed to initialize');
}

export default infSign;
