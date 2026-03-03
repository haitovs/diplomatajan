# Build frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Install server deps
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev

# Final image: nginx + node (all-in-one)
FROM nginx:alpine
RUN apk add --no-cache nodejs

# Nginx config + frontend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Server code + deps
COPY server/*.js /app/server/
COPY --from=server-deps /app/server/node_modules /app/server/node_modules

# Entrypoint runs target + proxy + nginx
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4089
CMD ["/entrypoint.sh"]
