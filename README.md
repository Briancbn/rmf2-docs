# RMF Industrial Developer Documentation

Documentation site for the **ROS Industrial** multi-agent warehouse demo — MAPF path
planning, the Task Orchestrator, the UE5 simulation, and the VDA5050 bridge.

Built with [VitePress](https://vitepress.dev).

## Prerequisites

Install `pnpm` (10 and later) and `NodeJS` (22 and later)

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc
pnpm env use --global 24
```

## Getting started

```bash
cd ~/ros_industrial_ws/rmf2-docs

# 1. Install dependencies (first time only)
pnpm install

# 2. Start the live dev server (hot reload) → http://localhost:5173
pnpm run docs:dev
```

Open the printed URL in a browser; edits to any `.md` file reload instantly.

## Build & preview the static site

```bash
pnpm run docs:build      # outputs static HTML to docs/.vitepress/dist/
pnpm run docs:preview    # serve the built site locally to check it
```

`docs:build` fails on broken internal links, so a green build means every cross-page
link resolves.

## Project layout

```
docs/
├── index.md                  # home page (hero + module overview)
├── guide/
│   ├── getting-started.md     # prerequisites, build images, up/status/down
│   ├── architecture.md        # system diagram, message fabrics, task flow
│   ├── launch-scripts.md      # tmux launcher step table + control scripts
│   ├── mapf.md                # MAPF unified container
│   ├── task-orchestrator.md   # Rust / Crossflow workflow engine
│   ├── simulation.md          # UE5 packaged simulation
│   └── vda5050.md             # VDA5050 ↔ FIWARE bridge
└── .vitepress/config.mts      # nav, sidebar, search
```

## Editing tips

- **Add a page:** create a `.md` file, then add it to the `sidebar` (and `nav` if
  top-level) in `docs/.vitepress/config.mts`.
- **Internal links** use root-absolute paths without the `.md` extension, e.g.
  `[MAPF](docs/modules/mapf)`.
- **Callouts:** ` ::: tip ` / ` ::: warning ` / ` ::: danger ` blocks are supported.
