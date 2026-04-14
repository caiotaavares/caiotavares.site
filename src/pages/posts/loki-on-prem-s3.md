---
layout: ../../layouts/PostLayout.astro
title: "Como usar o s3 do NetAPP no grafana loki"
date: "2026-04-13"
tags: [Loki, NetAPP, s3, apisix, logging]
---
# Intro
O s3 se tornou o queridinho dos desenvolvedores quando o assunto é armazenamento de objetos, não só na nuvem (onde ele brlha),onde é oferecida escalabilidade e ifraestrutura quase infinita, como também on-premisses, ele se tornou uma opção disponibilizada por ferramentas como Minio e o NetAPP.

Recentemente precisei fazer uma alteração em algumas ferramentas de logging e a stack do grafana loki me pareceu uma boa opção

# S3
A primeira coisa que precisamos é das configurações do S3, e das AccessKeys do bucket que vamos usar
Das configurações do S3 vamos precisar do `endpoint: https://s3.example.com` e `region: us-east-1`. Das configurações do bucket vamos precisar da AccessKey de acesso ao bucket: `UserName`, `AccessKeyId` e `SecretAccessKey`.

```
{
    "Endpoint": https://s3.example.com
    "Region": us-east-1
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
Antes da configuração, devemos baixar o helm chart

*obviamente vc tem que ter o helm instalado*

`helm repo add grafana https://grafana.github.io/helm-charts`

Com `helm show values` é possível ver a opções disponíveis na versão atual do chart.

`helm show values grafana/loki > values.yaml`

O trecho que importa para nós e o seguinte:

```
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

Aqui as configurações do s3 diferem um pouco de quanto estamos usando um S3 na nuvem, principalmente a url de acesso ao s3, que segue o padrão: `https://<nome-do-bucket>.s3.<região>.amazonaws.com`, aqui vamos seguir o padrão `http://<AccessKeyId>:<SecretAccessKey>@<Endpoint>:<port>`

E esse será o padrão que usaremos para conectar no S3

```
loki:
    storage:
        bucketNames:
            chunks: loki-s3bucket
            ruler: loki-s3bucket
            admin: loki-s3bucket
        type: s3
        s3:
            s3: "http://<AccessKeyId>:<SecretAccessKey>@<Endpoint>:<port>"
            endpoint: <Endpoint>
            region: <Region>
            accessKeyId: "<AccessKeyId>"
            secretAccessKey: "<SecretAccessKey>"
            s3ForcePathStyle: true
            insecure: false
            http_config:
                idle_conn_timeout: 90s
                response_header_timeout: 0s
                insecure_skip_verify: false

        object_store:
            type: s3
            s3:
                s3: "http://<AccessKeyId>:<SecretAccessKey>@<Endpoint>:<port>"
                endpoint: <Endpoint>
                bucket_name: <UserName>
                region: <Region>
                access_key_id: "<AccessKeyId>"
                secret_access_key: "<SecretAccessKey>"
                insecure: false
                sse: {}
```

no nosso caso fica assim:

```
loki:
    storage:
        bucketNames:
            chunks: loki-s3bucket
            ruler: loki-s3bucket
            admin: loki-s3bucket
        type: s3
        s3:
            s3: "http://youraccesskeyid:yoursecretaccesskey@s3.example.com:<port>"
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
                s3: "http://youraccesskeyid:yoursecretaccesskey@s3.example.com:<port>"
                endpoint: https://s3.example.com.br
                bucket_name: loki-s3bucket
                region: us-east-1
                access_key_id: "youraccesskeyid"
                secret_access_key: "yoursecretaccesskey"
                insecure: false
                sse: {}
```