# convex-panel

Development panel for Convex apps.

Docs: `https://barrymichaeldoyle.github.io/convex-panel/`

## Workspace

- `packages/core`: published package
- `apps/example-react`: local example app
- `apps/docs`: GitHub Pages docs site

## Local Development

```bash
pnpm install
pnpm dev:example-react
pnpm dev:docs
```

## Release

Changesets is configured for versioning and publishing.

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

## Package Name

The source package name is `convex-panel`, but npm publication is currently blocked until that npm package name becomes available or is transferred.
