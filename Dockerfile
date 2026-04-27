FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .
RUN NODE_OPTIONS="--max-old-space-size=3072" npm run build

# ---- production stage ----
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.output ./output

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "./output/server/index.mjs"]
