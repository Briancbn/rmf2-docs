# Launch scripts

The `ros_industrial_demo/launch` directory orchestrates the whole stack. The **tmux**
launcher runs each step in its own pane, so every service is visible as it comes up.

## `start_environment_tmux.sh`

Runs one ordered **step table** inside a tmux session (`ihi_demo`). Each step's command
is sent to its own pane and gated on a health probe before the next step runs.

```bash
./start_environment_tmux.sh            # run all steps with health gates
./start_environment_tmux.sh --step N   # re-run from step N onward (debugging)
./start_environment_tmux.sh --status   # ports / containers / tmux status
./start_environment_tmux.sh --help
```

### Step table

| # | Step | tmux pane | Health gate |
| --- | --- | --- | --- |
| 1 | Dashboard (`rmf2-launcher`) | `Dashboard.0` | port `8083` |
| 2 | Broker (IOCS) | `IOCS.0` | `http://localhost:8000/status` |
| 3 | MQTT | `IOCS.1` | sleep 3s |
| 4 | MAPF (unified) | `Services.0` | port `8888` |
| 5 | Task Orchestrator | `Services.1` | `http://localhost:2727/health_check` |
| 6 | Devices (VDA5050) | `Devices.0` | log match `vda5050_fiware: state` |
| 7 | Simulation | `Sim.0` | sleep 10s |
| 8 | Init System | `InitSystem.0` | sleep 5s |
| 9 | Send Task | `SendTask.0` | sleep 3s |

The step table is the single source of truth. To add or edit a step, see the
`launch/how_to_add_step.md` guide in the repo.

::: tip Debugging a failed step
On a failed gate the launcher prints the failing pane's last 20 lines and leaves the
session running. Attach and inspect:

```bash
tmux attach -t ihi_demo      # then switch to the failing window
```
:::

## `stop_environment_tmux.sh`

Tears everything down in **reverse** order, then kills the `ihi_demo` session. It is
best-effort — a single failure never aborts the rest — and is safe to run from inside the
session (it kills that session last).

```bash
./stop_environment_tmux.sh            # graceful stop + kill the tmux session
./stop_environment_tmux.sh --hard     # also force-remove leftover containers/ports
./stop_environment_tmux.sh --status
./stop_environment_tmux.sh --help
```

Steps 8 (Init) and 9 (Send Task) are one-shot, so teardown covers steps 7 → 1.

## Control scripts

The launcher calls per-service control scripts (each takes `start` / `stop`):

| Script | Service |
| --- | --- |
| `rmf2_unified_mapf_control.sh` | MAPF unified container |
| `task_orchestrator_control.sh` | Task Orchestrator |
| `rmf2_res_vda5050_control.sh` | VDA5050 bridge |
| `simulation/Linux/RMF2_SIM.sh` | UE5 simulation binary |
| `rmf2_res_mqtt_control.sh` | Mosquitto MQTT |
| `rmf2_res_broker_control.sh` | IOCS broker stack |
