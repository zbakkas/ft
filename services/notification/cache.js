import environ from "./src/utils/environ";
import { getInternal } from "./src/utils/internal";
import { redis } from "./src/utils/redis";

async function fetchUsernameFromCache(userId) {
  const key = `notification:username:${userId}`;
  const username = await redis.get(key);
  if (!username) {
    console.warn("Username Not Found! fetching from remote server...");
    const fetchedUser = await getInternal(
      `${environ.USER_MGMT_SERVICE_URL}/internal/users/${userId}`
    );
    await redis.setex(key, 10, fetchedUser.username);
    return fetchedUser.username;
  }
  return username;
}

async function clearCacheBlocked() {
  let stream = redis.scanStream({ match: "notification:blocks:*" });
  stream.on("data", async (keys) => {
    for (const key of keys) {
      await redis.del(key);
    }
  });
  stream = redis.scanStream({ match: "notification:blocked:*" });
  stream.on("data", async (keys) => {
    for (const key of keys) {
      await redis.del(key);
    }
  });
}

async function cacheBlocks() {
  const fetchedBlocked = await getInternal(
    `http://127.0.0.1:3002/internal/blocks`
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
  console.log(`All blocks has been cashed! Took ${Date.now() - time}ms`);
}

async function isUserBlocked(userId, targetUserId) {
  return await redis.sismember(`notification:blocks:${targetUserId}`, userId);
}

async function addUserToBlockSet(userId, targetUserId) {
  return await redis.sadd(`notification:blocks:${userId}`, targetUserId);
}

async function removeUserFromBlockSet(userId, targetUserId) {
  return await redis.srem(`notification:blocks:${userId}`, targetUserId);
}

// await clearCacheBlocked();
// await cacheBlocks();
// await addUserToBlockSet(
//   "019aa6f5-5678-71b2-ad4c-a373763dfffb",
//   "019aa6eb-605d-7df3-90f5-c6aae8512986"
// );
console.log(
  await isUserBlocked(
    "019aa6eb-605d-7df3-90f5-c6aae8512986",
    "019aa6f5-5678-71b2-ad4c-a373763dfffb"
  )
);
// await removeUserFromBlockSet(
//   "019aa6f5-5678-71b2-ad4c-a373763dfffb",
//   "019aa6eb-605d-7df3-90f5-c6aae8512986"
// );

await redis.quit();
