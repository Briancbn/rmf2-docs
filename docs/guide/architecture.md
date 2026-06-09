# Architecture

The demo is a set of cooperating Docker containers (plus a UE5 binary) wired together
through three message fabrics:

- **AMQP** — RabbitMQ, for task schedules & status.
- **MQTT** — Mosquitto, for VDA5050 AGV traffic and MAPF coordination.
- **NGSI-LD** — the Scorpio context broker, the single source of truth for robot state,
  maps, and tasks (FIWARE AMR data model).

This page builds your mental model top-down: first the modules, then **sequence
diagrams** of how they talk during startup, task execution, and telemetry.

## The big picture (4 modules)

At its simplest, the demo is four modules around a shared broker. Tasks flow down into
robot motion; robot state flows back up into the context broker.

```mermaid
flowchart LR
  TO["Task Orchestrator<br/>(what to do)"]
  MAPF["MAPF<br/>(where to go)"]
  V["VDA5050<br/>(talk to robots)"]
  SIM["Simulation<br/>(the robots)"]

  TO --> MAPF --> V --> SIM
  SIM -. state .-> V -. state .-> TO
```

Everything is glued together by the **IOCS broker stack** (RabbitMQ for tasks, Mosquitto
for VDA5050/MQTT, Scorpio for FIWARE state). The rest of this page zooms in.

## Modules at a glance

```mermaid
flowchart TB
  subgraph control[Control plane]
    DASH["Dashboard / rmf2-launcher<br/>HTTP :8083"]
    LAUNCH["start_environment_tmux.sh<br/>+ control scripts"]
  end

  subgraph compute[Compute / logic]
    TO["Task Orchestrator<br/>(Rust + Crossflow) :2727"]
    MAPF["MAPF unified<br/>solver :8888 · executor · MRS · map :7073"]
    BR["VDA5050 ↔ FIWARE bridge"]
  end

  subgraph fabric[Message fabrics / IOCS broker stack]
    RMQ["RabbitMQ<br/>:5672 / UI :15672"]
    MQTT["Mosquitto<br/>:1883"]
    SC["Scorpio context broker<br/>NGSI-LD :9090"]
    REDIS["Redis :6379"]
  end

  SIM["Simulation (UE5)<br/>plays the AGV fleet"]

  LAUNCH -. starts/stops .-> TO & MAPF & BR & MQTT & RMQ & SC & SIM
  DASH -. onboarding API .-> LAUNCH

  TO <-->|AMQP @RECEIVE@| RMQ
  TO <-->|movement reqs| MAPF
  MAPF <-->|MQTT| MQTT
  MAPF <-->|NGSI-LD| SC
  SIM <-->|VDA5050 / MQTT| MQTT
  MQTT <--> BR
  BR -->|NGSI-LD upsert| SC
  MAPF <-->|cache| REDIS
```

> Every container joins the Docker network **`rmf2_broker_rmf-network`** and addresses
> peers by container hostname (e.g. `mosquitto`, `scorpio`, `rmf2_broker-rabbitmq-1`).

## Message fabrics

| Fabric | Broker | Used for |
| --- | --- | --- |
| **AMQP** | RabbitMQ (`:5672`, UI `:15672`) | Task schedules & status between the scheduler and the Task Orchestrator (exchange `@RECEIVE@`). |
| **MQTT** | Mosquitto (`:1883`, `:1928`, `:1929`) | VDA5050 AGV traffic; MAPF executor/MRS coordination. |
| **NGSI-LD** | Scorpio context broker (`:9090`) | Single source of truth for robot state, maps and tasks (FIWARE AMR data model). |

---

## Sequence 1 — Bringing the environment up

How `start_environment_tmux.sh` starts the stack in order, gating each step on a health
check before moving on. (See [Launch scripts](/guide/launch-scripts) for the full step
table.)

```mermaid
sequenceDiagram
  autonumber
  actor You
  participant L as start_environment_tmux.sh
  participant D as Dashboard (:8083)
  participant B as IOCS broker stack
  participant M as Mosquitto
  participant MA as MAPF (:8888)
  participant TO as Task Orchestrator (:2727)
  participant V as VDA5050 bridge
  participant S as Simulation (UE5)

  You->>L: ./start_environment_tmux.sh
  L->>D: start rmf2-launcher
  L-->>D: gate: TCP :8083 up?
  L->>B: start broker (Scorpio/Redis/RabbitMQ/Postgres)
  L-->>B: gate: GET :8000/status == 200
  L->>M: start Mosquitto
  L->>MA: start MAPF unified
  L-->>MA: gate: TCP :8888 up?
  L->>TO: start Task Orchestrator
  L-->>TO: gate: GET :2727/health_check == 200
  L->>V: start VDA5050 bridge
  L-->>V: gate: "state" lines in logs
  L->>S: launch UE5 simulation
  Note over L: Init System + Send Task (one-shot)
  L-->>You: all gates green → attach tmux (ihi_demo)
```

