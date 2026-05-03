# アプリケーション仕様書: 実施記録作成フロー

## 1. 概要

### BUC日本語名
実施記録作成フロー

### BUC英語名
ExecutionRecordCreationFlow

### 所属業務
訪問介護実施業務

### 目的
訪問介護サービスの実施内容を詳細に記録し、サービス実施の証跡を保持する。記録はシステムに登録され、請求計算の基礎となる。

---

## 2. アクターと画面

### 関連アクター
- **サービススタッフ**: 実施記録を作成
- **事務担当者**: 実施記録を確認・登録

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| 実施記録作成画面 | サービススタッフ | 実施内容を記録 |
| 実施記録登録画面 | 事務担当者 | 記録を確認・承認して登録 |
| 実施記録確認画面 | 事務担当者 | 記録を確認・閲覧 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: 実施記録を作成する**
2. **UC-002: 実施記録をシステムに登録する**
3. **UC-003: 実施記録を確認する**

---

## 4. ユースケース詳細

### UC-001: 実施記録を作成する

**英語名**: CreateExecutionRecord

**目的**: サービススタッフがサービス実施内容を詳細に記録

**事前条件**: サービスが完了している（実施記録が「完了」状態）

**事後条件**: 実施記録が詳細内容を含めて記録される（状態は「完了」のまま）

**入力**:
- 実施記録ID (auto)
- スケジュールID (required)
- 会員名 (auto)
- 実施日時 (required)
- 対応内容 (required)
- 提供時間 (required)
- 特記事項 (optional)

**参照/更新データ**:
- 実施記録: Create/Update
- スケジュール情報: Read

**適用条件・ルール**: 実施記録必須項目により、訪問実施状態に応じた必須項目を記録

**例外系**:
- 実施記録が見つからない場合: エラー

---

### UC-002: 実施記録をシステムに登録する

**英語名**: RegisterExecutionRecordToSystem

**目的**: サービススタッフが作成した記録を事務担当者が確認・検証してシステムに正式登録

**事前条件**: 実施記録が「完了」状態で詳細内容が記入されている

**事後条件**: 実施記録が「記録確認」状態に遷移。請求計算の対象として確定

**入力**:
- 実施記録ID (required)
- 記録の正確性確認 (required) - boolean
- 請求対象確認 (required) - boolean
- 承認サイン (required)

**参照/更新データ**:
- 実施記録: Update

**適用条件・ルール**: 実施記録必須項目により、全項目が記入されていることを確認

**例外系**:
- 必須項目が未入力の場合: エラーを表示し、修正を促す

---

### UC-003: 実施記録を確認する

**英語名**: ConfirmExecutionRecord

**目的**: 記録内容を確認し、請求対象確認や品質管理を実施

**事前条件**: 実施記録が「記録確認」状態である

**事後条件**: 実施記録内容が事務担当者に見える状態

**入力**: 実施記録ID (optional) - 検索

**参照/更新データ**:
- 実施記録: Read

**適用条件・ルール**: 記録内容と計画内容に乖離がないかを確認

**例外系**:
- 実施記録が見つからない場合: エラー

---

## 5. API エンドポイント

### API-001: 実施記録を作成する

**日本語名**: 実施記録作成

**HTTP メソッド・パス**: POST /api/v1/execution-records/create

**リクエスト**:
```json
{
  "scheduleId": "number",
  "executionDateTime": "string (YYYY-MM-DD HH:MM)",
  "serviceContent": "string",
  "providedHours": "number",
  "specialNotes": "string (optional)"
}
```

**レスポンス (201 Created)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "staffId": "number",
  "staffName": "string",
  "executionDateTime": "string",
  "serviceContent": "string",
  "providedHours": "number",
  "executionState": "完了",
  "createdAt": "datetime"
}
```

---

### API-002: 実施記録をシステムに登録する

**日本語名**: 実施記録登録

**HTTP メソッド・パス**: PATCH /api/v1/execution-records/:executionRecordId/register

**リクエスト**:
```json
{
  "accuracyConfirmed": "boolean",
  "billingTargetConfirmed": "boolean",
  "approvalSignature": "string"
}
```

**レスポンス (200 OK)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "executionState": "記録確認",
  "registeredAt": "datetime"
}
```

---

### API-003: 実施記録を取得する

**日本語名**: 実施記録取得

**HTTP メソッド・パス**: GET /api/v1/execution-records/:executionRecordId

**レスポンス (200 OK)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "staffId": "number",
  "staffName": "string",
  "executionDateTime": "string",
  "serviceContent": "string",
  "providedHours": "number",
  "specialNotes": "string",
  "executionState": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

### API-004: 実施記録一覧を取得する

**日本語名**: 実施記録一覧取得

**HTTP メソッド・パス**: GET /api/v1/execution-records

**クエリパラメータ**:
- careeMemberId (optional)
- executionState (optional)
- month (optional, YYYY-MM)
- page (optional)
- limit (optional)

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "executionRecordId": "number",
      "careeMemberId": "number",
      "careeMemberName": "string",
      "staffId": "number",
      "staffName": "string",
      "executionDateTime": "string",
      "providedHours": "number",
      "executionState": "string",
      "createdAt": "datetime"
    }
  ],
  "pagination": {...}
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| 実施記録作成画面 | executionRecordId | - | ○ (自動) |
| 〃 | careeMemberName | - | ○ (表示) |
| 〃 | executionDateTime | ○ | YYYY-MM-DD HH:MM |
| 〃 | serviceContent | ○ | 1-500文字 |
| 〃 | providedHours | ○ | 0-24 (数値) |
| 〃 | specialNotes | - | 0-500文字 |
| 実施記録登録画面 | executionRecordId | - | ○ (検索) |
| 〃 | serviceContent | - | ○ (表示) |
| 〃 | providedHours | - | ○ (表示) |
| 〃 | accuracyConfirmed | ○ | boolean (チェック) |
| 〃 | billingTargetConfirmed | ○ | boolean (チェック) |
| 〃 | approvalSignature | ○ | 1-100文字 |
| 実施記録確認画面 | executionRecordId | - | ○ (検索) |
| 〃 | careeMemberName | - | ○ (表示) |
| 〃 | staffName | - | ○ (表示) |
| 〃 | serviceContent | - | ○ (表示) |
| 〃 | providedHours | - | ○ (表示) |
| 〃 | executionState | - | ○ (表示) |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| HomeVisitServiceExecution | CreateExecutionRecord | 実施記録作成 |
| HomeVisitServiceExecution | RegisterExecutionRecordToSystem | 実施記録登録 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class ExecutionRecordController {
  POST /create: CreateExecutionRecordRequest → ExecutionRecordDTO
  PATCH /:id/register: RegisterExecutionRecordRequest → ExecutionRecordDTO
  GET /:id: → ExecutionRecordDetailDTO
  GET: (query params) → List<ExecutionRecordDTO>
}
```

---

## 9. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | HomeVisitServiceExecution | CreateExecutionRecord | POST /create | 実施記録作成画面 | -→完了 |
| UC-002 | HomeVisitServiceExecution | RegisterExecutionRecordToSystem | PATCH /:id/register | 実施記録登録画面 | 完了→記録確認 |
| UC-003 | HomeVisitServiceExecution | - | GET /:id | 実施記録確認画面 | - |
| UC-003 | HomeVisitServiceExecution | - | GET (一覧) | 実施記録確認画面 | - |

**完了**
