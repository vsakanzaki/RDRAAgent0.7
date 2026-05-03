# UI仕様書: スケジュール変更要望受付画面

**画面日本語名**: スケジュール変更要望受付画面  
**画面英語名**: ScheduleChangeRequestReceptionScreen  
**所属BUC**: ScheduleAdjustmentFlow  

**目的**: 介護会員からのスケジュール変更要望を受け付け、変更内容を詳細に記録。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スケジュールID | number | - | - |
| 会員名 | string | - | - |
| 変更要望内容 | string | ○ | ○ |
| 変更希望日時 | datetime | ○ | ○ |
| 受付日 | date | - | - |

---

## API利用

**受付**: POST /api/v1/schedules/:scheduleId/change-request

**リクエスト**:
```json
{
  "changeContent": "string",
  "desiredDateTime": "string"
}
```

---

## 操作フロー

```
START → [受付フォーム表示]
  → [変更内容、希望日時を入力]
  → [受付ボタン押下] → POST /:id/change-request
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 変更要望を受け付けられること | 必須 |
| FR-002 | 内容を詳細に記録できること | 必須 |

---

## 監査/権限制御

**権限**: 「スケジュール計画担当者」

