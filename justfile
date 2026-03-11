set positional-arguments

setup:
  cargo fetch
  pnpm install
  pnpm --dir plugin install

build:
  cargo build --workspace
  pnpm build

test:
  cargo test --workspace
  pnpm test

lint:
  cargo fmt --all -- --check
  cargo clippy --workspace --all-targets -- -D warnings
  pnpm lint

typecheck:
  pnpm typecheck

validate-examples:
  cargo run -p polybash-cli -- validate \
    --project fixtures/projects/valid/fighter_basic.zxmodel.json \
    --stylepack fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json

export-example:
  cargo run -p polybash-cli -- export \
    --project fixtures/projects/valid/fighter_basic.zxmodel.json \
    --stylepack fixtures/stylepacks/valid/zx_fighter_v1.stylepack.json \
    --out out/example
