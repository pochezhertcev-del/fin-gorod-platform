FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspaces

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN npm --workspace apps/server run build

FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
