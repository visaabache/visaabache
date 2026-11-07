# VISA ABACHE — production image (Node 22, Next.js standalone server)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates postgresql-client && rm -rf /var/lib/apt/lists/* \
  && groupadd -r app && useradd -r -g app -d /app app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 STORAGE_LOCAL_DIR=/data/storage
COPY --from=build --chown=app:app /app ./
RUN mkdir -p /data/storage && chown -R app:app /data
USER app
EXPOSE 3000
VOLUME ["/data"]
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT}"]
