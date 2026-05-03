# UI仕様書: スケジュール要望確認画面

**画面日本語名**: スケジュール要望確認画面  
**画面英語名**: ScheduleRequestConfirmationScreen  
**所属BUC**: SchedulePlanningFlow  

**目的**: 介護会員のスケジュール要望を検索・表示して詳細を確認。スケジュール計画の基礎情報。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スケジュールID | number | - | - |
| 会員名 | string | - | - |
| 要望日時 | datetime | - | - |
| 訪問先 | string | - | - |
| 要望内容 | string | - | - |

---

## API利用

**検索**: GET /api/v1/schedules?memberStatus={status}&page={page}&limit={limit}

**詳細**: GET /api/v1/schedules/:scheduleId

---

## 操作フロー

```
START → [要望検索] → GET /api/v1/schedules
  → [要望一覧表示]
  → [要望選択] → GET /:scheduleId
  → [詳細表示]
  → [計画作成へ遷移]
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 要望を検索できること | 必須 |
| FR-002 | 詳細を表示できること | 必須 |

---

## 監査/権限制御

**権限**: 「スケジュール計画担当者」

