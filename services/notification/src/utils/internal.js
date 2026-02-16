import crypto from "crypto";
import environ from "./environ.js";

const headerName = "x-hmac-signature";

const signPayload = (payload) => {
  return crypto
    .createHmac("sha256", environ.INTERNAL_HMAC_SECRET)
    .update(payload)
    .digest("hex");
};

function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function fetchRetry(url, delay, tries, fetchOptions = {}) {
  let triesLeft;
  function onError(err) {
    triesLeft = tries - 1;
    console.error(`Failed to fetch ${url} retrying...`);
    if (!triesLeft) {
      throw err;
    }
    return wait(delay).then(() =>
      fetchRetry(url, delay, triesLeft, fetchOptions)
    );
  }
  return fetch(url, fetchOptions).catch(onError);
}

export const getInternal = async (url) => {
  const res = await fetchRetry(url, 2000, 5, {
    headers: {
      [headerName]: signPayload(""),
    },
  });
  return await res.json();
};

export const postInternal = async (url, data = {}, headers = {}) => {
  const payload = JSON.stringify(data);
  const signature = signPayload(payload);

  return fetchRetry(url, 2000, 5, {
    method: "POST",
    headers: {
      ...headers,
      [headerName]: signature,
      "content-type": "application/json",
    },
    body: payload,
  });
};
