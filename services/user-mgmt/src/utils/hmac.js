import crypto from "crypto";
import fp from "fastify-plugin";

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export default fp(async function hmacVerify(fastify, opts) {
  const { secret, headerName = "x-hmac-signature" } = opts;
  if (!secret) throw new Error("HMAC secret is required");

  fastify.addHook("preHandler", async (req, reply) => {
    if (!req.url.includes("/internal/")) return;

    const signature = req.headers[headerName];
    const payload = req.body ? JSON.stringify(req.body) : "";

    if (!signature || !verifySignature(payload, signature, secret)) {
      req.log.warn({ url: req.url }, "Invalid or missing HMAC signature");
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });
});
