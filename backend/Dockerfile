FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile --filter backend

COPY backend/ ./backend/
RUN pnpm --filter backend build

EXPOSE 3001

CMD ["node", "backend/dist/main"]
