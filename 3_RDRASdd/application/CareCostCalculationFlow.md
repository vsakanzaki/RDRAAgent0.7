# アプリケーション仕様書: 介護費用計算フロー

## 1. 概要

### BUC日本語名
介護費用計算フロー

### BUC英語名
CareCostCalculationFlow

### 所属業務
請求業務

### 目的
月別の実施記録に基づいて、料金契約に応じた介護費用を正確に計算し、請求・回収業務の基盤となる費用情報を確定する。

---

## 2. アクターと画面

### 関連アクター
- **事務担当者**: 実施記録の確認と費用計算を実施

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| 実施記録確認画面 | 事務担当者 | 当月の実施記録を確認 |
| 介護費用計算画面 | 事務担当者 | 費用を計算・確認・修正・承認 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: 実施記録を確認する**
2. **UC-002: 介護費用を計算する**

---

## 4. ユースケース詳細

### UC-001: 実施記録を確認する

**英語名**: ConfirmExecutionRecords

**目的**: 当月分の実施記録を集計し、確認する

**事前条件**: 実施記録が登録されている

**事後条件**: 当月分の記録が整理されて表示される

**入力**: 計算月 (required, YYYY-MM)

**参照/更新データ**:
- 実施記録: Read
- 介護会員情報: Read

**適用条件・ルール**: 月別費用計算ルールにより、月ごとの費用を計算

**例外系**:
- 該当月に記録がない場合: メッセージ表示

---

### UC-002: 介護費用を計算する

**英語名**: CalculateCost

**目的**: 実施記録に基づいて月別の介護費用を計算し、料金契約ごとに請求金額を確定

**事前条件**: 当月分の実施記録が整理されている

**事後条件**: 費用が「計算済み」状態で記録される

**入力**:
- 介護会員ID (required)
- 計算月 (required)
- 料金区分 (required) - enum: 月額料金, 従量制, 混合料金
- 契約金額 (required)
- 時間単価 (optional, 従量制の場合)
- 基本時間 (optional, 混合料金の場合)

**参照/更新データ**:
- 費用: Create
- 実施記録: Read
- 介護会員情報: Read

**適用条件・ルール**:
- 月額料金: 月額契約料金 × 契約月数
- 従量制: 実施時間 × 時間単価
- 混合料金: 基本月額 + max(0, 実施時間 - 基本時間) × 追加単価

**例外系**:
- 契約情報が見つからない場合: エラー
- 計算結果が異常な値の場合: 警告

---

## 5. API エンドポイント

### API-001: 実施記録を確認する（参照系）

**日本語名**: 実施記録確認

**HTTP メソッド・パス**: GET /api/v1/execution-records

**クエリパラメータ**:
- month (required, YYYY-MM)
- page (optional)
- limit (optional)

**レスポンス (200 OK)**:
```json
{
  "targetMonth": "string (YYYY-MM)",
  "items": [
    {
      "executionRecordId": "number",
      "careeMemberId": "number",
      "careeMemberName": "string",
      "executionDateTime": "string",
      "serviceContent": "string",
      "providedHours": "number",
      "executionState": "string"
    }
  ],
  "pagination": {...},
  "summary": {
    "totalRecords": "number",
    "totalHours": "number"
  }
}
```

---

### API-002: 介護費用を計算する

**日本語名**: 介護費用計算

**HTTP メソッド・パス**: POST /api/v1/costs/calculate

**リクエスト**:
```json
{
  "careeMemberId": "number",
  "targetMonth": "string (YYYY-MM)",
  "billingType": "enum (月額料金|従量制|混合料金)",
  "contractAmount": "number",
  "hourlyRate": "number (optional, 従量制の場合)",
  "baseHours": "number (optional, 混合料金の場合)",
  "additionalRate": "number (optional, 混合料金の場合)"
}
```

**レスポンス (201 Created)**:
```json
{
  "costId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "targetMonth": "string",
  "billingType": "string",
  "calculatedAmount": "number",
  "executionHours": "number",
  "calculationDetails": {
    "baseAmount": "number (optional)",
    "additionalAmount": "number (optional)"
  },
  "billingState": "計算済み",
  "calculatedAt": "datetime"
}
```

---

### API-003: 費用計算結果を確認・修正する

**日本語名**: 費用計算確認・修正

**HTTP メソッド・パス**: GET /api/v1/costs/:costId

**レスポンス (200 OK)**:
```json
{
  "costId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "targetMonth": "string",
  "billingType": "string",
  "calculatedAmount": "number",
  "executionHours": "number",
  "billingState": "string",
  "calculatedAt": "datetime"
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| 実施記録確認画面 | targetMonth | ○ | YYYY-MM |
| 〃 | items (一覧) | - | ○ (表示) |
| 〃 | totalRecords | - | ○ (表示) |
| 〃 | totalHours | - | ○ (表示) |
| 介護費用計算画面 | careeMemberId | ○ | ○ (検索) |
| 〃 | careeMemberName | - | ○ (自動表示) |
| 〃 | targetMonth | ○ | YYYY-MM |
| 〃 | billingType | ○ | 列挙値 |
| 〃 | contractAmount | ○ | 0以上の数値 |
| 〃 | hourlyRate | - | 条件付き必須（従量制） |
| 〃 | baseHours | - | 条件付き必須（混合料金） |
| 〃 | calculatedAmount | - | ○ (自動計算・表示) |
| 〃 | executionHours | - | ○ (自動表示) |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| BillingManagement | CalculateMonthlyCost | 月別費用計算 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class CareCostController {
  POST /calculate: CalculateMonthlyCostRequest → CostCalculationDTO
  GET /:costId: → CostCalculationDetailDTO
}
```

---

## 9. UI 連携契約

| API | 画面 | 操作種別 | 説明 |
|-----|------|--------|------|
| GET /execution-records (month) | 実施記録確認画面 | 一覧・確認 | 当月記録を表示 |
| POST /calculate | 介護費用計算画面 | 計算 | 費用を計算 |
| GET /:costId | 介護費用計算画面 | 詳細表示 | 計算結果を表示 |

---

## 10. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | HomeVisitServiceExecution | - | GET /execution-records | 実施記録確認画面 | - |
| UC-002 | BillingManagement | CalculateMonthlyCost | POST /calculate | 介護費用計算画面 | -→計算済み |

**完了**
