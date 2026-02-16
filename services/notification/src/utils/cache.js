import environ from "./environ.js";
import { getInternal } from "./internal.js";
import { redis } from "./redis.js";

async function listFriendships() {
  const stream = redis.scanStream({ match: "notification:friends:*" });
  stream.on("data", async (keys) => {
    for (const key of keys) {
      console.log(key);
      console.log(await redis.smembers(key));
    }
  });
}

export async function cacheFriendships() {
  const relationships = await getInternal(
    `${environ.USER_MGMT_SERVICE_URL}/internal/friendships`
  );
  const time = Date.now();

  const arr = [];

  for (const relationship of relationships) {
    arr.push(
      ...[
        redis.sadd(
          `notification:friends:${relationship.requesterId}`,
          relationship.receiverId
        ),
        redis.sadd(
          `notification:friends:${relationship.receiverId}`,
          relationship.requesterId
        ),
      ]
    );
  }

  await Promise.all(arr);

  console.log(`All friendship has been cashed! Took ${Date.now() - time}ms`);
  await listFriendships();
}

export async function removeFriendshipFromCache({ requesterId, receiverId }) {
  await Promise.all([
    redis.srem(`notification:friends:${requesterId}`, receiverId),
    redis.srem(`notification:friends:${receiverId}`, requesterId),
  ]);
  console.log(`removed: ${requesterId} && ${receiverId}`);
  await listFriendships();
}

export async function addFriendshipToCache({ requesterId, receiverId }) {
  await Promise.all([
    redis.sadd(`notification:friends:${requesterId}`, receiverId),
    redis.sadd(`notification:friends:${receiverId}`, requesterId),
  ]);
  console.log(`added: ${requesterId} && ${receiverId}`);
  await listFriendships();
}

export async function isUserFriendOf(userId, targetUserId) {
  return await redis.sismember(`notification:friends:${targetUserId}`, userId);
}

export async function fetchUsernameFromCache(userId) {
  const key = `notification:username:${userId}`;
  const username = await redis.get(key);
  if (!username) {
    console.warn("Username Not Found! fetching from remote server...");
    const fetchedUser = await getInternal(
      `${environ.USER_MGMT_SERVICE_URL}/internal/users/${userId}`
    );
    await redis.setex(key, 60, fetchedUser.username);
    return fetchedUser.username;
  }
  return username;
}

async function listBlocks() {
  const stream = redis.scanStream({ match: "notification:blocks:*" });
  stream.on("data", async (keys) => {
    for (const key of keys) {
      console.log(key);
      console.log(await redis.smembers(key));
    }
  });
}

export async function cacheBlocks() {
  const fetchedBlocked = await getInternal(
    `${environ.USER_MGMT_SERVICE_URL}/internal/blocks`
  );
  const time = Date.now();
  const jobs = [];
  for (const blocked of fetchedBlocked) {
    jobs.push(
      await redis.sadd(
        `notification:blocks:${blocked.blockerId}`,
        blocked.blockedId
      )
    );
  }
  await Promise.all(jobs);
  console.log(`All blocked users has been cashed! Took ${Date.now() - time}ms`);
  await listBlocks();
}

export async function isUserBlocked(userId, targetUserId) {
  return await redis.sismember(`notification:blocks:${targetUserId}`, userId);
}

export async function addUserToBlockSet({
  requesterId: userId,
  receiverId: targetUserId,
}) {
  return await redis.sadd(`notification:blocks:${userId}`, targetUserId);
}

export async function removeUserFromBlockSet({
  requesterId: userId,
  receiverId: targetUserId,
}) {
  return await redis.srem(`notification:blocks:${userId}`, targetUserId);
}
