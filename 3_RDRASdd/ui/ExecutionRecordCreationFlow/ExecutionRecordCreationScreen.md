# UI仕様書: 実施記録作成画面

**画面日本語名**: 実施記録作成画面  
**画面英語名**: ExecutionRecordCreationScreen  
**所属BUC**: ExecutionRecordCreationFlow  

**目的**: サービススタッフが訪問介護の実施内容・時間・対応内容を詳細に記録。複数項目を入力・修正可能。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スケジュールID | number | - | - |
| 会員名 | string | - | - |
| 実施日時 | datetime | ○ | ○ |
| 対応内容 | string | ○ | ○ |
| 提供時間 | number | ○ | ○ |

---

## API利用

**作成**: POST /api/v1/execution-records/create

**リクエスト**:
```json
{
  "scheduleId": "number",
  "executionDateTime": "string",
  "serviceContent": "string",
  "providedTime": "number"
}
```

---

## 操作フロー

```
START → [作成フォーム表示]
  → [実施日時、対応内容、提供時間を入力]
  → [作成ボタン押下] → POST /create
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 実施記録を詳細に記録できること | 必須 |
| FR-002 | 複数項目を修正できること | 必須 |

---

## 監査/権限制御

**権限**: 「サービススタッフ」

