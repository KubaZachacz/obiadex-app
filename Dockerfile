FROM node:lts AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY . .
RUN npm run build

FROM node:lts AS runner
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]

