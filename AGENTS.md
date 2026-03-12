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
- 出力ファイルパス指定はプロジェクトルートからの相対パスで表す
- ファイル出力はプロジェクトルートの相対パス位置に出力する

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
- 初期要望.txtから4phaseでファイルを作成し、1_RDRAフォルダーにコピーする
### 「1_RDRA」フォルダー
- 0_RDRAZeroOne/phase1〜phase4で作成した成果物を保持するフォルダー
- 1_RDRA/ifフォルダーは他のツールとの連携用のファイルを保持する
### 「2_RDRASpec」フォルダー
- AIが仕様を生成し出力するフォルダー
- phase1,2ファルダ―は中間生成物を保持する
### 「RDRA_Knowledge/0_RDRAZeroOne」フォルダー
- Phase1〜4: 初期要望から４フェーズでRDRA定義を生成するプロンプトを保持

### 「RDRA_Knowledge/1_RDRA」フォルダー
要件定義手法の「RDRA」の考え方をまとめたファイルを含む
- RDRA.md: RDRAの考え方をまとめたファイル
- RDRASheet.md: RDRA定義をSpreadsheetで行う各シートのフォーマットの説明
- RDRAGraph.md: RDRAGraphのデータ構造「関連データ.txt」の説明

### 「RDRA_Knowledge/2_RDRASpec」フォルダー
- 関連データ.txtファイルからビジネスルール、画面照会、ER図を生成するPromptファイルを保持

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

2. **指示実行用の設定**（`RDRA_Knowledge/helper_tools/settings/`）
   - `rdraConfig.js` AI実行のphase毎の並列実行するPromptファイルを定義する

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
   - `default.provider` で使用するプロバイダを切り替える
## 外部リソース

- **RDRAGraph 可視化**: https://vsa.co.jp/rdratool/graph/v0.94/
- **Google スプレッドシートテンプレート**: https://docs.google.com/spreadsheets/d/1h7J70l6DyXcuG0FKYqIpXXfdvsaqjdVFwc6jQXSh9fM/
