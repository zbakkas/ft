#!/bin/sh

set -e

echo "Initializing Vault with transcendence credentials..."

if ! command -v vault >/dev/null 2>&1; then
    echo "Installing Vault client..."
    apk add --no-cache wget unzip
    VAULT_VERSION="1.15.4"
    wget -O vault.zip "https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip"
    unzip vault.zip
    mv vault /usr/local/bin/
    rm vault.zip
fi

echo "Waiting for Vault to be ready..."
until curl -s http://vault:8200/v1/sys/health > /dev/null 2>&1; do
    echo "Waiting for Vault..."
    sleep 2
done

export VAULT_ADDR=http://vault:8200

echo "Setting up secrets engine..."
vault secrets enable -path=secret kv-v2 || echo "KV engine already enabled"

echo "Setting up user authentication..."
vault auth enable userpass || echo "Userpass already enabled"

echo "Writing Vault policies..."
vault policy write service-read - <<'EOF'
path "secret/data/*" {
    capabilities = ["read"]
}

path "secret/metadata/*" {
    capabilities = ["list", "read"]
}

path "sys/health" {
    capabilities = ["read"]
}
EOF

vault policy write team-read - <<'EOF'
path "secret/data/*" {
    capabilities = ["read"]
}

path "secret/metadata/*" {
    capabilities = ["list", "read"]
}
EOF

vault policy write team-admin - <<'EOF'
path "secret/*" {
    capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/health" {
    capabilities = ["read"]
}
EOF

echo "Creating team users..."
if [ -f "/dev/shm/secrets/vault_users_creds" ]; then
    while IFS=: read -r username password policy; do
        if [ -n "$username" ] && [ -n "$password" ] && [ -n "$policy" ]; then
            echo "Creating user: $username with policy: $policy"
            vault write auth/userpass/users/$username password="$password" policies="$policy"
        fi
    done < /dev/shm/secrets/vault_users_creds
else
    echo "ERROR: /dev/shm/secrets/vault_users_creds not found!"
    exit 1
fi

echo "Creating limited service token..."
vault token create -id="svc-read-token" -policy="service-read" -orphan >/dev/null || true

echo "Setting up AppRole authentication for services..."
vault auth enable approle || echo "AppRole already enabled"

vault write auth/approle/role/service-role \
    token_ttl=15m \
    token_max_ttl=30m \
    token_policies="service-read" \
    secret_id_ttl=0 \
    bind_secret_id=true

ROLE_ID=$(vault read -field=role_id auth/approle/role/service-role/role-id)
echo "AppRole RoleID: $ROLE_ID"

SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/service-role/secret-id)
echo "AppRole SecretID: $SECRET_ID"

echo "Saving AppRole credentials..."
mkdir -p /scripts/approle
echo "$ROLE_ID" > /scripts/approle/role-id
echo "$SECRET_ID" > /scripts/approle/secret-id
chmod 644 /scripts/approle/role-id
chmod 644 /scripts/approle/secret-id

echo "Enabling audit logs..."
vault audit enable file file_path=/vault/logs/audit.log || echo "Audit logging already enabled"

echo "Setting up database credentials..."
if [ -f "/dev/shm/secrets/database_creds" ]; then
    DB_ARGS=""
    while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            DB_ARGS="$DB_ARGS ${key}=${value}"
        fi
    done < /dev/shm/secrets/database_creds
    vault kv put secret/database $DB_ARGS
else
    echo "ERROR: /dev/shm/secrets/database_creds not found!"
    exit 1
fi

echo "Setting up JWT secrets..."
vault kv put secret/jwt \
    JWT_SECRET="$(openssl rand -hex 32)" \
    COOKIE_SECRET="$(openssl rand -hex 32)" \
    TWO_FA_KEY="$(openssl rand -hex 32)" \
    internal_secret="$(openssl rand -hex 32)" \
    internal_hmac_secret="$(openssl rand -hex 32)"

echo "Setting up OAuth placeholders..."

echo "Setting up SMTP configuration..."
if [ -f "/dev/shm/secrets/smtp_creds" ]; then
    SMTP_ARGS=""
    while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            SMTP_ARGS="$SMTP_ARGS ${key}=${value}"
        fi
    done < /dev/shm/secrets/smtp_creds
    vault kv put secret/smtp $SMTP_ARGS
else
    echo "ERROR: /dev/shm/secrets/smtp_creds not found!"
    exit 1
fi

echo "Setting up service URLs..."
if [ -f "/dev/shm/secrets/services_urls" ]; then
    SERVICES_ARGS=""
    while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ -n "$value" ]; then
            SERVICES_ARGS="$SERVICES_ARGS ${key}=${value}"
        fi
    done < /dev/shm/secrets/services_urls
    vault kv put secret/services $SERVICES_ARGS
else
    echo "ERROR: /dev/shm/secrets/services_urls not found!"
    exit 1
fi

echo "Setting up infrastructure..."
if [ -f "/dev/shm/secrets/redis_creds" ]; then
    INFRA_ARGS=""
    while IFS='=' read -r key value; do
        if [ -n "$key" ]; then
            INFRA_ARGS="$INFRA_ARGS ${key}=${value}"
        fi
    done < /dev/shm/secrets/redis_creds
    INFRA_ARGS="$INFRA_ARGS RABBITMQ_URL=amqp://rabbit LOG_DIR=/usr/src/logs"
    vault kv put secret/infrastructure $INFRA_ARGS
else
    echo "ERROR: /dev/shm/secrets/redis_creds not found!"
    exit 1
fi
