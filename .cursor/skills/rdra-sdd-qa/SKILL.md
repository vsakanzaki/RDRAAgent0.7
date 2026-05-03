---
name: rdra-sdd-qa
description: >-
  Answers inquiries about implementation-oriented specifications in 3_RDRASdd by reading
  domain/application/ui artifacts and tracing required evidence to 2_RDRASpec when needed.
  Use when the user asks about 3_RDRASdd、SDD、ドメイン仕様、アプリケーション仕様、UI仕様、API、
  画面仕様、実装AI向け仕様、レイヤー接続、仕様の根拠確認.
  Not for explaining 1_RDRA/if/関連データ.txt line-by-line (use rdra-relation-explain) or
  change-impact analysis on RDRA graph objects (use rdra-impact-analysis).
---

# 3_RDRASdd 実装仕様への問合せ回答

`3_RDRASdd` の成果物（domain/application/ui）に対する問合せへ回答する。
この成果物は `RDRA_Knowledge/_3_RDRASdd/` の生成指示に基づいて作成され、生成時に
`1_RDRA/if/関連データ.txt` と `2_RDRASpec/` を参照している前提で扱う。

## 事実ソース（正）

- 成果物（一次回答の主対象）
  - [3_RDRASdd/domain/](3_RDRASdd/domain/) ... コンテキスト別ドメイン仕様
  - [3_RDRASdd/application/](3_RDRASdd/application/) ... BUC別アプリケーション仕様
  - [3_RDRASdd/ui/](3_RDRASdd/ui/) ... BUC/画面別UI仕様
  - [3_RDRASdd/_callgraph/callgraph_data.json](3_RDRASdd/_callgraph/callgraph_data.json) ... 仕様間参照の補助情報
- 上流仕様（根拠確認・不整合確認・不足説明で使用）
  - [2_RDRASpec/論理データモデル.md](2_RDRASpec/論理データモデル.md)
  - [2_RDRASpec/ビジネスルール.md](2_RDRASpec/ビジネスルール.md)
  - [2_RDRASpec/画面照会.json](2_RDRASpec/画面照会.json)
  - [2_RDRASpec/phase1/](2_RDRASpec/phase1/)
- 生成指示（作成意図の確認）
  - [RDRA_Knowledge/_3_RDRASdd/31_Create_Domain.md](RDRA_Knowledge/_3_RDRASdd/31_Create_Domain.md)
  - [RDRA_Knowledge/_3_RDRASdd/32_Create_Application.md](RDRA_Knowledge/_3_RDRASdd/32_Create_Application.md)
  - [RDRA_Knowledge/_3_RDRASdd/33_Create_UI.md](RDRA_Knowledge/_3_RDRASdd/33_Create_UI.md)

## 回答方針

- 通常回答では `3_RDRASdd` を正の成果物として読む。
- 仕様の根拠、不整合、未定義項目の説明が必要な場合のみ `2_RDRASpec` へ遡る。
- 断定できない事項は「要確認」と明示し、推測で仕様を確定しない。

## 問合せ分類

### A. Domain 問合せ

- 対象: `3_RDRASdd/domain/*.md`
- 典型質問: コンテキスト境界、エンティティ、状態遷移、不変条件、ドメインサービス
- 読み方:
  - 章「エンティティ定義」「状態モデル」「ビジネスルール」「Application 連携契約」を優先
  - 必要に応じて `2_RDRASpec/論理データモデル.md` と `2_RDRASpec/ビジネスルール.md` で根拠確認

### B. Application 問合せ

- 対象: `3_RDRASdd/application/*.md`
- 典型質問: UC 詳細、API エンドポイント、DTO、例外、Domain 呼び出し契約
- 読み方:
  - 章「UC 詳細」「API エンドポイント」「ドメイン層呼び出し契約」「UI 連携契約」を優先
  - API や DTO の根拠は `2_RDRASpec/論理データモデル.md` と `2_RDRASpec/画面照会.json` で確認

### C. UI 問合せ

- 対象: `3_RDRASdd/ui/<BUC>/*.md`
- 典型質問: 画面項目、コンポーネント、操作フロー、画面状態、エラー表示、利用API
- 読み方:
  - 章「表示/入力項目」「API 利用」「画面状態」「バリデーション」「エラー表示」を優先
  - API の正当性は対応する `3_RDRASdd/application/*.md` を必ず照合
  - 画面の業務文脈は `2_RDRASpec/画面照会.json` で補強

### D. レイヤー横断問合せ

- 対象: Domain - Application - UI の接続
- 典型質問: 「この画面操作はどの UC/API/ドメインサービスに繋がるか」
- 追跡手順:
  1. UI 仕様から操作・API を抽出
  2. Application 仕様で UC/API/DTO/例外を確認
  3. Domain 仕様で状態遷移・サービス契約を確認
  4. 必要時に `2_RDRASpec` へ遡って根拠を示す

## 手順

1. 問合せを A/B/C/D に分類する（混在時は複数分類）。
2. まず `3_RDRASdd` の該当ファイルから事実を抽出する。
3. 根拠や整合性が論点なら `2_RDRASpec` を参照して裏取りする。
4. 不足・矛盾・未定義は「要確認」として具体的に列挙する。
5. 回答は「結論 → 根拠（参照ファイル） → 要確認事項」の順で示す。

## 出力テンプレート

```markdown
# 3_RDRASdd 問合せ回答: <要約>

## 結論
- <質問への直接回答>

## 根拠（3_RDRASdd）
- <ファイル>: <該当章/要点>

## 根拠（2_RDRASpec, 必要時）
- <ファイル>: <該当要点>

## レイヤー接続（横断時のみ）
- UI: <画面/操作>
- Application: <UC/API/DTO>
- Domain: <サービス/状態>

## 要確認
- <不足している仕様、断定できない理由、確認先>
```

## 境界（このスキルが担当しないこと）

- `1_RDRA/if/関連データ.txt` の行単位解説は `rdra-relation-explain` を使う。
- RDRA オブジェクト変更の波及分析は `rdra-impact-analysis` を使う。
- 業務／システム一般問合せ（関連データ中心）は `rdra-business-system-qa` を使う。

## 関連スキル

- [.cursor/skills/rdra-core-references/SKILL.md](.cursor/skills/rdra-core-references/SKILL.md)
- [.cursor/skills/rdra-relation-explain/SKILL.md](.cursor/skills/rdra-relation-explain/SKILL.md)
- [.cursor/skills/rdra-business-system-qa/SKILL.md](.cursor/skills/rdra-business-system-qa/SKILL.md)
- [.cursor/skills/rdra-impact-analysis/SKILL.md](.cursor/skills/rdra-impact-analysis/SKILL.md)
