# アプリケーション仕様書: スタッフ働き方設定フロー

## 1. 概要

### BUC日本語名
スタッフ働き方設定フロー

### BUC英語名
StaffWorkingStyleSettingFlow

### 所属業務
スタッフ管理業務

### 目的
スタッフの柔軟な働き方希望（フルタイム、パートタイム、単発）を登録から審査、承認、実行までのライフサイクルを管理し、スケジュール計画での勤務形態制約を実現する。

---

## 2. アクターと画面

### 関連アクター
- **サービススタッフ**: 働き方希望を設定
- **スタッフ管理担当者**: 働き方を審査・承認・管理

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| 働き方設定画面 | サービススタッフ | 働き方希望を入力・設定 |
| 働き方審査画面 | スタッフ管理担当者 | 働き方の実現可能性を審査 |
| 働き方承認画面 | スタッフ管理担当者 | 働き方を承認 |
| 働き方実行管理画面 | スタッフ管理担当者 | 承認済み働き方の実施を管理 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: スタッフ働き方希望を設定する** (登録)
2. **UC-002: スタッフ働き方を審査する** (審査)
3. **UC-003: スタッフ働き方を承認する** (承認)
4. **UC-004: スタッフ働き方を実行する** (実行)

---

## 4. ユースケース詳細

### UC-001: スタッフ働き方希望を設定する

**英語名**: RegisterWorkingStyle

**目的**: スタッフが自身の働き方希望を登録

**事前条件**: スタッフが登録されている

**事後条件**: 働き方情報が「登録」状態で記録される

**入力**:
- スタッフID (auto)
- 働き方区分 (required) - enum: フルタイム, パートタイム, 単発
- 勤務開始日 (required)
- 勤務形態詳細 (required)

**参照/更新データ**:
- スタッフ働き方: Create

**適用条件・ルール**: スタッフ働き方柔軟設定により、区分ごとの制約を記録

**例外系**:
- スタッフIDが存在しない場合: エラー

---

### UC-002: スタッフ働き方を審査する

**英語名**: ReviewWorkingStyle

**目的**: 管理者がスタッフの働き方希望の実現可能性を審査

**事前条件**: 働き方情報が「登録」状態である

**事後条件**: 働き方情報が「審査」状態に遷移

**入力**:
- 働き方ID (required)
- 審査結果 (required) - enum: 適正, 要相談, 保留
- 審査日 (required)

**参照/更新データ**:
- スタッフ働き方: Update

**適用条件・ルール**: 月160時間以上（フルタイム）、月80～159時間（パート）等の制約を確認

**例外系**:
- 働き方が「登録」状態でない場合: エラー

---

### UC-003: スタッフ働き方を承認する

**英語名**: ApproveWorkingStyle

**目的**: 管理者が審査済みの働き方を正式に承認

**事前条件**: 働き方情報が「審査」状態である

**事後条件**: 働き方情報が「承認」状態に遷移

**入力**:
- 働き方ID (required)
- 承認結果 (required) - enum: 承認, 却下
- 承認日 (required)

**参照/更新データ**:
- スタッフ働き方: Update

**適用条件・ルール**: 承認済みの働き方のみがスケジュール計画で配置可能

**例外系**:
- 働き方が「審査」状態でない場合: エラー

---

### UC-004: スタッフ働き方を実行する

**英語名**: ExecuteWorkingStyle

**目的**: 承認済みの働き方を実運用に移行

**事前条件**: 働き方情報が「承認」状態である

**事後条件**: 働き方情報が「実行」状態に遷移。スケジュール計画で実運用開始

**入力**:
- 働き方ID (required)
- 実施開始日 (required)

**参照/更新データ**:
- スタッフ働き方: Update

**適用条件・ルール**: スケジュール計画は「実行」状態の働き方のみを参照

**例外系**:
- 働き方が「承認」状態でない場合: エラー

---

## 5. API エンドポイント

### API-001: 働き方希望を設定する

**日本語名**: 働き方設定・登録

**HTTP メソッド・パス**: POST /api/v1/staff-working-style/register

**リクエスト**:
```json
{
  "staffId": "number",
  "workingStyleType": "enum (フルタイム|パートタイム|単発)",
  "workStartDate": "string (YYYY-MM-DD)",
  "details": "string"
}
```

