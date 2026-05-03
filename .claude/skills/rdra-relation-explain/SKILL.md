---
name: rdra-relation-explain
description: >-
  Explains the contents of 1_RDRA/if/関連データ.txt by combining the RDRAGraph data
  structure (RDRA_Knowledge/.rdracore/RDRAGraph.md) with the RDRA metamodel
  (RDRA_Knowledge/.rdracore/RDRA.md). Use when the user asks to explain, summarize,
  interpret, walk through, or validate 関連データ.txt / RDRA 定義, or mentions
  関連データの内容説明、RDRA定義の説明、モデル1とモデル2、オブジェクトの関連、#child/#edge の意味.
  Not for business/system Q&A (use rdra-business-system-qa) or change-impact analysis (use rdra-impact-analysis).
---

# 関連データ.txt を RDRA 定義として説明する

`1_RDRA/if/関連データ.txt` は、RDRASheet（表形式）から生成された RDRAGraph 用の入力データ。
このスキルは、**データ構造（どう書かれているか）**と**メタモデル上の意味（何を表しているか）**の 2 つを突き合わせて、
関連データの各行を RDRA の用語で説明するためのもの。

## 正典

- データ構造（行の形式・タグ・結合ルール・シート別変換）: [RDRA_Knowledge/.rdracore/RDRAGraph.md](RDRA_Knowledge/.rdracore/RDRAGraph.md)
- メタモデル（モデル構成要素とモデル間のつながりの規則）: [RDRA_Knowledge/.rdracore/RDRA.md](RDRA_Knowledge/.rdracore/RDRA.md)

## 対象ファイル

- [1_RDRA/if/関連データ.txt](1_RDRA/if/関連データ.txt)

## このスキルの守備範囲（境界）

- **担当する**: 関連データ.txt の各行の構造説明、RDRA.md 規則への対応付け、変換表に無いモデル1・モデル2の組合せの指摘、重複ペアや親子構造のグラフ形式観点での不整合の指摘。
- **担当しない**: 業務／システム機能の問合せ回答 → `rdra-business-system-qa`。変更・追加の影響範囲・波及分析 → `rdra-impact-analysis`。孤立 UC・孤立情報・片側欠落などの静的網羅性チェック → `rdra-business-system-qa` の C 観点。

## 手順

関連データを説明するときは、以下の順で実施する。

1. **構造を読み込む**: まず `RDRAGraph.md` を Read し、1 行目＝システム名、2 行目以降＝ `関係種別 / モデル1 / モデル2 / オブジェクト結合文字列` の 4 カラム、`#child` / `#edge` / `#comment` / `#arrow` / `#stereotype` / `#attribute` の用途、および `@@` / `//` の結合ルールを確認する。
2. **意味を読み込む**: 続けて `RDRA.md` を Read し、各モデル（業務 / BUC / アクティビティ / UC / アクター / 外部システム / 情報 / 状態モデル / 状態 / コンテキスト / 条件 / バリエーション / 画面 / イベント / タイマー）の意味と、モデル間のつながりの規則を確認する。
3. **関連データを読む**: `1_RDRA/if/関連データ.txt` を Read し、1 行目のシステム名を出力タイトルに採用する。
4. **行ごとに分解する**: 各行について、以下を抽出する。
   - 関係種別（`#child` など）
   - モデル1、モデル2
   - `@@` で区切られた `オブジェクト1`・`オブジェクト2` のペア
   - `//` で区切られた複数ペア
5. **意味に翻訳する**: 抽出した `モデル1→モデル2` の組合せを、`RDRA.md` の「モデル間のつながりの規則」のどの規則に対応するかで説明する（例: `#child 業務 BUC` → 「業務は複数の BUC を配下にもつ」の具体化）。
6. **整合性を確認する**: `RDRAGraph.md` の各シート別変換表に照らし、その行がどのシートから生成され得るか（BUC / 情報 / 状態 / 条件 / バリエーション / アクター / 外部システム）を特定する。変換表に存在しないモデル1・モデル2 の組は、整合性の疑いとして指摘する。

## 関係種別ごとの読み解き指針（RDRAGraph.md に準拠）

- `#child`: 親→子の階層（例: アクター群→アクター、業務→BUC、コンテキスト→情報 / 状態モデル / 条件 / バリエーション、状態モデル→状態、BUC→アクティビティ）。
- `#edge`: 横方向の関連（例: アクティビティ↔UC、UC↔情報、UC↔条件、情報↔状態モデル、条件↔バリエーション など）。
- `#arrow`: 遷移・方向のある関連（主に状態遷移: 状態→UC、UC→状態、状態→状態、アクティビティ→アクティビティ）。
- `#comment`: 対象オブジェクトに紐づく説明文。
- `#stereotype`: 状態の開始／終了（`start` / `stop`）などのステレオタイプ。
- `#attribute`: 情報の属性列挙、バリエーションの値列挙。

## 出力テンプレート

関連データを説明するときは、次の構造で返す。

```
# <1 行目のシステム名> の関連データ説明

## 概要
<行数、扱われている関係種別の種類、登場する主要モデル>

## 行ごとの説明
- 行 N | #<関係種別> <モデル1> → <モデル2>
  - 規則: <RDRA.md のつながりの規則に対応する文>
  - ペア数: <// 区切りで数えたペア数>
  - 例: <最初の 1〜2 ペアを「オブジェクト1 / オブジェクト2」の形で>
  - 想定シート: <RDRAGraph.md のシート別変換表で該当する RDRASheet>

## 気づき・整合性の指摘（このスキルの範囲内）
- <重複ペア、モデル組合せが変換表に無い、親子がグラフ形式観点で揃っていない など。孤立 UC／片側欠落は rdra-business-system-qa の C 観点で扱う>
```

## 出力上の注意

- 用語は `RDRA.md` と `RDRAGraph.md` の日本語ラベルをそのまま使う（「業務」「BUC」「アクティビティ」「UC」「情報」「状態モデル」「コンテキスト」「条件」「バリエーション」「アクター群」「アクター」「外部システム群」「外部システム」）。
- `オブジェクト1@@オブジェクト2` の `@@` / `//` は説明本文では区切り記号として扱い、翻訳後の自然文には残さない。
- ファイル全体が大きい場合は、まず 1 行目と関係種別ごとの先頭行を読み、残りは関係種別単位でまとめて要約する（全ペアを逐語で書き出さない）。
- RDRAGraph.md の変換表に無いモデル1・モデル2 の組は、断定せずに「変換表に該当なし。元シートの確認が必要」と示す。

## 関連参照（必要時のみ）

- [.claude/skills/rdra-core-references/SKILL.md](.claude/skills/rdra-core-references/SKILL.md) … RDRA メタモデル / 関連データ形式 / RDRASheet の正典まとめ
- [.claude/skills/rdra-business-system-qa/SKILL.md](.claude/skills/rdra-business-system-qa/SKILL.md) … 業務／システム問合せ・網羅性
- [.claude/skills/rdra-impact-analysis/SKILL.md](.claude/skills/rdra-impact-analysis/SKILL.md) … 変更・追加の影響度分析
