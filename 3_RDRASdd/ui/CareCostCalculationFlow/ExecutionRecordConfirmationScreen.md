# UI仕様書: 実施記録確認画面

**画面日本語名**: 実施記録確認画面  
**画面英語名**: ExecutionRecordConfirmationScreen  
**所属BUC**: CareCostCalculationFlow  

**目的**: 実施記録を検索・表示して詳細を確認。請求対象となる記録を整理。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| 記録ID | number | - | - |
| 会員名 | string | - | - |
| 実施日時 | datetime | - | - |
| 対応内容 | string | - | - |
| 請求対象 | enum | ○ | ○ |

---

## API利用

**検索**: GET /api/v1/execution-records?memberName={name}&month={month}&page={page}

**詳細**: GET /api/v1/execution-records/:recordId

---

## 操作フロー

```
START → [検索条件入力]
  → [検索] → GET /api/v1/execution-records
  → [記録一覧表示]
  → [記録選択] → GET /:recordId
  → [詳細表示]
  → [請求対象確認]
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 実施記録を検索できること | 必須 |
| FR-002 | 詳細を確認できること | 必須 |
| FR-003 | 請求対象を整理できること | 必須 |

---

## 監査/権限制御

**権限**: 「事務担当者」

