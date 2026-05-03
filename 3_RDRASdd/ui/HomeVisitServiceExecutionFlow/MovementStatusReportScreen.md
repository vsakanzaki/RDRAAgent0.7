# UI仕様書: 移動状況報告画面

**画面日本語名**: 移動状況報告画面  
**画面英語名**: MovementStatusReportScreen  
**所属BUC**: HomeVisitServiceExecutionFlow  

**目的**: サービススタッフが訪問予定時間に向けて移動中であることを報告・更新。現在地情報を管理。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スタッフID | number | - | - |
| スケジュールID | number | - | - |
| 報告日時 | datetime | ○ | ○ |
| 移動状態 | enum | ○ | ○ |
| 現在地 | string | - | ○ |

---

## API利用

**報告**: PUT /api/v1/schedules/:scheduleId/movement-report

**リクエスト**:
```json
{
  "reportedDateTime": "string",
  "movementStatus": "enum",
  "currentLocation": "string (optional)"
}
```

---

## 操作フロー

```
START → [報告フォーム表示]
  → [報告日時、移動状態、現在地を入力]
  → [報告ボタン押下] → PUT /:id/movement-report
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 移動状況を報告できること | 必須 |
| FR-002 | 現在地情報を管理できること | 推奨 |

---

## 監査/権限制御

**権限**: 「サービススタッフ」

