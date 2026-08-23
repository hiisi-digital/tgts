# Fixtures that must not compile

Each `.ts` here is a construction the type system is supposed to refuse, kept as
a file so the refusal is checked rather than remembered. `../compile_fail_test.ts`
runs `deno check` on every one and fails if any of them succeeds.

`control_compiles.ts` is the opposite and must compile. Without it a broken
harness that reports failure for everything would look like a passing suite.
