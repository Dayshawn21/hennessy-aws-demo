import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = path.resolve("public/assets/photos");
const files = (await readdir(directory)).filter((file) => file.endsWith(".png"));

for (const file of files) {
  const input = path.join(directory, file);
  const base = path.join(directory, path.basename(file, ".png"));
  await sharp(input).resize({ width: 1800, withoutEnlargement: true }).avif({ quality: 68, effort: 5 }).toFile(`${base}.avif`);
  await sharp(input).resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(`${base}.webp`);
}

console.log(`Optimized ${files.length} photography assets.`);
