FROM node:22-slim AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
COPY packages/core/package.json packages/core/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/cli/package.json apps/cli/package.json
RUN npm ci --ignore-scripts
COPY packages/core packages/core
COPY apps/web apps/web
COPY testing testing
COPY api api
COPY vercel.json ./
RUN npm run build:web && npm run test:core && npm run test:web

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0
COPY package*.json ./
COPY packages/core/package.json packages/core/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/cli/package.json apps/cli/package.json
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/apps/web/public apps/web/public
USER node
EXPOSE 3000
CMD ["node","apps/web/dist/src/server.js"]
