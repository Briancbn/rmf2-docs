# Demos

A hands-on walkthrough you can run once the stack is up (see
[Getting started](/guide/getting-started)).

## Warehouse demo (multi-robot fleet move)

Bring everything up, then send robots on coordinated, collision-free moves.

### 1. Start the stack

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/launch
./start_environment_tmux.sh
```

![Stack up](/demo/demos-step-01.png)

### 2. Send a multi-robot task

Publish a parallel workflow (fork → N robots → join) to the Task Orchestrator:

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts
python3 send_parallel_workflow_3_robots.py
```

![Robots moving](/demo/demos-step-02.png)

Dispatch **every** initialized robot at once:

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts/taskorchestrator
python3 send_workflow.py
```

![Whole fleet](/demo/demos-step-03.png)

### 3. Tear down

```bash
./stop_environment_tmux.sh        # or --hard to force-remove leftovers
```
