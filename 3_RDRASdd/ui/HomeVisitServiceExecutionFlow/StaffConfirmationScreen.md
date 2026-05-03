# UI仕様書: スタッフ確定画面

**画面日本語名**: スタッフ確定画面  
**画面英語名**: StaffConfirmationScreen  
**所属BUC**: HomeVisitServiceExecutionFlow  

**目的**: 計画されたスケジュールを確認し、適切なスタッフを選択・確定。確定内容を確認。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スケジュールID | number | - | - |
| 会員名 | string | - | - |
| 確定日時 | datetime | - | - |
| 確定スタッフ | string | ○ | ○ |
| 確定日 | date | - | - |

---

## API利用

**確定**: POST /api/v1/schedules/:scheduleId/staff-confirm

**リクエスト**:
```json
{
  "staffId": "number",
  "confirmedDate": "string (YYYY-MM-DD)"
}
```

---

## 操作フロー

```
START → [スケジュール表示]
  → [スタッフを選択]
  → [確定ボタン押下] → POST /:id/staff-confirm
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | スタッフを選択できること | 必須 |
| FR-002 | 確定内容を確認できること | 必須 |

---

## 監査/権限制御

**権限**: 「スケジュール計画担当者」

