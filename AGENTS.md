see @RDRA_Knowledge/1_RDRA/RDRA.md
see @初期要望.txt

# RDRAAgent Project Context

## 基本方針
- 回答は入力された言語で行う

## このプロジェクトの重要ルール
- `RDRA_Knowledge/` 配下には成果物を出力しない（知識・ツール置き場）。
- TSV はヘッダー行を必須とし、UTF-8 で扱う。
- 各フォルダのAIによる入出力の分類:
  - 入力: `初期要望.txt`    処理対象の要望を入力する
  - 入力: `RDRA_Knowledge/`AIに対する指示を入力する
  - 出力: `0_RDRAZeroOne/` フェーズ別にAIがRDRA定義を出力する
  - 出力: `1_RDRA/`        最終的なRDRA定義をプログラムでコピーする
  - 出力: `2_RDRASpec/`    フェーズ別にAIが仕様を出力する
- AIは出力フォルダーにのみ出力する

## 実行ルール
- AI出力のためにProgramを絶対に生成しない

## プロジェクト概要
RDRAAgent は、体系的なソフトウェア要件定義のために **RDRA（Relationship Driven Requirement Analysis）** 手法を実装した Node.js ベースのシステムです。初期要望からRDRA定義を、4フェーズで段階的に具体化し、そこから仕様を生成する
- フォルダの役割:
  - `初期要望.txt`   RDRA定義対象の要求を記述したファイル
  - `モデル設定.json` AIプロバイダ（claude, gemini, cursor, codex）とモデルの設定
  - `0_RDRAZeroOne/` フェーズ別のRDRA定義を出力する
  - `1_RDRA/`        最終的なRDRA定義がコピーされる
  - `2_RDRASpec/`    仕様が出力される
  - `Samples/`       サンプルプロジェクト（図書館システム、貸し会議室SaaS、介護事業者向けシステム）
  - `RDRA_Knowledge/`出力フォルダーに対応するフォルダー名で存在する

**主な特徴:**
- 外部依存なし（Node.js 標準モジュールのみ）
- テキスト/TSV ベースのデータ形式（データベース不使用）
- LLM 統合ワークフローによる AI 支援分析
- マルチプラットフォーム対応（Windows, macOS）
- フェーズ分割されたモジュール構成

### 「0_RDRAZeroOne/phase1〜phase4」
- フェーズ別のRDRA定義を出力する
- Phase1 成果物: システム概要.json, 要求.tsv, ビジネスポリシー.tsv, ビジネスパラメータ.tsv, 業務.tsv, 状態.tsv
- Phase2 成果物: BUC.tsv, アクター.tsv, バリエーション.tsv, 外部システム.tsv
- Phase3 成果物: UCアクター.tsv, UCタイマー.tsv, UC外部システム.tsv, UC条件.tsv, 情報.tsv
- Phase4 成果物: BUC.tsv, 条件関連.tsv, 条件.tsv, バリエーション.tsv, 状態.tsv
### 「1_RDRA」フォルダー
- Phase3/Phase4の成果物を統合して保持するフォルダー
- ファイル: システム概要.json, アクター.tsv, 外部システム.tsv, 情報.tsv, 状態.tsv, 条件.tsv, バリエーション.tsv, BUC.tsv
- if/関連データ.txt: RDRAGraph可視化用のデータ（makeGraphData.jsで生成）
### 「2_RDRASpec」フォルダー
- AIが仕様を生成し出力するフォルダー
- ルート: 論理データモデル.md, ビジネスルール.md, 画面照会.json
- phase1/: 画面一覧.json, BUC画面.json, アクター画面.json

### 「RDRA_Knowledge/0_RDRAZeroOne」フォルダー
- Phase1〜4: 初期要望から４フェーズでRDRA定義を生成するプロンプトを保持
- phase1/: 要求生成.md, 業務生成.md, ビジネスポリシー生成.md, ビジネスパラメータ生成.md, 状態生成.md
- phase3/: UCアクター.md, UC外部システム.md, 情報生成.md
- phase4/: BUC生成.md

### 「RDRA_Knowledge/1_RDRA」フォルダー
要件定義手法の「RDRA」の考え方をまとめたファイルを含む
- RDRA.md: RDRAの考え方をまとめたファイル
- RDRASheet.md: RDRA定義をSpreadsheetで行う各シートのフォーマットの説明
- RDRAGraph.md: RDRAGraphのデータ構造「関連データ.txt」の説明

