FROM oven/bun:latest AS base

WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

RUN mkdir -p /temp/prod
COPY package.json bun.lock* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production


FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

RUN bunx prisma generate

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/prisma ./prisma
COPY --from=prerelease /usr/src/app/uploads ./uploads
COPY --from=prerelease /usr/src/app/package.json .
RUN mkdir -p /usr/src/logs && chown -R bun:bun /usr/src/app/prisma /usr/src/logs /usr/src/app/uploads

USER bun
EXPOSE 3002/tcp
ENTRYPOINT ["sh", "-c", "bunx prisma db push --skip-generate && bun run src/index.js"]
