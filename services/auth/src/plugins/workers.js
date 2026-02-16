import fp from "fastify-plugin";
import emailWorker from "../workers/email.worker";
import mainWorker from "../workers/main.worker";

export default fp(async (fastify) => {
  let workers = []
  workers.push(mainWorker());
  workers.push(emailWorker());
  fastify.log.info("Workers registered!")
  fastify.addHook("preClose", () => {
    console.log("Closed");
  })
  fastify.addHook("onClose", async () => {
    for (const worker of workers) {
      await worker.close();
    }
    console.log("Workers closed!")
  });
});
