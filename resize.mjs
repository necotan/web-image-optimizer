import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import piexif from 'piexifjs';

const PRESETS = {
  low: { longEdge: 1600, jpegQuality: 72 },
  default: { longEdge: 2400, jpegQuality: 82 },
  high: { longEdge: 3200, jpegQuality: 90 },
};
const TARGET_EXTENSIONS = new Set(['.jpg', '.jpeg']);

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function printUsage() {
  console.log(`使い方: npm run resize -- "<フォルダパス>" [プリセット名] [オプション]`);
  console.log('');
  console.log('オプション:');
  console.log('  -p, --preset <名前>   プリセットを指定 (省略時は default)');
  console.log('  -q, --quality <1-100> JPEGのqualityを直接指定 (プリセットより優先される)');
  console.log('  -l, --long-edge <px>  長辺の最大ピクセル数を直接指定 (プリセットより優先される)');
  console.log('  -h, --help            このヘルプを表示');
  console.log('');
  console.log(`プリセット: ${Object.keys(PRESETS).join(' / ')}`);
  for (const [name, { longEdge, jpegQuality }] of Object.entries(PRESETS)) {
    console.log(`  ${name}: 長辺${longEdge}px / quality${jpegQuality}`);
  }
  console.log('');
  console.log('例:');
  console.log('  npm run resize -- "C:\\Photos\\2026-08-04" high');
  console.log('  npm run resize -- "C:\\Photos\\2026-08-04" --quality 95');
  console.log('  npm run resize -- "C:\\Photos\\2026-08-04" --long-edge 1200 --quality 60');
}

function parseNumberOption(name, rawValue) {
  if (rawValue === undefined) {
    console.error(`${name} には値が必要です`);
    process.exit(1);
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value)) {
    console.error(`${name} には整数を指定してください: ${rawValue}`);
    process.exit(1);
  }
  return value;
}

function parseArgs(argv) {
  const positionals = [];
  const options = { preset: undefined, quality: undefined, longEdge: undefined, help: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      positionals.push(arg);
      continue;
    }

    const equalIndex = arg.indexOf('=');
    const name = equalIndex === -1 ? arg : arg.slice(0, equalIndex);
    const inlineValue = equalIndex === -1 ? undefined : arg.slice(equalIndex + 1);
    const takeValue = () => (inlineValue !== undefined ? inlineValue : argv[++i]);

    switch (name) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-p':
      case '--preset':
        options.preset = takeValue();
        if (options.preset === undefined) {
          console.error(`${name} には値が必要です`);
          process.exit(1);
        }
        break;
      case '-q':
      case '--quality':
        options.quality = parseNumberOption(name, takeValue());
        break;
      case '-l':
      case '--long-edge':
        options.longEdge = parseNumberOption(name, takeValue());
        break;
      default:
        console.error(`不明なオプションです: ${name}`);
        console.error('--help でオプション一覧を表示します');
        process.exit(1);
    }
  }

  return { positionals, options };
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
  const { positionals, options } = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const inputDir = positionals[0];
  const presetName = options.preset ?? positionals[1] ?? 'default';

  if (!inputDir) {
    printUsage();
    process.exit(1);
  }

  const preset = PRESETS[presetName];
  if (!preset) {
    console.error(`不明なプリセットです: ${presetName}`);
    console.error(`利用可能なプリセット: ${Object.keys(PRESETS).join(' / ')}`);
    process.exit(1);
  }

  if (options.quality !== undefined && (options.quality < 1 || options.quality > 100)) {
    console.error(`quality は1から100の範囲で指定してください: ${options.quality}`);
    process.exit(1);
  }
  if (options.longEdge !== undefined && options.longEdge < 1) {
    console.error(`long-edge は1以上で指定してください: ${options.longEdge}`);
    process.exit(1);
  }

  const LONG_EDGE = options.longEdge ?? preset.longEdge;
  const JPEG_QUALITY = options.quality ?? preset.jpegQuality;
  const isCustomized = options.longEdge !== undefined || options.quality !== undefined;
  const settingLabel = isCustomized ? 'カスタム' : presetName;

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

  console.log(`${files.length}件を処理します (${settingLabel}: 長辺${LONG_EDGE}px / quality${JPEG_QUALITY})...`);

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
