#!/bin/sh
set -e

echo "Running OWASP CRS entrypoint scripts..."
if [ -d "/docker-entrypoint.d" ]; then
    /docker-entrypoint.sh nginx -t > /dev/null 2>&1 || true
fi

echo "Removing auto-generated default.conf in favor of custom waf.conf..."
rm -f /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

echo "Testing nginx configuration..."
nginx -t

echo "Starting nginx with custom WAF configuration..."
exec "$@"
