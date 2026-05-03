# callgraph_ui_data.json 生成プロンプト（ui 単体）

`3_RDRASdd/ui/<BUC英語名>/<画面英語名>.md` のみを入力とし、Callgraph 用の **ui 部分 JSON** を生成する。

## 実行モード（厳守）

- 本ドキュメントは **仕様説明依頼ではない**。ユーザーが `parallel-runner` / メニューから実行した前提で、**必ず次に示す出力先へ JSON ファイルを書き込むこと**。
- **確認質問・手順の説明のみ・チャット本文だけで終了することを禁止**する。説明文はファイル出力後に短く付けてよいが、**ファイル未作成で終了してはならない**。
- **完了の定義**: プロジェクトルート相対で `3_RDRASdd/_callgraph/callgraph_ui_data.json` が存在し、有効な JSON として読み込めること。
- `3_RDRASdd/ui/` 配下に `.md` が1つでもある場合、`uiBucs` と `screens` を **空のままにしない**（全画面を抽出する）。

## 目的
- 最終 `callgraph_data.json` のうち **ui レイヤー**に相当する `uiBucs` / `screens` を出力する。
- このプロンプト単体では **domain / application は読まない**。

## 入力
- `3_RDRASdd/ui/**/*.md`（親フォルダ名 = BUC 英語名、ファイル名 = 画面英語名）

## 抽出ルール（ui）

- **画面英語名**: ファイル名（拡張子なし）。
- **画面日本語名**: `## 1. 概要` の「画面日本語名」（無ければ要確認だが空でよい）。
- **BUC 英語名**: 親フォルダ名。
- **画面の API 利用**: `## 8. API 利用`（旧 `## API利用`）内の `**メソッド/パス**:` 行から `METHOD` と `PATH` を抽出し `apis` に格納する。推測で補完しない。
- **Application 契約との一致**: 抽出する `METHOD` / `PATH` は `3_RDRASdd/application/<BUC英語名>.md` の `## 5. API エンドポイント` と一致させること（統合時は UC の `endpoints` と文字列照合）。不一致があると `screens[].ucs` が空のままとなる。
- **screens[].ucs**: この段階では **空配列** でよい。UC との対応は統合 JavaScript が `apis` と application の `endpoints` を照合して付与する。

## ID 規約

| 種別 | ID 形式 |
|---|---|
| 画面 | `screen:<画面英語名>` |
| ui BUC | `uibuc:<BUC英語名>` |

## 出力 JSON スキーマ（このファイルが出力するトップレベル）

出力は **次の2キーのみ** を持つオブジェクトとする。

```json
{
  "uiBucs": [],
  "screens": []
}
```

```json
{
  "uiBucs": [
    {
      "id": "uibuc:<EN>",
      "label": "<EN>",
      "screens": ["screen:<ScreenEN>"]
    }
  ],
  "screens": [
    {
      "id": "screen:<ScreenEN>",
      "label": "<ScreenEN>",
      "labelJa": "<JA>",
      "buc": "uibuc:<BUCEN>",
      "filePath": "3_RDRASdd/ui/<BUCEN>/<ScreenEN>.md",
      "ucs": [],
      "apis": [
        { "method": "GET", "path": "/example" }
      ]
    }
  ]
}
```

## 出力ルール
- `method` は大文字。`path` は先頭 `/`。
- UTF-8、改行 LF、インデント 2 スペース。

## 出力先（必須）
- **必ず** `3_RDRASdd/_callgraph/callgraph_ui_data.json` にファイル出力する。
- `RDRA_Knowledge/` 配下には出力しない。
