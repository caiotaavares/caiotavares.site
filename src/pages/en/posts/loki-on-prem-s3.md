---
layout: ../../layouts/PostLayout.astro
title: "Como usar o S3 do NetApp no Grafana Loki"
date: "2026-04-13"
tags: [Loki, NetApp, s3, apisix, logging]
alternate: "/en/posts/loki-on-prem-s3"
---

# Intro

The S3 become the absolute pattern when the subject is object strorage. It shines in cloud because its scalability and almost infinite infrastructure, but it also consolidated in the *on-premises* scenario through tools like **MinIO** and **NetAPP**

Recently i needed to make some maintenance in our logging tools and the **Grafana Loki** stack showed up as an excellent option for our environment.

# S3

The fist thing we need is the S3 connection settings and the credentials (*AccessKeys*) of the bucket that will be used.

For this example, we will need the following data:
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

Before we start the configuration, we need to add the repository and the official helm chart (assuming you already have helm installed):

```
# Adding the repository
helm repo add grafana [https://grafana.github.io/helm-charts](https://grafana.github.io/helm-charts)

# Gerando o arquivo values.yaml para conferir as opções
helm show values grafana/loki > values.yaml
```

The most important part for data persistence is the storage section:

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

The S3 on-premisses config differs a bit when we're using the native AWS S3. While in the cloud the URL follows the pattern `https://<bucket-name>.s3.<region>.amazonaws.com`, here we will follow the connection format: `http://<AccessKeyId>:<SecretAccessKey>@<Endpoint>:<port>`.

Below is the adjusted configuration for our scenario:

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
It's the modern AWS standard. The bucket name becomes a subdomain. When `s3ForcePathStyle = true` the bucket name is treated as a directory in the URL path, i.e., `https://s3.amazonaws.com/bucket-name`. This is what we want, since our s3 is exposed exactly this way.

If you're not using official AWS, you're probably using an "S3-compatible" storage solution (like MinIO or Ceph). Many of these tools don't support routing by dynamic DNS subdomain. In other words, your DNS server doesn't know how to automatically resolve any `*.s3.example.com.br`.

When `s3ForcePathStyle = false` Loki will try to access loki-s3bucket.s3.example.com.br.