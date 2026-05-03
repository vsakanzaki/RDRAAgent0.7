---
name: rdra-impact-analysis
description: >-
  Analyzes impact of changing or adding RDRA objects using 1_RDRA/if/関連データ.txt as
  the graph source: traverses object links (#child/#edge/#arrow), emphasizes propagation
  via 情報 to other UCs, and uses RDRA.md model rules to find related objects when adding
  new ones. Use when the user asks for 影響度分析、変更影響、追加時の影響範囲、関連データからの影響、
  UCへの波及、情報を経由した影響.
  Not for static coverage checks like isolated UC (use rdra-business-system-qa C) or line-by-line graph explanation (use rdra-relation-explain).
---

# オブジェクトの変更・追加にともなう影響度分析

RDRA のオブジェクト（業務・BUC・アクティビティ・UC・情報・状態・画面などの**名前付きインスタンス**）を変更または追加するとき、**どの UC・画面・情報・状態・条件に波及するか**を把握するためのスキル。

## データソース（正）

- **グラフの事実**: [1_RDRA/if/関連データ.txt](1_RDRA/if/関連データ.txt) … 行の意味・パースは [RDRA_Knowledge/.rdracore/RDRAGraph.md](RDRA_Knowledge/.rdracore/RDRAGraph.md) に従う。
- **メタモデル上の許容関係**: [RDRA_Knowledge/.rdracore/RDRA.md](RDRA_Knowledge/.rdracore/RDRA.md) … 「モデル間のつながりの規則」。追加オブジェクトが**どのモデルに属するか**を決め、**どのモデル同士の辺が成立しうるか**を判断する。

## 前提（このプロジェクトの考え方）

- 影響範囲は **関連データ上の辺**（`#child` / `#edge` / `#arrow` および `#attribute` / `#comment` が付くペア）を辿って列挙する。
- **情報を経由した波及**は特に重要。`RDRA.md` にあるとおり UC は情報を操作し、情報同士は構造化のためにつながる。したがって **ある情報オブジェクトの変更は、それに #edge する UC や、情報→情報の連鎖で間接的に結ばれた UC まで**広がりうる。
- **オブジェクトを追加する**場合は、(1) その名前が **どのモデル**のインスタンスかを明示し、(2) `RDRA.md` の規則と `RDRAGraph.md` のシート別変換に照らして **接続しうる相手モデル**を決め、(3) 既存の関連データに **どの関係種別の行にどの `オブジェクト1@@オブジェクト2` を足すと一貫するか**（または新規行が必要か）を示す。

## このスキルの守備範囲（境界）

- **担当する**: オブジェクトの変更・追加にともなう波及（`#child` / `#edge` / `#arrow` の辿り、情報をハブとした BFS、メタモデルからの接続候補列挙、影響度の高/中/低の整理）。
- **担当しない**: 静的な網羅性チェック（孤立 UC・孤立情報・片側欠落など）→ `rdra-business-system-qa` の C 観点。関連データの行ごとの解説 → `rdra-relation-explain`。

## 手順

### 1. 入力を確定する

ユーザーから次を得る（曖昧なら確認する）。

- **対象オブジェクト名**（例: `会員マスタ`、`介護費用を計算する`）
- **操作種別**: 変更（属性・意味・削除） / 追加
- 分かれば **モデル**（情報 / UC / 画面 など）。不明なら関連データの出現行から推定し、推定であることを明記する。

### 2. 関連データを読み、出現箇所を洗い出す

`1_RDRA/if/関連データ.txt` を Read し、対象名が **D 列の結合文字列**（`@@` の左右、`//` で区切られた各ペア）に含まれる行をすべて列挙する。

各行について記録する項目:

- 関係種別（A 列）
- モデル1・モデル2（B・C 列）
- 当該オブジェクトが **モデル1 側かモデル2 側か**（名前照合）

### 3. グラフ探索で「直接影響」を分類する

関係種別ごとに、ユーザー向けの影響の読みを付ける（`RDRAGraph.md` の語義に準拠）。

- `#child`: 親子・配下構造の変更。親または子の片方を変えると、ツリー表示・スコープの解釈に影響。
- `#edge`: 横断リンク。UC↔情報、UC↔画面、情報↔情報、条件↔バリエーション等。**同じ行に並ぶ他のペア**も同一「モデル1・モデル2」上の近傍として参照。
- `#arrow`: 状態遷移・方向付き。状態や UC の順序・到達可能性の解釈に影響。
- `#attribute` / `#comment`: 属性列・説明文の変更。下流の仕様書・画面項目・検証ルールに影響しやすい。

### 4. 「情報経由」の二次・三次波及を追う

対象が **情報**、または **UC / 状態 / 条件** など情報に辺があるモデルなら、次を実施する。

1. 対象から `#edge` で **直接つながる情報オブジェクト**（`UC	情報` の D 列、`情報	情報` の両側、`情報	状態モデル` 等）を列挙。
2. それらの情報を起点に、`情報	情報` の `#edge` を **実務上は深さ制限 5〜10** 程度で BFS し、到達した情報を記録。
3. 到達した各情報について、`UC	情報` や `アクティビティ	UC` など **情報の向こう側の UC** を逆引きし、「**この UC 群が影響候補**」としてまとめる。

説明では **「情報をハブとした波及」** と明示する。

### 5. 追加時はメタモデルで「接続候補」を列挙する

**追加**の場合、次を出力に含める。

- 追加オブジェクトの **モデル名**（`RDRA.md` の見出し語に合わせる）
- `RDRA.md` の「モデル間のつながりの規則」から、**そのモデルが直接つながりうるモデル**の一覧
- `RDRAGraph.md` の変換表から、**関連データに現れうる行パターン**
- 既存オブジェクト名のうち、**最初に接続を検討すべき近傍**（関連データ上の共起から推測できるもの）

断定が危うい場合は **要シート確認** とし、[RDRA_Knowledge/.rdracore/RDRASheet.md](RDRA_Knowledge/.rdracore/RDRASheet.md) を参照するよう書く。

### 6. 影響度の表現（推奨スケール）

- **高**: ハブ的（次数大、情報連鎖の根に近い）、または削除・改名で多数の D 列が無効化される。
- **中**: 同一モデル1・モデル2行の一部ペア、または `#comment` / `#attribute` のみの波及。
- **低**: 説明のみ、孤立に近いが参照は残る。

行数・ペア数を数えて根拠を一言添える。

## 出力テンプレート

```markdown
# 影響度分析: <対象オブジェクト>（<変更|追加>）

## 前提
- 根拠データ: `1_RDRA/if/関連データ.txt`
- 対象の推定モデル: <モデル>（根拠: …）

## 関連データ上の出現
- 該当行の要約: …
- 関係種別の内訳: …

## 直接影響（辺の種類別）
- #child: …
- #edge: …
- #arrow: …
- #attribute / #comment: …

## 情報を経由した波及（該当時）
- 起点情報: …
- 情報→情報の到達: …
- 影響候補 UC（および画面・イベント）: …

## 追加時の接続候補（追加の場合）
- メタモデル上つながりうるモデル: …
- 関連データに追加しうる行パターン: …
- 既存オブジェクトとの推奨接続: …

## 総合評価
- 影響度: 高 / 中 / 低（理由: …）
- 確認すべき成果物: 2_RDRASpec の該当ファイル、シート定義 等
```

## 関連スキル（任意）

- [.cursor/skills/rdra-core-references/SKILL.md](.cursor/skills/rdra-core-references/SKILL.md) … RDRA メタモデル / 関連データ形式 / RDRASheet の正典まとめ
- [.cursor/skills/rdra-relation-explain/SKILL.md](.cursor/skills/rdra-relation-explain/SKILL.md) … 関連データの読み解き
- [.cursor/skills/rdra-business-system-qa/SKILL.md](.cursor/skills/rdra-business-system-qa/SKILL.md) … 網羅性・静的整合性
