FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/dist ./dist

COPY server/server.cjs ./server.cjs
COPY package.json ./

RUN npm install --omit=dev && \
    npm install express cors bcrypt jsonwebtoken multer dotenv --omit=dev

RUN mkdir -p /app/data/uploads

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV JWT_SECRET=germany-secret-2024
ENV CORS_ORIGIN=*

CMD ["dumb-init", "node", "server.cjs"]