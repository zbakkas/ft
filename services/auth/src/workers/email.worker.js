import { Worker } from "bullmq";
import { fileURLToPath } from "url";
import { redis } from "../db/redis.js";
import { QueueType } from "../services/queue.services.js";
import mailer from "../utils/mailer.js";

let running_worker;

const emailWorker = () =>
  new Worker(
    QueueType.EMAIL,
    async (job) => {
      console.log("Job (email) started!");
      const { email, template, context } = job.data;
      try {
        console.log(`Sending email for ${template}`);
        await mailer.sendEmail(template, email, context);
        console.log(`Sending email for ${template}`);
      } catch (e) {
        console.error(`ERROR: ${e}`);
      }
      console.log("Job (email) done");
    },
    {
      connection: redis,
      concurrency: 10,
      limiter: {
        max: 200,
        duration: 1000,
      },
    }
  );

process.on("SIGINT", async () => {
  await running_worker?.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await running_worker?.close();
  process.exit(0);
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Email worker started!");
  running_worker = emailWorker();
}

export default emailWorker;
