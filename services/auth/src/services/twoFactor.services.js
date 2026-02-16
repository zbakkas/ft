import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import { environ } from "../utils/environ.js";
import { prisma } from "../db/prisma.js";

const setup2FA = async (id) => {
  const secret = speakeasy.generateSecret({
    name: `Transcendence:${id}`,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeUrl,
  };
};

const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
};

const encrypt2FASecret = (secret) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", environ.TWO_FA_KEY, iv);
  let encryptedSecret = cipher.update(secret, "ascii", "hex");
  encryptedSecret += cipher.final("hex");
  return {
    encryptedSecret,
    iv,
    tag: cipher.getAuthTag(),
  };
};

const decrypt2FASecret = (encryptedSecret, iv, tag) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    environ.TWO_FA_KEY,
    iv
  );
  decipher.setAuthTag(tag);
  let decryptedSecret = decipher.update(encryptedSecret, "hex", "ascii");
  decryptedSecret += decipher.final("ascii");
  return decryptedSecret;
};

/**
 *
 * @param {string} userId
 * @param {{secret: string, qrCodeUrl: string, backupCodes: string[]}} twoFaObj
 */
const store2FA = async (userId, twoFaObj) => {
  try {
    const { encryptedSecret, iv, tag } = encrypt2FASecret(twoFaObj.secret);
    await prisma.twoFactorAuth.create({
      data: {
        userId,
        secret: encryptedSecret,
        iv,
        tag,
      },
    });
  } catch (error) {
    console.error("Error storing 2FA data:", error);
    throw error;
  }
};

const userHas2FA = async (userId, method) => {
  try {
    return await prisma.twoFactorAuth.findFirst({
      where: {
        userId,
        method,
      },
    });
  } catch (error) {
    console.error("Error checking if user has 2FA:", error);
    throw error;
  }
};

const userHasActivated2FA = async (userId, method) => {
  try {
    return await prisma.twoFactorAuth.findFirst({
      where: {
        userId,
        method,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error("Error checking if user has activated 2FA:", error);
    throw error;
  }
};

const fetchUser2FA = async (userId, method) => {
  try {
    return await prisma.twoFactorAuth.findFirst({
      where: {
        userId,
        method,
      },
    });
  } catch (error) {
    console.error("Error fetching user 2FA:", error);
    throw error;
  }
};

const generateBackupCodes = () => {
  return Array.from({ length: 20 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
};

export const _2FAService = {
  setup2FA,
  verify2FAToken,
  encrypt2FASecret,
  store2FA,
  userHas2FA,
  userHasActivated2FA,
  fetchUser2FA,
  decrypt2FASecret,
  generateBackupCodes,
};
