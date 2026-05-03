# アプリケーション仕様書: スケジュール計画フロー

## 1. 概要

### BUC日本語名
スケジュール計画フロー

### BUC英語名
SchedulePlanningFlow

### 所属業務
スケジュール管理業務

### 目的
介護会員のサービス要望とスタッフのスキル・働き方に基づいてスケジュール計画を作成し、計画内容を確定させることで、訪問介護実施の基盤スケジュールを確保する。

---

## 2. アクターと画面

### 関連アクター
- **スケジュール計画担当者**: スケジュール計画の立案・確定を実施

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| スケジュール要望確認画面 | スケジュール計画担当者 | 会員の要望を確認 |
| スケジュール計画画面 | スケジュール計画担当者 | スケジュール計画案を作成・編集 |
| スケジュール確定画面 | スケジュール計画担当者 | スケジュール計画を確定 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: スケジュール要望を確認する**
2. **UC-002: スケジュールを計画する**
3. **UC-003: スケジュールを確定する**

---

## 4. ユースケース詳細

### UC-001: スケジュール要望を確認する

**英語名**: ConfirmScheduleRequest

**目的**: 介護会員のサービス要望内容を確認

**事前条件**: 介護会員がサービス要望を登録

**事後条件**: 要望内容がスケジュール計画担当者に見える状態

**入力**: スケジュールID (optional) - 検索

**参照/更新データ**:
- スケジュール情報: Read
- 介護会員情報: Read

**適用条件・ルール**: 会員要望スケジュール対応により、サービス利用中の要望を最優先に対応

**例外系**:
- スケジュールIDが存在しない場合: エラー

---

### UC-002: スケジュールを計画する

**英語名**: PlanSchedule

**目的**: 会員要望とスタッフのスキル・働き方を考慮してスケジュール計画を作成

**事前条件**: 会員情報が「サービス利用中」以上である

**事後条件**: スケジュール計画が「計画」状態で記録される

**入力**:
- 介護会員ID (required)
- 要望日時 (required)
- 訪問先 (required)
- 優先スタッフID (optional)

**参照/更新データ**:
- スケジュール情報: Create
- 介護会員情報: Read
- スタッフ情報: Read
- スタッフスキル: Read
- スタッフ働き方: Read

**適用条件・ルール**:
- 会員要望スケジュール対応: 要望を反映した計画
- スタッフスキル別業務配分: 認定スキル保有者のみ候補
- スタッフ働き方柔軟設定: 勤務形態の制約を遵守

**例外系**:
- 会員が見つからない場合: エラー
- 適切なスタッフがいない場合: 警告メッセージ

---

### UC-003: スケジュールを確定する

**英語名**: ConfirmSchedule

**目的**: 計画されたスケジュールを確定し、訪問実施の基準を確定

**事前条件**: スケジュール計画が「計画」状態である

**事後条件**: スケジュールが「確定」状態に遷移。訪問介護実施フローが開始

**入力**:
- スケジュールID (required)
- 割り当てスタッフID (required)
- 確定日時 (required)

**参照/更新データ**:
- スケジュール情報: Update

**適用条件・ルール**: スタッフスキルが「認定」状態であることを確認

**例外系**:
- スケジュールが「計画」状態でない場合: エラー
- 割り当てスタッフのスキルが非認定の場合: 警告

---

## 5. API エンドポイント

### API-001: スケジュール要望を確認する

**日本語名**: スケジュール要望確認

**HTTP メソッド・パス**: GET /api/v1/schedules/:scheduleId

**レスポンス (200 OK)**:
```json
{
  "scheduleId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "requestedDateTime": "string (YYYY-MM-DD HH:MM)",
  "visitAddress": "string",
  "scheduleState": "計画"
}
```

---

### API-002: スケジュール計画を作成する

**日本語名**: スケジュール計画作成

**HTTP メソッド・パス**: POST /api/v1/schedules/plan

