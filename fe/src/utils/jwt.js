export function parseJwt(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      return null;
    }

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getTokenExpirationDate(token) {
  const payload = parseJwt(token);
  if (!payload?.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

export function isTokenExpired(token) {
  const expirationDate = getTokenExpirationDate(token);
  if (!expirationDate) {
    return true;
  }

  return expirationDate.getTime() <= Date.now();
}
