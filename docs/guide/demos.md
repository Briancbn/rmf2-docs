# Demos

Hands-on walkthroughs you can run once the stack is up (see [Installation](/guide/getting-started)).

## Warehouse demo (multi-robot fleet move)

The headline demo: bring everything up, initialise the warehouse, and send robots on
coordinated, collision-free moves.

### 1. Start the stack

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/launch
./start_environment_tmux.sh
./start_environment_tmux.sh --status     # confirm ports/containers are green
```

This runs all startup steps (dashboard → broker → MQTT → MAPF → orchestrator → VDA5050 →
simulation → init → send task). See [Launch scripts](/guide/launch-scripts) for the step
table.

### 2. Send a parallel multi-robot task

The known-good, ready-to-run tester publishes a parallel workflow (fork → N robots →
join) to the Task Orchestrator over AMQP:

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts

# Default: Manufacturer_2,Manufacturer_3,Manufacturer_4 → their named goals
python3 send_parallel_workflow_3_robots.py
# or choose robots + goals (valid robots: Manufacturer_2–Manufacturer_25):
python3 send_parallel_workflow_3_robots.py \
  --robots Manufacturer_10,Manufacturer_11,Manufacturer_12 \
  --goals  P189,P190,P191
```

::: tip Robot IDs must match your init
The `warehouse_os_setup` init (`launch/send_init_warehouse_os_setup.sh`) spawns
**`Manufacturer_1`–`Manufacturer_25`**. A goal can be either a **named location**
(`Manufacturer_X_goal` / `Manufacturer_X_home`, resolved via
`location_coord_map_os_res.json`) or a **raw waypoint** like `P301` — the orchestrator
passes unknown names straight through to MAPF. Raw waypoints must be navigable nodes
(this map's are in the `P160`+ range, e.g. `P301`, `P303`, `P305`). Use `--dry-run`
to preview the workflow JSON without sending.
:::

#### Start the whole fleet

To dispatch **every initialized robot** at once (`Manufacturer_2`–`Manufacturer_25`,
each to its goal), use the wrapper:

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts

./send_start_all_warehouse.sh
./send_start_all_warehouse.sh --dry-run   # preview without sending
```

`Manufacturer_1` has no goal mapping and stays at `P421`. Two named goals collide
(`Manufacturer_3_goal`/`Manufacturer_8_goal` → `P231`,
`Manufacturer_4_goal`/`Manufacturer_14_goal` → `P297`), so the wrapper reroutes
`Manufacturer_8`→`P167` and `Manufacturer_14`→`P177` to avoid a conflicting-destination
failure.

### 3. Watch it happen

```bash
# robots move via MAPF
docker logs mapf_unified --tail 30 -f
# orchestrator drives the workflow
docker logs task_orchestrator --tail 30 -f
# state lands in FIWARE via the VDA5050 bridge
docker logs vda5050_fiware --tail 30 -f
```

### 4. Tear down

```bash
./stop_environment_tmux.sh        # or --hard to force-remove leftovers
```

## Other ways to drive robots

- **MAPF directly** — submit a single planning task via the movement gateway
  (`POST :8009/mapf/send_task`). See [MAPF → Try it directly](/modules/mapf#try-it-directly-send-to-test).
- **Simulation actions** — rack-lift / depalletize via `TaskRequest` messages. See
  [Simulation → Controlling the simulation](/modules/simulation#controlling-the-simulation).

::: warning Some shell testers are currently broken
`test_scripts/send_test_tasks_*_robots.sh`, `send_all_home.sh`, and `loop_tasks.sh` all
depend on **`test_replace_destination.py`, which is missing from the repo** — they fail as
shipped. Until it's restored, use `send_parallel_workflow_3_robots.py` or the MAPF
`/mapf/send_task` API above.
:::
