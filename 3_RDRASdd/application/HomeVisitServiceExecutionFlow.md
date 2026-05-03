# アプリケーション仕様書: 訪問介護実施フロー

## 1. 概要

### BUC日本語名
訪問介護実施フロー

### BUC英語名
HomeVisitServiceExecutionFlow

### 所属業務
訪問介護実施業務

### 目的
計画されたスケジュール通りに訪問介護サービスを実施し、スタッフ確定から移動、サービス実施、完了までの各段階を記録・管理する。請求計算の基となる実施情報を正確に保持する。

---

## 2. アクターと画面

### 関連アクター
- **スケジュール計画担当者**: スタッフ確定を実施
- **サービススタッフ**: 移動報告、サービス実施を記録

### 利用画面
| 画面名 | 利用アクター | 操作 |
|--------|-----------|------|
| スタッフ確定画面 | スケジュール計画担当者 | スタッフを確定 |
| 移動状況報告画面 | サービススタッフ | 移動中であることを報告 |
| 訪問介護実施画面 | サービススタッフ | サービス実施内容をリアルタイムで記録 |

---

## 3. ユースケース一覧

### 主要フロー
1. **UC-001: スタッフを確定する**
2. **UC-002: スタッフが移動する**
3. **UC-003: 訪問介護サービスを実施する**

---

## 4. ユースケース詳細

### UC-001: スタッフを確定する

**英語名**: ConfirmStaffAssignment

**目的**: スケジュール確定後、提供するスタッフを最終確定

**事前条件**: スケジュールが「確定」状態である

**事後条件**: 実施記録が「スタッフ確定」状態で作成

**入力**:
- スケジュールID (required)
- スタッフID (required)
- 確定日時 (required)

**参照/更新データ**:
- スケジュール情報: Read
- 実施記録: Create

**適用条件・ルール**: スタッフスキルが「認定」状態であることを確認

**例外系**:
- スケジュールが「確定」状態でない場合: エラー

---

### UC-002: スタッフが移動する

**英語名**: ReportStaffMovement

**目的**: スタッフが訪問先に向けて移動中であることを報告

**事前条件**: 実施記録が「スタッフ確定」状態である

**事後条件**: 実施記録が「移動中」状態に遷移。現在地情報が記録

**入力**:
- 実施記録ID (required)
- 現在地 (optional)
- 予定到着時刻 (optional)
- 報告日時 (required)

**参照/更新データ**:
- 実施記録: Update

**適用条件・ルール**: 訪問実施スケジュール確認により、リアルタイム位置情報を管理

**例外系**:
- 実施記録が見つからない場合: エラー

---

### UC-003: 訪問介護サービスを実施する

**英語名**: ExecuteHomeVisitService

**目的**: 訪問先到着後、サービスを実施し、実施内容をリアルタイムで記録

**事前条件**: 実施記録が「移動中」状態である

**事後条件**: 実施記録が「実施中」→「完了」に遷移。詳細な実施内容が記録

**入力**:
- 実施記録ID (required)
- 到着時刻 (required)
- サービス開始時刻 (required)
- 対応内容（基本） (required)
- サービス終了時刻 (optional)
- 対応内容詳細 (optional)
- 特記事項 (optional)

**参照/更新データ**:
- 実施記録: Update

**適用条件・ルール**: 実施記録必須項目により、段階ごとに必須記入項目を管理

**例外系**:
- 実施記録が見つからない場合: エラー

---

## 5. API エンドポイント

### API-001: スタッフを確定する

**日本語名**: スタッフ確定

**HTTP メソッド・パス**: POST /api/v1/schedules/:scheduleId/confirm-staff

**リクエスト**:
```json
{
  "staffId": "number",
  "confirmationDate": "string (YYYY-MM-DD)"
}
```

**レスポンス (201 Created)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "staffId": "number",
  "staffName": "string",
  "visitDateTime": "string",
  "visitAddress": "string",
  "executionState": "スタッフ確定",
  "confirmedAt": "datetime"
}
```

---

### API-002: スタッフが移動する

**日本語名**: 移動状況報告

**HTTP メソッド・パス**: PATCH /api/v1/execution-records/:executionRecordId/report-movement

**リクエスト**:
```json
{
  "currentLocation": "string (optional)",
  "estimatedArrivalTime": "string (YYYY-MM-DD HH:MM, optional)",
  "reportDateTime": "string (YYYY-MM-DD HH:MM)"
}
```

**レスポンス (200 OK)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "staffId": "number",
  "currentLocation": "string",
  "estimatedArrivalTime": "string",
  "executionState": "移動中",
  "reportedAt": "datetime"
}
```

