# Create a workflow

A workflow is a **Crossflow diagram**: a small JSON graph the
[Task Orchestrator](/guide/task-orchestrator) executes to coordinate one or more robots.
This page shows how to author one from scratch, then how to send it.

## Diagram anatomy

Every diagram has three top-level keys:

| Key | What it is |
| --- | --- |
| `version` | Diagram schema version (currently `"0.1.0"`). |
| `start` | The `id` of the first op to run. |
| `ops` | A map of `id → operation`. The graph is wired by each op's `next`. |

An **operation** has a `type`. The common ones:

| `type` | Purpose |
| --- | --- |
| `node` | Calls a service. Pick a `builder` (e.g. `UniversalNode`, `MapfReplaceNode`) and a `config`. |
| `fork_clone` | Splits flow into parallel branches — `next` is a **list** of op ids. |
| `buffer` | A wait point that holds a branch's result until a `join` collects it. |
| `join` | Waits for all listed `buffers`, then continues. |

`next` points to the id of the op to run next, or `{ "builtin": "terminate" }` to end a
branch.

::: tip Where data comes from
A `node`'s `mapping` pulls fields out of the incoming message with JSONPath — e.g.
`"$.payload.robot_id"` reads `payload.robot_id` from the `Schedule` you send.
:::

## Example: sequential pickup → dropoff

The simplest useful workflow — pick at one location, then navigate to another. This is
the shipped `workflow_executor/diagrams/pickup_dropoff.json`:

```json
{
  "version": "0.1.0",
  "start": "pickup",
  "ops": {
    "pickup": {
      "type": "node",
      "builder": "UniversalNode",
      "config": {
        "service_name": "pickup_service",
        "mapping": {
          "robot_id": "$.payload.robot_id",
          "item": "$.payload.item",
          "location": "$.payload.pickup.location"
        }
      },
      "next": "dropoff"
    },
    "dropoff": {
      "type": "node",
      "builder": "UniversalNode",
      "config": {
        "service_name": "navigation_service",
        "mapping": {
          "robot_id": "$.payload.robot_id",
          "destination": "$.payload.dropoff.location"
        }
      },
      "next": { "builtin": "terminate" }
    }
  }
}
```

Reading it: start at `pickup`, call `pickup_service`, then flow to `dropoff`, call
`navigation_service`, then terminate.

## Example: parallel multi-robot (fork → join)

To move several robots at once, **fork** into a branch per robot and **join** to wait for
all of them. Each branch ends in a `buffer`; the `join` collects every buffer before it
continues. Sketch for two robots:

```json
{
  "version": "0.1.0",
  "start": "fork",
  "ops": {
    "fork": {
      "type": "fork_clone",
      "next": ["move_a", "move_b"]
    },
    "move_a": {
      "type": "node",
      "builder": "MapfReplaceNode",
      "next": "buf_a",
      "config": { "asset_name": "MiR_00014", "coordinates": "P300", "task_type": "amr_mapf" }
    },
    "move_b": {
      "type": "node",
      "builder": "MapfReplaceNode",
      "next": "buf_b",
      "config": { "asset_name": "MiR_00015", "coordinates": "P301", "task_type": "amr_mapf" }
    },
    "buf_a": { "type": "buffer" },
    "buf_b": { "type": "buffer" },
    "join": {
      "type": "join",
      "buffers": ["buf_a", "buf_b"],
      "next": { "builtin": "terminate" }
    }
  }
}
```

::: tip Generate it instead of hand-writing
For N robots, building this by hand is tedious. The
`send_parallel_workflow_3_robots.py` tester generates the fork/buffer/join ops
programmatically — a good template to copy. See
[Try it directly](/guide/task-orchestrator#try-it-directly-send-to-test).
:::

## Send it

The orchestrator runs a diagram when it's wrapped in a **`Schedule`** and published to the
AMQP `@RECEIVE@` exchange:

```json
{
  "id": "urn:ngsi-ld:Schedule:my-test-01",
  "type": "Schedule",
  "payload": { "...": "your diagram here" }
}
```

The shipped senders do this for you (and are the verified path):

```bash
cd ~/ros_industrial_ws/ros_industrial_demo/test_scripts
python3 send_parallel_workflow_3_robots.py
```

Watch it run:

```bash
docker logs task_orchestrator --tail 50 -f
```

For the AMQP message shape, the HTTP `/workflow` alternative, and troubleshooting, see the
[Task Orchestrator](/guide/task-orchestrator) page.
