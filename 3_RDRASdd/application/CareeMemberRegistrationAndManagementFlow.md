# アプリケーション仕様書: 介護会員登録・管理フロー

## 1. 概要

### BUC日本語名
介護会員登録・管理フロー

### BUC英語名
CareeMemberRegistrationAndManagementFlow

### 所属業務
介護会員管理業務

### 目的
訪問介護サービスの対象となる介護会員の基本情報を受け付けから登録、管理・更新、サービス利用状態の遷移（開始・休止・再開・終了）まで、ライフサイクル全体をシステムで管理し、スケジュール計画や請求管理の基盤となる介護会員情報を正確に保持する。

---

## 2. アクターと画面

### 関連アクター
- **スケジュール計画担当者**: 新規会員情報の受付窓口。スケジュール計画に必要な会員情報を確認
- **介護会員管理担当者**: 会員情報の登録・更新・状態遷移を実施する主要オペレータ

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| 介護会員受付画面 | スケジュール計画担当者 | 新規会員情報を入力・確認 |
| 介護会員登録画面 | 介護会員管理担当者 | 受け付けた情報をシステムに登録 |
| 介護会員情報管理画面 | 介護会員管理担当者 | 登録済み情報を検索・表示・編集・更新 |
| サービス利用開始画面 | 介護会員管理担当者 | 会員のサービス利用開始手続き |
| サービス利用休止画面 | 介護会員管理担当者 | 会員のサービス一時中断手続き |
| サービス利用再開画面 | 介護会員管理担当者 | 休止中の会員のサービス再開手続き |
| サービス終了画面 | 介護会員管理担当者 | 会員のサービス利用終了手続き |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: 介護会員情報を受け付ける**
   - 目的: 新規会員からの相談・問い合わせ時に基本情報を受け付ける
   - 事前条件: 会員が相談を申し込む
   - 事後条件: 会員情報が初期登録状態で保持される

2. **UC-002: 介護会員情報を登録する**
   - 目的: 受け付けた会員情報をシステムに登録する
   - 事前条件: 会員情報が受け付けられている
   - 事後条件: 会員が「情報確認」状態で登録される

3. **UC-003: 介護会員情報を更新する**
   - 目的: 登録済みの会員情報を修正・更新する
   - 事前条件: 会員情報がシステムに登録されている
   - 事後条件: 会員情報が最新の状態に更新される

4. **UC-004: サービス利用を開始する**
   - 目的: 情報確認済みの会員がサービス利用を開始する
   - 事前条件: 会員状態が「情報確認」である
   - 事後条件: 会員状態が「サービス利用中」に遷移

5. **UC-005: サービス利用を休止する**
   - 目的: サービス利用中の会員のサービスを一時中断する
   - 事前条件: 会員状態が「サービス利用中」である
   - 事後条件: 会員状態が「サービス休止」に遷移

6. **UC-006: サービス利用を再開する**
   - 目的: 休止中のサービスを再開する
   - 事前条件: 会員状態が「サービス休止」である
   - 事後条件: 会員状態が「サービス利用中」に遷移

7. **UC-007: サービス終了を処理する**
   - 目的: 会員のサービス利用を終了する
   - 事前条件: 会員状態が「サービス利用中」または「サービス休止」である
   - 事後条件: 会員状態が「サービス終了」に遷移

---

## 4. ユースケース詳細

### UC-001: 介護会員情報を受け付ける

**英語名**: ReceiveCareeMemberInformation

**目的**: 新規会員からの相談・問い合わせ時に基本情報を受け付ける

**事前条件**: 会員が相談窓口に申し込む

**事後条件**: 会員基本情報が「初期登録」状態で保持される

**入力**:
- 会員ID（スケジュール計画担当者による参照画面の表示で確認）
- 名前 (required)
- 住所 (required)
- 電話番号 (required)
- 生年月日 (required)
- 施設タイプ (required) - enum: 小規模施設, 中規模施設, 大規模施設

**参照/更新データ**:
- 介護会員情報: Read/Create

**適用条件・ルール**:
- 介護会員属性多角管理: 新規登録時は会員状況を「相談中」で初期化
- 会員の状態は「初期登録」に設定

