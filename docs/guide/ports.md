# Ports & networking

All containers attach to the shared Docker network **`rmf2_broker_rmf-network`** and
reach each other by container hostname.

```bash
docker network create rmf2_broker_rmf-network        # one-time setup
docker network inspect rmf2_broker_rmf-network       # verify membership
```

## Port map

| Service | Port(s) | Protocol | Notes |
| --- | --- | --- | --- |
| Dashboard API (`rmf2-launcher`) | `8083` | HTTP | Control & onboarding API |
| IOCS status (`rmf-swagger`) | `8000` | HTTP | `/status` health used by the launcher |
| Scorpio context broker | `9090` | HTTP / NGSI-LD | FIWARE source of truth |
| Redis | `6379` | TCP | Cache / queue |
| RabbitMQ | `5672` | AMQP | Task schedules & status |
| RabbitMQ management UI | `15672` | HTTP | `guest` / `guest` |
| Mosquitto | `1883`, `1928`, `1929` | MQTT | VDA5050 + MAPF traffic |
| MAPF — solver | `8888` | HTTP | Path-planning API |
| MAPF — map server | `7073` | HTTP / Flask | FIWARE map service |
| MAPF — ADG executor | `6333` (HTTP), `1932` (MQTT) | HTTP / MQTT | Execution engine |
| MAPF — MRS | `1933` | MQTT | Movement request server (FIWARE) |
| MAPF — movement gateway | `8009` | HTTP / FastAPI | REST movement requests |
| Task Orchestrator | `2727` | HTTP | `/health_check`, `/workflow` |
| RTS scheduler | `8089` | HTTP | Scheduler API |

## Health endpoints used by the launcher

| Step | Probe |
| --- | --- |
| Dashboard | TCP `:8083` |
| Broker (IOCS) | `GET http://localhost:8000/status` → 200 |
| MAPF | TCP `:8888` |
| Task Orchestrator | `GET http://localhost:2727/health_check` → 200 |
| VDA5050 | `state` lines in `docker logs vda5050_fiware` |

## Quick port check

```bash
# From the launcher
./start_environment_tmux.sh --status

# Or directly
for p in 8083 8000 9090 5672 15672 1883 8888 7073 2727 8089; do
  ss -tlnp 2>/dev/null | grep -q ":$p " && echo "UP   $p" || echo "down $p"
done
```
