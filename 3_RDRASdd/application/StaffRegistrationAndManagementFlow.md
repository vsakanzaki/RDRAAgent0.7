# アプリケーション仕様書: スタッフ登録・管理フロー

## 1. 概要

### BUC日本語名
スタッフ登録・管理フロー

### BUC英語名
StaffRegistrationAndManagementFlow

### 所属業務
スタッフ管理業務

### 目的
訪問介護サービスを提供するスタッフの基本情報を登録・管理し、スキル認定や働き方設定の基盤となるスタッフマスター情報を正確に保持する。スケジュール計画での人員配置に必要な情報を提供する。

---

## 2. アクターと画面

### 関連アクター
- **スケジュール計画担当者**: スケジュール計画に必要なスタッフ情報を参照
- **スタッフ管理担当者**: スタッフ基本情報の登録・更新・管理を実施

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| スタッフ情報参照画面 | スケジュール計画担当者 | スタッフ情報を検索・参照 |
| スタッフ登録画面 | スタッフ管理担当者 | 新規スタッフを登録 |
| スタッフ情報管理画面 | スタッフ管理担当者 | 登録済みスタッフ情報を編集・更新 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: スタッフ基本情報を提供する**
   - 目的: スケジュール計画に必要なスタッフ情報を参照可能にする
   - 事前条件: スタッフが登録されている
   - 事後条件: スタッフ情報が計画担当者に見える状態

2. **UC-002: スタッフ基本情報を登録する**
   - 目的: 新規スタッフの基本情報をシステムに登録
   - 事前条件: 新規スタッフの情報が提供されている
   - 事後条件: スタッフ情報がシステムに登録される

3. **UC-003: スタッフ基本情報を管理する**
   - 目的: 登録済みスタッフの基本情報を更新・管理
   - 事前条件: スタッフ情報がシステムに登録されている
   - 事後条件: スタッフ情報が最新に更新される

---

## 4. ユースケース詳細

### UC-001: スタッフ基本情報を提供する

**英語名**: ProvideStaffInfo

**目的**: スケジュール計画に必要なスタッフ情報を参照可能にする

**事前条件**: スタッフが登録されている

**事後条件**: スタッフ情報がスケジュール計画担当者に見える

**入力**: スタッフID (optional) - 検索

**参照/更新データ**:
- スタッフ情報: Read
- スタッフスキル: Read
- スタッフ働き方: Read
- 事業所情報: Read

**適用条件・ルール**: スタッフスキル別業務配分、スタッフ働き方柔軟設定により、認定済みスキルと承認済み働き方を表示

**例外系**:
- スタッフIDが存在しない場合: 「スタッフが見つかりません」というメッセージ

---

### UC-002: スタッフ基本情報を登録する

**英語名**: RegisterStaffInfo

**目的**: 新規スタッフの基本情報をシステムに登録

**事前条件**: 新規スタッフの情報が提供されている

**事後条件**: スタッフ情報がシステムに登録される

**入力**:
- 名前 (required)
- 資格 (required)
- 事業所 (required) - FK to 事業所

**参照/更新データ**:
- スタッフ情報: Create
- 事業所情報: Read

**適用条件・ルール**: 
- 事業所は既存の事業所から選択
- スタッフID は自動採番

**例外系**:
- 事業所が存在しない場合: エラーを表示
- 必須項目が未入力の場合: バリデーションエラー

---

### UC-003: スタッフ基本情報を管理する

**英語名**: ManageStaffInfo

**目的**: 登録済みスタッフの基本情報を更新・管理

**事前条件**: スタッフ情報がシステムに登録されている

**事後条件**: スタッフ情報が最新に更新される

**入力**:
- スタッフID (required)
- 名前 (optional)
- 資格 (optional)
- 事業所 (optional)

**参照/更新データ**:
- スタッフ情報: Update
- 事業所情報: Read

**適用条件・ルール**: スキルや働き方が既に設定されている場合は注意喚起

**例外系**:
- スタッフIDが存在しない場合: 404エラー

---

## 5. API エンドポイント

### API-001: スタッフ情報を提供する（参照系）

**日本語名**: スタッフ情報取得

**HTTP メソッド・パス**: GET /api/v1/staff/:staffId

**目的**: 特定のスタッフ情報を取得

**リクエスト**: なし

