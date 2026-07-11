# Proxy image — holds GEMINI_API_KEY in the runtime container only.
# The web (nginx) image never sees this key.

FROM node:20-alpine AS runtime

WORKDIR /app

# Install only the proxy's deps (just @google/genai). No build step needed.
COPY server/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server/proxy.mjs ./

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

# Run as a non-root user for defense in depth.
USER node

CMD ["node", "proxy.mjs"]
