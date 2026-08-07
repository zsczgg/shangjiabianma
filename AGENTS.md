# Repository guidance

Before changing Docker Compose, deployment, ports, API integration, container names, networking, or server migration behavior, read `docs/DEPLOYMENT_TOPOLOGY.md` in full.

Cross-repository invariants:

- Keep the encoding and inventory systems in separate Git repositories and separate Compose projects.
- Use the external Docker network `shangjiabianma-internal` for communication between the two systems.
- Keep the encoding API container name `shangjiabianma-app` and container port `3210` stable.
- The inventory system must use `http://shangjiabianma-app:3210/api/v1` in deployed containers.
- Never commit `.env`, API keys, encryption keys, databases, or backups.
- Never merge or share the two systems' SQLite databases or data volumes.
- Update both repositories and both copies of `docs/DEPLOYMENT_TOPOLOGY.md` when changing a cross-repository invariant.