### 「RDRA_Knowledge/2_RDRASpec」フォルダー
- phase1/21_論理データ生成.md: RDRA定義から論理データを生成する方法
- phase1/22_ビジネスルール生成.md: ビジネスルールモジュールを定義する方法
- phase1/23_画面一覧生成.md: 全画面の詳細を生成する方法
- phase1/24_BUC画面生成.md: BUC/アクター別の画面を生成する方法
- phase1/25_アクター画面生成.md: アクター別の画面を生成する方法
- phase2/26_画面照会生成.md: 画面一覧・BUC画面・アクター画面を統合し画面照会を生成する方法

## 「helper_tools」フォルダー
ファイルの削除やコピーなどのツールを保持する

## アーキテクチャ概要
- `RDRA_Knowledge` フォルダー
  - Agent に対する実行プロンプトを保持する
  - このフォルダー配下には絶対にファイルを出力しない
  - 配下のフォルダー構成は出力するフォルダー構成と対応する
    - RDRA_Knowledge/0_RDRAZeroOne/phase1/   -> /0_RDRAZeroOne/phase1/
    - RDRA_Knowledge/0_RDRAZeroOne/phase3/   -> /0_RDRAZeroOne/phase3/
    - RDRA_Knowledge/0_RDRAZeroOne/phase4/   -> /0_RDRAZeroOne/phase4/
    - RDRA_Knowledge/2_RDRASpec/phase1/      -> /2_RDRASpec/ および /2_RDRASpec/phase1/
    - RDRA_Knowledge/2_RDRASpec/phase2/      -> /2_RDRASpec/

### 主要コンポーネント

1. **`menu.js`**（エントリーポイント）
   - Node.js `readline` を使った対話型 CLI メニュー
   - 全体処理とフェーズ管理を統括
   - UI エディター用サーバープロセスの並行管理
   - クロスプラットフォームのコマンド実行（Windows cmd/PowerShell, macOS Terminal）

2. **3つの主要処理ストリーム**

   **ストリーム1: ZeroOne（`0_RDRAZeroOne/`）- 要求定義**
   - Phase1: 初期要素を抽出（システム概要、要求、ビジネスポリシー、ビジネスパラメータ、業務、状態）し、`./0_RDRAZeroOne/phase1/` に出力する
   - Phase2: BUC候補、アクター、バリエーション、外部システムを定義し、`./0_RDRAZeroOne/phase2/` に出力する
   - Phase3: UCアクター、UCタイマー、UC外部システム、UC条件、情報を定義し、`./0_RDRAZeroOne/phase3/` に出力する
   - Phase4: LLMでBUCと条件関連を生成した後、`attachContext.js` が条件・バリエーション・状態にコンテキスト列を付与して `./0_RDRAZeroOne/phase4/` に出力する
   - Phase5: `rdraFileCopy.js` でPhase3/4成果物を `1_RDRA/` へ統合し、`makeGraphData.js` で `1_RDRA/if/関連データ.txt` を生成する

   **ストリーム2: RDRA（`1_RDRA/`）- 要求可視化と管理**
   - RDRAGraph 可視化用の関連データ生成
   - Google スプレッドシート出力対応

   **ストリーム3: RDRASpec（`2_RDRASpec/`）- 仕様生成**
   - 論理データモデル（Markdown）
   - UI 定義（JSON）
   - ビジネスルール文書

3. **ヘルパーツール**（`RDRA_Knowledge/helper_tools/`）
   - `menuAction.js` - menu.jsの実行ロジック本体。メニュー番号に応じたアクションを実行する
   - `attachContext.js` - Phase4完了後に自動実行。phase3/情報.tsv を基に、条件・バリエーション・状態にコンテキスト列を付与して phase4/ へ出力する
   - `rdraFileCopy.js` - Phase3/4の成果物を検証し `1_RDRA/` へコピーする
   - `makeGraphData.js` - 1_RDRAのTSV/JSONからRDRAGraph用の1_RDRA/if/関連データ.txtを生成する（ReScript由来のビルド済みJS）
   - `makeZeroOneData.js` - 1_RDRAの成果物をGoogleスプレッドシート用のZeroOne形式に変換する
   - `copyToClipboard.js` - クリップボードへコピー（Windows/macOS/Linux対応）
   - `deleteFiles.js` - 0_RDRAZeroOne/1_RDRA/2_RDRASpecの成果物を削除する
   - web_tool/
     - `bucActorUI.js` - 画面照会用 HTTP サーバー（port 3002）
     - `bucActorUI.html` - BUC/アクター別画面照会のHTML
   - parallelRun/
     - `node-file-runner-V3.js` - nodeでAI Cliを実行する
     - `parallel-runner.js` - node-file-runner-V3.jsを並行実行する。Phase4完了後にattachContext.jsを自動実行する

