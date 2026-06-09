# MAPF (unified)

**Repo:** `mapf_unified_repo` · **Image:** `mapf_unified:latest` · **Container:** `mapf_unified`

Multi-Agent Path Finding. This is a single container that bundles six MAPF-related
services (previously six separate containers) managed by **supervisord**.

## What problem it solves

In a warehouse, many robots share the same aisles and intersections. If each robot plans
its own route, they deadlock and collide. **MAPF plans time-coordinated, collision-free
paths for the whole fleet at once** (ECBS solver), compiles them into an
action-dependency graph the executor can drive, and exposes the map and live robot
positions through FIWARE so planning always uses current state.

> In one line: *many robots, one floor, no collisions — and keep them moving.*

## Services inside the container

| Service | Port(s) | Purpose |
| --- | --- | --- |
| `fiware_map_server` | `7073` (HTTP/Flask) | Uploads maps to the context broker |
| `load_maps` | — (one-shot) | Loads YAML maps at startup |
| `mapf_solver` | `8888` (HTTP) | MAPF path-planning solver (ECBS) |
| `adg_executor` | `6333` (HTTP), `1932` (MQTT) | ADG execution engine |
| `mapf_mrs` | `1933` (MQTT) | Movement request server (FIWARE) |
| `movement_request_server` | `8009` (HTTP/FastAPI) | REST API for movement requests |

```
┌─────────────────────────────────────────────────────────┐
│                   mapf_unified container                 │
│  supervisord (process manager)                           │
│  ├── fiware_map_server     → :7073 (HTTP/Flask)          │
│  ├── load_maps             → (one-shot at startup)       │
│  ├── mapf_solver           → :8888 (HTTP)                │
│  ├── adg_executor          → :6333 (HTTP), :1932 (MQTT)  │
│  ├── mapf_mrs              → :1933 (MQTT)                 │
│  └── movement_request_svr  → :8009 (HTTP/FastAPI)        │
│                                                          │
│  External deps: mosquitto · redis · scorpio · rabbitmq   │
└─────────────────────────────────────────────────────────┘
```

The launcher's port-`8888` health gate is what tells it MAPF is ready.

## Role in the system

The Task Orchestrator asks MAPF for collision-free paths; the solver plans them, the
ADG executor drives execution, and the MRS/movement gateway turn plans into movement
requests that ultimately become VDA5050 orders. Maps and robot positions are exchanged
via the FIWARE context broker.

## Run

Via the demo launcher (recommended):

```bash
./rmf2_unified_mapf_control.sh start   # or: start_environment_tmux.sh (step 4)
```

Standalone:

```bash
docker network create rmf2_broker_rmf-network   # if needed
docker compose up -d                            # from mapf_unified_repo
```

## Key environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `MQTT_SERVER_HOST` | `mosquitto` | MQTT broker hostname |
| `REDIS_HOST` | `redis` | Redis hostname |
| `CONTEXT_BROKER_HOST` | `scorpio` | FIWARE context broker |
| `AMQP_HOST` | `rmf2_broker-rabbitmq-1` | RabbitMQ hostname |
| `BUILDING_NAME` | `warehouse_v2` | Map / building name |
| `MAP_SERVER_PORT` | `7073` | FIWARE map server port |

See `.env` in the repo for the full list.

## Deploying a new map

1. Copy the map YAML into **both** source dirs:
   ```bash
   cp my_warehouse.yaml src/mapf/mapf_service/mapf_service/maps/   # solver
   cp my_warehouse.yaml src/fiware_map/maps/                       # context broker
   ```
2. Set `BUILDING_NAME="my_warehouse"` in `.env`.
3. Rebuild the image.

The repo also ships `MAP_CHANGE_GUIDE.md` with the detailed procedure.

## Try it directly (send to test)

The cleanest direct entry point is the **movement request gateway** (FastAPI), which
enqueues a planning task and lets you poll its status. In the demo (unified container)
it's on **`:8009`**; standalone it defaults to `:8000`.

```bash
# Submit a planning task: move robot_1 from waypoint P5 to P1
curl --location 'http://localhost:8009/mapf/send_task' \
  --header 'Content-Type: application/json' \
  --data '{
    "tasks": [
      { "task_id": "t1", "robot_id": "robots_robot_1", "start_location": "P5", "goal_location": "P1" }
    ]
  }'

# Poll its status
curl 'http://localhost:8009/mapf/monitor_task?task_id=t1'
# verbose variant:
curl 'http://localhost:8009/mapf/monitor_task_verbose?task_id=t1'
```

Expected `monitor_task` shape:

```json
{ "tasks": [ { "task_id": "t1", "status": "executing" } ] }
```

Watch execution as it happens:

```bash
docker logs mapf_unified --tail 30 -f      # all MAPF services (unified container)
```

::: warning Broken shell testers
`test_scripts/send_test_tasks_*_robots.sh`, `send_all_home.sh`, and `loop_tasks.sh` all
call **`test_replace_destination.py`, which is missing from the repo** — so they fail as
shipped. Use the `/mapf/send_task` curl above (or the
[Task Orchestrator workflow sender](/modules/task-orchestrator#try-it-directly-send-to-test))
until that script is restored.
:::

## Troubleshooting

```bash
docker logs mapf_unified --tail 50
curl -s http://localhost:8888/ >/dev/null && echo "solver up" || echo "solver down"
```

If the launcher reports `Timeout waiting for port 8888`, the container failed to start —
check the image was built and the logs above.
