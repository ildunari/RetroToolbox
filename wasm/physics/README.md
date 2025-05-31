# Physics WASM Module

This Rust crate provides basic physics integration and collision detection routines for `NeonJumpGame`.

## Building

To compile the WebAssembly module run:

```bash
cargo build --target wasm32-unknown-unknown --release
```

The resulting `physics_wasm.wasm` file can be copied to `public/physics_wasm.wasm`.

Note: In the Codex environment network access is disabled after setup so the `wasm32-unknown-unknown` target may not be installed. Make sure it is installed locally via `rustup target add wasm32-unknown-unknown` before running the build.
