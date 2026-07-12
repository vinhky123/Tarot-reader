# Proxy image — holds GEMINI_API_KEY in the runtime container only.
# The web (nginx) image never sees this key.

FROM node:20-alpine AS runtime

WORKDIR /app

# Install the proxy's deps (@google/genai + tsx for loading correspondences.ts).
COPY server/package.json ./
RUN npm install --omit=dev && npm cache clean --force

# proxy.mjs imports the shared correspondence data from ../src/data/.
COPY server/proxy.mjs ./
COPY src/data/correspondences.ts ./src/data/correspondences.ts

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

# Run as a non-root user for defense in depth.
USER node

CMD ["node", "--import", "tsx/proxy", "proxy.mjs"]
