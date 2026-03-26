# Docker Compose antigo (`docker-compose` com hífen, sem plugin v2)

O repositório assume **`docker compose`** (espaço), plugin **Compose v2**, para `depends_on` com `condition: service_healthy`, etc.

## Se não tiveres o plugin v2

| Sintoma | O que fazer |
|--------|-------------|
| `docker compose up -d` → `unknown shorthand flag: 'd'` | O `docker` não tem o plugin. Instala [Compose v2 para Linux](https://docs.docker.com/compose/install/linux/) ou usa o binário **`docker-compose`** (hífen) com uma versão recente (≥ 1.29). |
| `depends_on` / `profiles` / `required` inválidos | O teu `docker-compose` é velho demais: **actualiza** o Compose ou instala o plugin v2. |

Com **Compose v2** (como após actualizar no Orange Pi / CasaOS), os comandos do README funcionam tal como estão.

## Referência rápida

| Comando | Típico em |
|--------|-----------|
| `docker compose` (espaço) | Docker oficial, plugin v2, instalações actualizadas |
| `docker-compose` (hífen) | Pacotes antigos `apt install docker-compose` (substituir por v2 quando possível) |

## E2E local

```bash
docker compose -f docker-compose.e2e.yml up -d
```

(Com hífen, se for o caso: `docker-compose -f docker-compose.e2e.yml up -d`.)
