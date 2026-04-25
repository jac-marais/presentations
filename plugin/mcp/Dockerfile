FROM node:22-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DOCKER_CONTAINER=1

WORKDIR /app
COPY package-capture.json package.json
RUN npm install --omit=dev
COPY capture.mjs .

ENTRYPOINT ["node", "capture.mjs"]
