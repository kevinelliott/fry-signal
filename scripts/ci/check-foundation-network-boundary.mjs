import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const sourceRoots = ["apps/web/app", "packages/domain/src"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"]);
const testFilePattern = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

const prohibitedPatterns = [
  {
    label: "wallet or chain runtime import",
    pattern:
      /(?:from\s*|import\s*\(|require\s*\()\s*["'][^"']*(?:@airgap\/beacon|@taquito|ethers|viem|wagmi)[^"']*["']/u,
  },
  {
    label: "HTTP client import",
    pattern: /(?:from\s*|import\s*\(|require\s*\()\s*["'][^"']*(?:axios|node:https?|undici)[^"']*["']/u,
  },
  {
    label: "runtime fetch",
    pattern: /\bfetch\s*\(/u,
  },
  {
    label: "browser socket or event stream",
    pattern: /\b(?:WebSocket|EventSource|XMLHttpRequest)\b/u,
  },
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (sourceExtensions.has(extname(entry.name)) && !testFilePattern.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}

const sourceFiles = (
  await Promise.all(sourceRoots.map((root) => collectFiles(join(repositoryRoot, root))))
).flat();

const violations = [];
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  for (const { label, pattern } of prohibitedPatterns) {
    if (pattern.test(source)) {
      violations.push(`${relative(repositoryRoot, file)}: ${label}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Phase 1 must remain walletless and network-free:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Foundation network boundary passed across ${sourceFiles.length} runtime source files.`);
}
