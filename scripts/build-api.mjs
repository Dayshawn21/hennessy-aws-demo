// Bundles api/inquiries.ts into api/dist/index.mjs and zips it for upload to Lambda.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

rmSync("api/dist", { recursive: true, force: true });
mkdirSync("api/dist", { recursive: true });
await build({
  entryPoints: ["api/inquiries.ts"],
  outfile: "api/dist/index.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  external: ["@aws-sdk/*"], // AWS SDK v3 is included in the Lambda Node runtime
  sourcemap: false,
});
execFileSync("powershell", ["-NoProfile", "-Command", "Compress-Archive -Path api/dist/index.mjs -DestinationPath api/dist/inquiries.zip -Force"], { stdio: "inherit" });
console.log("Built api/dist/inquiries.zip");
