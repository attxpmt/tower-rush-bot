FROM node:20-alpine AS base
WORKDIR /app

# Install backend deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# Install dev deps for build
RUN npm install && npm run build && npm run prisma:generate

# ---- Mini App build ----
FROM node:20-alpine AS mini-builder
WORKDIR /app/mini-app
COPY mini-app/package*.json ./
RUN npm install
COPY mini-app ./
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=mini-builder /app/mini-app/dist ./mini-app/dist

RUN npm install -g prisma

# Railway sets PORT dynamically
EXPOSE ${PORT:-3000}

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
