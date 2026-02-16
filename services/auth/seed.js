import { faker } from "@faker-js/faker";
import { prisma } from "./src/db/prisma";
import { password as pw } from "bun";

async function seedUsers() {
  const userTemplate = () => ({
    username: faker.internet.username(),
    email: faker.internet.email(),
    passwordHashed: faker.internet.password(),
  });
  const users = faker.helpers.multiple(userTemplate, { count: 10 });
  //   await prisma.user.createMany({
  //     data: [{}],
  //   });
  const data = await Promise.all(
    users.map(async (user) => ({
      ...user,
      username: undefined,
      passwordHashed: await pw.hash(user.password, {
        algorithm: "bcrypt",
        cost: 10,
      }),
      isVerified: true,
    }))
  );
  await Bun.write("accounts.json", JSON.stringify(users, null, 2));
  await prisma.user.createMany({
    data,
  });
}

await seedUsers();
