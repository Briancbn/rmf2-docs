# Simulation (UE5)

**Location:** `simulation/` · **Launcher:** `simulation/RMF2_new_sim.sh` · **Engine:** Unreal Engine 5

A packaged **Unreal Engine 5** warehouse simulation that stands in for the physical AGV
fleet. In a sim run it plays the robot side of the VDA5050 conversation over MQTT, so the
rest of the stack behaves exactly as it would against real hardware.

## What problem it solves

You can't always test against a physical AGV fleet — it's expensive, slow, and risky to
iterate on. **The simulation provides realistic virtual robots that speak the exact same
VDA5050/MQTT protocol**, so the entire stack (MAPF, orchestrator, bridge, FIWARE) runs
unchanged against them. It lets you develop and demo the full system with zero hardware.

> In one line: *exercise the whole stack end-to-end without a single real robot.*

## What ships

```
simulation/
├── RMF2_new_sim.sh                       # launcher script
├── RMF2_new_sim/Binaries/Linux/RMF2_new_sim   # packaged UE5 executable
├── Engine/                               # UE5 runtime
└── Manifest_*.txt                        # packaged-build manifests
```

`RMF2_new_sim.sh` simply `chmod +x`'s and runs the packaged binary, forwarding any
arguments:

```sh
#!/bin/sh
UE_TRUE_SCRIPT_NAME=$(echo "$0" | xargs readlink -f)
UE_PROJECT_ROOT=$(dirname "$UE_TRUE_SCRIPT_NAME")
chmod +x "$UE_PROJECT_ROOT/RMF2_new_sim/Binaries/Linux/RMF2_new_sim"
"$UE_PROJECT_ROOT/RMF2_new_sim/Binaries/Linux/RMF2_new_sim" RMF2_new_sim "$@"
```

::: warning Not tmuxinator
The simulation is a **direct binary**, not a tmuxinator project. The tmux launcher runs
it in the `Sim` pane; teardown stops it with `pkill -f RMF2_new_sim` (and killing the
`ihi_demo` session also reaps the pane). Older scripts referenced a `tmuxinator
ihi_p2_final_demo` session — that path is no longer used.
:::

## Run

Via the demo launcher (step 7):

```bash
./start_environment_tmux.sh            # starts the sim in the Sim pane
```

Directly:

```bash
~/ros_industrial_ws/simulation/RMF2_new_sim.sh
```

## Role in the system

- Subscribes/publishes **VDA5050** messages over **MQTT** (Mosquitto), acting as the AGVs.
- Robot state flows through the [VDA5050 ↔ FIWARE bridge](/modules/vda5050) into the
  Scorpio context broker, so MAPF and the Task Orchestrator see simulated robots exactly
  like physical ones.

## Try it directly (send to test)

The simulation is the *robot side*, so you don't send tasks to the binary itself — you
launch it, then drive its robots through MAPF / the Task Orchestrator and watch them
move.

```bash
# 1. Launch the sim (or it comes up at step 7 of the launcher)
~/ros_industrial_ws/simulation/RMF2_new_sim.sh

# 2. Confirm the simulated robots are chattering on MQTT (VDA5050 topics)
mosquitto_sub -h localhost -p 1883 -t '#' -v        # all topics; Ctrl-C to stop

# 3. Drive a robot and watch it move (see the MAPF / Task Orchestrator pages)
#    e.g. the orchestrator workflow sender:
python3 ~/ros_industrial_ws/ros_industrial_demo/test_scripts/send_parallel_workflow_3_robots.py
```

Confirm state is reaching FIWARE via the [bridge](/modules/vda5050):

```bash
docker logs vda5050_fiware --tail 30 -f             # expect periodic "state" lines
```

## Controlling the simulation

Beyond driving AMRs to waypoints (via MAPF / the Task Orchestrator), the sim accepts
**`TaskRequest`** messages to trigger asset actions — rack lifting and manipulator
pickup.

### Message format

```json
{
  "type": "TaskRequest",
  "id": "urn:ngsild:Task:001:TaskRequest",
  "task_type": "liftrack",
  "task_command": "START",
  "asset_id": "6",
  "task_params": {},
  "timestamp": "2025-01-09T15:30:15Z",
  "task_expected_start": "2025-01-09T14:30:15",
  "task_expected_end": "2025-01-09T15:30:15"
}
```

::: tip What actually matters for the sim
Only **`task_type`** (plus `task_command` and the target `asset_id`) drives behaviour.
The remaining fields are required by the schema but unused by the simulation.
:::

### AMR — rack lifting

| `task_type` | Action |
| --- | --- |
| `liftrack` | AMR lifts the rack at `asset_id` |
| `droprack` | AMR drops the rack |

### Robot arm — manipulator pickup

| `task_type` | Action |
| --- | --- |
| `depalletize` | Manipulator performs a pickup |

<!-- TODO(confirm transport): how is this TaskRequest delivered to the sim?
     MQTT topic vs AMQP @RECEIVE@ exchange? Fill in the exact publish command below
     once confirmed. -->

::: warning Transport not yet confirmed
The exact channel that carries `TaskRequest` to the sim (an MQTT topic vs the AMQP
`@RECEIVE@` exchange) still needs confirming — once known, a copy-paste publish command
goes here. More sim behaviours will be documented as the functionality is finished.
:::

_Source: Dillon Chew (project chat)._

## Stop

```bash
pkill -f RMF2_new_sim          # or just stop_environment_tmux.sh
```

## Notes

- The packaged binary is large and lives outside version control; ensure it's present on
  the target machine before a sim run.
- To run **without** the simulation (e.g. against real robots), simply skip step 7 — the
  rest of the stack is unchanged.
