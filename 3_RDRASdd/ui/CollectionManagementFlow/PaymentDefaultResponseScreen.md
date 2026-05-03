# UI仕様書: 支払い滞納対応画面

**画面日本語名**: 支払い滞納対応画面  
**画面英語名**: PaymentDefaultResponseScreen  
**所属BUC**: CollectionManagementFlow  

**目的**: 滞納情報を確認し、回収活動を記録・管理。滞納解消までの進捗を追跡。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| 請求ID | number | - | - |
| 会員名 | string | - | - |
| 滞納金額 | number | - | - |
| 滞納日数 | number | - | - |
| 対応内容 | string | ○ | ○ |

---

## API利用

**検索**: GET /api/v1/defaults?status={status}&days={daysOverdue}

**対応記録**: POST /api/v1/defaults/:invoiceId/response

**リクエスト**:
```json
{
  "responseContent": "string",
  "responseDate": "string (YYYY-MM-DD)"
}
```

---

## 操作フロー

```
START → [滞納情報検索]
  → [滞納一覧表示] → GET /api/v1/defaults
  → [滞納選択] → 詳細表示
  → [対応内容を入力]
  → [記録ボタン押下] → POST /:id/response
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → [進捗を追跡]
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 滞納情報を確認できること | 必須 |
| FR-002 | 回収活動を記録できること | 必須 |
| FR-003 | 滞納解消までの進捗を追跡できること | 必須 |

---

## 監査/権限制御

**権限**: 「事務担当者」

**監査ログ**: 滞納対応記録 → invoiceId, responseContent, タイムスタンプ

