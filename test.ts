import fs from "node:fs/promises";
import ktPoserParser from "./index.ts";

(async function () {
  const file = await fs.readFile("./test/test-in.kt", "utf8");
  const output = ktPoserParser(file);
  fs.writeFile("./out.json", JSON.stringify(output, null, 2));
})();
