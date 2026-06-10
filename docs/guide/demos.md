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
./send_start_all_warehouse.sh
```

![Whole fleet](/demo/demos-step-03.png)

### 3. Tear down

```bash
./stop_environment_tmux.sh        # or --hard to force-remove leftovers
```

## Other ways to drive robots

- **Simulation actions** — drive an AGV or trigger a device (rack-lift / depalletize)
  in the UE5 sim via MQTT, using the bundled test scripts or `demo_single_agv.py`. See
  [Simulation → Drive it with the test scripts](/guide/simulation#drive-it-with-the-test-scripts).
- **VDA5050 directly** — send/stitch orders over MQTT and watch them convert into the
  AMR model in Scorpio. See [VDA5050 → Try it directly](/guide/vda5050#try-it-directly-send-to-test).
- **MAPF directly** — submit a single planning task via the movement gateway
  (`POST :8009/mapf/send_task`). See [MAPF → Try it directly](/guide/mapf#try-it-directly-send-to-test).
- **Task Orchestrator directly** — publish a workflow / schedule over AMQP, or `POST /workflow`.
  See [Task Orchestrator → Try it directly](/guide/task-orchestrator#try-it-directly-send-to-test).
