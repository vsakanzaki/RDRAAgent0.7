---
name: rdra-core-references
description: >-
  Loads the canonical RDRA references from RDRA_Knowledge/.rdracore/ as a single entry point:
  RDRA.md (metamodel: constituent models and inter-model rules),
  RDRAGraph.md (関連データ.txt line format: #child/#edge/#arrow/@@//, sheet-to-graph conversion),
  RDRASheet.md (tabular layout: columns, TSV, hierarchy via blank cells, file roles).
  Use when explaining RDRA, interpreting ZeroOne/1_RDRA TSV or JSON, or when the user mentions
  RDRA構成要素、モデル間の関係、業務、BUC、UC、アクター、情報、状態、コンテキスト、条件、バリエーション、
  関連データ、RDRAGraph、#child、#edge、@@、//、グラフ表示、RDRASheet、表形式、シート、列、TSV、定義ファイル、階層セル.
---

# RDRA 正典参照（統合版）

このスキルは、RDRA に関する 3 つの正典ファイルへの統一エントリポイント。タスクに応じて該当ファイルを Read して規則・用語に従う。

## 1. RDRA メタモデル（概念）

- **正典**: [RDRA_Knowledge/.rdracore/RDRA.md](RDRA_Knowledge/.rdracore/RDRA.md)
- **使う場面**: モデル名・要素・モデル間の規則を扱うとき。一般書籍や他プロジェクトの RDRA 用語と混同しない。
- **用語ラベル（例）**: 業務 / BUC / アクティビティ / UC / 情報 / 状態モデル / 状態 / コンテキスト / 条件 / バリエーション / アクター / 外部システム / 画面 / イベント / タイマー

### 手順（概念）

1. RDRA の用語・ルールに触れるタスクでは、まず `RDRA.md` を Read する。
2. 説明・分類・整合性チェックは、`RDRA.md` の定義および「モデル間のつながりの規則」に合わせる。
3. オブジェクトとメタモデルの対応が曖昧なときは、`RDRA.md` 末尾の例（会員／受注／受注を登録する）に沿って整理する。

## 2. 関連データ（RDRAGraph 形式）

- **正典**: [RDRA_Knowledge/.rdracore/RDRAGraph.md](RDRA_Knowledge/.rdracore/RDRAGraph.md)
- **対象成果物**: [1_RDRA/if/関連データ.txt](1_RDRA/if/関連データ.txt) … `makeGraphData.js` 等で生成。RDRAGraph ツールに貼り付けて可視化する。
- **使う場面**: 関連データ.txt の行（関係種別 / モデル1 / モデル2 / オブジェクト結合）を解釈・検証するとき。
- **タグ**: `#child` / `#edge` / `#comment` / `#arrow` / `#stereotype` / `#attribute`
- **結合**: `@@`（オブジェクト1@@オブジェクト2）、`//`（複数ペア区切り）

### 手順（グラフ形式）

1. `関連データ.txt` の構造・1 行目（システム名）・2 行目以降の 4 カラムを解釈するときは、まず `RDRAGraph.md` を Read する。
2. カラム A の関係タグおよび D 列の `オブジェクト1@@オブジェクト2//…` の結合ルールは、`RDRAGraph.md` に従う。
3. シートから関連データへの変換対応は、`RDRAGraph.md` 後半のシート別セクションを参照する。
4. 表形式の列定義は `RDRASheet.md`、メタモデル用語は `RDRA.md` と整合させる。

## 3. RDRASheet（表形式）

- **正典**: [RDRA_Knowledge/.rdracore/RDRASheet.md](RDRA_Knowledge/.rdracore/RDRASheet.md)
- **使う場面**: シート列定義、TSV、空白セルによる階層、ファイル分割（BUC シートでの統合等）を扱うとき。

### 手順（シート形式）

1. RDRASheet 形式に触れるタスクでは、まず `RDRASheet.md` を Read する。
2. 行の意味（同一行の項目同士の関連）、空白セルによる階層の引き継ぎ、TSV 出力の前提などは、`RDRASheet.md` の記述に合わせる。
3. メタモデル上の用語は `RDRA.md` と整合させる。表からグラフ用「関連データ」への変換ルールは `RDRAGraph.md` を参照する。

### RDRA 定義ファイルの配置（このリポジトリ）

- **(project root) `0_RDRAZeroOne/`** … TSV 原本など ZeroOne 成果物の置き場（生成時）。
- **(project root) `1_RDRA/`** … RDRA で定義されたファイル（関連データ等）が**配置されている**想定。
- `1_RDRA/` 配下のファイルの意味を理解する場合は `RDRASheet.md` と `RDRA.md` の定義情報を参照する。

## 横断ルール

- 用語は `RDRA.md` の日本語ラベルに統一する。
- 関連データを語るときは `RDRAGraph.md` の用語（モデル1・モデル2、関係タグ）をそのまま使う。
- シート名・列名・ファイル役割は `RDRASheet.md` に合わせる。

## 関連スキル（必要時のみ）

- [.claude/skills/rdra-relation-explain/SKILL.md](.claude/skills/rdra-relation-explain/SKILL.md) … 関連データの行ごとの説明
- [.claude/skills/rdra-business-system-qa/SKILL.md](.claude/skills/rdra-business-system-qa/SKILL.md) … 業務／システム問合せ
- [.claude/skills/rdra-impact-analysis/SKILL.md](.claude/skills/rdra-impact-analysis/SKILL.md) … 変更・追加の影響度分析
