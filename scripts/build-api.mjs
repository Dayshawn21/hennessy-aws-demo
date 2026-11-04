// Bundles each Lambda in api/ into api/dist/<name>/index.mjs and zips it as api/dist/<name>.zip
// for upload in the Lambda console.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";

const functions = ["inquiries", "bookings"];

rmSync("api/dist", { recursive: true, force: true });
for (const name of functions) {
  mkdirSync(`api/dist/${name}`, { recursive: true });
  await build({
    entryPoints: [`api/${name}.ts`],
    outfile: `api/dist/${name}/index.mjs`,
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    external: ["@aws-sdk/*"], // AWS SDK v3 is included in the Lambda Node runtime
    sourcemap: false,
  });
  execFileSync(
    "powershell",
    ["-NoProfile", "-Command", `Compress-Archive -Path api/dist/${name}/index.mjs -DestinationPath api/dist/${name}.zip -Force`],
    { stdio: "inherit" },
  );
  console.log(`Built api/dist/${name}.zip`);
}
