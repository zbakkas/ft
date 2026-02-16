import crypto from "crypto";
import { environ } from "./environ.js";

const secret = environ.INTERNAL_HMAC_SECRET;
const headerName = "x-hmac-signature";

const signPayload = (payload) => {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

export const postInternal = async (url, data = null, headers = {}) => {
  const payload = JSON.stringify(data);
  const signature = signPayload(payload);

  return fetch(url, {
    method: "POST",
    headers: {
      [headerName]: signature,
      "content-type": "application/json",
      ...headers,
    },
    body: payload,
  });
};
