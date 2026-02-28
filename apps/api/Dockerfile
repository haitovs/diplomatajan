FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY workers/sim-runner/package.json ./workers/sim-runner/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/sim-core/package.json ./packages/sim-core/package.json

RUN npm install

COPY apps/api ./apps/api
COPY packages/contracts ./packages/contracts
COPY packages/sim-core ./packages/sim-core

WORKDIR /app/apps/api
RUN npm run build

EXPOSE 4051
CMD ["npm", "run", "dev"]
