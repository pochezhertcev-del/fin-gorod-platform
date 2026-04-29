FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspaces

COPY packages/shared ./packages/shared
COPY apps/client ./apps/client

RUN npm --workspace apps/client run build

FROM nginx:alpine

COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
