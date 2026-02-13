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
  - `0_RDRAZeroOne/` フェーズ別のRDRA定義を出力する
  - `1_RDRA/`        最終的なRDRA定義がコピーされる
  - `2_RDRASpec/`    仕様が出力される
  - `RDRA_Knowledge/`出力フォルダーに対応するフォルダー名で存在する

**主な特徴:**
- 外部依存なし（Node.js 標準モジュールのみ）
- テキスト/TSV ベースのデータ形式（データベース不使用）
- LLM 統合ワークフローによる AI 支援分析
- マルチプラットフォーム対応（Windows, macOS）
- フェーズ分割されたモジュール構成

### 「0_RDRAZeroOne/phase1」「0_RDRAZeroOne/phase2」「0_RDRAZeroOne/phase3」「0_RDRAZeroOne/phase4」
- フェーズ別のRDRA定義を出力する
- Phase1-Phase4:フェーズ毎の成果物を保持するフォルダー
### 「1_RDRA」フォルダー
- 要件の生成物を保持するフォルダー
- フェーズ３とフェーズ４の生成物を保持するフォルダー
- 関連データ.txt:RDRAGraphのためのデータ
### 「2_RDRASpec」フォルダー
- AIが仕様を生成し出力するフォルダー
- 仕様ファイルを保持するフォルダー
### 「RDRA_Knowledge/0_RDRAZeroOne」フォルダー
- Phase1-4:初期要望から４フェーズでRDRASheetを生成する手順を示す

### 「RDRA_Knowledge/1_RDRA」フォルダー
要件定義手法の「RDRA」の考え方をまとめたファイルを含む
- RDRA.md:RDRAの考え方をまとめたファイル
- RDRASheet.md:RDRA定義をSpreadsheetで行う各シートのフォーマットの説明、各シート内のモデルは「RDRA.md」で定義したモデルに対応する
- RDRAGraph.md:RDRAGraphのデータ構造「関連データ.txt」の説明
- **RDRA 手法解説**: `RDRA_Knowledge/1_RDRA/RDRA.md` を参照
- **Google spreadsheet フォーマット解説**: `RDRA_Knowledge/1_RDRA/RDRASheet.md` を参照
- **RDRAGraph データ構造解説**: `RDRA_Knowledge/1_RDRA/RDRAGraph.md` を参照
### 「RDRA_Knowledge/2_RDRASpec」フォルダー
- 21_論理データ生成.md:RDRA定義から論理データを生成する方法を説明したファイル
- 22_ビジネスルール生成.md:ビジネスルールモジュールを定義する方法を記述したファイル
- 23_画面一覧生成.md:全画面の詳細を生成する方法を説明したファイル
- 24_BUC画面生成.md:BUC/アクター別の画面を生成する方法を説明したファイル
- 25_アクター画面生成.md:アクター別の画面を生成する方法を説明したファイル
- 26_画面照会生成.md:「画面一覧生成、BUC画面生成、アクター画面生成」を統合し画面のUI定義を生成する方法を記述したファイル
- specValidation.md:仕様の妥当性検証方法を記述したファイル

## 「helper_tools」フォルダー
ファイルの削除やコピーなどのツールを保持する

## アーキテクチャ概要
- `RDRA_Knowledge` フォルダー
  - Agent に対する実行プロンプトを保持する
  - このフォルダー配下には絶対にファイルを出力しない
  - 配下のフォルダー構成は出力するフォルダー構成と対応する
    - RDRA_Knowledge/0_RDRAZeroOne/phase1/   -> /0_RDRAZeroOne/phase1/
    - RDRA_Knowledge/0_RDRAZeroOne/phase2/   -> /0_RDRAZeroOne/phase2/
    - RDRA_Knowledge/0_RDRAZeroOne/phase3/   -> /0_RDRAZeroOne/phase3/
    - RDRA_Knowledge/0_RDRAZeroOne/phase4/   -> /0_RDRAZeroOne/phase4/

