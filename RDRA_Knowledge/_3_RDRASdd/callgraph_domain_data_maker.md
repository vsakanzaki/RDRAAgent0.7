# callgraph_domain_data.json 生成プロンプト（domain 単体）

`3_RDRASdd/domain/*.md` のみを入力とし、Callgraph 用の **domain 部分 JSON** を生成する。

## 実行モード（厳守）

- 本ドキュメントは **質問への回答依頼ではない**。実行されたら **必ず** `3_RDRASdd/_callgraph/callgraph_domain_data.json` を作成・上書きする。
- **確認質問や説明だけで終了することを禁止**。チャットに JSON を貼るだけで完了としない。
- **完了の定義**: プロジェクトルート相対で `3_RDRASdd/_callgraph/callgraph_domain_data.json` が存在し、有効な JSON であること。

## 目的
- Cytoscape ビューアが参照する最終 `callgraph_data.json` のうち、**domain レイヤー**に相当する `contexts` / `services` / `entities` を出力する。
- このプロンプト単体では **application / ui は読まない**。

## 入力
- `3_RDRASdd/domain/*.md`（1 ファイル = 1 コンテキスト）

## 抽出ルール（domain）

- **コンテキスト英語名**: `## 1. 概要` の表「コンテキスト英語名」セル。
- **コンテキスト日本語名**: 同表「コンテキスト日本語名」。
- **エンティティ**: `## 2. エンティティ定義` 配下の `### 2.x <日本語エンティティ名>` 見出しの日本語名をラベルにする。
- **サービス英語名/日本語名**: `## 7. ドメインサービス` の `### DS-x: 日本語名 (EnglishName)` または `## 10. Application 連携契約` の表から抽出。
- **サービス→エンティティ**: `7.1` の「変更対象状態」/「対象エンティティ」、または `7.2 情報の CRUD` の「対象エンティティ」。複数あれば全件。
- **サービス→利用候補 UC（Callgraph 統合用・必須）**: `## 10. Application 連携契約` を読み、**各行のドメインサービス（メソッド名またはサービス名の行）に対応する** application UC の日本語名を `candidateUcs` に列挙する。
  - 同じ節に「利用候補UC」の箇条書きだけがある場合は、表の「サービス名」「メソッド名」と照らして当該サービスに関連する UC 名を割り当てる。
  - domain のサービス日本語名（例: `スケジュール確定`）と application の UC 日本語名（例: `スケジュールを確定する`）が表記上異なってもよい。**仕様に明示されている対応関係**を優先する。
  - 対応が読み取れないサービスは `candidateUcs: []` とする。

## ID 規約

| 種別 | ID 形式 |
|---|---|
| コンテキスト | `context:<英語コンテキスト名>` |
| サービス | `service:<英語コンテキスト名>:<サービス英語名>` |
| エンティティ | `entity:<英語コンテキスト名>:<エンティティ日本語名>` |

## 出力 JSON スキーマ（このファイルが出力するトップレベル）

出力は **次の3キーのみ** を持つオブジェクトとする（他キーは付けない）。

```json
{
  "contexts": [],
  "services": [],
  "entities": []
}
```

各要素の形は次のとおり（配列は該当が無ければ空でよい）。

```json
{
  "contexts": [
    {
      "id": "context:<EN>",
      "label": "<EN>",
      "labelJa": "<JA>",
      "filePath": "3_RDRASdd/domain/<File>.md",
      "services": ["service:<CtxEN>:<SvcEN>"],
      "entities": ["entity:<CtxEN>:<EntJA>"]
    }
  ],
  "services": [
    {
      "id": "service:<CtxEN>:<SvcEN>",
      "label": "<SvcEN>",
      "labelJa": "<SvcJA>",
      "context": "context:<CtxEN>",
      "filePath": "3_RDRASdd/domain/<File>.md",
      "entities": ["entity:<CtxEN>:<EntJA>"],
      "candidateUcs": ["<application UC の日本語名>"]
    }
  ],
  "entities": [
    {
      "id": "entity:<CtxEN>:<EntJA>",
      "label": "<EntJA>",
      "context": "context:<CtxEN>",
      "filePath": "3_RDRASdd/domain/<File>.md"
    }
  ]
}
```

## 出力ルール
- UTF-8、改行 LF、インデント 2 スペース。
- JSON 以外の説明文は出力しない。
- `filePath` はプロジェクトルートからの相対パス（`/` 区切り）。
- コメントや説明キーを JSON に含めない。
- 不明な関連は空配列でよい。

## 出力先（必須）
- **必ず** プロジェクトルート相対で `3_RDRASdd/_callgraph/callgraph_domain_data.json` にファイル出力する。
- チャット本文に JSON を表示しただけでは完了としない。
- `RDRA_Knowledge/` 配下には出力しない。
