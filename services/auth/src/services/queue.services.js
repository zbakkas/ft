import { Queue, QueueEvents } from "bullmq";
import { redis } from "../db/redis.js";

export const QueueType = Object.freeze({
  REGISTRATION: "registration",
  EMAIL: "email",
});

/**
 * @type {Map<QueueType, Queue>}
 */
const queues = new Map();

/**
 * @type {Map<QueueType, QueueEvents>}
 */
const queueEvents = new Map();

export const getQueue = (name) => {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection: redis,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      })
    );
    queueEvents.set(name, new QueueEvents(name, { connection: redis }));
  }
  return queues.get(name);
};

export const closeAll = async () => {
  for (const q of Object.values(queues)) {
    await q.close();
  }
  for (const q of Object.values(queueEvents)) {
    await q.close();
  }
};
