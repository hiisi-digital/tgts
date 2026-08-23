# `@hiisi/tgts`

<div align="center" style="text-align: center;">

[![JSR](https://jsr.io/badges/@hiisi/tgts)](https://jsr.io/@hiisi/tgts)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/tgts.svg)](https://github.com/hiisi-digital/tgts/issues)
![License](https://img.shields.io/github/license/hiisi-digital/tgts?color=%23009689)

> What a build target is, as data. Runtime, platform, architecture and what each of those can
> actually do.

</div>

## What it is

A build target here is three axes and a capability set. Which runtime (`deno`, `node`, `bun`,
`browser`, `cloudflare`, `edge`), which platform (`darwin`, `linux`, `windows`, `android`,
`ios`, `freebsd`), which architecture (`x64`, `arm64`, `arm`, `x86`, `wasm32`), and what that
combination can reach for: filesystem, network, environment, process, ffi, workers, wasm,
crypto, webgpu, dom.

`tgts` holds those definitions and the small set of operations over them. Compose axes into a
target, parse a target id someone typed, resolve it to the real thing with its capabilities
filled in, match one against a pattern, ask whether a capability is present, or detect what
you're currently running on.

That's all it does, on purpose. It has no opinion about your build and doesn't run anything.
It's the vocabulary the packages that _do_ run things share, so that `@hiisi/cfg-ts` and
`@hiisi/otso` mean the same thing by "node-linux-x64" without either of them owning the
definition.

## Status

Pre-1.0, api not settled, breaking changes possible. Migrations get documented and kept behind
a minor bump at the least.

The axes, the predefined targets, the capability sets and all six operations are implemented
and tested. Detection is the piece most worth a second look before you lean on it: it probes
the host and refuses rather than guessing, so an unrecognised platform or architecture throws
instead of silently picking something. That's the behaviour we want, but the set of names it
recognises is only as wide as what we've actually seen.

## Usage

```typescript
import { hasCapability, matchesTarget, parseTargetId, resolveTarget } from "@hiisi/tgts";

// parse validates the spelling and reports which axes it found
const parsed = parseTargetId("node-linux-x64");
// { success: true, target: { runtime: {name: "node"}, platform: {name: "linux"}, ... } }

// resolve looks those axes up and hands back the target with capabilities attached
const target = resolveTarget("node-linux-x64");
target.capabilities.length; // 8

// match against a pattern, which is what a conditional-compilation predicate needs
matchesTarget(target, "node"); // true

// and the capability question, which is the one build tooling actually asks
hasCapability(target, "fs"); // true
```

```typescript
import { detectArchitecture, detectPlatform, detectRuntime } from "@hiisi/tgts";

// what am I standing on right now. throws rather than guessing when it does not know,
// because a build that stops and says so beats one that silently picked wrong
const here = detectRuntime();
```

## What belongs elsewhere

`tgts` answers what a _target_ can do, statically, at build time. Three sibling packages answer
neighbouring questions and it's worth knowing which one you actually want:

[`@hiisi/onlywhen`](https://jsr.io/@hiisi/onlywhen) asks which runtime you are on right now and
lets you branch on it, at runtime or stripped out at build time.

[`@hiisi/shimp`](https://jsr.io/@hiisi/shimp) asks what _this running process_ is allowed to do,
which under deno is a permission grant and is a different question from what the target
supports in principle.

[`@hiisi/cfg-ts`](https://jsr.io/@hiisi/cfg-ts) is the `@cfg` decorator that consumes target
predicates written in this vocabulary, and [`@hiisi/otso`](https://jsr.io/@hiisi/otso) is the
build framework that evaluates them.

## Limitations

The capability sets are hand-maintained. They describe what a runtime broadly offers, not what
a specific version of it does, so a capability being listed is not a promise that every build
of that runtime has it. If a capability matters enough to gate on, gate on it and test it.

Detection only recognises names we've encountered. An unusual platform or architecture throws,
which is deliberate, but it does mean the recognised set is a list rather than a rule.

## Installation

Not published yet, so this does not resolve. It is the command once a release
lands.

```bash
deno add jsr:@hiisi/tgts
```

## Contributing

Feel free to. Adding a runtime, platform, architecture or capability is mostly filling in a
table and a test, so that's a good first thing if you find one missing. If you're unsure
whether an idea belongs here rather than in one of the three siblings above, an issue first
saves you writing a PR that lands in the wrong repository. Forks are fine as well, just mind
the licence.

## Support

Whether you use this project, have learned something from it, or just like it, please consider supporting it by buying me a coffee, so I can dedicate more time on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> The project is licensed under the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`

> You can check out the full license [here](https://github.com/hiisi-digital/tgts/blob/main/LICENSE)
