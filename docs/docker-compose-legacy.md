# Docker Compose antigo (apt, CasaOS, `docker-compose` com hífen)

## Dois comandos diferentes

| Comando | O que é |
|--------|---------|
| `docker-compose` (hífen) | Binário **Compose v1** / wrapper antigo, comum em `apt install docker-compose` no Debian/Ubuntu e em imagens ARM/CasaOS. |
| `docker compose` (espaço) | **Plugin** Compose v2, junto com o Docker instalado a partir do site oficial ou repo Docker. |

Se `docker compose up -d` der `unknown shorthand flag: 'd'`, o teu `docker` **não** tem o plugin: usa **`docker-compose up -d`** (com hífen).

## Versão mínima

Para juntar dois ficheiros com `-f ficheiro1 -f ficheiro2`, o `docker-compose` precisa de suportar **merge** (em geral **≥ 1.27**). Verifica com `docker-compose --version`. Se o merge falhar, actualiza o pacote `docker-compose` do SO ou usa um único ficheiro gerado à mão.

## Ficheiros deste repositório

- **`docker-compose.yml`** — só **api** + **nginx**. Sem `profiles`, sem `depends_on` com `required`, compatível com Compose file **3.7** e `docker-compose` antigo do apt.
- **`docker-compose.postgres.yml`** — acrescenta **Postgres** e, no merge, o serviço `api` passa a ter `depends_on: postgres`.

## Postgres no mesmo servidor que a API (Docker)

```bash
docker-compose -f docker-compose.yml -f docker-compose.postgres.yml up -d
```

No `.env`: `DB_HOST=postgres`, `DB_PORT=5432`, e `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` coerentes com `DB_USER` / `DB_PASSWORD` / `DB_NAME`.

## Postgres já existe (CasaOS / host)

```bash
docker-compose up -d
```

Garante que `DB_HOST` no `.env` é acessível **de dentro do contentor** (IP do host, `172.17.0.1`, ou `host.docker.internal` com `extra_hosts` no `docker-compose.yml`).

## Quer o Compose v2 sem mexer no CasaOS?

Opções (avalia risco em ARM/CasaOS antes):

1. Instalar só o **plugin** [Compose v2](https://docs.docker.com/compose/install/linux/) como binário `docker-compose` (standalone) ou plugin — não substitui o motor Docker, mas pode coexistir com stacks antigas.
2. Manter o `docker-compose` do apt e usar **apenas** os YAML deste repo (já compatíveis).

**Podman** com `podman-compose` é outro ecossistema; não é drop-in garantido com todas as opções do Compose v2.

## E2E local

```bash
docker-compose -f docker-compose.e2e.yml up -d
```
