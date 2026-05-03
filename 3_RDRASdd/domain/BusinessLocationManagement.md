# ドメイン仕様書: 事業所管理

## 1. 概要

### コンテキスト日本語名
事業所管理

### コンテキスト英語名
BusinessLocationManagement

### 目的
複数の拠点事業所またはサテライト事業所を一元管理し、事業所ごとの基本情報・運営情報・売上情報を統一的に管理する。各事業所に所属するスタッフ、訪問実績、売上状況の基盤情報を提供する。

---

## 2. エンティティ定義

### 事業所 (BusinessLocation)
複数の拠点事業所またはサテライト事業所を一元管理するためのマスター情報

| 項目名 | 型 | isKey | 説明 | 制約 |
|--------|-----|-------|------|------|
| 事業所_ID | number | true | 事業所の一意識別子 | PK |
| 事業所名 | string | - | 事業所の名称 | NOT NULL |
| 住所 | string | - | 事業所の住所 | NOT NULL |
| 電話番号 | string | - | 事業所の電話番号 | NOT NULL |
| 規模 | string | - | 事業所の規模 | - |
| 事業所区分 | enum | - | 拠点事業所、サテライト事業所 | NOT NULL |

---

## 3. Value Objects / 列挙

### 事業所区分 (LocationType)
事業所の規模・役割を分類

| 値 | 説明 |
|----|------|
| 拠点事業所 | 本部機能を持つ中核事業所。複数サテライトの統括 |
| サテライト事業所 | 拠点事業所の配下で地域的な訪問介護を展開 |

---

## 4. 状態モデル

事業所管理コンテキストは、事業所自体の状態遷移を持たない。マスターデータとして一度登録すると、名称・住所等の属性は更新可能だが、ライフサイクル状態を持たない。

---

## 5. ビジネスルール

### 事業所情報の一元管理
**目的**: 複数の事業所を一元管理し、スタッフ配置、スケジュール計画、売上管理の基盤とする

**適用タイミング**: 事業所情報の登録・更新時

**対象エンティティ**: 事業所

| 事業所区分 | 必須情報 | 運用制約 |
|---------|--------|--------|
| 拠点事業所 | 本部住所、管理部門の電話番号 | スタッフ数50名以上、複数サテライト管理 |
| サテライト事業所 | 営業住所、サテライト電話番号 | 拠点事業所に従属、スタッフ数10～30名 |

**ルール**: 拠点事業所は1つ以上、サテライト事業所は複数登録可能

**違反時の扱い**: 事業所区分の登録内容を検証、不整合時は警告メッセージ表示

---

## 6. 不変条件と整合性制約

### 主キー一意性
- 事業所_ID は全体で一意
- 事業所名も全体で一意（同名の事業所は不可）

### 参照整合性
- StaffManagement のスタッフテーブルの事業所_ID は、事業所テーブルに存在する ID を参照
- BillingManagement の売上情報は、事業所_ID 経由で事業所情報を参照

### 属性の一貫性

| 属性 | 制約 |
|-----|------|
| 事業所名 | NOT NULL、全体で一意、最大100文字 |
| 住所 | NOT NULL、最大200文字 |
| 電話番号 | NOT NULL、有効な電話番号形式 |
| 事業所区分 | NOT NULL、「拠点事業所」または「サテライト事業所」のみ |

### 事業所と配下情報の整合性
- 拠点事業所には1名以上の事業所管理者を配置
- サテライト事業所には1名以上のスタッフを配置
- 事業所削除時は、配下のスタッフ・スケジュールを別事業所に異動するか、サービス終了処理を実施

---

## 7. ドメインサービス

### 7.1. 事業所マスター管理サービス

#### RegisterBusinessLocation (事業所登録)
**責務**: 新規事業所情報を登録し、マスターに追加

**入力 DTO**:
```
RegisterBusinessLocationRequest {
  locationName: string (NOT NULL)
  address: string (NOT NULL)
  phoneNumber: string (NOT NULL)
  scale: string (OPTIONAL)
  locationType: enum (NOT NULL, 拠点事業所 | サテライト事業所)
}
```

**戻り値 DTO**:
```
BusinessLocationResponse {
  locationId: number
  locationName: string
  address: string
  phoneNumber: string
  scale: string
  locationType: enum
  registeredAt: datetime
}
```

**処理説明**:
1. 事業所名の一意性確認
2. 住所、電話番号のバリデーション
3. 事業所区分の妥当性確認
4. 新規レコードを作成
5. ID を自動採番
6. 登録日時を記録

---

