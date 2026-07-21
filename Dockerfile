FROM node:24-alpine AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile --filter @verae/api...

COPY server server
COPY packages packages
RUN pnpm --filter @verae/contracts build && pnpm --filter @verae/api build

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache tini

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/packages/contracts ./packages/contracts
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/migrations ./server/migrations
COPY --from=build /app/server/seeds ./server/seeds

USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/dist/index.js"]
