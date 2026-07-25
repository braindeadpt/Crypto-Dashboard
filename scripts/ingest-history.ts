import { ingestHistorySeries } from "../src/lib/history/ingest";

ingestHistorySeries()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