**例外系**:
- 必須項目が未入力の場合: バリデーションエラーを表示
- 電話番号形式が不正の場合: 形式エラーを表示

---

### UC-002: 介護会員情報を登録する

**英語名**: RegisterCareeMemberInfo

**目的**: 受け付けた会員情報をシステムに登録する

**事前条件**: 会員情報が「初期登録」状態で存在する

**事後条件**: 会員が「情報確認」状態で登録される。会員状況が「契約待ち」に遷移

**入力**:
- 会員ID (required)
- 名前 (required)
- 住所 (required)
- 電話番号 (required)
- 生年月日 (required)
- 施設タイプ (required)
- 会員状況 (auto) - 「契約待ち」に設定

**参照/更新データ**:
- 介護会員情報: Update

**適用条件・ルール**:
- 介護会員属性多角管理: 全必須項目入力で会員状況を「契約待ち」に自動遷移
- 状態を「情報確認」に設定

**例外系**:
- 会員が既に「情報確認」以上の状態の場合: 警告をログに記録
- 必須項目が未入力の場合: エラーを表示し、登録を中止

---

### UC-003: 介護会員情報を更新する

**英語名**: UpdateCareeMemberInfo

**目的**: 登録済みの会員情報を修正・更新する

**事前条件**: 会員情報がシステムに登録されている

**事後条件**: 会員情報が最新状態に更新される

**入力**:
- 会員ID (required)
- 名前 (optional)
- 住所 (optional)
- 電話番号 (optional)
- 生年月日 (optional)
- 施設タイプ (optional)
- 会員状況 (optional)

**参照/更新データ**:
- 介護会員情報: Update

**適用条件・ルール**:
- 介護会員属性多角管理: サービス休止中は読み取り専用（更新不可）
- 更新可能な状態: 初期登録、情報確認、サービス利用中、サービス終了

**例外系**:
- 会員が「サービス休止」状態の場合: 「休止期間中は更新不可」というエラーを表示
- 会員IDが存在しない場合: 「会員が見つかりません」というエラーを表示

---

### UC-004: サービス利用を開始する

**英語名**: StartServiceUse

**目的**: 情報確認済みの会員がサービス利用を開始する状態遷移を実行

**事前条件**: 会員状態が「情報確認」であり、会員状況が「契約待ち」である

**事後条件**: 会員状態が「サービス利用中」に遷移。会員状況が「サービス利用中」に遷移

**入力**:
- 会員ID (required)
- 利用開始日 (required)

**参照/更新データ**:
- 介護会員情報: Update

**適用条件・ルール**:
- 会員要望スケジュール対応: サービス利用中の会員の要望を最優先に対応するための前提条件

**例外系**:
- 会員状態が「情報確認」でない場合: 「状態が適切ではありません」というエラーを表示
- 会員状況が「契約待ち」でない場合: 「契約手続きが完了していません」というエラーを表示

---

### UC-005: サービス利用を休止する

**英語名**: PauseServiceUse

**目的**: サービス利用中の介護会員のサービス利用を一時中断

**事前条件**: 会員状態が「サービス利用中」である

**事後条件**: 会員状態が「サービス休止」に遷移

**入力**:
- 会員ID (required)
- 利用休止日 (required)
- 休止理由 (required)
- 予定再開日 (optional)

**参照/更新データ**:
- 介護会員情報: Update

**適用条件・ルール**:
- 会員要望スケジュール対応: 休止中の会員の要望は保留状態に設定

**例外系**:
- 会員状態が「サービス利用中」でない場合: エラーを表示

---

### UC-006: サービス利用を再開する

**英語名**: ResumeServiceUse

**目的**: 休止中のサービスを再開する

**事前条件**: 会員状態が「サービス休止」である

**事後条件**: 会員状態が「サービス利用中」に遷移

**入力**:
- 会員ID (required)
- 利用再開日 (required)

**参照/更新データ**:
- 介護会員情報: Update

**適用条件・ルール**:
- 会員要望スケジュール対応: 再開時に保留されていた要望を再度確認可能に

