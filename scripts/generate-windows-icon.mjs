import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = process.cwd();
const assetsDir = path.join(root, "assets");
const pngPath = path.join(assetsDir, "busicare-app-icon.png");
const icoPath = path.join(assetsDir, "busicare-app-icon.ico");
await fs.mkdir(assetsDir, { recursive: true });
await sharp(path.join(root, "public", "busicare-app-icon.svg"))
  .resize(256, 256, { fit: "contain" })
  .png()
  .toFile(pngPath);
const ico = await pngToIco(pngPath);
await fs.writeFile(icoPath, ico);
await fs.unlink(pngPath);
console.log("Generated branded Windows ICO from public/busicare-app-icon.svg");
