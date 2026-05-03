# アプリケーション仕様書: 回収管理フロー

## 1. 概要

### BUC日本語名
回収管理フロー

### BUC英語名
CollectionManagementFlow

### 所属業務
請求業務

### 目的
請求した介護費用の支払い状況を確認し、入金を管理。支払い滞納が発生した場合は回収活動を記録。事業所管理者が売上を把握・管理できる情報を提供する。

---

## 2. アクターと画面

### 関連アクター
- **事務担当者**: 支払い状況の確認と滞納対応を実施
- **事業所管理者**: 売上の把握・管理を実施

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| 支払い状況確認画面 | 事務担当者 | 支払い回収状況を確認・入金を記録 |
| 売上管理画面 | 事業所管理者 | 売上実績を把握・分析 |
| 支払い滞納対応画面 | 事務担当者 | 滞納情報を確認・回収活動を記録 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: 支払い状況を確認する**
2. **UC-002: 売上を把握・管理する**
3. **UC-003: 支払い滞納に対応する**

---

## 4. ユースケース詳細

### UC-001: 支払い状況を確認する

**英語名**: ConfirmPaymentStatus

**目的**: 決済システムとの連携により支払い回収状況を確認し、入金を記録

**事前条件**: 請求が「支払い待機」状態である

**事後条件**: 入金確認または滞納判定が実施される

**入力**: 照会期間 (optional)

**参照/更新データ**:
- 請求情報: Read
- 費用情報: Read

**適用条件・ルール**: 請求・回収業務管理により、支払い予定日から7日経過で催促開始

**例外系**:
- 決済システムとの連携に失敗した場合: エラー

---

### UC-002: 売上を把握・管理する

**英語名**: ManageRevenue

**目的**: 集計された売上情報を確認し、事業所別の売上実績を把握・分析

**事前条件**: 支払いが完了している

**事後条件**: 売上情報が事業所管理者に表示される

**入力**: 集計月 (required, YYYY-MM)

**参照/更新データ**:
- 請求情報: Read
- 費用情報: Read
- 事業所情報: Read

**適用条件・ルール**: 月末に売上を集計・確定

**例外系**:
- 該当月に売上がない場合: メッセージ表示

---

### UC-003: 支払い滞納に対応する

**英語名**: RespondToPaymentDelinquency

**目的**: 支払い滞納が発生した場合、回収活動を実施し、対応記録を残す

**事前条件**: 支払期限を過ぎても入金がない

**事後条件**: 滞納対応が記録される。状態が「支払い完了」またはさらに進行する

**入力**:
- 請求ID (required)
- 滞納金額 (required)
- 滞納日数 (required)
- 対応内容 (required)
- 対応日時 (required)

**参照/更新データ**:
- 請求情報: Update
- 費用情報: Read

**適用条件・ルール**: 
- 支払い予定日から7日経過で催促対応開始
- 30日以上滞納時は電話・文書による回収活動を実施

**例外系**:
- 請求が見つからない場合: エラー

---

## 5. API エンドポイント

### API-001: 支払い状況を確認する

**日本語名**: 支払い状況確認

**HTTP メソッド・パス**: GET /api/v1/payment-status

