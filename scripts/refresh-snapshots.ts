import { refreshHeavySnapshots } from "../src/lib/data/refreshHeavy";

async function main() {
  console.log("Refreshing heavy DefiLlama snapshots…");
  const started = Date.now();
  const result = await refreshHeavySnapshots();
  console.log(
    `Done in ${((Date.now() - started) / 1000).toFixed(1)}s — yields=${result.yieldsPools} protocols=${result.defiProtocols}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
