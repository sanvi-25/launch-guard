import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createZipBuffer } from "../lib/zip-builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.resolve(rootDir, "..", "launchguard.zip");

console.log("Packaging LaunchGuard into:", outputPath);
const buf = createZipBuffer(rootDir);
fs.writeFileSync(outputPath, buf);
console.log(`[DONE] launchguard.zip created (${(buf.length / 1024).toFixed(1)} KB) on Desktop!`);
