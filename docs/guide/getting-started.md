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
# IOCS broker stack (Scorpio, Redis, RabbitMQ, Postgres)
cd ~/ros_industrial_ws/rmf2_broker_repo
docker build -f ./Containers/rmf-base.Dockerfile . -t mctdis/rmf-base
docker compose build
cd ..

# VDA5050 bridge
cd ~/ros_industrial_ws/vda5050_fiware_repo 
docker build -t vda5050_fiware_repo-vda5050_fiware:latest .

# MAPF unified (map server + solver + executor + MRS + movement gateway)
cd ~/ros_industrial_ws/mapf_unified_repo 
docker build -t mapf_unified:latest .

# Task Orchestrator (Rust)
cd ~/ros_industrial_ws/task_orchestrator_repo 
docker build -t task_orchestrator:latest .
```

::: tip
First-time builds are slow: MAPF ~10–15 min, VDA5050 ~5–10 min.
:::

## Download & Launch the warehouse simulation

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

## Launch the environment

The recommended launcher runs each startup step in its **own tmux pane** and gates on a
health check before moving on:

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/launch
./start_environment_tmux.sh

# tear down
# ./stop_environment_tmux.sh          # graceful, reverse order, kills the tmux session
```

What it does, in order (see [Launch scripts](/guide/launch-scripts) for the full table):

## Send a Demo Task to the Task Orchestrator

Publish a parallel workflow to the Task Orchestrator. This workflow forks into multiple robot tasks and joins when all robots complete their work.

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts/taskorchestrator
python3 send_workflow.py
```
![Demo_TaskOrchestrator](/demo/demos-step-02.png)

