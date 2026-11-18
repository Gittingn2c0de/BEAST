
FROM node:20-bookworm-slim

# Install FFmpeg for BEAST's film-rendering feature.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the application.
COPY package.json ./
COPY server.mjs ./
COPY public ./public
COPY knowledge ./knowledge

# Create writable directories for BEAST's data.
RUN mkdir -p /app/workspace/exports /app/workspace/assets \
    && chown -R node:node /app

# Run as a non-root user.
USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV BEAST_NO_OPEN=1

EXPOSE 3000

CMD ["npm", "start"]
