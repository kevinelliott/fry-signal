import { createRequire } from "node:module";

const requireFromNext = createRequire(import.meta.resolve("next/package.json"));
const sharp = requireFromNext("next/dist/server/image-optimizer").getSharp();
const postcssVersion = requireFromNext("postcss/package.json").version;

if (sharp.versions.sharp !== "0.35.3" || postcssVersion !== "8.5.25") {
  throw new Error(
    `Next dependency overrides drifted: sharp ${sharp.versions.sharp}, postcss ${postcssVersion}`,
  );
}

const source = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#f2c94c"/></svg>',
);
const output = await sharp(source).resize(4, 4).png().toBuffer({ resolveWithObject: true });

if (output.info.format !== "png" || output.info.width !== 4 || output.info.height !== 4) {
  throw new Error("Sharp compatibility check produced an unexpected image");
}

const pngSignature = "89504e470d0a1a0a";
if (output.data.subarray(0, 8).toString("hex") !== pngSignature) {
  throw new Error("Sharp compatibility check produced an invalid PNG signature");
}

console.log(
  `Next dependency overrides passed: sharp ${sharp.versions.sharp}, postcss ${postcssVersion}, SVG to ${output.info.width}x${output.info.height} PNG`,
);
