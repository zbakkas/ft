vault {
  address = "http://vault:8200"
}

auto_auth {
  method {
    type = "approle"
    
    config = {
      role_id_file_path = "/etc/vault/approle/role-id"
      secret_id_file_path = "/etc/vault/approle/secret-id"
      remove_secret_id_file_after_reading = false
    }
  }

  sink {
    type = "file"
    config = {
      path = "/vault/token"
    }
  }
}

cache {}

listener "tcp" {
  address = "0.0.0.0:8100"
  tls_disable = true
}

api_proxy {
  use_auto_auth_token = true
}
