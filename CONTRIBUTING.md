# Contributing to Tashev Relay

Thanks for helping make AI-assisted development easier to resume.

## Before opening a PR

1. Search existing issues and pull requests.
2. For a new agent or large feature, open an issue first.
3. Keep Relay local-first and small.
4. Never add code that collects credentials, `.env` values, private keys, cookies or provider tokens.

## Development

Requirements: Node.js 18+ and Git.

```bash
git clone https://github.com/tashev11/tashev-relay.git
cd tashev-relay
npm test
npm run lint
npm run smoke
```

## Pull requests

- Add tests for behavior changes.
- Keep runtime dependencies at zero unless there is a strong reason.
- Document user-visible CLI changes.
- Update CHANGELOG.md for meaningful changes.
- Avoid provider-specific assumptions in the core.

## Agent adapters

A good adapter should only translate Relay's neutral state into the minimum context the target coding agent needs. It must not automate account switching, bypass provider limits or copy provider credentials.

## Security

Do not open a public issue for a vulnerability that could expose user code or secrets. Follow SECURITY.md.
