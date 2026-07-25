import { ingestSectorsSnapshot } from "../src/lib/data/sectors";

ingestSectorsSnapshot()
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
