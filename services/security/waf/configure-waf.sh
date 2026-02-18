#!/bin/bash
set -e

echo "=== Custom WAF Configuration ==="

echo "Running OWASP CRS initialization scripts..."
if [ -d "/docker-entrypoint.d" ]; then
    for f in $(find /docker-entrypoint.d -type f \( -name '*.sh' -o -name '*.envsh' \) | sort); do
        if [ -x "$f" ]; then
            echo "  -> $f"
            case "$f" in
                *.envsh) . "$f" ;;
                *.sh) "$f" ;;
            esac
        fi
    done
fi

echo "Applying custom ModSecurity overrides..."

if grep -q "SecResponseBodyAccess" /etc/modsecurity.d/modsecurity-override.conf 2>/dev/null; then
    sed -i 's/SecResponseBodyAccess On/SecResponseBodyAccess Off/' /etc/modsecurity.d/modsecurity-override.conf
else
    echo "SecResponseBodyAccess Off" >> /etc/modsecurity.d/modsecurity-override.conf
fi

if ! grep -q "SecRequestBodyLimit" /etc/modsecurity.d/modsecurity-override.conf 2>/dev/null; then
    echo "SecRequestBodyLimit 13107200" >> /etc/modsecurity.d/modsecurity-override.conf
    echo "SecRequestBodyNoFilesLimit 131072" >> /etc/modsecurity.d/modsecurity-override.conf
fi

echo "Allowing PUT/PATCH/DELETE methods for REST API..."
cat >> /etc/modsecurity.d/modsecurity-override.conf <<'MODSEC'

# Allow PUT, PATCH, DELETE methods (needed for REST API file uploads, updates, etc.)
SecRule REQUEST_METHOD "^(?:GET|HEAD|POST|OPTIONS|PUT|PATCH|DELETE)$" \
    "id:900200,\
    phase:1,\
    pass,\
    t:none,\
    nolog,\
    ctl:ruleRemoveById=911100"

SecRule REQUEST_HEADERS:Host "@rx ^localhost:(6969|9090|5601|8200)$" \
    "id:900300,\
    phase:1,\
    pass,\
    t:none,\
    nolog,\
    ctl:ruleEngine=Off"
MODSEC

echo "Writing custom nginx routing config..."

cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server_tokens off;

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

map $http_host $backend {
    "localhost:6969" "grafana:6969";
    "localhost:9090" "prometheus:9090";
    "localhost:5601" "kibana:5601";
    "localhost:8200" "ft_transcendence_vault:8200";
    "localhost:3000" "api_gateway:3000";
    default "frontend:5000";
}

server {
    listen 8080 default_server;
    server_name _;

    client_max_body_size 50M;

    error_page 403 /blocked.html;
    location = /blocked.html {
        root /usr/share/nginx/html;
        internal;
        modsecurity off;
    }

    location /waf/health {
        modsecurity off;
        access_log off;
        return 200 "ModSecurity WAF Healthy\n";
        add_header Content-Type text/plain;
    }

    location /waf/status {
        modsecurity off;
        access_log off;
        return 200 "OWASP ModSecurity CRS Active\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://$backend;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX

echo "Testing nginx configuration..."
nginx -t

echo "Starting nginx..."
exec nginx -g 'daemon off;'
