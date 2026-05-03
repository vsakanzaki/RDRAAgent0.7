# callgraph_application_data.json 生成プロンプト（application 単体）

`3_RDRASdd/application/*.md` のみを入力とし、Callgraph 用の **application 部分 JSON** を生成する。

## 実行モード（厳守）

- 本ドキュメントは **質問への回答依頼ではない**。実行されたら **必ず** `3_RDRASdd/_callgraph/callgraph_application_data.json` を作成・上書きする。
- **確認質問や説明だけで終了することを禁止**。チャットに JSON を貼るだけで完了としない。
- **完了の定義**: プロジェクトルート相対で `3_RDRASdd/_callgraph/callgraph_application_data.json` が存在し、有効な JSON であること。

## 目的
- 最終 `callgraph_data.json` のうち **application レイヤー**に相当する `appBucs` / `ucs` を出力する。
- このプロンプト単体では **domain / ui は読まない**。
- **UC→ドメインサービス接続の主軸**は統合時に domain 側の `services[].candidateUcs`（Application連携契約）と **`ucs[].labelJa`** の照合である。本プロンプトは UC / API / BUC を正確に出力し、ヒント列は補助情報として付与する。
- `mergeCallgraphData.js` が domain の `3_RDRASdd/_callgraph/callgraph_domain_data.json` と照合して **正しい `service:...` ID** に正規化できるよう、UC ごとに **日本語のサービス名ヒント**を必ず付与する。

## 入力
- `3_RDRASdd/application/*.md`（1 ファイル = 1 BUC）

## 抽出ルール（application）

- **BUC 英語名**: `## 1. 概要` の表「BUC 英語名」。
- **BUC 日本語名**: 同表「BUC 日本語名」。
- **UC 英語名/日本語名**: `## 4. UC 詳細` の各節（英語名が無い場合は日本語名を英語化して補完してよい）。
- **UC 内 API エンドポイント**: `## 5. API エンドポイント` から `METHOD` と `PATH` を抽出し、該当 UC の `endpoints` に格納。API は独立ノードにしない。
- **endpoint の label**: `△ <METHOD> <PATH>` 形式。
- **UC→ドメインサービス（service ID）**: `## 7. ドメイン層呼び出し契約` の表から、推測できる場合は `service:<CtxEN>:<SvcEN>` 形式を `ucs[].services` に列挙する（後方互換・参考用）。**英語メソッド名は推測ミスしやすい**ため、必ず下記の **ヒント列も出力する**。
- **UC→ドメインサービス（ヒント・必須）**:
  - **`serviceHints`**: 表の「コンテキスト」「サービス名（日本語）」から、UC ごとに `{ "context": "<英語コンテキスト名>", "nameJa": "<日本語サービス名>" }` の配列を出力する。表に「直接サービス呼び出しなし」とある BUC は **空配列**。
  - **`serviceNamesJa`**: 当該 UC が利用するドメインサービスの日本語名だけを列挙した配列（`serviceHints` と同じ内容でよい。統合用の冗長フィールド）。
- **UC の screens**: この段階では **空配列** でよい。画面とのリンクは統合 JavaScript が `endpoints` と画面 `apis` の一致で補完する。

## ID 規約

| 種別 | ID 形式 |
|---|---|
| UC | `uc:<BUC英語名>:<UC日本語名>` |
| application BUC | `appbuc:<BUC英語名>` |

## 出力 JSON スキーマ（このファイルが出力するトップレベル）

出力は **次の2キーのみ** を持つオブジェクトとする。

```json
{
  "appBucs": [],
  "ucs": []
}
```

```json
{
  "appBucs": [
    {
      "id": "appbuc:<EN>",
      "label": "<EN>",
      "labelJa": "<JA>",
      "filePath": "3_RDRASdd/application/<EN>.md",
      "ucs": ["uc:<EN>:<UCJa>"]
    }
  ],
  "ucs": [
    {
      "id": "uc:<BUCEN>:<UCJa>",
      "label": "<UCEN>",
      "labelJa": "<UCJa>",
      "buc": "appbuc:<BUCEN>",
      "filePath": "3_RDRASdd/application/<BUCEN>.md",
      "services": ["service:<CtxEN>:<SvcEN>"],
      "serviceHints": [
        { "context": "ScheduleManagement", "nameJa": "スケジュールを確定する" }
      ],
      "serviceNamesJa": ["スケジュールを確定する"],
      "screens": [],
      "endpoints": [
        { "method": "GET", "path": "/example", "label": "△ GET /example" }
      ]
    }
  ]
}
```

- `serviceHints` / `serviceNamesJa` は **必須**（ドメイン呼び出しが無い UC では空配列 `[]`）。
- `services` は推測で埋めてよいが、推測できなければ空配列でもよい（統合時に **domain `candidateUcs` / ヒント**から復元する）。

## 出力ルール
- `endpoints` / `apis` の `method` は大文字（GET/POST/PUT/PATCH/DELETE）。
- `path` は先頭 `/` を必須。
- UTF-8、改行 LF、インデント 2 スペース。
- JSON 以外の説明文は出力しない。

## 出力先（必須）
- **必ず** `3_RDRASdd/_callgraph/callgraph_application_data.json` にファイル出力する。
- `RDRA_Knowledge/` 配下には出力しない。