**リクエスト**:
```json
{
  "careeMemberId": "number",
  "requestedDateTime": "string (YYYY-MM-DD HH:MM)",
  "visitAddress": "string",
  "preferredStaffIds": ["number"] (optional)
}
```

**レスポンス (201 Created)**:
```json
{
  "scheduleId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "plannedDateTime": "string",
  "visitAddress": "string",
  "candidateStaffIds": ["number"],
  "scheduleState": "計画",
  "createdAt": "datetime"
}
```

---

### API-003: スケジュール計画を修正する

**日本語名**: スケジュール計画修正

**HTTP メソッド・パス**: PATCH /api/v1/schedules/:scheduleId/plan

**リクエスト**:
```json
{
  "plannedDateTime": "string (optional)",
  "visitAddress": "string (optional)",
  "preferredStaffIds": ["number"] (optional)
}
```

**レスポンス (200 OK)**:
```json
{
  "scheduleId": "number",
  "plannedDateTime": "string",
  "visitAddress": "string",
  "candidateStaffIds": ["number"],
  "scheduleState": "計画",
  "updatedAt": "datetime"
}
```

---

### API-004: スケジュールを確定する

**日本語名**: スケジュール確定

**HTTP メソッド・パス**: POST /api/v1/schedules/:scheduleId/confirm

**リクエスト**:
```json
{
  "assignedStaffId": "number",
  "confirmationDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (200 OK)**:
```json
{
  "scheduleId": "number",
  "careeMemberId": "number",
  "careeMemberName": "string",
  "assignedStaffId": "number",
  "assignedStaffName": "string",
  "confirmedDateTime": "string",
  "visitAddress": "string",
  "scheduleState": "確定",
  "confirmedAt": "datetime"
}
```

---

### API-005: スケジュール一覧を取得する

**日本語名**: スケジュール一覧取得

**HTTP メソッド・パス**: GET /api/v1/schedules

**クエリパラメータ**:
- careeMemberId (optional)
- scheduleState (optional) - 計画, 確定
- page (optional)
- limit (optional)

**レスポンス (200 OK)**:
```json
{
  "items": [{...}],
  "pagination": {...}
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| スケジュール要望確認画面 | scheduleId | - | ○ (検索) |
| 〃 | careeMemberName | - | ○ (表示) |
| 〃 | requestedDateTime | - | ○ (表示) |
| 〃 | visitAddress | - | ○ (表示) |
| スケジュール計画画面 | careeMemberId | ○ | ○ (検索) |
| 〃 | requestedDateTime | ○ | YYYY-MM-DD HH:MM |
| 〃 | visitAddress | ○ | 1-200文字 |
| 〃 | preferredStaffIds | - | 列挙値 |
| スケジュール確定画面 | scheduleId | - | ○ (検索) |
| 〃 | assignedStaffId | ○ | 列挙値 |
| 〃 | confirmationDate | ○ | YYYY-MM-DD |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| ScheduleManagement | PlanSchedule | スケジュール計画作成 |
| ScheduleManagement | UpdateSchedulePlan | スケジュール計画修正 |
| ScheduleManagement | ConfirmSchedule | スケジュール確定 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class ScheduleController {
  POST /plan: PlanScheduleRequest → ScheduleDTO
  PATCH /:id/plan: UpdateSchedulePlanRequest → ScheduleDTO
  POST /:id/confirm: ConfirmScheduleRequest → ScheduleDTO
  GET /:id: → ScheduleDetailDTO
  GET: (query params) → List<ScheduleDTO>
}
```

---

## 9. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | ScheduleManagement | - | GET /:id | スケジュール要望確認画面 | - |
| UC-002 | ScheduleManagement | PlanSchedule | POST /plan | スケジュール計画画面 | -→計画 |
| UC-002 | ScheduleManagement | UpdateSchedulePlan | PATCH /:id/plan | スケジュール計画画面 | 計画→計画 |
| UC-003 | ScheduleManagement | ConfirmSchedule | POST /:id/confirm | スケジュール確定画面 | 計画→確定 |

**完了**
