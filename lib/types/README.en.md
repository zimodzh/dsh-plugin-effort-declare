# lib/types/

<p align="center">
  <samp>
    <a href="./README.md">中文</a> ·
    <strong>English</strong>
  </samp>
</p>

TypeScript declarations emitted by `tsc -b` from [`src/`](../../src/). `package.json` `"types"` and `exports.*.types` point here.

These files are build output, not hand-written API docs. Behaviour is defined by the sources and the root README.

## What's in this directory

| Path | Source |
| --- | --- |
| [`index.d.ts`](./index.d.ts) | Host entry |
| [`client/`](./client/) | Browser half |
| [`core/`](./core/) | Shared pure functions |