#### UpdateBusinessLocation (事業所情報更新)
**責務**: 登録済みの事業所情報を更新

**入力 DTO**:
```
UpdateBusinessLocationRequest {
  locationId: number (NOT NULL)
  locationName: string (OPTIONAL)
  address: string (OPTIONAL)
  phoneNumber: string (OPTIONAL)
  scale: string (OPTIONAL)
}
```

**戻り値 DTO**:
```
BusinessLocationResponse {
  locationId: number
  locationName: string
  address: string
  phoneNumber: string
  scale: string
  locationType: enum
  updatedAt: datetime
}
```

**処理説明**:
1. 事業所_ID の存在確認
2. 事業所名を変更する場合は一意性確認
3. 提供された項目のみを更新
4. 住所・電話番号のバリデーション
5. 更新日時を記録

---

#### DeactivateBusinessLocation (事業所廃止)
**責務**: 事業所を廃止する場合の処理。配下のスタッフ・スケジュールの処理を含む

**入力 DTO**:
```
DeactivateBusinessLocationRequest {
  locationId: number (NOT NULL)
  deactivationReason: string (NOT NULL)
  deactivationDate: string (NOT NULL)
  transferLocationId: number (OPTIONAL, 異動先事業所ID)
}
```

**戻り値 DTO**:
```
BusinessLocationDeactivationResponse {
  locationId: number
  locationName: string
  deactivationReason: string
  deactivationDate: string
  affectedStaffCount: number
  affectedScheduleCount: number
  deactivatedAt: datetime
}
```

**処理説明**:
1. 事業所_ID の存在確認
2. 配下のスタッフ数を確認
3. 配下のアクティブなスケジュール数を確認
4. 異動先事業所を指定した場合、スタッフを異動処理
5. 異動先を指定しない場合、スタッフの離職処理
6. 事業所廃止日を設定
7. 廃止理由を記録

---

### 7.2. 事業所統計・レポートサービス

#### GetBusinessLocationStats (事業所統計取得)
**責務**: 指定事業所の統計情報（スタッフ数、月間訪問回数、売上等）を取得

**入力 DTO**:
```
GetBusinessLocationStatsRequest {
  locationId: number (NOT NULL)
  statisticsMonth: string (NOT NULL, YYYY-MM形式)
}
```

**戻り値 DTO**:
```
BusinessLocationStatisticsResponse {
  locationId: number
  locationName: string
  locationType: enum
  statisticsMonth: string
  staffCount: number
  activeStaffCount: number
  monthlyVisitCount: number
  monthlyRevenue: number
  careeMemberCount: number
  averageServiceTime: number
  statsCalculatedAt: datetime
}
```

**処理説明**:
1. 事業所_ID の存在確認
2. StaffManagement から配置スタッフ数を取得
3. HomeVisitServiceExecution から当月訪問回数を集計
4. BillingManagement から当月売上を集計
5. CareeMemberManagement から会員数を取得
6. 平均サービス時間を計算
7. 統計情報を返却

---

#### GenerateBusinessLocationReport (事業所運営レポート生成)
**責務**: 指定期間の事業所運営状況レポートを生成

**入力 DTO**:
```
GenerateBusinessLocationReportRequest {
  locationId: number (NOT NULL)
  reportStartMonth: string (NOT NULL, YYYY-MM形式)
  reportEndMonth: string (NOT NULL, YYYY-MM形式)
  reportType: enum (月間 | 四半期 | 年間)
}
```

**戻り値 DTO**:
```
BusinessLocationReportResponse {
  locationId: number
  locationName: string
  reportPeriod: {
    startMonth: string
    endMonth: string
  }
  summaryStats: {
    totalVisitCount: number
    totalRevenue: number
    totalCareeMemberServed: number
    averageServiceQuality: number
  }
  monthlyTrends: List<{
    month: string
    visitCount: number
    revenue: number
  }>
  staffUtilization: {
    averageStaffCount: number
    utilizationRate: number
  }
  reportGeneratedAt: datetime
}
```

**処理説明**:
1. 事業所_ID の存在確認
2. 指定期間の複数月の統計を集計
3. 月別トレンドを計算
4. スタッフ稼働率を計算
5. サービス品質指標を集計（BillingManagement から）
6. レポートを生成

---

## 8. コンテキスト境界と依存

### 他コンテキストとの情報関係