**例外系**:
- 会員状態が「サービス休止」でない場合: エラーを表示

---

### UC-007: サービス終了を処理する

**英語名**: TerminateServiceUse

**目的**: 会員のサービス利用を終了する

**事前条件**: 会員状態が「サービス利用中」または「サービス休止」である

**事後条件**: 会員状態が「サービス終了」に遷移。会員状況が「サービス終了」に遷移

**入力**:
- 会員ID (required)
- 終了日 (required)
- 終了理由 (required)

**参照/更新データ**:
- 介護会員情報: Update

**適用条件・ルール**:
- サービス終了後は更新不可

**例外系**:
- 会員が既に「サービス終了」状態の場合: 「既に終了処理がされています」というエラーを表示

---

## 5. API エンドポイント

### API-001: 介護会員情報を受け付ける

**日本語名**: 介護会員情報受付

**HTTP メソッド・パス**: POST /api/v1/caremembers/accept

**目的**: 新規会員情報を受け付け、初期登録状態で保持

**リクエスト**:
```json
{
  "name": "string",
  "address": "string",
  "phoneNumber": "string",
  "birthDate": "string (YYYY-MM-DD)",
  "facilityType": "enum (小規模施設|中規模施設|大規模施設)"
}
```

**レスポンス (201 Created)**:
```json
{
  "careeMemberId": "number",
  "name": "string",
  "address": "string",
  "phoneNumber": "string",
  "birthDate": "string",
  "facilityType": "string",
  "memberStatus": "相談中",
  "careeMemberState": "初期登録",
  "createdAt": "datetime"
}
```

**主なエラー**:
- 400 Bad Request: 必須項目が不足またはフォーマットが不正
- 422 Unprocessable Entity: バリデーション失敗（電話番号形式等）

---

### API-002: 介護会員情報を登録する

**日本語名**: 介護会員情報登録

**HTTP メソッド・パス**: POST /api/v1/caremembers/register

**目的**: 受け付けた会員情報をシステムに正式登録

**リクエスト**:
```json
{
  "careeMemberId": "number",
  "name": "string",
  "address": "string",
  "phoneNumber": "string",
  "birthDate": "string (YYYY-MM-DD)",
  "facilityType": "enum"
}
```

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "name": "string",
  "address": "string",
  "phoneNumber": "string",
  "birthDate": "string",
  "facilityType": "string",
  "memberStatus": "契約待ち",
  "careeMemberState": "情報確認",
  "updatedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 指定した会員IDが見つからない
- 409 Conflict: 既に登録済み

---

### API-003: 介護会員情報を更新する

**日本語名**: 介護会員情報更新

**HTTP メソッド・パス**: PATCH /api/v1/caremembers/:careeMemberId

**目的**: 登録済み会員情報を更新

**リクエスト**:
```json
{
  "name": "string (optional)",
  "address": "string (optional)",
  "phoneNumber": "string (optional)",
  "birthDate": "string (optional)",
  "facilityType": "enum (optional)"
}
```

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "name": "string",
  "address": "string",
  "phoneNumber": "string",
  "birthDate": "string",
  "facilityType": "string",
  "memberStatus": "string",
  "careeMemberState": "string",
  "updatedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 会員が見つからない
- 409 Conflict: サービス休止中のため更新不可

---

### API-004: サービス利用を開始する

**日本語名**: サービス利用開始

**HTTP メソッド・パス**: POST /api/v1/caremembers/:careeMemberId/service/start

**目的**: 会員がサービス利用を開始する状態遷移を実行

