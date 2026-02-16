import fs from "fs";
import mime from "mime-types";
import path from "path";
import sharp from "sharp";
import { prisma } from "../db/prisma.js";
import { sendError, sendSuccess } from "../utils/fastify.js";
import { generateFilename, saveFile } from "../utils/file.js";

const DEFAULT_AVATAR_PATH = path.join("uploads", "avatars", "default");

/**
 * Ensures default avatar exists for all sizes
 */
const ensureDefaultAvatar = async () => {
  const sizes = [
    { name: "small", width: 64, height: 64 },
    { name: "medium", width: 128, height: 128 },
    { name: "large", width: 512, height: 512 },
  ];

  if (!fs.existsSync(DEFAULT_AVATAR_PATH)) {
    fs.mkdirSync(DEFAULT_AVATAR_PATH, { recursive: true });
  }

  for (const size of sizes) {
    const filePath = path.join(DEFAULT_AVATAR_PATH, `${size.name}.png`);
    if (!fs.existsSync(filePath)) {
      await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 4,
          background: { r: 230, g: 230, b: 230, alpha: 1 },
        },
      })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
        })
        .toFile(filePath);
    }
  }
};

ensureDefaultAvatar().catch(console.error);

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const updateMyProfile = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  if (!request.body || Object.keys(request.body).length == 0)
    return reply.code(400).send({ error: "Bad Request" });
  const data = request.body;
  await prisma.userProfile.update({
    where: { id: userId },
    data,
  });
  return sendSuccess(reply, 200, "USER_PROFILE_UPDATE_SUCCESS");
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const showMyProfile = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  return prisma.userProfile.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      language: true,
      bio: true,
    },
  });
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const updateMyAvatar = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  let tempFilePath = null;
  let newDirPath = null;

  try {
    const data = await request.file();

    if (!data) {
      return sendError(reply, 400, "No file uploaded");
    }

    const ALLOWED_TYPES = ["image/png", "image/jpeg"];
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ASPECT_RATIO_TOLERANCE = 0.01;

    if (!ALLOWED_TYPES.includes(data.mimetype)) {
      return sendError(reply, 400, "Invalid file type. Only JPEG/PNG allowed.");
    }

    const extension = path.extname(data.filename);
    const filename = generateFilename(extension);
    const dirPath = path.join("uploads", "avatars", generateFilename());
    const filePath = path.join(dirPath, filename);

    tempFilePath = filePath;
    newDirPath = dirPath;

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    await saveFile(data.file, filePath);

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return sendError(reply, 400, "File size exceeds 5MB limit");
    }

    const { width, height } = await sharp(filePath).metadata();
    const aspectRatio = width / height;
    const isSquare = Math.abs(aspectRatio - 1) < ASPECT_RATIO_TOLERANCE;

    if (!isSquare) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return sendError(reply, 400, "NOT_SQUARE");
    }

    const oldUserData = await prisma.$transaction(async (tx) => {
      const old = await tx.userProfile.findUnique({
        where: { id: userId },
        select: { avatarPath: true },
      });

      await tx.userProfile.update({
        where: { id: userId },
        data: {
          avatarPath: dirPath,
          avatarName: data.filename,
        },
      });

      return old;
    });

    const AVATAR_SIZES = [
      { name: "small", width: 64, height: 64 },
      { name: "medium", width: 128, height: 128 },
      { name: "large", width: 512, height: 512 },
    ];

    const ext = path.extname(data.filename);
    await Promise.all(
      AVATAR_SIZES.map((size) => {
        const outputFile = path.join(dirPath, `${size.name}${ext}`);
        return sharp(filePath)
          .resize(size.width, size.height, { fit: "cover" })
          .toFile(outputFile);
      }),
    );

    fs.unlinkSync(filePath);

    if (oldUserData?.avatarPath && fs.existsSync(oldUserData.avatarPath)) {
      fs.rmSync(oldUserData.avatarPath, { recursive: true, force: true });
    }

    return sendSuccess(reply, 201, "Avatar updated successfully");
  } catch (error) {
    console.error("Error updating avatar:", error);

    if (newDirPath && fs.existsSync(newDirPath)) {
      fs.rmSync(newDirPath, { recursive: true, force: true });
    }

    if (error.code === "ENOSPC") {
      return sendError(reply, 507, "Insufficient storage space");
    }

    return sendError(reply, 500, "Failed to update avatar");
  }
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const showMyAvatar = async (request, reply) => {
  const userId = request.headers["x-user-id"];
  const size = request.query.size?.toLowerCase() || "large";
  const allowedSizes = ["small", "medium", "large"];
  if (!allowedSizes.includes(size)) {
    return sendError(
      reply,
      400,
      `Invalid size, valid ones are (${allowedSizes.join(" or ")})`,
    );
  }
  try {
    const result = await prisma.userProfile.findUnique({
      where: {
        id: userId,
      },
      select: {
        avatarPath: true,
        avatarName: true,
      },
    });

    let filePath;
    let filename;

    if (!result?.avatarPath) {
      filePath = path.join(DEFAULT_AVATAR_PATH, `${size}.png`);
      filename = "default-avatar.png";
    } else {
      const ext = path.extname(result.avatarName);
      filePath = path.join(result.avatarPath, `${size}${ext}`);
      filename = result.avatarName;

      if (!fs.existsSync(filePath)) {
        filePath = path.join(DEFAULT_AVATAR_PATH, `${size}.png`);
        filename = "default-avatar.png";
      }
    }

    const fileStream = fs.createReadStream(filePath);
    const ext = path.extname(filename);
    return reply
      .header("Content-Disposition", `inline; filename="${filename}"`)
      .type(mime.contentType(ext))
      .send(fileStream);
  } catch (e) {
    console.error("Error serving avatar:", e);
    return sendError(reply, 500, "Failed to serve avatar");
  }
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const showUserAvatar = async (request, reply) => {
  const { username } = request.params;
  const size = request.query.size?.toLowerCase() || "large";
  const allowedSizes = ["small", "medium", "large"];
  if (!allowedSizes.includes(size)) {
    return sendError(
      reply,
      400,
      `Invalid size, valid ones are (${allowedSizes.join(" or ")})`,
    );
  }
  try {
    const result = await prisma.userProfile.findUnique({
      where: {
        username,
      },
      select: {
        avatarPath: true,
        avatarName: true,
      },
    });
    if (!result) return sendError(reply, 404, "USER_NOT_FOUND");

    let filePath;
    let filename;

    if (!result.avatarPath) {
      filePath = path.join(DEFAULT_AVATAR_PATH, `${size}.png`);
      filename = "default-avatar.png";
    } else {
      const ext = path.extname(result.avatarName);
      filePath = path.join(result.avatarPath, `${size}${ext}`);
      filename = result.avatarName;

      if (!fs.existsSync(filePath)) {
        filePath = path.join(DEFAULT_AVATAR_PATH, `${size}.png`);
        filename = "default-avatar.png";
      }
    }

    const fileStream = fs.createReadStream(filePath);
    const ext = path.extname(filename);
    return reply
      .header("Content-Disposition", `inline; filename="${filename}"`)
      .type(mime.contentType(ext))
      .send(fileStream);
  } catch (e) {
    console.error("Error serving avatar:", e);
    return sendError(reply, 500, "Failed to serve avatar");
  }
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const searchUsers = async (request, reply) => {
  const { q } = request.query;
  const currentUser = request.headers["x-user-id"];
  if (!q) return sendError(reply, 400, "query required!");
  const users = await prisma.userProfile.findMany({
    where: {
      username: {
        contains: q,
      },
      id: { not: currentUser },
      BlockedUsers: {
        none: { blockedId: currentUser },
      },
    },
  });
  return users;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getUserByUsername = async (request, reply) => {
  const currentUser = request.headers["x-user-id"];
  const { username } = request.params;

  const user = await prisma.userProfile.findUnique({
    where: {
      username,
      BlockedUsers: { none: { blockedId: currentUser } },
    },
    select: {
      id: true,
      username: true,
      bio: true,
    },
  });
  if (!user) return sendError(reply, 404, "USER_NOT_FOUND");
  return user;
};

/**
 *
 * @type {import('fastify').RouteHandlerMethod}
 */
const getUserById = async (request, reply) => {
  const currentUser = request.headers["x-user-id"];
  const { userId } = request.params;
  const user = await prisma.userProfile.findUnique({
    where: {
      id: userId,
      BlockedUsers: { none: { blockedId: currentUser } },
    },
  });
  if (!user) return sendError(reply, 404, "USER_NOT_FOUND");
  return user;
};

export default {
  updateMyProfile,
  showMyProfile,
  updateMyAvatar,
  showMyAvatar,
  showUserAvatar,
  searchUsers,
  getUserByUsername,
  getUserById,
};
