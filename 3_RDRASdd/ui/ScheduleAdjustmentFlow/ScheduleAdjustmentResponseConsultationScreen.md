# UI仕様書: スケジュール調整対応協議画面

**画面日本語名**: スケジュール調整対応協議画面  
**画面英語名**: ScheduleAdjustmentResponseConsultationScreen  
**所属BUC**: ScheduleAdjustmentFlow  

**目的**: 調整困難な状況を記録し、介護会員への説明内容を作成して対応方法を協議。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スケジュールID | number | - | - |
| 会員名 | string | - | - |
| 調整困難な理由 | string | ○ | ○ |
| 説明内容 | string | ○ | ○ |
| 対応方法 | enum | ○ | ○ |

---

## API利用

**協議記録**: POST /api/v1/schedules/:scheduleId/consultation

**リクエスト**:
```json
{
  "difficultyReason": "string",
  "explanation": "string",
  "responseMethod": "enum"
}
```

---

## 操作フロー

```
START → [協議フォーム表示]
  → [理由、説明、対応方法を入力]
  → [記録ボタン押下] → POST /:id/consultation
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 困難状況を記録できること | 必須 |
| FR-002 | 対応方法を決定できること | 必須 |

---

## 監査/権限制御

**権限**: 「スケジュール計画担当者」

