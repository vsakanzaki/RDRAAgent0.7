# アプリケーション仕様書: スタッフスキル管理フロー

## 1. 概要

### BUC日本語名
スタッフスキル管理フロー

### BUC英語名
StaffSkillManagementFlow

### 所属業務
スタッフ管理業務

### 目的
スタッフが保有する介護スキル情報の申告から確認、認定までのライフサイクルを管理し、スケジュール計画でのスキル別業務配分を実現する。

---

## 2. アクターと画面

### 関連アクター
- **サービススタッフ**: 自身のスキル情報を申告
- **スタッフ管理担当者**: スキル情報を確認・認定

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| スキル入力画面 | サービススタッフ | スキル情報を入力・申告 |
| スキル確認画面 | スタッフ管理担当者 | スキル情報を確認 |
| スキル認定画面 | スタッフ管理担当者 | スキル情報を認定 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: スタッフスキル情報を入力する** (申告)
2. **UC-002: スタッフスキル情報を確認する** (確認)
3. **UC-003: スタッフスキル情報を認定する** (認定)

---

## 4. ユースケース詳細

### UC-001: スタッフスキル情報を入力する

**英語名**: RegisterSkillInfo

**目的**: スタッフが自身のスキル情報を申告

**事前条件**: スタッフが登録されている

**事後条件**: スキル情報が「申告」状態で記録される

**入力**:
- スタッフID (auto)
- スキル種別 (required) - enum: 介護助手, 介護福祉士, 看護師, その他
- 取得日 (required)
- 説明 (optional)

**参照/更新データ**:
- スタッフスキル: Create

**適用条件・ルール**: スタッフスキル別業務配分により、認定済みスキルのみがスケジュール計画で利用可能

**例外系**:
- スタッフIDが存在しない場合: エラー

---

### UC-002: スタッフスキル情報を確認する

**英語名**: VerifySkillInfo

**目的**: 管理者がスタッフが申告したスキル情報を確認・検証

**事前条件**: スキル情報が「申告」状態である

**事後条件**: スキル情報が「確認」状態に遷移

**入力**:
- スキルID (required)
- 確認結果 (required) - enum: 適正, 要確認, 保留

**参照/更新データ**:
- スタッフスキル: Update

**適用条件・ルール**: 確認状態のスキルは注意付きで計画可能

**例外系**:
- スキルが「申告」状態でない場合: エラー

---

### UC-003: スタッフスキル情報を認定する

**英語名**: ApproveSkillInfo

**目的**: 管理者が確認済みのスキルを正式に認定

**事前条件**: スキル情報が「確認」状態である

**事後条件**: スキル情報が「認定」状態に遷移。スケジュール計画で利用可能

**入力**:
- スキルID (required)
- 認定結果 (required) - enum: 認定, 保留, 非認定
- 認定日 (required)

**参照/更新データ**:
- スタッフスキル: Update

**適用条件・ルール**: 認定済みスキルのみがスケジュール計画で配置可能

**例外系**:
- スキルが「確認」状態でない場合: エラー

---

## 5. API エンドポイント

### API-001: スキル情報を申告する

**日本語名**: スキル入力・申告

**HTTP メソッド・パス**: POST /api/v1/staff-skills/register

**リクエスト**:
```json
{
  "staffId": "number",
  "skillType": "enum (介護助手|介護福祉士|看護師|その他)",
  "acquisitionDate": "string (YYYY-MM-DD)",
  "description": "string (optional)"
}
```

**レスポンス (201 Created)**:
```json
{
  "skillId": "number",
  "staffId": "number",
  "staffName": "string",
  "skillType": "string",
  "acquisitionDate": "string",
  "skillState": "申告",
  "createdAt": "datetime"
}
```

---

### API-002: スキル情報を確認する

**日本語名**: スキル確認

**HTTP メソッド・パス**: PATCH /api/v1/staff-skills/:skillId/verify

**リクエスト**:
```json
{
  "verificationResult": "enum (適正|要確認|保留)",
  "verificationDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "skillId": "number",
  "staffId": "number",
  "skillType": "string",
  "skillState": "確認",
  "verificationResult": "string",
  "verifiedAt": "datetime"
}
```

---

### API-003: スキル情報を認定する

**日本語名**: スキル認定

**HTTP メソッド・パス**: PATCH /api/v1/staff-skills/:skillId/approve

**リクエスト**:
```json
{
  "approvalResult": "enum (認定|保留|非認定)",
  "approvalDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "skillId": "number",
  "staffId": "number",
  "skillType": "string",
  "skillState": "認定",
  "approvalResult": "string",
  "approvedAt": "datetime"
}
```

---

### API-004: スキル一覧を取得する

**日本語名**: スキル一覧取得

**HTTP メソッド・パス**: GET /api/v1/staff-skills

**クエリパラメータ**:
- staffId (optional)
- skillState (optional) - 申告, 確認, 認定

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "skillId": "number",
      "staffId": "number",
      "staffName": "string",
      "skillType": "string",
      "skillState": "string",
      "createdAt": "datetime"
    }
  ],
  "pagination": {...}
}
```

---

## 6. 画面バインディング

| 画面名 | DTO/Entity属性 | 入力必須 | 編集可否 | 検証ルール |
|--------|---------------|--------|--------|---------|
| スキル入力画面 | staffId | - | - | ○ (自動) |
| 〃 | skillType | ○ | ○ | 列挙値 |
| 〃 | acquisitionDate | ○ | ○ | YYYY-MM-DD |
| 〃 | description | - | ○ | 0-500文字 |
| スキル確認画面 | skillId | - | - | ○ (表示専用) |
| 〃 | skillType | - | - | ○ (表示専用) |
| 〃 | verificationResult | ○ | ○ | 列挙値 |
| スキル認定画面 | skillId | - | - | ○ (表示専用) |
| 〃 | skillType | - | - | ○ (表示専用) |
| 〃 | approvalResult | ○ | ○ | 列挙値 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| StaffManagement | RegisterSkillInfo | スキル申告 |
| StaffManagement | VerifySkillInfo | スキル確認 |
| StaffManagement | ApproveSkillInfo | スキル認定 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class StaffSkillController {
  POST /register: RegisterSkillInfoRequest → SkillInfoDTO
  PATCH /:id/verify: VerifySkillInfoRequest → SkillInfoDTO
  PATCH /:id/approve: ApproveSkillInfoRequest → SkillInfoDTO
  GET: (query params) → List<SkillDTO>
}
```

---

## 9. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | StaffManagement | RegisterSkillInfo | POST /register | スキル入力画面 | -→申告 |
| UC-002 | StaffManagement | VerifySkillInfo | PATCH /:id/verify | スキル確認画面 | 申告→確認 |
| UC-003 | StaffManagement | ApproveSkillInfo | PATCH /:id/approve | スキル認定画面 | 確認→認定 |

**完了**
