import { Worker } from "bullmq";
import { fileURLToPath } from "url";
import { prisma } from "../db/prisma.js";
import { redis } from "../db/redis.js";
import otpServices from "../services/otp.services.js";
import { getQueue, QueueType } from "../services/queue.services.js";
import { environ } from "../utils/environ.js";
import { postInternal } from "../utils/internalClient.js";

let running_worker;

const eventHandler = {
  UserRegistered: async (payload, userId) => {
    const { username, email, headers } = payload;
    const otp = await otpServices.createOTP(
      prisma,
      userId,
      "email_verification",
    );
    await getQueue(QueueType.EMAIL).add("send-verification", {
      email,
      template: "verifyEmail",
      context: {
        link: `${environ.CLIENT_URL}/verify-email?token=${otp.token}`,
      },
    });
    const res = await postInternal(
      `${environ.USER_MGMT_SERVICE_URL}/internal/profiles`,
      {
        userId,
        username,
      },
      headers,
    );
    if (!res.ok) throw new Error("Internal server error");
  },
  ResendVerification: async (payload, userId) => {
    const { email } = payload;
    const otp = await otpServices.createOTP(
      prisma,
      userId,
      "email_verification",
    );
    await getQueue(QueueType.EMAIL).add("send-verification", {
      email,
      template: "verifyEmail",
      context: {
        link: `${environ.CLIENT_URL}/verify-email?token=${otp.token}`,
      },
    });
  },
};

const mainWorker = () =>
  new Worker(
    QueueType.REGISTRATION,
    async (job) => {
      console.log("Job (registration) started!");
      const { outboxId, userId, eventType, payload } = job.data;
      try {
        await eventHandler[eventType](payload, userId);
        await prisma.outBox.update({
          where: { id: outboxId },
          data: { status: "processed" },
        });
      } catch (e) {
        await prisma.outBox.update({
          where: { id: outboxId },
          data: { status: "failed" },
        });
        console.error(e);
      }
      console.log("Job (registration) done");
    },
    {
      connection: redis,
      concurrency: 5,
    },
  );

setInterval(async () => {
  const events = await prisma.outBox.findMany({
    where: {
      status: "pending",
    },
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  for (const event of events) {
    await getQueue(QueueType.REGISTRATION).add("process-registration", {
      outboxId: event.id,
      userId: event.userId,
      eventType: event.eventType,
      payload: event.payload,
    });
    await prisma.outBox.update({
      where: { id: event.id },
      data: { status: "queued" },
    });
  }
}, 1000);

process.on("SIGINT", async () => {
  await running_worker?.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await running_worker?.close();
  process.exit(0);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Registration worker started!");
  running_worker = mainWorker();
}

export default mainWorker;
