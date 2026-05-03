# UI仕様書: 訪問介護実施画面

**画面日本語名**: 訪問介護実施画面  
**画面英語名**: HomeCareServiceExecutionScreen  
**所属BUC**: HomeVisitServiceExecutionFlow  

**目的**: サービススタッフが計画されたスケジュールを確認し、サービス実施内容をリアルタイムで記録・更新。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スケジュールID | number | - | - |
| 会員名 | string | - | - |
| スタッフ名 | string | - | - |
| 実施内容 | string | ○ | ○ |
| 提供時間 | number | ○ | ○ |

---

## API利用

**実施記録**: PUT /api/v1/schedules/:scheduleId/service-execution

**リクエスト**:
```json
{
  "serviceContent": "string",
  "providedTime": "number"
}
```

---

## 操作フロー

```
START → [スケジュール表示]
  → [実施内容、提供時間を入力]
  → [記録ボタン押下] → PUT /:id/service-execution
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | サービス内容をリアルタイムで記録できること | 必須 |
| FR-002 | 提供時間を記録できること | 必須 |

---

## 監査/権限制御

**権限**: 「サービススタッフ」

