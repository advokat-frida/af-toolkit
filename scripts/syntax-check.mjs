import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = [
  join(repositoryRoot, "server.mjs"),
  join(repositoryRoot, "public", "toolkit.js"),
  join(repositoryRoot, "scripts"),
  join(repositoryRoot, "tests")
];

async function collect(path) {
  if (extname(path)) return [path];
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await collect(child));
    else if ([".js", ".mjs"].includes(extname(entry.name))) files.push(child);
  }
  return files;
}

const files = (await Promise.all(roots.map(collect))).flat().sort();
for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}
process.stdout.write(`Syntax checked ${files.length} JavaScript files.\n`);
