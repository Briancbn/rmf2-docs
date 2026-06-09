# Task Orchestrator

**Repo:** `task_orchestrator_repo` · **Image:** `task_orchestrator:latest` · **Container:** `task_orchestrator`

A Rust workflow-execution engine built on **Crossflow**. It receives task schedules over
AMQP, executes workflow diagrams, and coordinates robots via ROS 2 / MQTT.

## What problem it solves

A real warehouse job is rarely a single move: it's "pick at A, then drop at B", "send
three robots in parallel and wait for all of them", with pauses, retries and ordering
constraints. **The orchestrator turns a declarative workflow diagram into coordinated,
monitored, multi-robot execution** — fanning work out across robots, calling MAPF/robot
services in the right order, and reporting status back. It's the layer between
"high-level task" and "individual robot actions".

> In one line: *declarative tasks in, coordinated multi-robot execution out.*

## Internal crates

| Crate | Purpose |
| --- | --- |
| `rmf2_task_orchestrator` | Main binary — HTTP server on port `2727` |
| `workflow_executor` | Crossflow-based workflow engine |
| `amqp` | AMQP client for RabbitMQ communication |

## Tasks: the vocabulary

A few related concepts show up across the system — worth pinning down:

| Term | What it is |
| --- | --- |
| **TaskRequest** | A single requested action on an asset (e.g. `liftrack`, `depalletize`). See the [Simulation TaskRequest format](/guide/simulation#message-format). |
| **Schedule** | A wrapper carrying a **workflow diagram** (`{ id, type: "Schedule", payload: <diagram> }`) published to the AMQP `@RECEIVE@` exchange. |
| **Workflow diagram** | A Crossflow graph of operations (fork / nodes / join). Samples in `workflow_executor/diagrams/`. |
| **TaskStatus** | Progress/completion messages emitted as the workflow runs. |

In short: a **Schedule** carries a **workflow diagram** that the orchestrator executes,
which in turn issues **TaskRequests** to robots/services and reports **TaskStatus** back.

## Role in the system

1. A scheduler publishes a **Schedule** (with a workflow diagram) onto the AMQP
   `@RECEIVE@` exchange.
2. The orchestrator executes the diagram, emitting **TaskRequest** messages and tracking
   **TaskStatus**.
3. It coordinates with MAPF for paths and with robots over ROS 2 / MQTT, publishing
   status back onto `@RECEIVE@`.

```
scheduler ──AMQP Schedule──► Task Orchestrator ──TaskRequest──► robots / MAPF
                               │  (Crossflow)
robots ────TaskStatus──────────┘──TaskStatus──► back onto @RECEIVE@
```

## HTTP API

| Endpoint | Method | Description |
| --- | --- | --- |
| `/health_check` | GET | Health check (used by the launcher's gate) |
| `/workflow` | POST | Submit a workflow diagram |

## AMQP integration

- **Subscribes** to the `@RECEIVE@` exchange for `Schedule` and `TaskStatus` messages.
- **Publishes** `TaskRequest` and `TaskStatus` messages to the same exchange.

## Workflow diagrams

Sample diagrams live in `workflow_executor/diagrams/`:

- `pickup_dropoff.json` — basic pickup-and-dropoff
- `pause_resume_pickup_dropoff.json` — adds pause/resume support

## Try it directly (send to test)

First confirm it's alive:

```bash
curl -s http://localhost:2727/health_check && echo " ← orchestrator up"
```

### Known-good: the parallel-workflow sender (AMQP)

The verified, working tester ships in the demo. It builds a Crossflow diagram (fork →
N robots → join), wraps it in a `Schedule`, and publishes to the `@RECEIVE@` fanout
exchange on RabbitMQ (`localhost:5672`):

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts

# default: 3 robots to default goals
python3 send_parallel_workflow_3_robots.py

# choose robots and goals
python3 send_parallel_workflow_3_robots.py \
  --robots MiR_00014,MiR_00015,MiR_00016 \
  --goals  P300,P301,P302
```

Watch it run:

```bash
docker logs task_orchestrator --tail 50 -f
```

### Publish a Schedule yourself (AMQP)

Any AMQP client works — publish a `Schedule` to the `@RECEIVE@` fanout exchange. The
message shape the orchestrator expects:

```json
{
  "id": "urn:ngsi-ld:Schedule:my-test-01",
  "type": "Schedule",
  "payload": { "...": "a Crossflow workflow diagram (see workflow_executor/diagrams/)" }
}
```

### HTTP `/workflow`

The binary also exposes `POST /workflow` for submitting a workflow diagram directly over
HTTP (port `2727`). The AMQP sender above is the path exercised by the demo, so prefer it
when in doubt.

## Run

Via the demo launcher (recommended):

```bash
./task_orchestrator_control.sh start   # or: start_environment_tmux.sh (step 5)
```

Standalone:

```bash
docker run -d \
  --name task_orchestrator \
  --network rmf2_broker_rmf-network \
  -p 2727:2727 \
  -e TASK_ORCHESTRATOR__AMQP__HOST=rmf2_broker-rabbitmq-1 \
  -e TASK_ORCHESTRATOR__MQTT__HOST=mosquitto \
  task_orchestrator:latest
```

## Configuration

Environment variables (override `config.toml`):

| Variable | Default | Description |
| --- | --- | --- |
| `RUST_LOG` | `info` | Log level (`debug`/`info`/`warn`/`error`) |
| `TASK_ORCHESTRATOR__HTTP__HOST` | `0.0.0.0` | HTTP bind address |
| `TASK_ORCHESTRATOR__HTTP__PORT` | `2727` | HTTP port |
| `TASK_ORCHESTRATOR__AMQP__HOST` | `localhost` | RabbitMQ host |
| `TASK_ORCHESTRATOR__AMQP__PORT` | `5672` | RabbitMQ port |
| `TASK_ORCHESTRATOR__MQTT__HOST` | `localhost` | MQTT host |
| `TASK_ORCHESTRATOR__MQTT__PORT` | `1883` | MQTT port |

## Local development

```bash
# Ubuntu 22.04 + ROS 2 Humble
sudo apt install clang ros-humble-example-interfaces ros-humble-geometry-msgs ros-humble-std-msgs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

source /opt/ros/humble/setup.bash
cargo build --release
RUST_LOG=debug cargo run
```

For FastDDS discovery, also `source ~/ros_industrial_ws/ros_industrial_demo/launch/fastdds_setup.sh`
before running.

## Troubleshooting

```bash
docker logs task_orchestrator --tail 50
curl -s http://localhost:2727/health_check && echo " ← orchestrator up"
```
