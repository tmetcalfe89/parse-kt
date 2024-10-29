import fs from "node:fs/promises";
import path from "node:path";

import ktPoserParser from "./index.ts";

const inDir = `C:/Users/17606/Desktop/TimInc/Minecraft/cobblemon/common/src/main/kotlin/com/cobblemon/mod/common/client/render/models/blockbench/pokemon`;
const outDir =
  "C:/Users/17606/Desktop/TimInc/Minecraft/cobblemon/common/src/main/resources/assets/cobblemon/bedrock/pokemon/posers/new";
const copyDir = "./out/in";
const errorDir = "./out/error";
const mirrorDir =
  "C:/Users/17606/Desktop/TimInc/Minecraft/cobblemon/common/src/main/resources/assets/cobblemon/bedrock/pokemon/models";

const fileIndex: { [key: string]: string } = {};
async function indexFilesByName(currentDir: string, relativePath = "") {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);
    const newRelativePath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      await indexFilesByName(entryPath, newRelativePath);
    } else if (entry.isFile()) {
      fileIndex[
        entryPath.split("\\").slice(-2, -1).join("").split("_").pop()!
      ] = entryPath.split("\\").slice(-2, -1).join("");
    }
  }
}

function toSnakeCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .toLowerCase();
}
const ratio = { w: 0, l: 0 };

function shakeCommentedLines(raw: string) {
  return raw
    .split(/[\r\n]/g)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

async function processDirectory(currentDir: string, relativePath = "") {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = `${currentDir}/${entry.name}`;
    const newRelativePath = `${relativePath}/${entry.name}`;
    const outPath = `${outDir}${newRelativePath}`;
    const copyPath = `${copyDir}${newRelativePath}`;
    const errorPath = `${errorDir}${newRelativePath}`;

    if (entry.isDirectory()) {
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
        await fs.copyFile(entryPath, copyPath);
        const newFileContent = ktPoserParser(shakeCommentedLines(fileContent));
        const searchable = outPath.slice(0, -8).split("/").pop()!.toLowerCase();
        let targetDir =
          fileIndex[toSnakeCase(searchable)] ||
          Object.entries(fileIndex).find(
            ([k, v]) => k.startsWith(searchable) || searchable.startsWith(k)
          )?.[1];
        if (!targetDir) {
          throw new Error(`Couldn't find ${searchable} in fileIndex`);
        }
        const targetFile = path.join(
          outDir,
          targetDir,
          toSnakeCase(
            entryPath.split("/").pop()?.replaceAll("Model.kt", "")!
          ) + ".json"
        );
        await fs.mkdir(targetFile.split("\\").slice(0, -1).join("\\"), {
          recursive: true,
        });
        console.log(targetFile);
        await fs.writeFile(targetFile, JSON.stringify(newFileContent, null, 2));
        ratio.w++;
      } catch (error) {
        await fs.writeFile(
          errorPath,
          `Error processing ${entryPath}: ${error.stack}`
        );
        ratio.l++;
      }
    }
  }
}

(async function () {
  try {
    await fs.mkdir("./out", { recursive: true });
    await indexFilesByName(mirrorDir);
    fs.writeFile("./out/filesIndex.json", JSON.stringify(fileIndex, null, 2));
    await processDirectory(inDir);
    console.log(ratio);
  } catch (error) {
    console.error("Error:", error);
  }
})();
