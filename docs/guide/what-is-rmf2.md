# What is RMF Industrial (RMF2)?

RMF2.0 is inspired by the [Open-RMF](https://www.open-rmf.org/) project, where
**interoperability** across a mixed fleet is the central concern.

It provides **open-source tooling for distinct, composable modules** that together make up
a fleet management system for **manufacturing and logistics** — letting heterogeneous
robots and devices (AGVs, robotic arms, conveyors, racks) work as one fleet.

## What it offers

Each capability is an independent, swappable module, shipped as its own Docker image:

### Simulation & Digital Twin
Large-scale photorealistic simulation / digital twin in **Unreal Engine**, standing in for
the physical robots. → [Simulation](/guide/simulation)

### VDA5050 Support
Out-of-the-box support and tooling for VDA5050 compatibility. → [VDA5050](/guide/vda5050)

### Multi-Agent Path Finding and Execution
Scalable route planning and deterministic execution. → [MAPF](/guide/mapf)

### Workflow Orchestration
Effortless workflow definition and customization. → [Task Orchestrator](/guide/task-orchestrator)

### Task Scheduling
Highly efficient task scheduling for machines, humanoids and mobile robots. → [Scheduler](/guide/scheduler)

### Web Dashboard & UI
React library and sample web dashboard for monitoring and control. → [UI](/guide/ui)

## Why it's built this way

Splitting the system into distinct microservices keeps each concern — path finding, task
orchestration, AGV protocol, simulation — independent and replaceable. You can swap, test,
or deploy any module on its own, and continuously ship isolated features without disturbing
the rest of the fleet.


| Module | Repo | Image |
| --- | --- | --- |
| [Simulation](/guide/simulation) | `simulation/` | UE5 packaged binary |
| [VDA5050](/guide/vda5050) | `vda5050_fiware_repo` | `vda5050_fiware_repo-vda5050_fiware:latest` |
| [MAPF (unified)](/guide/mapf) | `mapf_unified_repo` | `mapf_unified:latest` |
| [Task Orchestrator](/guide/task-orchestrator) | `task_orchestrator_repo` | `task_orchestrator:latest` |
| IOCS broker stack | `rmf2_broker_repo` | Scorpio / Redis / RabbitMQ / Postgres |
| [Scheduler](/guide/scheduler) | `rmf2_scheduler` | _not in demo yet_ |
| [UI](/guide/ui) | `rmf2-ui` | _not in demo yet_ |

> All containers share the Docker network `rmf2_broker_rmf-network`.

See [Architecture](/guide/architecture) for how the modules fit together.
