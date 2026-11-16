# Production image: docker build -t dar-zellij . && docker run -p 3100:3100 --env-file .env -v zellige-uploads:/app/storage dar-zellij
FROM node:22-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app ./
EXPOSE 3100
# Applies pending migrations, then starts the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
