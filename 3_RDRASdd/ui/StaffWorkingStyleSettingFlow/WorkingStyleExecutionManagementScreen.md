# UI仕様書: 働き方実行管理画面

**画面日本語名**: 働き方実行管理画面  
**画面英語名**: WorkingStyleExecutionManagementScreen  
**所属BUC**: StaffWorkingStyleSettingFlow  

**目的**: 承認された働き方の実運用を管理。実施状況を記録・確認し、問題対応。

---

## 表示/入力項目

| 項目名 | 型 | 必須 | 編集可否 |
|-------|---|-----|--------|
| スタッフID | number | - | - |
| 働き方区分 | enum | - | - |
| 実施開始日 | date | - | - |
| 実施状況 | enum | ○ | ○ |

---

## API利用

**更新**: PATCH /api/v1/staff-working-style/:styleId/execute

**リクエスト**:
```json
{
  "executionStatus": "enum (順調|要確認|問題対応中)",
  "executionDate": "string (YYYY-MM-DD)"
}
```

---

## 操作フロー

```
START → [承認済み働き方一覧表示]
  → [働き方選択] → 詳細表示
  → [実施状況を入力]
  → [更新ボタン押下] → PATCH /:id/execute
    ├→ [成功] → 成功メッセージ
    └→ [失敗] → エラーメッセージ
  → END
```

---

## 機能要求

| 要求ID | 要求内容 | 優先度 |
|-------|--------|-------|
| FR-001 | 承認済み働き方を一覧表示 | 必須 |
| FR-002 | 実施状況を記録 | 必須 |
| FR-003 | 問題対応を記録 | 推奨 |

---

## 監査/権限制御

**権限**: 「スタッフ管理担当者」

