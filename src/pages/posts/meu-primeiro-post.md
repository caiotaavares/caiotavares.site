---
layout: ../../layouts/PostLayout.astro
title: "Configuração rápida do Loki com Docker"
date: "2024-04-13"
description: "Neste post eu mostro rapidamente como você pode fazer o deploy do Loki + Grafana na sua máquina usando docker-compose em 5 minutos para testar sua aplicação."
---
# Configuração rápida do Loki com Docker

Recentemente precisei testar a integração dos meus logs locais que enviavam dados para o **Loki**. 
Como eu não queria gastar criando infraestrutura real na AWS ou outros clouds de início, levantei um stack super rápido no docker.

## Arquivo docker-compose.yml
Usando o arquivo abaixo, e rodando um `docker-compose up -d`, você ganha de brinde um stack de observabilidade simples.

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

## Próximos passos
Assim que eles sobem, você já pode acessar o `http://localhost:3000` pro Grafana (admin/admin), adicionar o data source Loki (URL `http://loki:3100`) e brincar.

Obrigado por ler!
