import fs from "node:fs/promises";
import path from "node:path";
import ktPoserParser from "./index.ts";

const inDir = `C:/Users/17606/Desktop/TimInc/Minecraft/cobblemon/common/src/main/kotlin/com/cobblemon/mod/common/client/render/models/blockbench/pokemon`;
const rootOutDir = "./out";
const outDir = path.join(rootOutDir, "./out");
const copyDir = path.join(rootOutDir, "./in");
const errorDir = path.join(rootOutDir, "./error");

function toSnakeCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .toLowerCase();
}
const ratio = { w: 0, l: 0 };

async function processDirectory(currentDir: string, relativePath = "") {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = `${currentDir}/${entry.name}`;
    const newRelativePath = `${relativePath}/${entry.name}`;
    const outPath = `${outDir}${newRelativePath}`;
    const copyPath = `${copyDir}${newRelativePath}`;
    const errorPath = `${errorDir}${newRelativePath}`;

    if (entry.isDirectory()) {
      await fs.mkdir(outPath, { recursive: true });
      await fs.mkdir(copyPath, { recursive: true });
      await fs.mkdir(errorPath, { recursive: true });
      await processDirectory(entryPath, newRelativePath);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".kt") &&
      relativePath != ""
    ) {
      console.log(`Processing file: ${entryPath}`);
      const fileContent = await fs.readFile(entryPath, "utf-8");
      try {
        const newFileContent = ktPoserParser(fileContent);
        await fs.writeFile(
          toSnakeCase(outPath.slice(0, -8)) + ".json",
          JSON.stringify(newFileContent, null, 2)
        );
        await fs.copyFile(entryPath, copyPath);
        ratio.w++;
      } catch (error) {
        await fs.writeFile(
          errorPath,
          `Error processing ${entryPath}: ${error.message}`
        );
        ratio.l++;
      }
    }
  }
}

(async function () {
  try {
    await processDirectory(inDir);
    console.log(ratio);
  } catch (error) {
    console.error("Error:", error);
  }
})();
