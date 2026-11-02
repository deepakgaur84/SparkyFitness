FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-musclemap-config.sh /docker-entrypoint.d/40-musclemap-config.sh
RUN chmod +x /docker-entrypoint.d/40-musclemap-config.sh

COPY app/ /usr/share/nginx/html/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
