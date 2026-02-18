path "secret/data/app/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/app/*" {
  capabilities = ["list", "delete"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