| 関連コンテキスト | 情報フロー | 用途 |
|-------------|---------|------|
| StaffManagement | 事業所マスター情報を提供、スタッフの所属事業所確認 | スタッフ配置管理の基盤 |
| CareeMemberManagement | 事業所マスター情報を参照 | 会員情報管理の共有マスター |
| ScheduleManagement | 事業所マスター情報を参照（スタッフ経由） | スケジュール計画の事業所制約確認 |
| BillingManagement | 事業所別売上情報を提供 | 事業所別の売上・収益管理 |

### 提供する情報
- 事業所基本情報（名称、住所、電話番号、規模、区分）
- 事業所統計（スタッフ数、訪問実績、売上）
- 事業所別運営レポート

---

## 9. 実装 AI 向け指示

### 言語非依存の疑似シグネチャ

```
// 事業所マスター管理
registerBusinessLocation(
  locationName: string,
  address: string,
  phoneNumber: string,
  scale: string,
  locationType: enum
) -> BusinessLocationResponse

updateBusinessLocation(
  locationId: number,
  updates: Map<string, any>
) -> BusinessLocationResponse

deactivateBusinessLocation(
  locationId: number,
  deactivationReason: string,
  deactivationDate: string,
  transferLocationId: number
) -> BusinessLocationDeactivationResponse

// 統計・レポート
getBusinessLocationStats(
  locationId: number,
  statisticsMonth: string
) -> BusinessLocationStatisticsResponse

generateBusinessLocationReport(
  locationId: number,
  reportStartMonth: string,
  reportEndMonth: string,
  reportType: enum
) -> BusinessLocationReportResponse
```

### トランザクション境界
- **原子単位**: 1つの事業所登録 = 1トランザクション
- 廃止処理時は、配下スタッフの異動 + 事業所廃止 = 1トランザクション内
- 統計取得は読み取り専用、トランザクション不要

### バリデーション順序
1. 必須項目の NULL チェック
2. 一意性確認（事業所名）
3. 形式チェック（電話番号、住所等）
4. 事業所区分の妥当性確認
5. 参照整合性確認（異動先事業所が存在するか）

### エラー分類

| エラー分類 | 例 | ハンドリング |
|---------|------|----------|
| **業務エラー** | 事業所名重複、廃止時の配下スタッフ未処理 | ユーザーに通知、修正を促す |
| **整合性エラー** | 異動先事業所が存在しない | トランザクション롤백, ログ記録 |
| **外部連携エラー** | StaffManagement データ未同期 | 再試行, フォールバック |

---

## 10. Application 連携契約

### サービス一覧表

| サービス名 | メソッド名 | 入力 DTO | 戻り値 DTO | 変更対象エンティティ | 操作 | 発生し得るエラー分類 |
|---------|---------|---------|----------|------------|------|-----------|
| 事業所登録 | registerBusinessLocation | RegisterBusinessLocationRequest | BusinessLocationResponse | 事業所 | CREATE | 業務エラー、整合性エラー |
| 事業所情報更新 | updateBusinessLocation | UpdateBusinessLocationRequest | BusinessLocationResponse | 事業所 | UPDATE | 業務エラー |
| 事業所廃止 | deactivateBusinessLocation | DeactivateBusinessLocationRequest | BusinessLocationDeactivationResponse | 事業所 | UPDATE | 業務エラー |
| 事業所統計取得 | getBusinessLocationStats | GetBusinessLocationStatsRequest | BusinessLocationStatisticsResponse | なし（読み取り専用） | READ | - |
| 運営レポート生成 | generateBusinessLocationReport | GenerateBusinessLocationReportRequest | BusinessLocationReportResponse | なし（読み取り専用） | READ | - |

### 参照操作（CRUD 読み取り）

| 操作 | メソッド名 | 検索条件 | 戻り値 | 用途 |
|-----|---------|--------|--------|------|
| 単件取得 | getBusinessLocationById | locationId | BusinessLocation | 事業所詳細情報確認 |
| 全事業所一覧 | listAllBusinessLocations | なし | List<BusinessLocation> | 事業所一覧表示 |
| 区分別一覧 | listBusinessLocationsByType | locationType | List<BusinessLocation> | 拠点・サテライト別一覧 |
| 拠点配下検索 | listSatellitesByMainLocation | mainLocationId | List<BusinessLocation> | 拠点直下のサテライト検索 |

### 利用候補 UC

このドメイン契約を利用し得る UC：

- `売上を把握・管理する` → getBusinessLocationStats, generateBusinessLocationReport (参照)
- スタッフ登録・異動時に事業所_ID を参照確認
- スケジュール計画時に事業所制約を確認（スタッフの所属事業所）
- 事業所管理者向けダッシュボードで統計情報を表示

---