**リクエスト**:
```json
{
  "serviceStartDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "careeMemberState": "サービス利用中",
  "memberStatus": "サービス利用中",
  "transitionedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 会員が見つからない
- 409 Conflict: 状態遷移が不可能（状態が「情報確認」でない等）

---

### API-005: サービス利用を休止する

**日本語名**: サービス利用休止

**HTTP メソッド・パス**: POST /api/v1/caremembers/:careeMemberId/service/pause

**目的**: 会員のサービス利用を一時中断

**リクエスト**:
```json
{
  "pauseStartDate": "string (YYYY-MM-DD)",
  "pauseReason": "string",
  "estimatedResumeDate": "string (YYYY-MM-DD, optional)"
}
```

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "careeMemberState": "サービス休止",
  "pauseStartDate": "string",
  "pauseReason": "string",
  "transitionedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 会員が見つからない
- 409 Conflict: 状態が「サービス利用中」でない

---

### API-006: サービス利用を再開する

**日本語名**: サービス利用再開

**HTTP メソッド・パス**: POST /api/v1/caremembers/:careeMemberId/service/resume

**目的**: 会員のサービスを再開

**リクエスト**:
```json
{
  "resumeDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "careeMemberState": "サービス利用中",
  "memberStatus": "サービス利用中",
  "transitionedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 会員が見つからない
- 409 Conflict: 状態が「サービス休止」でない

---

### API-007: サービス終了を処理する

**日本語名**: サービス終了

**HTTP メソッド・パス**: POST /api/v1/caremembers/:careeMemberId/service/terminate

**目的**: 会員のサービス利用を終了

**リクエスト**:
```json
{
  "terminationDate": "string (YYYY-MM-DD)",
  "terminationReason": "string"
}
```

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "careeMemberState": "サービス終了",
  "memberStatus": "サービス終了",
  "terminationDate": "string",
  "transitionedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 会員が見つからない
- 409 Conflict: 状態遷移が不可能

---

### API-008: 介護会員情報を取得する（参照系）

**日本語名**: 介護会員情報取得

**HTTP メソッド・パス**: GET /api/v1/caremembers/:careeMemberId

**目的**: 特定の介護会員情報を取得

**リクエスト**: なし

**レスポンス (200 OK)**:
```json
{
  "careeMemberId": "number",
  "name": "string",
  "address": "string",
  "phoneNumber": "string",
  "birthDate": "string",
  "facilityType": "string",
  "memberStatus": "string",
  "careeMemberState": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

**主なエラー**:
- 404 Not Found: 会員が見つからない

---

### API-009: 介護会員一覧を取得する（参照系）

**日本語名**: 介護会員一覧取得

**HTTP メソッド・パス**: GET /api/v1/caremembers

**目的**: 介護会員の一覧を検索・取得

**クエリパラメータ**:
- memberStatus (optional) - フィルタ: 相談中, 契約待ち, サービス利用中, サービス終了, 退会
- facilityType (optional) - フィルタ: 小規模施設, 中規模施設, 大規模施設
- page (optional, default=1) - ページ番号
- limit (optional, default=20) - 1ページあたりの件数 (1-100)
- sort (optional) - ソート順: createdAt, name

**レスポンス (200 OK)**:
```json
{
  "items": [
    {
      "careeMemberId": "number",
      "name": "string",
      "address": "string",
      "phoneNumber": "string",
      "facilityType": "string",
      "memberStatus": "string",
      "careeMemberState": "string",
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

**主なエラー**:
- 400 Bad Request: クエリパラメータが不正

---

## 6. 画面バインディング

| 画面名 | DTO/Entity属性 | 入力必須 | 編集可否 | 表示専用 | 検証ルール |
|--------|---------------|--------|--------|--------|---------|
| 介護会員受付画面 | name | ○ | ○ | - | 名前: 1-100文字 |
| 〃 | address | ○ | ○ | - | 住所: 1-200文字 |
| 〃 | phoneNumber | ○ | ○ | - | 電話: 正規表現マッチ |
| 〃 | birthDate | ○ | ○ | - | 日付: YYYY-MM-DD |
| 〃 | facilityType | ○ | ○ | - | 列挙値のみ |
| 介護会員登録画面 | careeMemberId | - | - | ○ | 自動採番 |
| 〃 | name | ○ | ○ | - | 1-100文字 |
| 〃 | address | ○ | ○ | - | 1-200文字 |
| 〃 | phoneNumber | ○ | ○ | - | 電話形式 |
| 〃 | birthDate | ○ | ○ | - | YYYY-MM-DD |
| 〃 | facilityType | ○ | ○ | - | 列挙値 |
| 〃 | memberStatus | - | - | ○ | 「契約待ち」に自動設定 |
| 〃 | careeMemberState | - | - | ○ | 「情報確認」に自動設定 |
| 介護会員情報管理画面 | careeMemberId | - | - | ○ | 検索キー |
| 〃 | name | ○ | ○ | - | 1-100文字 |
| 〃 | address | ○ | ○ | - | 1-200文字 |
| 〃 | phoneNumber | ○ | ○ | - | 電話形式 |
| 〃 | birthDate | ○ | ○ | - | YYYY-MM-DD |
| 〃 | facilityType | ○ | ○ | - | 列挙値 |
| 〃 | memberStatus | ○ | 状態による | - | 状態別の更新可否 |
| 〃 | careeMemberState | - | - | ○ | 読み取り専用 |
| サービス利用開始画面 | careeMemberId | - | - | ○ | 検索結果 |
| 〃 | serviceStartDate | ○ | ○ | - | YYYY-MM-DD |
| サービス利用休止画面 | careeMemberId | - | - | ○ | 検索結果 |
| 〃 | pauseStartDate | ○ | ○ | - | YYYY-MM-DD |
| 〃 | pauseReason | ○ | ○ | - | 1-500文字 |
| 〃 | estimatedResumeDate | - | ○ | - | YYYY-MM-DD (optional) |
| サービス利用再開画面 | careeMemberId | - | - | ○ | 検索結果 |
| 〃 | resumeDate | ○ | ○ | - | YYYY-MM-DD |
| サービス終了画面 | careeMemberId | - | - | ○ | 検索結果 |
| 〃 | terminationDate | ○ | ○ | - | YYYY-MM-DD |
| 〃 | terminationReason | ○ | ○ | - | 1-500文字 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | メソッド | 入力DTO | 戻り値DTO | 説明 |
|---------|-----------|---------|---------|---------|------|
| CareeMemberManagement | RegisterCareeMemberInfo | registerInfo | RegisterCareeMemberInfoRequest | CareeMemberInfoResponse | 新規会員情報を登録 |
| CareeMemberManagement | UpdateCareeMemberInfo | updateInfo | UpdateCareeMemberInfoRequest | CareeMemberInfoResponse | 会員情報を更新 |
| CareeMemberManagement | StartServiceUse | startService | StartServiceUseRequest | CareeMemberStateTransitionResponse | サービス利用開始 |
| CareeMemberManagement | PauseServiceUse | pauseService | PauseServiceUseRequest | CareeMemberStateTransitionResponse | サービス利用休止 |
| CareeMemberManagement | ResumeServiceUse | resumeService | ResumeServiceUseRequest | CareeMemberStateTransitionResponse | サービス利用再開 |
| CareeMemberManagement | TerminateServiceUse | terminateService | TerminateServiceUseRequest | CareeMemberStateTransitionResponse | サービス終了処理 |

### トランザクション境界
- 各操作は単一トランザクション内で完結
- 状態遷移操作は全てのバリデーション後にコミット

### ドメインエラー分類と API レスポンスへの変換

| Domain エラー | HTTP Status | API エラーコード | UI概要 |
|---------------|------------|---------------|--------|
| MemberNotFound | 404 | MEMBER_NOT_FOUND | 会員が見つかりません |
| InvalidStateTransition | 409 | INVALID_STATE | 状態遷移が不可能です |
| ValidationError | 400 | VALIDATION_ERROR | 入力値が不正です |
| ServicePausedError | 409 | SERVICE_PAUSED | サービス休止中は操作できません |

---

## 8. 外部連携
特に外部システムとのイベント連携はなし。内部的に ScheduleManagement への情報参照のみ。

---

## 9. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class CareeMemberController {
  POST /accept: ReceiveCareeMemberInformationRequest → CareeMemberDTO
  POST /register: RegisterCareeMemberRequest → CareeMemberDTO
  PATCH /:id: UpdateCareeMemberRequest → CareeMemberDTO
  POST /:id/service/start: StartServiceUseRequest → CareeMemberStateTransitionDTO
  POST /:id/service/pause: PauseServiceUseRequest → CareeMemberStateTransitionDTO
  POST /:id/service/resume: ResumeServiceUseRequest → CareeMemberStateTransitionDTO
  POST /:id/service/terminate: TerminateServiceUseRequest → CareeMemberStateTransitionDTO
  GET /:id: → CareeMemberDTO
  GET: (query params) → List<CareeMemberDTO> (with pagination)
}
```

### ユースケース層疑似シグネチャ
```
class CareeMemberManagementUseCase {
  receiveCareeMemberInfo(request) → careeMemberId
  registerCareeMember(request) → careeMemberDTO
  updateCareeMember(request) → careeMemberDTO
  startServiceUse(careeMemberId) → careeMemberStateTransitionDTO
  pauseServiceUse(careeMemberId, reason) → careeMemberStateTransitionDTO
  resumeServiceUse(careeMemberId) → careeMemberStateTransitionDTO
  terminateServiceUse(careeMemberId, reason) → careeMemberStateTransitionDTO
  getCareeMember(careeMemberId) → careeMemberDTO
  searchCareeMemberList(filters, pagination) → List<careeMemberDTO>
}
```

### ログ/監査項目
- **誰が**: ユーザーID、オペレータ名
- **いつ**: タイムスタンプ (createdAt, updatedAt, transitionedAt)
- **何を**: オペレーション種別（受付、登録、更新、状態遷移）
- **記録対象**: careeMemberId, 変更前状態, 変更後状態, 変更理由（休止・終了の場合）

---

## 10. UI 連携契約

### 各 API を利用する画面マッピング

| API | 画面 | 操作種別 | 説明 |
|-----|------|--------|------|
| POST /accept | 介護会員受付画面 | 登録 | 新規会員情報を受け付け |
| POST /register | 介護会員登録画面 | 登録 | 受け付け情報をシステム登録 |
| PATCH /:id | 介護会員情報管理画面 | 更新 | 会員情報を編集・更新 |
| POST /:id/service/start | サービス利用開始画面 | 状態操作 | サービス利用開始 |
| POST /:id/service/pause | サービス利用休止画面 | 状態操作 | サービス利用休止 |
| POST /:id/service/resume | サービス利用再開画面 | 状態操作 | サービス利用再開 |
| POST /:id/service/terminate | サービス終了画面 | 状態操作 | サービス利用終了 |
| GET /:id | 全画面（詳細表示） | 初期表示・詳細表示 | 会員情報を表示 |
| GET | 介護会員情報管理画面 | 一覧・検索 | 会員一覧を表示 |

---

## 11. レイヤー接続チェック

| UC | 利用情報 | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 不足・要確認 |
|----|---------|---------|----------------|----------------|--------|--------|------------|
| UC-001 | 介護会員情報 | CareeMemberManagement | RegisterCareeMemberInfo | POST /accept | 介護会員受付画面 | -→初期登録 | - |
| UC-002 | 介護会員情報 | CareeMemberManagement | RegisterCareeMemberInfo | POST /register | 介護会員登録画面 | 初期登録→情報確認 | - |
| UC-003 | 介護会員情報 | CareeMemberManagement | UpdateCareeMemberInfo | PATCH /:id | 介護会員情報管理画面 | - | - |
| UC-004 | 介護会員情報 | CareeMemberManagement | StartServiceUse | POST /:id/service/start | サービス利用開始画面 | 情報確認→サービス利用中 | - |
| UC-005 | 介護会員情報 | CareeMemberManagement | PauseServiceUse | POST /:id/service/pause | サービス利用休止画面 | サービス利用中→サービス休止 | - |
| UC-006 | 介護会員情報 | CareeMemberManagement | ResumeServiceUse | POST /:id/service/resume | サービス利用再開画面 | サービス休止→サービス利用中 | - |
| UC-007 | 介護会員情報 | CareeMemberManagement | TerminateServiceUse | POST /:id/service/terminate | サービス終了画面 | サービス利用中→サービス終了 | - |
| - | 介護会員情報 | CareeMemberManagement | - | GET /:id | 全画面（参照） | - | - |
| - | 介護会員情報 | CareeMemberManagement | - | GET (一覧) | 介護会員情報管理画面 | - | - |

**完了**