### 主要コンポーネント

1. **`menu.js`**（エントリーポイント）
   - Node.js `readline` を使った対話型 CLI メニュー
   - 全体処理とフェーズ管理を統括
   - UI エディター用サーバープロセスの並行管理
   - クロスプラットフォームのコマンド実行（Windows cmd/PowerShell, macOS Terminal）

2. **3つの主要処理ストリーム**

   **ストリーム1: ZeroOne（`0_RDRAZeroOne/`）- 要求定義**
   - Phase1: 初期要素を抽出（要求、外部システム、ビジネスポリシー、ビジネスパラメータ、業務、状態、条件）し、`./0_RDRAZeroOne/phase1/` に出力する
   - Phase2: 業務とバリエーションを定義し、`./0_RDRAZeroOne/phase2/` に出力する
   - Phase3: アクター、情報、条件、状態を精緻化し、`./0_RDRAZeroOne/phase3/` に出力する
   - Phase4: BUC とシステム概要を生成し、条件・状態・バリエーションを関係モデルとして整形して `./0_RDRAZeroOne/phase4/` に出力する
   - Phase5: Phase3/4 成果物を統合して `1_RDRA/` を更新し、`関連データ.txt` を生成する

   **ストリーム2: RDRA（`1_RDRA/`）- 要求可視化と管理**
   - RDRAGraph 可視化用の関連データ生成
   - Google スプレッドシート出力対応

   **ストリーム3: RDRASpec（`2_RDRASpec/`）- 仕様生成**
   - 論理データモデル（Markdown）
   - UI 定義（JSON）
   - ビジネスルール文書

3. **ヘルパーツール**（`RDRA_Knowledge/helper_tools/**`）
   - `makeGraphData.js` - RDRAGraph 可視化用の関連データを生成
   - `makeZeroOneData.js` - Google スプレッドシート出力用データを準備
   - `copyToClipboard.js` - クリップボードへコピー
   - `deleteFiles.js` - クリーンアップユーティリティ
   - `rdraFileCopy.js` - 各フェーズ成果物を統合コピー
   - `menuAction.js` - menuの実行指示を行う
   - `makePhase3to4.js` - phase3の成果物にコンテキストを付加してphase4にファイルを出力する
   - Web tool
     - `bucActorUI.js` - ブラウザ編集用 HTTP サーバー（port 3002）
     - `bucActorUI.html` - 画面照会用のHTML
   - parallelRun
     - `node-file-runner-V3.js` - nodeでAI Cliを実行する
     - `parallel-runner.js` - node-file-runner-V3.jsを並行実行する

4. **指示実行用の設定**（`RDRA_Knowledge/helper_tools/settings/`）
   - `rdraConfig.js` - `0_RDRAZeroOne`/`2_RDRASpec`の各フェースの実行指示ファイルを設定

### データフローモデル

```
初期要望.txt（初期要求）
         ↓
    menu.js の選択
         ↓
    ├─→ Phase1-5（LLM 実行）
    │    RDRA_Knowledge/0_RDRAZeroOne/phase1~4/（md入力）
    │         ↓
    │    0_RDRAZeroOne/phase1~4/（TSV 出力）
    │         ↓
    │    1_RDRA/（統合）
    │
    ├─→ 可視化
    │    makeGraphData.js → RDRAGraph（外部ツール）
    │
    └─→ 仕様
         RDRA_Knowledge/2_RDRASpec/phase1~2
              ↓
         2_RDRASpec/
         ├─ 論理データモデル.md（論理データ）
         ├─ 画面照会.json（画面定義）
         └─ ビジネスルール.md（ルール）
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

## 外部リソース

- **RDRAGraph 可視化**: https://vsa.co.jp/rdratool/graph/v0.94/
- **Google スプレッドシートテンプレート**: https://docs.google.com/spreadsheets/d/1h7J70l6DyXcuG0FKYqIpXXfdvsaqjdVFwc6jQXSh9fM/

