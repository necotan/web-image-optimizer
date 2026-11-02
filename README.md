<h1 align="center">web-image-optimizer</h1>

<p align="center">
  English | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  Batch-resize and compress full-size JPEGs for the web.<br>
  GPS data is stripped automatically, while other EXIF is kept.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-ESM-5FA04E?logo=nodedotjs&logoColor=white">
  <img src="https://img.shields.io/badge/sharp-Image%20Processing-99CC00">
  <img src="https://img.shields.io/badge/Interface-CLI-4D4D4D?logo=gnubash&logoColor=white">
  <br>
  <img src="https://img.shields.io/badge/Privacy-GPS%20EXIF%20Removal-E05D44">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green"></a>
</p>

## Overview

- Give it a folder, and it processes all `.jpg` / `.jpeg` files directly inside it.
- Images are resized and compressed to the size and quality of the chosen preset (`low` / `default` / `high`) and written with the same names to an `export/` subfolder.
- The original files are never modified.
- Only the location data is removed from the output images.

## Setup

Clone this repository, move into the folder, and install the dependencies.

```
git clone https://github.com/necotan/web-image-optimizer.git
cd web-image-optimizer
npm install
```

## Usage

`npm run resize` must be run from inside the cloned `web-image-optimizer` folder. Always `cd` into it first.

```
cd <path to the cloned web-image-optimizer folder>
npm run resize -- "<path to the folder with your photos>" [preset] [options]
```

The preset is optional. If omitted, `default` is used.

Examples:

```
cd C:\projects\web-image-optimizer
npm run resize -- "C:\Photos\2026-08-04"
npm run resize -- "C:\Photos\2026-08-04" high
```

The converted files are written to `C:\Photos\2026-08-04\export\`.

The log output is in Japanese.

```
2件を処理します (default: 長辺2400px / quality82)...
  IMG_9040.JPG: 24.8MB -> 1.8MB
  IMG_9041.JPG: 23.1MB -> 1.6MB

完了: 2件 / 47.9MB -> 3.4MB / 2.1秒
出力先: C:\Photos\2026-08-04\export
```

## Presets

| Preset | Long edge | Quality |
|---|---|---|
| `low` | 1600px | 72 |
| `default` | 2400px | 82 |
| `high` | 3200px | 90 |

To change the preset defaults themselves, edit the `PRESETS` constant in `resize.mjs`.

## Options

To set values on the spot, use the following options to override the preset values.

| Option | Description |
|---|---|
| `-p`, `--preset <name>` | Set the preset (same as passing it as a positional argument; defaults to `default`) |
| `-q`, `--quality <1-100>` | Set the JPEG quality directly (takes priority over the preset) |
| `-l`, `--long-edge <px>` | Set the maximum long-edge size in pixels directly (takes priority over the preset) |
| `-h`, `--help` | Show help |

Values can be given as either `--quality 95` or `--quality=95`.

Examples:

```
npm run resize -- "C:\Photos\2026-08-04" --quality 95
npm run resize -- "C:\Photos\2026-08-04" --long-edge 1200 --quality 60
npm run resize -- "C:\Photos\2026-08-04" high --quality 95
```

When you combine a preset with options, only the values you set with options override the preset. (In the third example above, the long edge is 3200px from `high` and the quality is 95.) When an option overrides a value, the preset name in the log shows as `カスタム` (custom).

```
1件を処理します (カスタム: 長辺3200px / quality95)...
```

## Notes

- Only `.jpg` / `.jpeg` files directly inside the folder are processed.
- Images whose long edge is already at or below `LONG_EDGE` are not upscaled and are output at their original size.
- EXIF data other than location (capture date and time, camera model, exposure settings, etc.) is kept.
