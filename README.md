# web-image-optimizer

フォルダ内のフルサイズJPEGを、Web公開用に一括でリサイズ・圧縮するCLIツールです。位置情報の自動削除にも対応しています。

## 仕様

- フォルダを指定すると、直下の `.jpg` / `.jpeg` をまとめて処理します。
- 長辺2400px・quality82にリサイズ/圧縮し、`export/` サブフォルダに同名で出力します。
- 元ファイルは一切変更を行いません。
- 出力画像の位置情報だけを削除します。

## 初回セットアップ

このリポジトリをクローンし、フォルダに移動して依存パッケージをインストールします。

```
git clone https://github.com/necotan/web-image-optimizer.git
cd web-image-optimizer
npm install
```

## 使い方

`npm run resize` は、クローンした `web-image-optimizer` フォルダに移動してから実行する必要があります。実行前に必ず `cd` してください。

```
cd <クローンした web-image-optimizer フォルダのパス>
npm run resize -- "<写真の入ったフォルダのパス>"
```

例：

```
cd C:\projects\web-image-optimizer
npm run resize -- "C:\Photos\2026-08-04"
```

実行すると `C:\Photos\2026-08-04\export\` に変換後のファイルが生成されます。

```
2件を処理します (長辺2400px / quality82)...
  IMG_9040.JPG: 24.8MB -> 1.8MB
  IMG_9041.JPG: 23.1MB -> 1.6MB

完了: 2件 / 47.9MB -> 3.4MB / 2.1秒
出力先: C:\Photos\2026-08-04\export
```

## 品質設定を変えたい場合

`resize.mjs` 冒頭の定数を書き換えて調整します。

| 定数 | デフォルト | 内容 |
|---|---|---|
| `LONG_EDGE` | `2400` | 出力画像の長辺サイズ(px) |
| `JPEG_QUALITY` | `82` | JPEG品質(0-100) |

## 注意点

- 対象はフォルダ直下の`.jpg`/`.jpeg`のみです。
- 既に長辺が`LONG_EDGE`以下の画像は拡大せずそのまま出力します。
- 位置情報以外のEXIF情報（撮影日時、カメラ機種、露出設定など）は保持されます。
