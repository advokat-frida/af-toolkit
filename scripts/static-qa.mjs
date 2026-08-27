import { runStaticChecks } from "./checks.mjs";

const results = await runStaticChecks();
for (const result of results) {
  process.stdout.write(`${result.ok ? "PASS" : "FAIL"}  ${result.label}${result.detail ? ` · ${result.detail}` : ""}\n`);
}
const failed = results.filter((result) => !result.ok);
process.stdout.write(`\n${results.length - failed.length}/${results.length} static checks passed.\n`);
if (failed.length) process.exitCode = 1;
