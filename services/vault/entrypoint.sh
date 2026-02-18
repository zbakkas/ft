#!/bin/bash
set -e

# Copy secrets to writable tmpfs, then unmount Docker's read-only bind mounts
mkdir -p /dev/shm/secrets
cp /run/secrets/* /dev/shm/secrets/ 2>/dev/null || true

# Unmount each individual secret (Docker bind-mounts each file separately)
for f in /run/secrets/*; do
    umount "$f" 2>/dev/null || true
done
rm -rf /run/secrets/* 2>/dev/null || true

if [ -f "/dev/shm/secrets/vault_root_token" ]; then
    VAULT_ROOT_TOKEN=$(cat /dev/shm/secrets/vault_root_token)
else
    echo "ERROR: vault_root_token not found!"
    exit 1
fi

chmod -R 777 /scripts/approle 2>/dev/null || true

echo "Starting Vault server..."
su-exec vault:vault vault server -dev \
    -dev-root-token-id="${VAULT_ROOT_TOKEN}" \
    -dev-listen-address="${VAULT_DEV_LISTEN_ADDRESS:-0.0.0.0:8200}" &

VAULT_PID=$!

echo "Waiting for Vault to be healthy..."
until wget --spider -q http://127.0.0.1:8200/v1/sys/health 2>/dev/null; do
    sleep 1
done

echo "Vault is ready, running initialization..."

export VAULT_ADDR=http://127.0.0.1:8200
export VAULT_TOKEN="${VAULT_ROOT_TOKEN}"

/scripts/init-vault.sh

# === DESTROY ALL SECRETS ===
# /dev/shm is writable tmpfs — files CAN be shredded and deleted
echo "=== DESTROYING ALL SECRETS ==="
for f in /dev/shm/secrets/*; do
    if [ -f "$f" ]; then
        sz=$(wc -c < "$f" 2>/dev/null || echo 64)
        dd if=/dev/urandom of="$f" bs="$sz" count=3 2>/dev/null || true
        rm -f "$f"
        echo "  Shredded: $f"
    fi
done
rmdir /dev/shm/secrets 2>/dev/null || true

unset VAULT_TOKEN
unset VAULT_ROOT_TOKEN

echo "=== VERIFICATION ==="
echo "  /dev/shm/secrets/ exists: $([ -d /dev/shm/secrets ] && echo YES || echo NO)"
echo "  VAULT_TOKEN env: '$(printenv VAULT_TOKEN 2>/dev/null)'"
echo "  All secrets destroyed. Vault running securely."

echo "Initialization complete, Vault is ready!"

wait $VAULT_PID
