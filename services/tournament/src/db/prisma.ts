import { PrismaClient } from "../generated/prisma/index.js";

export const prisma = new PrismaClient();

await prisma.$queryRaw`PRAGMA journal_mode = WAL;`;
await prisma.$executeRaw`PRAGMA synchronous = NORMAL;`;
