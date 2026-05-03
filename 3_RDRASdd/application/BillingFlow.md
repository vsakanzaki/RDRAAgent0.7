# アプリケーション仕様書: 請求フロー

## 1. 概要

### BUC日本語名
請求フロー

### BUC英語名
BillingFlow

### 所属業務
請求業務

### 目的
計算済みの介護費用に基づいて請求書を発行し、介護会員への請求手続きを実施。請求状態を「請求中」に遷移させ、支払い催促から入金確認までの進捗を管理する。

---

## 2. アクターと画面

### 関連アクター
- **事務担当者**: 請求書を発行・送付し、支払い状況を管理

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| 介護費用計算画面 | 事務担当者 | 計算済み費用を確認 |
| 介護費用請求画面 | 事務担当者 | 請求書を発行・管理 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: 介護費用を請求する**

---

## 4. ユースケース詳細

### UC-001: 介護費用を請求する

**英語名**: IssueBillingInvoice

**目的**: 計算済みの費用に対して請求書を発行し、介護会員に請求

**事前条件**: 費用が「計算済み」状態である

**事後条件**: 請求が「請求中」状態に遷移。請求書が送付される

**入力**:
- 費用ID (required)
- 請求日 (required)
- 支払期限 (required)
- 請求先 (required)
- 手数料等の追加料金 (optional)

**参照/更新データ**:
- 費用: Update
- 請求: Create
- 介護会員情報: Read

**適用条件・ルール**: 請求・回収業務管理により、請求状態を「計算済み」→「請求中」に遷移

**例外系**:
- 費用が見つからない場合: エラー
- 計算ミスが検出された場合: 警告

---

## 5. API エンドポイント

### API-001: 請求書を発行する

**日本語名**: 請求発行

**HTTP メソッド・パス**: POST /api/v1/billing/issue

**リクエスト**:
```json
{
  "costId": "number",
  "billingDate": "string (YYYY-MM-DD)",
  "paymentDeadline": "string (YYYY-MM-DD)",
  "billedTo": "string",
  "additionalFees": "number (optional)"
}
```

**レスポンス (201 Created)**:
```json
{
  "invoiceId": "number",
  "costId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "billingAmount": "number",
  "billingDate": "string",
  "paymentDeadline": "string",
  "billedTo": "string",
  "billingState": "請求中",
  "issuedAt": "datetime"
}
```

---

### API-002: 請求情報を取得する

**日本語名**: 請求情報取得

**HTTP メソッド・パス**: GET /api/v1/billing/:invoiceId

**レスポンス (200 OK)**:
```json
{
  "invoiceId": "number",
  "costId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "billingAmount": "number",
  "billingDate": "string",
  "paymentDeadline": "string",
  "billedTo": "string",
  "billingState": "string",
  "issuedAt": "datetime"
}
```

---

### API-003: 請求一覧を取得する

**日本語名**: 請求一覧取得

**HTTP メソッド・パス**: GET /api/v1/billing

**クエリパラメータ**:
- careeMemberId (optional)
- billingState (optional) - 請求中, 支払い待機, 支払い完了
- month (optional, YYYY-MM)
- page (optional)
- limit (optional)

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "invoiceId": "number",
      "careeMemberId": "number",
      "careeMemberName": "string",
      "billingAmount": "number",
      "billingDate": "string",
      "billingState": "string",
      "issuedAt": "datetime"
    }
  ],
  "pagination": {...}
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| 介護費用請求画面 | costId | ○ | ○ (検索) |
| 〃 | careeMemberName | - | ○ (自動表示) |
| 〃 | billingAmount | - | ○ (自動表示) |
| 〃 | billingDate | ○ | YYYY-MM-DD |
| 〃 | paymentDeadline | ○ | YYYY-MM-DD |
| 〃 | billedTo | ○ | 1-100文字 |
| 〃 | additionalFees | - | 0以上の数値 |
| 〃 | totalAmount | - | ○ (自動計算・表示) |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| BillingManagement | IssueBillingInvoice | 請求発行 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class BillingController {
  POST /issue: IssueBillingInvoiceRequest → BillingInvoiceDTO
  GET /:invoiceId: → BillingInvoiceDetailDTO
  GET: (query params) → List<BillingInvoiceDTO>
}
```

---

## 9. UI 連携契約

| API | 画面 | 操作種別 | 説明 |
|-----|------|--------|------|
| POST /issue | 介護費用請求画面 | 登録 | 請求書を発行 |
| GET /:invoiceId | 介護費用請求画面 | 詳細表示 | 請求情報を表示 |
| GET (一覧) | 介護費用請求画面 | 一覧・検索 | 請求一覧を表示 |

---

## 10. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | BillingManagement | IssueBillingInvoice | POST /issue | 介護費用請求画面 | 計算済み→請求中 |

**完了**
