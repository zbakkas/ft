import amqp from "amqplib";
import { prisma } from "./db/prisma.js";
import {
  broadcastToUser,
  notifyPresenceChange,
} from "./routes/notification.routes.js";
import {
  addFriendshipToCache,
  addUserToBlockSet,
  fetchUsernameFromCache,
  isUserFriendOf,
  removeFriendshipFromCache,
  removeUserFromBlockSet,
} from "./utils/cache.js";
import environ from "./utils/environ.js";

const FORMATTERS = async (p) => {
  const username = await fetchUsernameFromCache(p.fromUser);
  console.log("[USERNAME]", username);
  return {
    "friend:accepted": () => ({
      type: "friend:accepted",
      title: "A friend accepted your friend request",
      content: `@${username} accepted your friend request.`,
      fromUser: {
        id: p.fromUser,
        username,
      },
    }),
    "friend:request": () => ({
      type: "friend:request",
      title: "You have a new friend request",
      content: `@${username} sent you a friend request.`,
      fromUser: {
        id: p.fromUser,
        username,
      },
    }),
    "message:new": () => ({
      type: "message:new",
      title: "You have a new message",
      content: `@${username} sent you a message.`,
      fromUser: {
        id: p.fromUser,
        username,
      },
    }),
    "tournament:match-started": () => ({
      type: "tournament:match-started",
      title: "Tournament match started",
      content: `@${username} has started your tournament match. Join now!`,
      fromUser: {
        id: p.fromUser,
        username,
      },
      matchId: p.matchId,
      gameMatchId: p.gameMatchId,
      tournamentId: p.tournamentId,
    }),
  };
};

const exchange = "user.events";
const queue = "notifications.queue";

async function consumer() {
  const connection = await amqp.connect(environ.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, "user.*");
  await channel.bindQueue(queue, exchange, "friendship.*");
  await channel.bindQueue(queue, exchange, "message.*");
  await channel.bindQueue(queue, exchange, "tournament.*");

  channel.consume(
    queue,
    async (msg) => {
      if (msg) {
        try {
          const parsedMsg = JSON.parse(msg.content.toString());
          const formatter = await FORMATTERS(parsedMsg);
          let formatted;
          console.log(parsedMsg);
          switch (msg.fields.routingKey) {
            case "user.created":
              await prisma.notification.create({
                data: {
                  type: "system",
                  title: "Welcome to transcendence",
                  content: "We're happy to have you here, play and enjoy games",
                  userId: parsedMsg.userId,
                },
              });
              break;
            case "friendship.request":
              formatted = formatter["friend:request"]();
              await prisma.notification.create({
                data: {
                  type: formatted.type,
                  title: formatted.title,
                  content: formatted.content,
                  userId: parsedMsg.userId,
                },
              });
              broadcastToUser(parsedMsg.userId, formatted);
              break;
            case "friendship.created":
              formatted = formatter["friend:accepted"]();
              await prisma.notification.create({
                data: {
                  type: formatted.type,
                  title: formatted.title,
                  content: formatted.content,
                  userId: parsedMsg.userId,
                },
              });
              broadcastToUser(parsedMsg.userId, formatted);
              await addFriendshipToCache({
                receiverId: parsedMsg.userId,
                requesterId: parsedMsg.fromUser,
              });
              break;
            case "friendship.unblocked":
              removeUserFromBlockSet(parsedMsg);
              if (isUserFriendOf(parsedMsg.requesterId, parsedMsg.receiverId))
                await notifyPresenceChange(parsedMsg, "online");
              break;
            case "friendship.blocked":
              addUserToBlockSet(parsedMsg);
              if (isUserFriendOf(parsedMsg.requesterId, parsedMsg.receiverId))
                await notifyPresenceChange(parsedMsg);
              break;
            case "friendship.removed":
              await notifyPresenceChange(parsedMsg);
              await removeFriendshipFromCache(parsedMsg);
              break;
            case "message.new":
              formatted = formatter["message:new"]();
              await prisma.notification.create({
                data: {
                  type: formatted.type,
                  title: formatted.title,
                  content: formatted.content,
                  userId: parsedMsg.userId,
                },
              });
              broadcastToUser(parsedMsg.userId, formatted);
              break;
            case "tournament.match-started":
              formatted = formatter["tournament:match-started"]();
              await prisma.notification.create({
                data: {
                  type: formatted.type,
                  title: formatted.title,
                  content: formatted.content,
                  userId: parsedMsg.userId,
                },
              });
              broadcastToUser(parsedMsg.userId, formatted);
              break;
            default:
              console.log(parsedMsg);
          }
        } catch (err) {
          console.error("[!] Failed to parse message content:", err);
        }
        channel.ack(msg);
      }
    },
    { noAck: false },
  );

  console.log(
    `[*] Waiting for messages in queue '${queue}'. To exit press CTRL+C`,
  );

  const closeGracefully = async () => {
    console.log("[*] Closing AMQP channel and connection...");
    try {
      await channel.close();
    } catch (err) {
      console.warn("[!] Error closing channel:", err);
    }
    try {
      await connection.close();
    } catch (err) {
      console.warn("[!] Error closing connection:", err);
    }
    process.exit(0);
  };

  process.once("SIGINT", closeGracefully);
  process.once("SIGTERM", closeGracefully);
}

export default consumer;
