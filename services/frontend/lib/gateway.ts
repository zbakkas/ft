const isServer = typeof window === "undefined";

const PUBLIC_GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";

const INTERNAL_GATEWAY_URL =
  process.env.GATEWAY_URL || "http://api_gateway:3000";

const rawGatewayUrl = isServer ? INTERNAL_GATEWAY_URL : PUBLIC_GATEWAY_URL;

export const GATEWAY_URL = rawGatewayUrl.replace(/\/+$/, "");

export const getGatewayUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${GATEWAY_URL}${normalizedPath}`;
};

export const getWsGatewayUrl = (path: string) => {
  const base = GATEWAY_URL.replace(/^https:\/\//, "wss://").replace(
    /^http:\/\//,
    "ws://",
  );

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};
