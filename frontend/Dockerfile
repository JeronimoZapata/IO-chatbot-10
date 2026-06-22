FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend/ ./frontend/

# NEXT_PUBLIC_* se resuelve en build time y lo consume el navegador del
# usuario, por eso apunta a localhost (no al nombre del servicio Docker).
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter frontend build

EXPOSE 3000

CMD ["pnpm", "--filter", "frontend", "start"]