---

### API-003: サービスを開始する

**日本語名**: サービス実施開始

**HTTP メソッド・パス**: PATCH /api/v1/execution-records/:executionRecordId/start-service

**リクエスト**:
```json
{
  "actualArrivalTime": "string (YYYY-MM-DD HH:MM)",
  "serviceStartTime": "string (YYYY-MM-DD HH:MM)",
  "initialServiceContent": "string"
}
```

**レスポンス (200 OK)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "staffId": "number",
  "actualArrivalTime": "string",
  "serviceStartTime": "string",
  "executionState": "実施中",
  "startedAt": "datetime"
}
```

---

### API-004: サービスを完了する

**日本語名**: サービス実施完了

**HTTP メソッド・パス**: PATCH /api/v1/execution-records/:executionRecordId/complete-service

**リクエスト**:
```json
{
  "serviceEndTime": "string (YYYY-MM-DD HH:MM)",
  "serviceContent": "string",
  "providedHours": "number",
  "specialNotes": "string (optional)"
}
```

**レスポンス (200 OK)**:
```json
{
  "executionRecordId": "number",
  "scheduleId": "number",
  "staffId": "number",
  "serviceEndTime": "string",
  "providedHours": "number",
  "executionState": "完了",
  "completedAt": "datetime"
}
```

---

### API-005: 実行状態を取得する

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
  "visitDateTime": "string",
  "visitAddress": "string",
  "executionState": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## 6. 画面バインディング

| 画面名 | 属性 | 入力必須 | 検証ルール |
|--------|------|--------|---------|
| スタッフ確定画面 | scheduleId | - | ○ (検索) |
| 〃 | careeMemberName | - | ○ (表示) |
| 〃 | confirmedDateTime | - | ○ (表示) |
| 〃 | staffId | ○ | 列挙値 |
| 移動状況報告画面 | executionRecordId | - | ○ (自動) |
| 〃 | currentLocation | - | 0-200文字 |
| 〃 | estimatedArrivalTime | - | YYYY-MM-DD HH:MM |
| 訪問介護実施画面 | executionRecordId | - | ○ (自動) |
| 〃 | careeMemberName | - | ○ (表示) |
| 〃 | serviceStartTime | ○ | YYYY-MM-DD HH:MM |
| 〃 | serviceContent | ○ | 1-500文字 |
| 〃 | providedHours | ○ | 0-24 (数値) |
| 〃 | serviceEndTime | - | YYYY-MM-DD HH:MM |
| 〃 | specialNotes | - | 0-500文字 |

---

## 7. ドメイン層呼び出し契約

### 利用するドメインサービス

| Context | サービス名 | 説明 |
|---------|-----------|------|
| HomeVisitServiceExecution | ConfirmStaffAssignment | スタッフ確定 |
| HomeVisitServiceExecution | ReportStaffMovement | 移動報告 |
| HomeVisitServiceExecution | StartServiceExecution | サービス実施開始 |
| HomeVisitServiceExecution | CompleteServiceExecution | サービス実施完了 |

---

## 8. 実装 AI 向け指示

### コントローラ疑似シグネチャ
```
class HomeVisitServiceController {
  POST /:scheduleId/confirm-staff: ConfirmStaffAssignmentRequest → ExecutionStatusDTO
  PATCH /:executionRecordId/report-movement: ReportStaffMovementRequest → ExecutionStatusDTO
  PATCH /:executionRecordId/start-service: StartServiceExecutionRequest → ExecutionStatusDTO
  PATCH /:executionRecordId/complete-service: CompleteServiceExecutionRequest → ExecutionStatusDTO
  GET /:executionRecordId: → ExecutionDetailDTO
}
```

---

## 9. レイヤー接続チェック

| UC | Context | Domain サービス | Application API | 利用画面 | 状態遷移 | 
|----|---------|----------------|----------------|--------|--------|
| UC-001 | HomeVisitServiceExecution | ConfirmStaffAssignment | POST /:scheduleId/confirm-staff | スタッフ確定画面 | -→スタッフ確定 |
| UC-002 | HomeVisitServiceExecution | ReportStaffMovement | PATCH /:executionRecordId/report-movement | 移動状況報告画面 | スタッフ確定→移動中 |
| UC-003 | HomeVisitServiceExecution | StartServiceExecution | PATCH /:executionRecordId/start-service | 訪問介護実施画面 | 移動中→実施中 |
| UC-003 | HomeVisitServiceExecution | CompleteServiceExecution | PATCH /:executionRecordId/complete-service | 訪問介護実施画面 | 実施中→完了 |

**完了**
