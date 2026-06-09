---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "RMF Industrial"
  text: "Documentation"
  tagline: Fleet Management for Manufacturing and Logistics
  actions:
    - theme: brand
      text: What is RMF Industrial
      link: /guide/what-is-rmf2
    - theme: alt
      text: Quickstart
      link: /guide/getting-started
    - theme: alt
      text: Github
      link: https://github.com/ros-industrial/rmf_industrial

features:

  - icon:
      src: /icons/FcCamcorderPro.svg
    title: Simulation & Digital Twin
    details: Large Scale Photorealistic Simulation / Digital Twin in Unreal Engine.
    link: /guide/simulation
  - icon:
      src: /icons/FcMindMap.svg
    title: Multi-Agent Path Finding and Execution
    details: Scalable route planning and deterministic execution.
    link: /guide/mapf
  - icon:
      src: /icons/FcWorkflow.svg
    title: Workflow Orchestration
    details: Effortless Workflow definition and customization.
    link: /guide/task-orchestrator
  - icon:
      src: /icons/FcTimeline.svg
    title: Task Scheduling
    details: Highly Efficient Task Scheduling for Machines, Humanoids and Mobile Robots.
  - icon:
      src: /icons/FcApproval.svg
    title: VDA5050 Support
    details: Out-of-box support and tooling for VDA5050 Compatibility.
    link: /guide/vda5050
  - icon: 🚀
    title: Fast Deployment
    details: Continuous Delivery through building, testing, and shipping isolated features as microservices.
---

## What is this?

A multi-agent warehouse robotics demo that integrates context management,
**VDA5050** AGV communication, **MAPF** multi-agent path finding, and a **Crossflow**
task orchestrator — with an **Unreal Engine 5** simulation standing in for the physical
robots.

The integration hub is the [`ros_industrial_demo`](/guide/launch-scripts) repository,
which provides the launch/teardown orchestration. The heavy lifting lives in sibling
repositories, each shipped as a Docker image:

| Module | Repo | Image |
| --- | --- | --- |
| [MAPF (unified)](/guide/mapf) | `mapf_unified_repo` | `mapf_unified:latest` |
| [Task Orchestrator](/guide/task-orchestrator) | `task_orchestrator_repo` | `task_orchestrator:latest` |
| [VDA5050](/guide/vda5050) | `vda5050_fiware_repo` | `vda5050_fiware_repo-vda5050_fiware:latest` |
| [Simulation](/guide/simulation) | `simulation/` | UE5 packaged binary |
| IOCS broker stack | `rmf2_broker_repo` | Scorpio / Redis / RabbitMQ / Postgres |

> All containers share the Docker network `rmf2_broker_rmf-network`.

## Quick Start

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/launch
./start_environment_tmux.sh      # bring the whole stack up, one step per tmux pane
./start_environment_tmux.sh --status
./stop_environment_tmux.sh       # tear it back down
```

See [Getting started](/guide/getting-started) for prerequisites and the full sequence.
