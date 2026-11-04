import sharp from "sharp";

const sourcePath = "reference/selected-option-2.png";
const implementationPath = "qa/home-desktop-final.png";
const outputPath = "qa/concept-vs-implementation-final.png";
const width = 1440;

const [source, implementation] = await Promise.all([
  sharp(sourcePath).resize({ width }).png().toBuffer({ resolveWithObject: true }),
  sharp(implementationPath).resize({ width }).png().toBuffer({ resolveWithObject: true }),
]);

const height = Math.max(source.info.height, implementation.info.height);
await sharp({
  create: { width: width * 2, height, channels: 4, background: "#0d0d0c" },
})
  .composite([
    { input: source.data, left: 0, top: 0 },
    { input: implementation.data, left: width, top: 0 },
  ])
  .png()
  .toFile(outputPath);

console.log(`Created ${outputPath}`);
