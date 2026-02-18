FROM hashicorp/vault:1.15.4

USER root
RUN apk add --no-cache curl openssl wget bash su-exec

COPY ./services/vault/init-vault.sh /scripts/init-vault.sh
COPY ./services/vault/entrypoint.sh /entrypoint-wrapper.sh
RUN chmod +x /scripts/init-vault.sh /entrypoint-wrapper.sh

RUN mkdir -p /scripts/approle /vault/logs /run/secrets && \
    chown -R 100:100 /vault

ENTRYPOINT ["/entrypoint-wrapper.sh"]
CMD ["server", "-dev"]
