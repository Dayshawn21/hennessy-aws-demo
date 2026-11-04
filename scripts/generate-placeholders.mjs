// Replaces every image in public/assets/photos/work with a flat-colour placeholder
// of the same name, format and pixel size. Run: node scripts/generate-placeholders.mjs
import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.resolve("public/assets/photos/work");
const files = await readdir(dir);
const names = [...new Set(files.filter((f) => /\.(jpg|png)$/.test(f)).map((f) => f.replace(/\.(jpg|png)$/, "")))];
const palette = ["#c9d6e3", "#e3d5c9", "#d3e3c9", "#e3c9d6", "#d6c9e3", "#e3e0c9"];

// Sidecar .json files only carry provenance notes about the real photos.
for (const f of files.filter((f) => f.endsWith(".json"))) await unlink(path.join(dir, f));

let i = 0;
for (const name of names) {
  const original = files.find((f) => f.startsWith(name + ".") && /\.(jpg|png)$/.test(f));
  const ext = path.extname(original);
  const { width: w, height: h } = await sharp(path.join(dir, original)).metadata();
  const label = name.replace(/-/g, " ");
  const fs = Math.round(Math.min(w, h) / 14);
  const sw = Math.max(2, w / 300);
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${palette[i++ % palette.length]}"/><rect x="${w * 0.04}" y="${h * 0.03}" width="${w * 0.92}" height="${h * 0.94}" fill="none" stroke="#6b7a8c" stroke-width="${sw}" stroke-dasharray="${w / 40} ${w / 60}"/><path d="M0 0L${w} ${h}M${w} 0L0 ${h}" stroke="#6b7a8c" stroke-opacity=".25" stroke-width="${sw}"/><g font-family="Arial, Helvetica, sans-serif" fill="#2b3644" text-anchor="middle"><text x="${w / 2}" y="${h / 2 - fs * 0.3}" font-size="${fs}" font-weight="700">Photo placeholder</text><text x="${w / 2}" y="${h / 2 + fs * 1.1}" font-size="${fs * 0.8}">${label}</text></g></svg>`);
  const img = sharp(svg);
  const base = path.join(dir, name);
  await (ext === ".png" ? img.clone().png() : img.clone().jpeg({ quality: 80 })).toFile(base + ext);
  await img.clone().webp({ quality: 80 }).toFile(base + ".webp");
  await img.clone().avif({ quality: 50, effort: 4 }).toFile(base + ".avif");
}
console.log(`Generated placeholders for ${names.length} images.`);
