#!/usr/bin/env bash
# Builds crates/parser to wasm32 and generates the JS/TS bindings that
# web/ imports directly (web/src/wasm/ is gitignored - generated here).
set -euo pipefail
cd "$(dirname "$0")/.."

# Prefer a rustup-managed toolchain over a stale distro-packaged `cargo` that
# may be years older and unable to read this workspace's lock file format.
[ -d "$HOME/.cargo/bin" ] && export PATH="$HOME/.cargo/bin:$PATH"

cargo build -p planscope-parser --release --target wasm32-unknown-unknown

mkdir -p web/src/wasm
wasm-bindgen \
  --target web \
  --out-dir web/src/wasm \
  --out-name planscope_parser \
  target/wasm32-unknown-unknown/release/planscope_parser.wasm
