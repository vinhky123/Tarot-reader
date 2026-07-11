FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The web bundle no longer needs the Gemini key — that lives only in the proxy
# service. VITE_GEMINI_MODEL is kept purely informational; the proxy selects the
# actual model via GEMINI_MODEL.
ARG VITE_GEMINI_MODEL=gemini-2.0-flash
ENV VITE_GEMINI_MODEL=$VITE_GEMINI_MODEL

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
