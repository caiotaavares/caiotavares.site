---
layout: ../../layouts/PostLayout.astro
title: "Como usar o S3 do NetApp no Grafana Loki"
date: "2026-04-13"
tags: [Loki, NetApp, s3, apisix, logging]
alternate: "/en/posts/loki-on-prem-s3"
---

# Intro

O S3 se tornou o padrão absoluto quando o assunto é armazenamento de objetos. Ele brilha na nuvem pela sua escalabilidade e infraestrutura quase infinita, mas também se consolidou no cenário *on-premises* através de ferramentas como MinIO e **NetApp**.

Recentemente, precisei realizar uma manutenção em algumas ferramentas de logging e a stack do **Grafana Loki** se mostrou uma excelente opção para o nosso ambiente.

# S3

A primeira coisa que precisamos são as configurações de conexão do S3 e as credenciais (*AccessKeys*) do bucket que será utilizado.

Para este exemplo, precisaremos dos seguintes dados:
* **Endpoint:** `https://s3.example.com`
* **Region:** `us-east-1`
* **Bucket:** `loki-s3bucket`
* **Credenciais:** `AccessKeyId` e `SecretAccessKey`

```json
{
    "Endpoint": "[https://s3.example.com](https://s3.example.com)",
    "Region": "us-east-1"
}

{
    "AccessKey": {
        "UserName": "loki-s3bucket",
        "AccessKeyId": "youraccesskeyid",
        "SecretAccessKey": "yoursecretaccesskey"
    }
}
```
# Helm Chart
Antes de iniciar a configuração, devemos adicionar o repositório e baixar o Helm Chart oficial (considerando que você já possui o Helm instalado):

```
# Adicionando o repositório
helm repo add grafana [https://grafana.github.io/helm-charts](https://grafana.github.io/helm-charts)

# Gerando o arquivo values.yaml para conferir as opções
helm show values grafana/loki > values.yaml
```

O trecho que realmente importa para a persistência dos dados é a seção de storage:

```yaml
loki:
    storage:
        s3:
            s3: null
            endpoint: null
            region: null
            secretAccessKey: null
            accessKeyId: null
            signatureVersion: null
            s3ForcePathStyle: false
            insecure: false
            http_config: {}
            # -- Check https://grafana.com/docs/loki/latest/configure/#s3_storage_config for more info on how to provide a backoff_config
            backoff_config: {}
            disable_dualstack: false

        object_store:
            # Type of object store. Valid options are: s3, gcs, azure
            type: s3
            # Optional prefix for storage keys
            storage_prefix: null
            # S3 configuration (when type is "s3")
            s3:
                # S3 endpoint URL
                endpoint: null
                # Optional region
                region: null
                # Optional access key
                access_key_id: null
                # Optional secret key
                secret_access_key: null
                # Optional. Enable if using self-signed TLS
                insecure: false
                # Optional server-side encryption configuration
                sse: {}
                # Optional HTTP client configuration
                http: {}
```

As configurações do S3 on-premises diferem um pouco de quando estamos usando o S3 nativo da AWS. Enquanto na nuvem a URL segue o padrão `https://<nome-do-bucket>.s3.<região>.amazonaws.com`, aqui seguiremos o formato de conexão: `http://<AccessKeyId>:<SecretAccessKey>@<Endpoint>:<port>`.

Abaixo, a configuração ajustada para o nosso cenário:

```yaml
loki:
    storage:
        bucketNames:
            chunks: loki-s3bucket
            ruler: loki-s3bucket
            admin: loki-s3bucket
        type: s3
        s3:
            s3: "[http://youraccesskeyid:yoursecretaccesskey@s3.example.com:443](http://youraccesskeyid:yoursecretaccesskey@s3.example.com:443)"
            endpoint: s3.example.com
            region: us-east-1
            accessKeyId: "youraccesskeyid"
            secretAccessKey: "yoursecretaccesskey"
            s3ForcePathStyle: true
            insecure: false
            http_config:
                idle_conn_timeout: 90s
                response_header_timeout: 0s
                insecure_skip_verify: false

        object_store:
            type: s3
            s3:
                s3: "[http://youraccesskeyid:yoursecretaccesskey@s3.example.com:443](http://youraccesskeyid:yoursecretaccesskey@s3.example.com:443)"
                endpoint: [https://s3.example.com](https://s3.example.com)
                bucket_name: loki-s3bucket
                region: us-east-1
                access_key_id: "youraccesskeyid"
                secret_access_key: "yoursecretaccesskey"
                insecure: false
                sse: {}
```

ou

```yaml
loki:
    storage:
        bucketNames:
            chunks: loki-s3bucket
            ruler: loki-s3bucket
            admin: loki-s3bucket
        type: s3
        s3:
            s3: "https://youraccesskeyid:yoursecretaccesskey@s3.example.com:443"
            endpoint: https://s3.example.com.br
            region: us-east-1
            accessKeyId: "youraccesskeyid"
            secretAccessKey: "yoursecretaccesskey"
            s3ForcePathStyle: true
            insecure: false
            http_config:
                idle_conn_timeout: 90s
                response_header_timeout: 0s
                insecure_skip_verify: false

        object_store:
            type: s3
            s3:
                s3: "https://youraccesskeyid:yoursecretaccesskey@s3.example.com:443"
                endpoint: https://s3.example.com.br
                bucket_name: loki-s3bucket
                region: us-east-1
                access_key_id: "youraccesskeyid"
                secret_access_key: "yoursecretaccesskey"
                insecure: false
                sse: {}
```

# Virtual Host Style vs Path Style (s3ForcePathStyle: false)
É o padrão moderno da AWS. O nome do bucket vira um subdomínio. Quando `s3ForcePathStyle = true` O nome do bucket é tratado como um diretório no caminho da URL, ou seja, `https://s3.amazonaws.com/nome-do-bucket`. É isso que desejamos, já que o nosso s3 é exposto exatamente dessa forma.

Se você não está usando a AWS oficial, você provavelmente está usando uma solução de storage "S3-compatible" (como MinIO ou Ceph). Muitas dessas ferramentas não têm suporte a roteamento por subdomínio DNS dinâmico. Ou seja, o seu servidor DNS não sabe resolver automaticamente qualquer `*.s3.example.com.br`.

Quando `s3ForcePathStyle = false` o Loki tentará acessar loki-s3bucket.s3.example.com.br.