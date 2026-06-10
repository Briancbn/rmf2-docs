# Getting Started

This page takes you from a clean Ubuntu 22.04 / ROS 2 Humble machine to a running demo.

## Prerequisites

### Host packages

```bash
# Ubuntu 22.04 / ROS 2 Humble
sudo apt install python3-pip python3-venv tmux
pip3 install pika redis requests pymongo psutil
```

### Docker network

All containers attach to one shared network:

```bash
docker network create rmf2_broker_rmf-network
```

### Stop conflicting host services

The stack runs its own brokers, so stop any system-wide ones:

```bash
sudo systemctl stop mosquitto.service 2>/dev/null || true
sudo systemctl stop rabbitmq-server.service 2>/dev/null || true
```

## Get the source

Each module is a separate repository cloned next to `ros_industrial_demo` under
`~/ros_industrial_ws`:

```bash
mkdir -p ~/ros_industrial_ws
cd ~/ros_industrial_ws

# Clone repositories (legacy branch)
git clone -b legacy <demo-package-url> ros_industrial_demo
git clone -b legacy <vda5050-fiware-url> vda5050_fiware_repo
git clone -b legacy <mapf-unified-url> mapf_unified_repo
git clone -b legacy <task-orchestrator-url> task_orchestrator_repo
git clone -b legacy <rmf2-broker-url> rmf2_broker_repo
```

## Build the images

```bash
cd ~/ros_industrial_ws

# IOCS broker stack (Scorpio, Redis, RabbitMQ, Postgres)
cd rmf2_broker_repo
docker build -f ./Containers/rmf-base.Dockerfile . -t mctdis/rmf-base
docker compose build
cd ..

# VDA5050 bridge
cd vda5050_fiware_repo && docker build -t vda5050_fiware_repo-vda5050_fiware:latest . && cd ..

# MAPF unified (map server + solver + executor + MRS + movement gateway)
cd mapf_unified_repo && docker build -t mapf_unified:latest . && cd ..

# Task Orchestrator (Rust)
cd task_orchestrator_repo && docker build -t task_orchestrator:latest . && cd ..
```

::: tip
First-time builds are slow: MAPF ~10–15 min, VDA5050 ~5–10 min.
:::

## Set up the warehouse simulation

Download and unpack the latest UE5 simulation build:

```bash
cd ~/ros_industrial_ws
curl -OL https://downloads.rmf-industrial.org/UE5Demos/RMF2_SIM_20260606.zip
unzip RMF2_SIM_20260606.zip
mv RMF2_SIM_20260606 ~/ros_industrial_ws/simulation
```

You can launch it standalone to verify it runs (the launcher also starts it as one of
its steps):

```bash
cd ~/ros_industrial_ws/simulation
./Linux/RMF2_SIM.sh
```

The simulation starts in fullscreen mode by default.

- Move: `W A S D`
- Toggle fullscreen: `Alt + Enter`
- Map marker: `M`

## Bring the environment up

The recommended launcher runs each startup step in its **own tmux pane** and gates on a
health check before moving on:

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/launch
./start_environment_tmux.sh
```

What it does, in order (see [Launch scripts](/guide/launch-scripts) for the full table):

1. **Dashboard** — `rmf2-launcher` HTTP API on `:8083`
2. **Broker (IOCS)** — Scorpio / Redis / RabbitMQ / Postgres
3. **MQTT** — Mosquitto
4. **MAPF (unified)** — map server, solver `:8888`, executor, MRS
5. **Task Orchestrator** — Rust workflow engine `:2727`
6. **Devices (VDA5050)** — VDA5050 bridge
7. **Simulation** — UE5 warehouse binary
8. **Init System** — register robots / locations with the context broker
9. **Send Task** — submit a sample workflow

If a step fails its health gate, the launcher dumps that pane's last lines and leaves
the session running so you can inspect it.

## Tear it down

```bash
./stop_environment_tmux.sh          # graceful, reverse order, kills the tmux session
./stop_environment_tmux.sh --hard   # also force-removes leftover containers/ports
```
