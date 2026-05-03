# アプリケーション仕様書: スケジュール調整フロー

## 1. 概要

### BUC日本語名
スケジュール調整フロー

### BUC英語名
ScheduleAdjustmentFlow

### 所属業務
スケジュール管理業務

### 目的
介護会員からのスケジュール変更要望に対して、調整可能性を判定し、調整可能な場合は迅速に対応する。調整困難な場合は説明内容を協議して対応方法を決定する。

---

## 2. アクターと画面

### 関連アクター
- **スケジュール計画担当者**: スケジュール変更要望を受け付け、調整を実施

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| スケジュール変更要望受付画面 | スケジュール計画担当者 | 変更要望を受け付け |
| スケジュール調整画面 | スケジュール計画担当者 | スケジュールを調整 |
| スケジュール調整対応協議画面 | スケジュール計画担当者 | 調整困難時に対応方法を協議 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: スケジュール変更要望を受け付ける**
2. **UC-002: スケジュールを調整する**
3. **UC-003: スケジュール調整困難時の対応を行う**

---

## 4. ユースケース詳細

### UC-001: スケジュール変更要望を受け付ける

**英語名**: ReceiveScheduleChangeRequest

**目的**: 介護会員からのスケジュール変更要望を受け付け、記録

**事前条件**: 会員のスケジュールが確定している

**事後条件**: 変更要望が記録され、調整可能性判定が実行

**入力**:
- スケジュールID (required)
- 変更要望内容 (required)
- 変更希望日時 (required)

**参照/更新データ**:
- スケジュール情報: Read/Update

**適用条件・ルール**: スケジュール調整可能性判定により、計画段階・確定段階・確定翌日以降で対応を分ける

**例外系**:
- スケジュールが見つからない場合: エラー

---

### UC-002: スケジュールを調整する

**英語名**: AdjustSchedule

**目的**: 調整可能な場合、スケジュールを調整して対応

**事前条件**: 変更要望が「計画段階」または「確定段階（限定的）」である

**事後条件**: スケジュールが調整され、会員に通知される

**入力**:
- スケジュールID (required)
- 調整案 (required)
- 調整結果 (required) - enum: 承認, 継続協議, 不可

**参照/更新データ**:
- スケジュール情報: Update

**適用条件・ルール**: スケジュール調整可能性判定により、スタッフ配置状況を確認した上で調整

**例外系**:
- スケジュール確定から1日以上経過している場合: 調整困難時対応に遷移

---

### UC-003: スケジュール調整困難時の対応を行う

**英語名**: RespondToScheduleAdjustmentDifficulty

**目的**: 調整困難な場合、理由を記録し、会員への説明内容を協議して対応方法を決定

**事前条件**: 変更要望が「確定翌日以降」または「調整困難」である

**事後条件**: 対応方法が決定され、会員に通知される

**入力**:
- スケジュールID (required)
- 調整困難な理由 (required)
- 説明内容 (required)
- 対応方法 (required) - enum: 実行, 延期, 中止

**参照/更新データ**:
- スケジュール情報: Update

**適用条件・ルール**: 会員要望スケジュール対応により、代案を提案

**例外系**:
- スケジュールが見つからない場合: エラー

---

## 5. API エンドポイント

### API-001: スケジュール変更要望を受け付ける

**日本語名**: スケジュール変更要望受付

**HTTP メソッド・パス**: POST /api/v1/schedules/:scheduleId/change-request

**リクエスト**:
```json
{
  "changeRequest": "string",
  "requestedDateTime": "string (YYYY-MM-DD HH:MM)",
  "requestDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (201 Created)**:
```json
{
  "scheduleId": "number",
  "careeMemberId": "number",
  "changeRequest": "string",
  "requestedDateTime": "string",
  "requestDate": "string",
  "adjustmentPossibility": "enum (可能|限定的|困難)",
  "createdAt": "datetime"
}
```

---

### API-002: スケジュールを調整する

**日本語名**: スケジュール調整

**HTTP メソッド・パス**: POST /api/v1/schedules/:scheduleId/adjust

**リクエスト**:
```json
{
  "adjustmentProposal": "string",
  "adjustmentResult": "enum (承認|継続協議|不可)",
  "adjustmentDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "scheduleId": "number",
  "careeMemberId": "number",
  "adjustmentProposal": "string",
  "adjustmentResult": "string",
  "scheduleState": "確定",
  "adjustedAt": "datetime"
}
```

---

### API-003: スケジュール調整困難時対応を行う

**日本語名**: スケジュール調整困難対応

**HTTP メソッド・パス**: POST /api/v1/schedules/:scheduleId/adjustment-difficulty-response

**リクエスト**:
```json
{
  "difficultyReason": "string",
  "explanation": "string",
  "responseMethod": "enum (実行|延期|中止)",
  "responseDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "scheduleId": "number",
  "careeMemberId": "number",
  "difficultyReason": "string",
  "explanation": "string",
  "responseMethod": "string",
  "respondedAt": "datetime"
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| スケジュール変更要望受付画面 | scheduleId | - | ○ (検索) |
| 〃 | changeRequest | ○ | 1-500文字 |
| 〃 | requestedDateTime | ○ | YYYY-MM-DD HH:MM |
| 〃 | requestDate | ○ | YYYY-MM-DD |
| スケジュール調整画面 | scheduleId | - | ○ (検索) |
| 〃 | currentPlanDateTime | - | ○ (表示) |
| 〃 | adjustmentProposal | ○ | 1-500文字 |
| 〃 | adjustmentResult | ○ | 列挙値 |
| スケジュール調整対応協議画面 | scheduleId | - | ○ (検索) |
| 〃 | difficultyReason | ○ | 1-500文字 |
| 〃 | explanation | ○ | 1-500文字 |
| 〃 | responseMethod | ○ | 列挙値 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| ScheduleManagement | HandleScheduleChangeRequest | 変更要望受け付け |
| ScheduleManagement | AdjustSchedule | スケジュール調整 |
| ScheduleManagement | RespondToAdjustmentDifficulty | 調整困難時対応 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class ScheduleAdjustmentController {
  POST /:id/change-request: ReceiveScheduleChangeRequestRequest → ScheduleAdjustmentDTO
  POST /:id/adjust: AdjustScheduleRequest → ScheduleAdjustmentDTO
  POST /:id/adjustment-difficulty-response: RespondToAdjustmentDifficultyRequest → ScheduleAdjustmentDTO
}
```

---

## 9. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 
|----|---------|----------------|----------------|--------|
| UC-001 | ScheduleManagement | HandleScheduleChangeRequest | POST /:id/change-request | スケジュール変更要望受付画面 |
| UC-002 | ScheduleManagement | AdjustSchedule | POST /:id/adjust | スケジュール調整画面 |
| UC-003 | ScheduleManagement | RespondToAdjustmentDifficulty | POST /:id/adjustment-difficulty-response | スケジュール調整対応協議画面 |

**完了**