4. **指示実行用の設定**（`RDRA_Knowledge/helper_tools/settings/`）
   - `rdraConfig.js` - Phase1〜4のプロンプトマップ、各フェーズの成果物ファイル一覧、RDRASpecのプロンプトマップを定義

### メニュー構成（`node menu.js`）

| 番号 | カテゴリ | アクション |
|------|----------|------------|
| 1 | ZeroOne | Phase1から4まで実行し1_RDRAにコピーする |
| 2 | ZeroOne | Phase2から4まで実行し1_RDRAにコピーする |
| 3 | ZeroOne | Phase3から4まで実行し1_RDRAにコピーする |
| 4 | ZeroOne | Phase4から4まで実行し1_RDRAにコピーする |
| 7 | ZeroOne | フェーズ単位実行：成果物が無い最初のPhaseを実行する |
| 8 | ZeroOne | 一括要件定義：成果物が無いPhaseからRDRA定義を一括実行する |
| 11 | RDRA | RDRAGraphを表示：関連データを作成しRDRAGraphを表示 |
| 12 | RDRA | Spreadsheetに展開：RDRA定義をクリップボードにコピー |
| 21 | RDRASpec | 仕様の作成：論理データ構造/画面/ビジネスルール |
| 22 | RDRASpec | BUC・アクター別画面を表示する |
| 0 | 全般 | メニュー終了 |
| 99 | 全般 | 生成した成果物の削除 |

### データフローモデル

```
初期要望.txt（初期要求）
         ↓
    menu.js の選択
         ↓
    ├─→ Phase1〜5（LLM 実行）
    │    RDRA_Knowledge/0_RDRAZeroOne/phase1,3,4/（md入力）
    │         ↓
    │    0_RDRAZeroOne/phase1〜4/（TSV 出力）
    │         ↓
    │    Phase4完了後: attachContext.js（コンテキスト付与）
    │         ↓
    │    Phase5: rdraFileCopy.js → 1_RDRA/（統合）
    │            makeGraphData.js → if/関連データ.txt
    │
    ├─→ 可視化
    │    makeGraphData.js → RDRAGraph（外部ツール）
    │
    └─→ 仕様
         RDRA_Knowledge/2_RDRASpec/phase1/（5プロンプト並列実行）
              ↓
         RDRA_Knowledge/2_RDRASpec/phase2/（1プロンプト実行）
              ↓
         2_RDRASpec/
         ├─ 論理データモデル.md（論理データ）
         ├─ ビジネスルール.md（ルール）
         ├─ 画面照会.json（統合画面定義）
         └─ phase1/
            ├─ 画面一覧.json
            ├─ BUC画面.json
            └─ アクター画面.json
```

## アプリ起動
```bash
node menu.js
```
メニューを持つ対話型 CLI が起動します。

## TSV ファイル形式ルール
- **区切り文字**: ソースコード中の `、` は、ファイル書き出し時に実タブへ変換
- **先頭行**: ヘッダー（列名）必須
- **エンコーディング**: 常に UTF-8
- **出力先**: フェーズ出力は `0_RDRAZeroOne/phase#/`、最終出力は `1_RDRA/` または `2_RDRASpec/`
- tsvファイルは１行目をヘッダー行としてカラム名を出力する

## 実装上の重要メモ

1. **npm 依存なし**: 意図的な設計です。

2. **ファイル上書き**: 再生成時、`menu.js` は同名の既存ファイルを自動上書きします。

3. **プロセス管理**:
   - 生成したプロセスはグローバル変数で保持: `global.bucActorUIServer`
   - メニュー終了（選択肢0）時に全プロセスを安全停止する

4. **モデル設定**:
   - `モデル設定.json` で AI プロバイダとモデルを管理
   - 対応プロバイダ: claude, gemini, cursor, codex
   - `default.provider` で使用するプロバイダを切り替える

## 外部リソース

- **RDRAGraph 可視化**: https://vsa.co.jp/rdratool/graph/v0.94/
- **Google スプレッドシートテンプレート**: https://docs.google.com/spreadsheets/d/1h7J70l6DyXcuG0FKYqIpXXfdvsaqjdVFwc6jQXSh9fM/