**レスポンス (201 Created)**:
```json
{
  "workingStyleId": "number",
  "staffId": "number",
  "staffName": "string",
  "workingStyleType": "string",
  "workingStyleState": "登録",
  "createdAt": "datetime"
}
```

---

### API-002: 働き方を審査する

**日本語名**: 働き方審査

**HTTP メソッド・パス**: PATCH /api/v1/staff-working-style/:workingStyleId/review

**リクエスト**:
```json
{
  "reviewResult": "enum (適正|要相談|保留)",
  "reviewDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "workingStyleId": "number",
  "staffId": "number",
  "workingStyleType": "string",
  "workingStyleState": "審査",
  "reviewedAt": "datetime"
}
```

---

### API-003: 働き方を承認する

**日本語名**: 働き方承認

**HTTP メソッド・パス**: PATCH /api/v1/staff-working-style/:workingStyleId/approve

**リクエスト**:
```json
{
  "approvalResult": "enum (承認|却下)",
  "approvalDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "workingStyleId": "number",
  "staffId": "number",
  "workingStyleType": "string",
  "workingStyleState": "承認",
  "approvedAt": "datetime"
}
```

---

### API-004: 働き方を実行する

**日本語名**: 働き方実行開始

**HTTP メソッド・パス**: PATCH /api/v1/staff-working-style/:workingStyleId/execute

**リクエスト**:
```json
{
  "executionStartDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "workingStyleId": "number",
  "staffId": "number",
  "workingStyleType": "string",
  "workingStyleState": "実行",
  "executionStartDate": "string",
  "executedAt": "datetime"
}
```

---

### API-005: 働き方一覧を取得する

**日本語名**: 働き方一覧取得

**HTTP メソッド・パス**: GET /api/v1/staff-working-style

**クエリパラメータ**:
- staffId (optional)
- workingStyleState (optional)

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "workingStyleId": "number",
      "staffId": "number",
      "staffName": "string",
      "workingStyleType": "string",
      "workingStyleState": "string",
      "createdAt": "datetime"
    }
  ],
  "pagination": {...}
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 編集可否 | 検証ルール |
|--------|------|--------|--------|---------|
| 働き方設定画面 | staffId | - | - | ○ (自動) |
| 〃 | workingStyleType | ○ | ○ | 列挙値 |
| 〃 | workStartDate | ○ | ○ | YYYY-MM-DD |
| 〃 | details | ○ | ○ | 1-500文字 |
| 働き方審査画面 | reviewResult | ○ | ○ | 列挙値 |
| 〃 | reviewDate | ○ | ○ | YYYY-MM-DD |
| 働き方承認画面 | approvalResult | ○ | ○ | 列挙値 |
| 〃 | approvalDate | ○ | ○ | YYYY-MM-DD |
| 働き方実行管理画面 | executionStartDate | ○ | ○ | YYYY-MM-DD |
| 〃 | executionStatus | - | ○ | 順調, 要確認, 問題対応中 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| StaffManagement | RegisterWorkingStyle | 働き方希望登録 |
| StaffManagement | ReviewWorkingStyle | 働き方審査 |
| StaffManagement | ApproveWorkingStyle | 働き方承認 |
| StaffManagement | ExecuteWorkingStyle | 働き方実行開始 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class StaffWorkingStyleController {
  POST /register: RegisterWorkingStyleRequest → WorkingStyleDTO
  PATCH /:id/review: ReviewWorkingStyleRequest → WorkingStyleDTO
  PATCH /:id/approve: ApproveWorkingStyleRequest → WorkingStyleDTO
  PATCH /:id/execute: ExecuteWorkingStyleRequest → WorkingStyleDTO
  GET: (query params) → List<WorkingStyleDTO>
}
```

---

## 9. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | StaffManagement | RegisterWorkingStyle | POST /register | 働き方設定画面 | -→登録 |
| UC-002 | StaffManagement | ReviewWorkingStyle | PATCH /:id/review | 働き方審査画面 | 登録→審査 |
| UC-003 | StaffManagement | ApproveWorkingStyle | PATCH /:id/approve | 働き方承認画面 | 審査→承認 |
| UC-004 | StaffManagement | ExecuteWorkingStyle | PATCH /:id/execute | 働き方実行管理画面 | 承認→実行 |

**完了**