If a gate fails, the launcher dumps that pane's last lines and leaves the session
running so you can `tmux attach -t ihi_demo` and inspect.

---

## Sequence 2 — End-to-end task execution

The core loop: a task becomes robot motion, and robot motion becomes updated context.

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant SCH as Scheduler / Dashboard
  participant RMQ as RabbitMQ (@RECEIVE@)
  participant TO as Task Orchestrator
  participant MA as MAPF (solver + executor)
  participant MQTT as Mosquitto
  participant ROBOT as Robot / UE5 sim
  participant BR as VDA5050 bridge
  participant SC as Scorpio (NGSI-LD)

  User->>SCH: submit task
  SCH->>RMQ: publish Schedule (workflow diagram)
  RMQ-->>TO: deliver Schedule
  activate TO
  TO->>MA: request path / movement
  activate MA
  MA->>MA: plan collision-free paths (ECBS)
  MA->>MQTT: VDA5050 order
  deactivate MA
  MQTT-->>ROBOT: order
  activate ROBOT
  ROBOT-->>MQTT: VDA5050 state (pose/progress)
  deactivate ROBOT
  MQTT-->>BR: state
  BR->>SC: upsert AMR state (NGSI-LD)
  MA-->>SC: read robot positions
  TO->>RMQ: publish TaskStatus
  RMQ-->>SCH: TaskStatus (progress/complete)
  deactivate TO
```

Key message names are real: the orchestrator subscribes to `Schedule`/`TaskStatus` and
publishes `TaskRequest`/`TaskStatus` on the AMQP `@RECEIVE@` exchange; robots speak
**VDA5050** over MQTT. The exact MAPF↔robot call shapes are shown conceptually.

---

## Sequence 3 — Robot telemetry → context broker

Zooming in on how state continuously flows back into FIWARE (this runs constantly, not
just during a task), which is what closes the loop for monitoring and re-planning.

```mermaid
sequenceDiagram
  autonumber
  participant ROBOT as Robot / UE5 sim
  participant MQTT as Mosquitto
  participant BR as VDA5050 ↔ FIWARE bridge
  participant SC as Scorpio (NGSI-LD)
  participant MA as MAPF / consumers

  loop while running
    ROBOT->>MQTT: VDA5050 state / connection / visualization
    MQTT-->>BR: subscribed topics
    BR->>BR: convert VDA5050 → FIWARE AMR (NGSI-LD)
    BR->>SC: upsert AMR entity
  end
  MA->>SC: query current robot positions
  SC-->>MA: AMR entities
```

---

## End-to-end task flow (text)

For quick reference, the same task loop in words:

1. A task is submitted (sample workflow, or `POST :8083/send_task`).
2. The schedule is published over **AMQP** to the **Task Orchestrator**.
3. The orchestrator executes the workflow diagram (Crossflow), requesting paths from
   **MAPF** and issuing movement requests.
4. MAPF plans collision-free paths (ECBS) and the **ADG executor** drives execution.
5. Movement commands reach robots as **VDA5050** orders over **MQTT**.
6. The **VDA5050 ↔ FIWARE bridge** converts robot state back into **NGSI-LD** and stores
   it in **Scorpio**, closing the loop for monitoring and the next planning cycle.
7. In a sim run, the **UE5 simulation** plays the role of the AGVs on the MQTT side.

## Repository layout

```
ros_industrial_ws/
├── ros_industrial_demo/      # integration hub: launch/teardown + compose files
│   ├── launch/               # start_environment_tmux.sh, control scripts, etc.
│   └── compose_files/        # broker / mosquitto / vda5050 compose
├── ros_industrial_demo_docs/ # ← this documentation site (VitePress)
├── mapf_unified_repo/        # MAPF unified container
├── task_orchestrator_repo/   # Rust task orchestrator
├── vda5050_fiware_repo/      # VDA5050 ↔ FIWARE bridge
├── rmf2_broker_repo/         # IOCS broker stack
├── rmf2_launcher_repo/       # dashboard / rmf2-launcher HTTP API
└── simulation/               # UE5 packaged binary (RMF2_new_sim)
```

See [Modules](/modules/mapf) for the deep dive on each box, and
[Ports & networking](/guide/ports) for the authoritative port map.
