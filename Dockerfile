FROM node:22-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]


