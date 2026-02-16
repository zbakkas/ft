#!/bin/bash

grafana server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini > /dev/null 2> /dev/null &

GRAFANA_PID=$!

ADMIN_PASSWORD=$(cat /run/secrets/admin_password)
GRAFANA_URL="http://localhost:6969"
ADMIN_USER="trans"


DASHBOARDS_DIR="/dashboards"
DATASOURCES_DIR="/datasources"

TMP_FILE="/tmp/payload.json"

echo  -e "\nWaiting for Grafana to start..."
until curl -k -s -f -o /dev/null "$GRAFANA_URL/api/health"; do
  sleep 1
done
echo -e "Grafana is ready\n"

grafana cli --homepath=/usr/share/grafana admin reset-admin-password $ADMIN_PASSWORD

for file in "$DATASOURCES_DIR"/*.json; do
  if [[ -f "$file" ]]; then
    filename=$(basename -- "$file")
    name="${filename%.*}"

    echo -e "Setting datasource: $name"

    echo "$payload" > $TMP_FILE
    echo "Response:"
    payload="$(cat $file)"
    curl -k -s -S -X POST \
        -H "Content-Type: application/json" \
        -u "$ADMIN_USER:$ADMIN_PASSWORD" \
        "$GRAFANA_URL/api/datasources" \
        --data-raw "$payload"
    rm -f $TMP_FILE
    echo ""
  fi
done

for file in "$DASHBOARDS_DIR"/*.json; do
  if [[ -f "$file" ]]; then
    filename=$(basename -- "$file")
    name="${filename%.*}"

    echo -e "Importing dashboard: $name"

    dashboard_json="$(cat $file)"
    payload="{\"dashboard\": $dashboard_json, \"overwrite\": true}"

    echo "$payload" > $TMP_FILE
    echo "Response:"
    curl -k -s -S -X POST \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -u "$ADMIN_USER:$ADMIN_PASSWORD" \
        "$GRAFANA_URL/api/dashboards/db" \
        -d @$TMP_FILE
    rm -f $TMP_FILE
    echo ""
  fi
done

kill $GRAFANA_PID
