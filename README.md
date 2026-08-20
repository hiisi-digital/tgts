# `tgts`

<div align="center" style="text-align: center;">

[![JSR](https://jsr.io/badges/@hiisi/tgts)](https://jsr.io/@hiisi/tgts)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/tgts.svg)](https://github.com/hiisi-digital/tgts/issues)
![License](https://img.shields.io/github/license/hiisi-digital/tgts?color=%23009689)

> Target definitions and schemas for multi-target TypeScript compilation: runtimes, platforms, architectures, and capabilities.

</div>

## What it does

`tgts` defines the target system for compiling TypeScript to multiple runtime/platform/architecture combinations. It carries the schemas, types, and API surface for describing and evaluating build targets.

This package includes:

- **Target types and schemas** covering runtime (`deno`, `node`, `bun`, `browser`, `cloudflare`, `edge`), platform (`darwin`, `linux`, `windows`, `android`, `ios`, `freebsd`), and architecture (`x64`, `arm64`, `arm`, `x86`, `wasm32`)
- **Predefined targets** for the common runtimes (`deno`, `node`, `bun`, `browser`), platforms (`darwin`, `linux`, `windows`), and architectures (`x64`, `arm64`)
- **Capability identifiers** (`STANDARD_CAPABILITIES`: fs, net, env, process, ffi, workers, wasm, crypto, webgpu, dom) plus a capability query API
- **Composition, parsing, and matching APIs** (`compose`, `parseTargetId`, `matchesTarget`, `findBestMatch`) for combining target dimensions and matching targets against patterns

It is intended to integrate with `@hiisi/cfg-ts` for conditional compilation, with `@hiisi/otso` consuming the target definitions during builds.

> **Status:** early skeleton. The type definitions, predefined targets, and capability constants exist; the evaluation functions (composition, parsing, matching, detection, capability queries) are declared but not yet implemented and currently throw.

## Installation

No version has been published to JSR yet, so this command does not resolve. It is the intended install once a release lands.

```bash
deno add jsr:@hiisi/tgts
```

## Related Packages

- [`@hiisi/otso`](https://jsr.io/@hiisi/otso) - The build framework that orchestrates target compilation
- [`@hiisi/cfg-ts`](https://jsr.io/@hiisi/cfg-ts) - The @cfg decorator that consumes target predicates
- [`@hiisi/ft-flags`](https://jsr.io/@hiisi/ft-flags) - Feature flag definitions
- [`@hiisi/shimp`](https://jsr.io/@hiisi/shimp) - Cross-runtime compatibility shims
- [`@hiisi/onlywhen`](https://jsr.io/@hiisi/onlywhen) - Runtime detection and conditional execution

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/tgts/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
