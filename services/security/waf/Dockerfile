FROM owasp/modsecurity-crs:nginx-alpine

USER root

RUN apk add --no-cache curl bash

COPY configure-waf.sh /configure-waf.sh
COPY pages/blocked.html /usr/share/nginx/html/blocked.html

RUN chmod +x /configure-waf.sh && \
    mkdir -p /var/log/modsec /var/log/nginx

EXPOSE 8080

CMD ["/configure-waf.sh"]
