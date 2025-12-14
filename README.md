# `tgts`

<div align="center" style="text-align: center;">

[![JSR](https://jsr.io/badges/@hiisi/tgts)](https://jsr.io/@hiisi/tgts)
[![npm Version](https://img.shields.io/npm/v/tgts?logo=npm)](https://www.npmjs.com/package/tgts)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/tgts.svg)](https://github.com/hiisi-digital/tgts/issues)
![License](https://img.shields.io/github/license/hiisi-digital/tgts?color=%23009689)

> Target definitions and schemas for multi-target TypeScript compilation - runtime, platform, and architecture support.

</div>

## What it does

`tgts` provides the target system for compiling TypeScript to multiple runtime/platform/architecture combinations. It defines the schemas, types, and evaluation logic for build targets.

This package includes:

- **Target schemas** for runtime (deno, node, bun), platform (darwin, linux, windows), and architecture (x64, arm64)
- **Target composition** for specifying multiple dimensions (e.g., node + linux + x64)
- **Target predicates** for use with `@hiisi/cfg-ts` decorators
- **Target resolution** to determine the appropriate output for each target

It integrates with `@hiisi/cfg-ts` to enable `@cfg(target("node"))` syntax for conditional compilation.

## Installation

```bash
# Deno
deno add jsr:@hiisi/tgts

# npm / yarn / pnpm
npm install tgts
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
