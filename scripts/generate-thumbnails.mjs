// Generate small WebP thumbnails for the character picker grid.
//
// The picker renders ~125x140px cells, so full-resolution character art (up to
// ~1MB each) is wasteful there. This produces bounded WebP thumbnails under
// public/img/thumb/<same relative path>.webp. The Canvas / sticker export keeps
// using the full-resolution originals at public/img/<path>.
//
// Run with:  npm run generate:thumbnails
// Re-run after adding or replacing any character image.

import sharp from "sharp";
import { readdir, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const IMG_ROOT = path.resolve("public/img");
const THUMB_DIRNAME = "thumb"; // output lives at public/img/thumb/**
const THUMB_ROOT = path.join(IMG_ROOT, THUMB_DIRNAME);
const MAX_EDGE = 300; // bound the longer side; covers ~2x the grid cell size
const WEBP_QUALITY = 80;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    // never descend into the generated thumbnail tree
    if (entry.isDirectory()) {
      if (full === THUMB_ROOT) continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

let made = 0;
let bytes = 0;

for await (const file of walk(IMG_ROOT)) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;

  const rel = path.relative(IMG_ROOT, file); // e.g. "ongeki/1.png"
  const outRel = rel.replace(/\.[^.]+$/, ".webp"); // "ongeki/1.webp"
  const outPath = path.join(THUMB_ROOT, outRel);

  await mkdir(path.dirname(outPath), { recursive: true });

  const buf = await sharp(await readFile(file))
    .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toBuffer();

  await writeFile(outPath, buf);
  made++;
  bytes += buf.length;
}

console.log(
  `generated ${made} thumbnails -> public/img/${THUMB_DIRNAME}/  ` +
    `(${(bytes / 1024 / 1024).toFixed(2)} MB total, ` +
    `avg ${(bytes / made / 1024).toFixed(1)} KB)`
);
