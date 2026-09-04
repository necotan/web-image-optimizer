# web-image-optimizer

フォルダ内のフルサイズJPEGを、Web公開用に一括でリサイズ・圧縮するCLIツールです。位置情報の自動削除にも対応しています。

## 仕様

- フォルダを指定すると、直下の `.jpg` / `.jpeg` をまとめて処理します。
- プリセット（`low` / `default` / `high`）に応じたサイズ・品質にリサイズ/圧縮し、`export/` サブフォルダに同名で出力します。
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
npm run resize -- "<写真の入ったフォルダのパス>" [プリセット名] [オプション]
```

プリセット名は省略可能で、省略時は `default` が使用されます。

例：

```
cd C:\projects\web-image-optimizer
npm run resize -- "C:\Photos\2026-08-04"
npm run resize -- "C:\Photos\2026-08-04" high
```

実行すると `C:\Photos\2026-08-04\export\` に変換後のファイルが生成されます。

```
2件を処理します (default: 長辺2400px / quality82)...
  IMG_9040.JPG: 24.8MB -> 1.8MB
  IMG_9041.JPG: 23.1MB -> 1.6MB

完了: 2件 / 47.9MB -> 3.4MB / 2.1秒
出力先: C:\Photos\2026-08-04\export
```

## プリセット

| プリセット | 長辺 | quality |
|---|---|---|
| `low` | 1600px | 72 |
| `default` | 2400px | 82 |
| `high` | 3200px | 90 |

プリセットの既定値そのものを変えたい場合は `resize.mjs` の `PRESETS` 定数を書き換えます。

## オプション

数値をその場で指定したい場合は、以下のオプションでプリセットの値を上書きできます。

| オプション | 内容 |
|---|---|
| `-p`, `--preset <名前>` | プリセットを指定（位置引数でのプリセット指定と同様。省略時は `default`） |
| `-q`, `--quality <1-100>` | JPEGのqualityを直接指定（プリセットより優先される） |
| `-l`, `--long-edge <px>` | 長辺の最大ピクセル数を直接指定（プリセットより優先される） |
| `-h`, `--help` | ヘルプを表示 |

値は `--quality 95` でも `--quality=95` でも指定できます。

例：

```
npm run resize -- "C:\Photos\2026-08-04" --quality 95
npm run resize -- "C:\Photos\2026-08-04" --long-edge 1200 --quality 60
npm run resize -- "C:\Photos\2026-08-04" high --quality 95
```

プリセットとオプションを併用した場合は、指定したオプションの項目だけがプリセットの値を上書きします。（上記3つ目の例では、長辺は `high` の3200px、qualityは95）オプションで上書きしたときは、実行ログのプリセット名の表示が `カスタム` になります。

```
1件を処理します (カスタム: 長辺3200px / quality95)...
```

## 注意点

- 対象はフォルダ直下の`.jpg`/`.jpeg`のみです。
- 既に長辺が`LONG_EDGE`以下の画像は拡大せずそのまま出力します。
- 位置情報以外のEXIF情報（撮影日時、カメラ機種、露出設定など）は保持されます。
