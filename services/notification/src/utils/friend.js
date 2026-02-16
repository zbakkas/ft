import { redis } from "./redis";

const getUserFriends = async (userId) => {
  return redis.smembers(`notification:friends:${userId}`);
};

export default {};
