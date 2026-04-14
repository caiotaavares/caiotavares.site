---
layout: ../../../layouts/PostLayout.astro
title: "Quick Loki Setup with Docker"
date: "2024-04-13"
alternate: "/posts/meu-primeiro-post"
tags: ["loki", "grafana", "docker", "logging"]
---

# Quick Loki Setup with Docker

Recently I needed to test the integration of my local logs sending data to **Loki**. 
Since I didn't want to spend time creating real infrastructure on AWS or other clouds at first, I spun up a super quick stack on docker.

## docker-compose.yml file
Using the file below, and running `docker-compose up -d`, you get a simple observability stack.

```yaml
version: "3"

networks:
  loki:

services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    networks:
      - loki
```

## Next steps
Once they are up, you can access `http://localhost:3000` for Grafana (admin/admin), add the Loki data source (URL `http://loki:3100`) and play around.

Thanks for reading!
