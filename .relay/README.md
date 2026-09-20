# Relay project state

This directory contains safe, portable project metadata.

- `config.json` may be committed.
- runtime state, handoffs and checkpoints are ignored.
- secrets, tokens, .env contents and private SSH keys are never read by Relay.

Start with: `relay save --task "..." --next "..."`
