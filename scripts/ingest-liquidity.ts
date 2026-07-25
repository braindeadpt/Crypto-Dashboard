import { ingestLiquiditySnapshot } from "../src/lib/data/liquidity";

ingestLiquiditySnapshot()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
