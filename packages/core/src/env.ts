declare global {
  // eslint-disable-next-line no-var
  var __CONVEX_INSPECT_DEV__: boolean | undefined;
}

function readDevOverride() {
  return globalThis.__CONVEX_INSPECT_DEV__;
}

export function setConvexInspectEnabled(enabled: boolean) {
  globalThis.__CONVEX_INSPECT_DEV__ = enabled;
}

export function resetConvexInspectEnabled() {
  delete globalThis.__CONVEX_INSPECT_DEV__;
}

function readNodeEnv() {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env.NODE_ENV;
}

function isLikelyLocalDevHost() {
  if (typeof location === "undefined") return false;

  return (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]" ||
    location.hostname.endsWith(".local")
  );
}

export function isDevEnvironment(override?: boolean) {
  if (typeof override === "boolean") return override;

  const globalOverride = readDevOverride();
  if (typeof globalOverride === "boolean") return globalOverride;

  const nodeEnv = readNodeEnv();
  if (typeof nodeEnv === "string") return nodeEnv !== "production";

  return isLikelyLocalDevHost();
}
