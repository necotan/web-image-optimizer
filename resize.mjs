import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import piexif from 'piexifjs';

const LONG_EDGE = 2400;
const JPEG_QUALITY = 82;
const TARGET_EXTENSIONS = new Set(['.jpg', '.jpeg']);

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function stripGpsExif(filePath) {
  const jpegData = fs.readFileSync(filePath, 'binary');
  let exifObj;
  try {
    exifObj = piexif.load(jpegData);
  } catch {
    return;
  }
  if (!exifObj.GPS || Object.keys(exifObj.GPS).length === 0) return;
  exifObj.GPS = {};
  const exifBytes = piexif.dump(exifObj);
  const newJpegData = piexif.insert(exifBytes, jpegData);
  fs.writeFileSync(filePath, newJpegData, 'binary');
}

async function main() {
  const inputDir = process.argv[2];
  if (!inputDir) {
    console.error('使い方: npm run resize -- "<フォルダパス>"');
    process.exit(1);
  }

  const resolvedDir = path.resolve(inputDir);
  if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
    console.error(`フォルダが見つかりません: ${resolvedDir}`);
    process.exit(1);
  }

  const outputDir = path.join(resolvedDir, 'export');
  fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && TARGET_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);

  if (files.length === 0) {
    console.log('対象のJPEGファイルが見つかりませんでした');
    return;
  }

  console.log(`${files.length}件を処理します (長辺${LONG_EDGE}px / quality${JPEG_QUALITY})...`);

  let originalTotal = 0;
  let outputTotal = 0;
  const startedAt = Date.now();

  for (const fileName of files) {
    const inputPath = path.join(resolvedDir, fileName);
    const outputPath = path.join(outputDir, fileName);

    const originalSize = fs.statSync(inputPath).size;
    originalTotal += originalSize;

    await sharp(inputPath)
      .rotate()
      .resize({
        width: LONG_EDGE,
        height: LONG_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .withMetadata()
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(outputPath);

    stripGpsExif(outputPath);

    const outputSize = fs.statSync(outputPath).size;
    outputTotal += outputSize;

    console.log(`  ${fileName}: ${formatBytes(originalSize)} -> ${formatBytes(outputSize)}`);
  }

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('');
  console.log(`完了: ${files.length}件 / ${formatBytes(originalTotal)} -> ${formatBytes(outputTotal)} / ${elapsedSec}秒`);
  console.log(`出力先: ${outputDir}`);
}

main();