**クエリパラメータ**:
- careeMemberId (optional)
- month (optional, YYYY-MM)
- paymentStatus (optional) - 未払い, 支払い済み, 滞納

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "invoiceId": "number",
      "careeMemberId": "number",
      "careeMemberName": "string",
      "billingAmount": "number",
      "paymentDeadline": "string",
      "paymentStatus": "string",
      "paymentDate": "string (optional)",
      "delinquencyDays": "number (optional)"
    }
  ],
  "pagination": {...},
  "summary": {
    "totalBilled": "number",
    "totalPaid": "number",
    "totalUnpaid": "number"
  }
}
```

---

### API-002: 売上を把握・管理する

**日本語名**: 売上管理

**HTTP メソッド・パス**: GET /api/v1/revenue

**クエリパラメータ**:
- businessLocationId (optional)
- month (required, YYYY-MM)

**レスポンス (200 OK)**:
```json
{
  "summaryMonth": "string (YYYY-MM)",
  "businessLocations": [
    {
      "businessLocationId": "number",
      "businessLocationName": "string",
      "totalRevenue": "number",
      "collectedAmount": "number",
      "collectionRate": "number (percent)",
      "numberOfBillings": "number"
    }
  ],
  "totalCompany": {
    "totalRevenue": "number",
    "totalCollected": "number",
    "totalCollectionRate": "number"
  }
}
```

---

### API-003: 滞納対応を記録する

**日本語名**: 滞納対応記録

**HTTP メソッド・パス**: PATCH /api/v1/payment-status/:invoiceId/respond-delinquency

**リクエスト**:
```json
{
  "delinquencyAmount": "number",
  "delinquencyDays": "number",
  "responseContent": "string",
  "responseDateTime": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "invoiceId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "delinquencyAmount": "number",
  "responseContent": "string",
  "respondedAt": "datetime"
}
```

---

### API-004: 滞納情報一覧を取得する

**日本語名**: 滞納情報一覧

**HTTP メソッド・パス**: GET /api/v1/payment-status/delinquencies

**クエリパラメータ**:
- businessLocationId (optional)
- delinquencyDays (optional) - 7, 30, 60以上
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
      "delinquencyAmount": "number",
      "delinquencyDays": "number",
      "paymentDeadline": "string"
    }
  ],
  "pagination": {...},
  "summary": {
    "totalDelinquencies": "number",
    "totalDelinquencyAmount": "number"
  }
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| 支払い状況確認画面 | month | - | YYYY-MM (optional) |
| 〃 | paymentStatus | - | 列挙値 (optional) |
| 〃 | items (一覧) | - | ○ (表示) |
| 〃 | totalBilled | - | ○ (表示) |
| 〃 | totalPaid | - | ○ (表示) |
| 売上管理画面 | month | ○ | YYYY-MM |
| 〃 | businessLocationId | - | 列挙値 (optional) |
| 〃 | totalRevenue | - | ○ (表示) |
| 〃 | collectedAmount | - | ○ (表示) |
| 〃 | collectionRate | - | ○ (表示) |
| 支払い滞納対応画面 | invoiceId | ○ | ○ (検索) |
| 〃 | careeMemberName | - | ○ (表示) |
| 〃 | delinquencyAmount | - | ○ (表示) |
| 〃 | delinquencyDays | - | ○ (表示) |
| 〃 | responseContent | ○ | 1-500文字 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| BillingManagement | ConfirmPaymentStatus | 支払い状況確認 |
| BillingManagement | RespondToPaymentDelinquency | 滞納対応 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class CollectionManagementController {
  GET /payment-status: (query params) → List<PaymentStatusDTO>
  GET /revenue: (query params) → RevenueManagementDTO
  PATCH /payment-status/:invoiceId/respond-delinquency: RespondToDelinquencyRequest → DelinquencyResponseDTO
  GET /payment-status/delinquencies: (query params) → List<DelinquencyDTO>
}
```

---

## 9. UI 連携契約

| API | 画面 | 操作種別 | 説明 |
|-----|------|--------|------|
| GET /payment-status | 支払い状況確認画面 | 一覧・確認 | 支払い状況を表示 |
| PATCH /payment-status/:invoiceId/respond-delinquency | 支払い滞納対応画面 | 登録 | 滞納対応を記録 |
| GET /payment-status/delinquencies | 支払い滞納対応画面 | 一覧 | 滞納一覧を表示 |
| GET /revenue | 売上管理画面 | 確認 | 売上情報を表示・分析 |

---

## 10. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | BillingManagement | ConfirmPaymentStatus | GET /payment-status | 支払い状況確認画面 | 支払い待機→支払い完了 |
| UC-002 | BillingManagement | - | GET /revenue | 売上管理画面 | - |
| UC-003 | BillingManagement | RespondToPaymentDelinquency | PATCH /payment-status/:invoiceId/respond-delinquency | 支払い滞納対応画面 | 支払い待機→対応記録 |

**完了**
