"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const amqplib_1 = __importDefault(require("amqplib"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: [".env", "../.env.shared"] });
exports.default = (0, fastify_plugin_1.default)(async (fastify) => {
    const connection = await amqplib_1.default.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertExchange("user.events", "topic", {
        durable: true,
    });
    fastify.decorate("rabbit", { connection, channel });
    fastify.addHook("onClose", async () => {
        await channel.close();
        await connection.close();
    });
});
//# sourceMappingURL=rabbit.js.map