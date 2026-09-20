# Security Policy

## Design principles

Tashev Relay is local-first and intentionally avoids reading secret material.

Relay must never intentionally read, serialize, sync or print:

- `.env` contents
- passwords
- API keys or access tokens
- private SSH keys
- browser cookies
- AI-provider authentication files

Server checks use an SSH alias already configured by the user and execute only `true` in non-interactive mode.

## Supported versions

Security fixes are provided for the latest released version.

## Reporting a vulnerability

Please use GitHub's private security advisory / vulnerability reporting flow for this repository when available. Do not post credentials, private repository content or exploitable details in a public issue.

Include:

- affected Relay version
- operating system
- minimal reproduction
- expected vs actual behavior
- potential impact

We will prioritize issues involving secret exposure, unsafe command execution, path traversal, state tampering or unintended remote writes.
