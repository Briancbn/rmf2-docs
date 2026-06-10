# Demos

Four hands-on demos, one per module. Every command lives under
`~/ros_industrial_ws/ros_industrial_demo/test_scripts`.

::: tip What needs to be running
The MAPF solver test needs only the `mapf_unified` container. The rest drive live robots —
bring the full stack up first with the [launch scripts](/guide/launch-scripts):
`cd ~/ros_industrial_ws/ros_industrial_demo/launch && ./start_environment_tmux.sh`.
:::

## 1. Send a task to the Task Orchestrator

Publish a workflow diagram (wrapped in a `Schedule`) over AMQP — it fans the work out
across robots.

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts
python3 send_parallel_workflow_3_robots.py          # fork -> N robots -> join
```

![Robots moving](/demo/demos-step-02.png)

→ More info: [Task Orchestrator](/guide/task-orchestrator) · [Create a workflow](/guide/create-workflow)

## 2. Send a MAPF request to MAPF

Send a path-finding problem straight to the solver (`:8888`); it returns a plan the script
verifies and renders to a GIF. Needs only the `mapf_unified` container.

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts/mapf
pip install -r requirements.txt        # once
./mapf_solver_test.py                   # 3 random agents on warehouse_v2
```

![MAPF solver plan, verified and animated](/demo/mapf-solver-test.gif)

→ More info: [MAPF](/guide/mapf)

## 3. Send a VDA5050 order to the VDA5050 master

Trigger the master and watch the order it emits drive the AGV (default serial `10`).

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts/vda5050
pip install paho-mqtt requests          # once
./watch.py order 10                      # in one terminal
./send_order.py 10 P619 P585 P551 P517   # in another — order straight to the client
```

→ More info: [VDA5050](/guide/vda5050)

## 4. Control a simulation

Drive the UE5 sim by hand over MQTT — move AGVs and trigger device actions.

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts/simulation
pip install paho-mqtt                    # once
./demo_single_agv.py                     # full pick -> manipulate -> conveyor cycle
./send_agv.py 10 P0                       # or move one AGV to a waypoint
```

![Simulation cycle](/demo/simulation-overview.png)

→ More info: [Simulation](/guide/simulation)

## Tear down

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/launch
./stop_environment_tmux.sh        # or --hard to force-remove leftovers
```
