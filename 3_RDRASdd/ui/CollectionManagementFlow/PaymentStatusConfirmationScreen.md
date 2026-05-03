# UI仕様書: 支払い状況確認画面

**画面日本語名**: 支払い状況確認画面  
**画面英語名**: PaymentStatusConfirmationScreen  
**所属BUC**: CollectionManagementFlow  

**目的**: 決済システムとの連携により支払い回収状況を確認。売上集計内容を一覧で確認。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| 請求ID | number | - | - |
| 会員名 | string | - | - |
| 請求金額 | number | - | - |
| 支払い状況 | enum | - | - |
| 支払い日 | date | - | - |

---

## API利用

**検索**: GET /api/v1/collections?month={month}&status={status}&page={page}

**詳細**: GET /api/v1/collections/:invoiceId

---

## 操作フロー

```
START → [検索条件入力（月、状況）]
  → [検索] → GET /api/v1/collections
  → [支払い状況一覧表示]
  → [詳細確認]
  → [売上集計表示]
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 支払い回収状況を確認できること | 必須 |
| FR-002 | 売上集計内容を一覧で確認できること | 必須 |

---

## 監査/権限制御

**権限**: 「事務担当者」