**レスポンス (200 OK)**:
```json
{
  "staffId": "number",
  "name": "string",
  "qualification": "string",
  "businessLocationId": "number",
  "businessLocationName": "string",
  "skills": [
    {
      "skillType": "string",
      "skillState": "string"
    }
  ],
  "workingStyle": {
    "workingStyleType": "string",
    "workingStyleState": "string"
  },
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: スタッフが見つからない

---

### API-002: スタッフ一覧を取得する（参照系）

**日本語名**: スタッフ一覧取得

**HTTP メソッド・パス**: GET /api/v1/staff

**目的**: スタッフ情報の一覧を検索・取得

**クエリパラメータ**:
- businessLocationId (optional) - フィルタ
- name (optional) - 部分検索
- page (optional, default=1)
- limit (optional, default=20)
- sort (optional) - createdAt, name

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "staffId": "number",
      "name": "string",
      "qualification": "string",
      "businessLocationName": "string",
      "createdAt": "datetime"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

---

### API-003: スタッフ基本情報を登録する

**日本語名**: スタッフ登録

**HTTP メソッド・パス**: POST /api/v1/staff/register

**目的**: 新規スタッフを登録

**リクエスト**:
```json
{
  "name": "string",
  "qualification": "string",
  "businessLocationId": "number"
}
```

**レスポンス (201 Created)**:
```json
{
  "staffId": "number",
  "name": "string",
  "qualification": "string",
  "businessLocationId": "number",
  "businessLocationName": "string",
  "createdAt": "datetime"
}
```

**主なエラー**:
- 400 Bad Request: 必須項目が不足
- 409 Conflict: 事業所が存在しない

---

### API-004: スタッフ基本情報を更新する

**日本語名**: スタッフ情報更新

**HTTP メソッド・パス**: PATCH /api/v1/staff/:staffId

**目的**: スタッフ情報を更新

**リクエスト**:
```json
{
  "name": "string (optional)",
  "qualification": "string (optional)",
  "businessLocationId": "number (optional)"
}
```

**レスポンス (200 OK)**:
```json
{
  "staffId": "number",
  "name": "string",
  "qualification": "string",
  "businessLocationId": "number",
  "businessLocationName": "string",
  "updatedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: スタッフが見つからない

---

## 6. 画面バインディング

| 画面名 | DTO/Entity属性 | 入力必須 | 編集可否 | 表示専用 | 検証ルール |
|--------|---------------|--------|--------|--------|---------|
| スタッフ情報参照画面 | staffId | - | - | ○ | 検索キー |
| 〃 | name | - | - | ○ | 表示専用 |
| 〃 | qualification | - | - | ○ | 表示専用 |
| 〃 | businessLocationName | - | - | ○ | 表示専用 |
| 〃 | skills | - | - | ○ | 表示専用（一覧） |
| 〃 | workingStyle | - | - | ○ | 表示専用 |
| スタッフ登録画面 | staffId | - | - | ○ | 自動採番 |
| 〃 | name | ○ | ○ | - | 1-100文字 |
| 〃 | qualification | ○ | ○ | - | 1-100文字 |
| 〃 | businessLocationId | ○ | ○ | - | 列挙値（事業所マスタ） |
| スタッフ情報管理画面 | staffId | - | - | ○ | 検索キー |
| 〃 | name | ○ | ○ | - | 1-100文字 |
| 〃 | qualification | ○ | ○ | - | 1-100文字 |
| 〃 | businessLocationId | ○ | ○ | - | 列挙値 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | メソッド | 入力DTO | 戻り値DTO | 説明 |
|---------|-----------|---------|---------|---------|------|
| StaffManagement | RegisterStaff | registerStaff | RegisterStaffRequest | StaffInfoResponse | スタッフを登録 |
| StaffManagement | UpdateStaff | updateStaff | UpdateStaffRequest | StaffInfoResponse | スタッフ情報を更新 |

### トランザクション境界
- 各操作は単一トランザクション内で完結

### ドメインエラー分類と API レスポンスへの変換

| Domain エラー | HTTP Status | API エラーコード | UI概要 |
|---------------|------------|---------------|--------|
| StaffNotFound | 404 | STAFF_NOT_FOUND | スタッフが見つかりません |
| BusinessLocationNotFound | 409 | LOCATION_NOT_FOUND | 事業所が見つかりません |
| ValidationError | 400 | VALIDATION_ERROR | 入力値が不正です |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class StaffController {
  POST /register: RegisterStaffRequest → StaffInfoDTO
  PATCH /:id: UpdateStaffRequest → StaffInfoDTO
  GET /:id: → StaffDetailDTO (with skills, workingStyle)
  GET: (query params) → List<StaffDTO> (with pagination)
}
```

### ユースケース層疑似シグネチャ
```
class StaffManagementUseCase {
  registerStaff(request) → staffDTO
  updateStaff(staffId, request) → staffDTO
  getStaffInfo(staffId) → staffDetailDTO (includes skills, workingStyle)
  searchStaffList(filters, pagination) → List<staffDTO>
}
```

### ログ/監査項目
- **誰が**: ユーザーID、オペレータ名
- **いつ**: タイムスタンプ (createdAt, updatedAt)
- **何を**: オペレーション種別（登録、更新）
- **記録対象**: staffId, 変更項目、変更前後の値

---

## 9. UI 連携契約

| API | 画面 | 操作種別 | 説明 |
|-----|------|--------|------|
| POST /register | スタッフ登録画面 | 登録 | 新規スタッフを登録 |
| PATCH /:id | スタッフ情報管理画面 | 更新 | スタッフ情報を編集・更新 |
| GET /:id | スタッフ情報参照画面 | 初期表示・詳細表示 | スタッフ情報を表示 |
| GET | スタッフ情報参照画面 | 一覧・検索 | スタッフ一覧を表示 |

---

## 10. レイヤー接続チェック

| UC | 利用情報 | Context | Domain サービス | Application API | 利用画面 | 不足・要確認 |
|----|---------|---------|----------------|----------------|--------|------------|
| UC-001 | スタッフ情報、スキル、働き方 | StaffManagement | - | GET /:id | スタッフ情報参照画面 | - |
| UC-001 | スタッフ情報 | StaffManagement | - | GET (一覧) | スタッフ情報参照画面 | - |
| UC-002 | スタッフ情報 | StaffManagement | RegisterStaff | POST /register | スタッフ登録画面 | - |
| UC-003 | スタッフ情報 | StaffManagement | UpdateStaff | PATCH /:id | スタッフ情報管理画面 | - |

**完了**
