export function getVerifyLogUrl(location = window.location) {
  return `${location.href.split("#")[0]}#/verify-log`;
}

export function getLegacyVerifyRedirect(location = window.location) {
  if (location.hash || !/\/verify-log\/?$/.test(location.pathname)) return null;
  const basePath = location.pathname.replace(/verify-log\/?$/, "");
  return `${location.origin}${basePath}${location.search || ""}#/verify-log`;
}
