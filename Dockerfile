FROM node:22-bookworm-slim AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=5000
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node backend/ ./
COPY --from=build /app/frontend/dist /app/frontend/dist
RUN mkdir -p uploads keys_store && chown node:node uploads keys_store
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "server.js"]
