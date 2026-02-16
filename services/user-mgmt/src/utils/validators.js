import errorMessages from "../schemas/errorMessages.js";
import { sendError } from "./fastify.js";

/**
 *
 * @param {import('zod').ZodObject} schema
 * @return {import('fastify').RouteHandlerMethod}
 */
export const bodyValidator = (schema) => async (request, reply) => {
  const result = schema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      path: err.path?.join(".") || err.keys?.join("."),
      code: err.message,
      message: errorMessages[err.message],
    }));
    return sendError(reply, 400, "BAD_REQUEST", { errors: errors });
  }
  return;
};
