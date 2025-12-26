# AI Code Runner

Node.js で Claude / Gemini / Codex CLI を実行するツール群です。  
並行実行、リアルタイム出力、TSV抽出機能をサポートしています。

## 特徴

- **マルチプロバイダー対応**: Claude / Gemini / Codex を切り替え可能
- **並行実行**: 複数プロンプトを同時実行
- **リアルタイム出力**: プレフィックス付きで各プロセスの出力を識別
- **TSV抽出**: ```` ```tsv ```` ブロックのみをファイルに保存
- **柔軟な出力指定**: 入力と出力のペアを `{input,output}` 形式で指定可能

---

## 並行実行ランナー (parallel-runner.js)

複数のプロンプトファイルを並行実行し、リアルタイムでコンソール出力します。

### 基本的な使い方

```bash
# 従来形式（出力は output/ に自動生成）
node parallel-runner.js prompt/run1.md prompt/run2.md prompt/run3.md

# 新形式（入力と出力のペアを指定）
node parallel-runner.js "{prompt/run1.md,output/run1.tsv}" "{prompt/run2.md,output/run2.tsv}"

# 混在形式
node parallel-runner.js prompt/run1.md "{prompt/run2.md,output/custom.tsv}"
```

### オプション

| オプション | 短縮形 | 説明 |
|-----------|-------|------|
| `--provider` | `-P` | AIプロバイダー (claude / gemini / codex) |
| `--model` | `-m` | モデル指定 |
| `--timeout` | | タイムアウト（ミリ秒、デフォルト: 120000） |
| `--help` | `-h` | ヘルプ表示 |

### 出力例

```
files: 3, provider: (default), model: (default), timeout: 120000ms

🚀 並行実行開始
対象ファイル: prompt/run1.md, prompt/run2.md, prompt/run3.md
[run1] ---
[run1] Claude の応答:
[run2] ---
[run2] Claude の応答:
[run3] ---
[run3] Claude の応答:
[run3] 「初期要望.md」を理解しました...
[run3] ```tsv
[run3] アクター	役割
[run3] エンドユーザー	ウォレットアプリを利用して...
[run2] 了解しました。情報を洗い出します...
[run3] ✅ OK (15.2s) -> output/run3.tsv
[run2] ✅ OK (17.0s) -> output/run2.tsv
[run1] ✅ OK (18.6s) -> output/run1.tsv

🏁 並行実行完了 (合計: 18.6秒)

--- summary ---
OK: 3/3
total: 18.6s
```

### TSV抽出機能

出力ファイルには ```` ```tsv ```` と ```` ``` ```` で囲まれた部分のみが保存されます。

**コンソール出力（全体）:**
```
[run3] 「初期要望.md」を理解しました...
[run3] ```tsv
[run3] アクター	役割
[run3] エンドユーザー	ウォレットアプリを利用して...
[run3] ```
[run3] 以上です。
```

**ファイル出力（TSVのみ）:**
```
アクター	役割
エンドユーザー	ウォレットアプリを利用して...
```

---

## 単体実行 (node-file-runner-V3.js)

単一のプロンプトファイルを実行します。

### 基本的な使い方

```bash
# 基本（プロンプトファイルを指定）
node node-file-runner-V3.js prompt.txt

# プロバイダー指定
node node-file-runner-V3.js prompt.txt --provider claude
node node-file-runner-V3.js prompt.txt --provider gemini
node node-file-runner-V3.js prompt.txt --provider codex

# 結果をファイルに保存
node node-file-runner-V3.js prompt.txt --output result.txt

# システムプロンプトも指定
node node-file-runner-V3.js prompt.txt --system-file system.txt -o result.txt

# 実行方法を変更
node node-file-runner-V3.js prompt.txt --method default
node node-file-runner-V3.js prompt.txt --method pipe
node node-file-runner-V3.js prompt.txt --method echo
```

### オプション一覧

| オプション | 短縮形 | 説明 |
|-----------|-------|------|
| `--provider` | `-P` | プロバイダー（claude / gemini / codex） |
| `--output` | `-o` | 出力ファイル |
| `--system-file` | `-s` | システムプロンプトファイル |
| `--method` | | 実行方法（default / pipe / echo） |
| `--model` | | モデル指定 |
| `--timeout` | | タイムアウト（ms） |
| `--auto-approve-number` | | Claude番号選択式確認で入力する番号 |
| `--debug` | | デバッグ出力 |
| `--sync` | | ファイルI/Oを同期処理 |

---

## ファイル構成

```
nodeClaudeRun/
├── node-file-runner-V3.js   # 単体実行スクリプト（マルチプロバイダー対応）
├── parallel-runner.js       # 並行実行ランナー
├── prompt/                  # プロンプトファイル
│   ├── run1.md
│   ├── run2.md
│   └── run3.md
├── output/                  # 出力フォルダ（自動作成）
├── sample-system.txt        # システムプロンプト例
└── README.md
```

---

## API（プログラムから利用）

```javascript
const { 
    runAI,           // 基本実行
    runAIWithPrefix, // プレフィックス付きリアルタイム出力
    runAIWithPipe,   // パイプ方式
    runAIWithEcho    // echo方式
} = require('./node-file-runner-V3');

// 基本的な使い方
const result = await runAI('こんにちは', { provider: 'claude' });
console.log(result.stdout);

// プレフィックス付き（並行実行時に便利）
const result2 = await runAIWithPrefix('分析してください', {
    provider: 'claude',
    prefix: 'task1'  // 出力に [task1] プレフィックスが付く
});
```

---

## 注意事項

### Gemini の非対話実行

- Gemini は CLI の仕様差で stdin 方式（pipe/echo）だと対話待ちになり得るため、内部的に `--yolo` を使う非対話方式へ寄せています。
- 無効化したい場合は `options.yolo = false` をコード側から渡してください。

### Windows での実行

- PowerShell で `{input,output}` 形式を使う場合は、引数を `""` で囲んでください：
  ```bash
  node parallel-runner.js "{prompt/run1.md,output/run1.tsv}"
  ```

### 出力ディレクトリ

- 指定した出力パスのディレクトリが存在しない場合、自動的に作成されます。
