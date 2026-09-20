FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS verify
COPY . .
RUN npm run check

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev --no-audit --no-fund

FROM dependencies AS browser-dependencies
RUN npx playwright install --with-deps chromium

FROM browser-dependencies AS browser-tests
COPY . .
COPY --from=verify /app/dist ./dist
CMD ["npm", "run", "test:browser"]

FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN mkdir /data && chown node:node /data
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=verify /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/server/main.js"]
