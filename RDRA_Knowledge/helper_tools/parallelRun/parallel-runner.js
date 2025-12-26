/**
 * 並行実行ランナー（シンプル版）
 * 
 * 使用方法:
 *   node parallel-runner.js file1.txt file2.txt file3.txt
 *   node parallel-runner.js {prompt/run1.md,output/run1.tsv} {prompt/run2.md,output/run2.tsv}
 *   node parallel-runner.js file1.txt file2.txt --provider gemini
 */

const { runAI, runAIWithPrefix } = require('./node-file-runner-V3');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

// 出力フォルダ（デフォルト）
const OUTPUT_DIR = 'output';

// ========================================
// ヘルプ表示
// ========================================
function showHelp() {
    console.log(`
並行実行ランナー（シンプル版）

使い方:
  node parallel-runner.js <files...> [options]
  node parallel-runner.js {input,output} {input,output} ... [options]

ファイル指定形式:
  file.txt                    入力のみ（出力は output/file.txt に自動生成）
  {input.md,output.tsv}       入力と出力のペアを指定

オプション:
  --provider, -P <name>   AIプロバイダー (claude, gemini, codex)
  --model, -m <model>     モデルを指定
  --timeout <ms>          タイムアウト（ミリ秒、デフォルト: 120000）
  --help, -h              このヘルプを表示

例:
  node parallel-runner.js file1.txt file2.txt file3.txt
  node parallel-runner.js {prompt/run1.md,output/run1.tsv} {prompt/run2.md,output/run2.tsv}
  node parallel-runner.js file1.txt --provider gemini
`);
}

// ========================================
// {input,output} 形式をパース
// ========================================
function parseFilePair(arg) {
    // {input,output} 形式かどうかチェック
    const match = arg.match(/^\{(.+),(.+)\}$/);
    if (match) {
        return {
            input: match[1].trim(),
            output: match[2].trim(),
        };
    }
    // 通常のファイルパス（出力は自動生成）
    return {
        input: arg,
        output: null,  // 後で自動生成
    };
}

// ========================================
// コマンドライン引数解析
// ========================================
function parseArgs(argv) {
    const args = argv.slice(2);
    const config = {
        filePairs: [],  // { input, output } のペア配列
        options: {
            timeout: 120000, // 2分
        },
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            showHelp();
            process.exit(0);
        } else if (arg === '--provider' || arg === '-P') {
            config.options.provider = args[++i];
        } else if (arg === '--model' || arg === '-m') {
            config.options.model = args[++i];
        } else if (arg === '--timeout') {
            config.options.timeout = parseInt(args[++i], 10);
        } else if (!arg.startsWith('-')) {
            config.filePairs.push(parseFilePair(arg));
        }
    }

    return config;
}

// ========================================
// ファイルからプロンプトを読み込み
// ========================================
function readPrompt(filePath) {
    const absolutePath = path.resolve(filePath);
    return fs.readFileSync(absolutePath, 'utf-8').trim();
}

// ========================================
// 出力ディレクトリを確保（指定パスに対応）
// ========================================
async function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    try {
        await mkdirAsync(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

// ========================================
// デフォルト出力ファイルパスを生成
// ========================================
function getDefaultOutputPath(inputFilePath) {
    const baseName = path.basename(inputFilePath);
    return path.join(OUTPUT_DIR, baseName);
}

// ========================================
// ```tsv ～ ``` で囲まれた部分を抽出
// ========================================
function extractTsvContent(text) {
    // ```tsv と ``` で囲まれた部分を抽出（複数ある場合は全て結合）
    const regex = /```tsv\n?([\s\S]*?)```/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        matches.push(match[1].trim());
    }
    
    if (matches.length > 0) {
        // 複数のTSVブロックがある場合は改行で結合
        return matches.join('\n');
    }
    
    // TSVブロックが見つからない場合は元のテキストを返す
    return text;
}

// ========================================
// 単一のプロンプトを実行
// ========================================
async function executePrompt(filePair, options = {}) {
    const { input: inputPath, output: outputPath } = filePair;
    const startTime = Date.now();
    const baseName = path.basename(inputPath, path.extname(inputPath));
    
    // 出力パスを決定（指定がなければデフォルト）
    const finalOutputPath = outputPath || getDefaultOutputPath(inputPath);

    try {
        const prompt = readPrompt(inputPath);
        
        // プレフィックスを設定（ファイル名をベースに）
        const execOptions = {
            ...options,
            prefix: baseName,
        };
        
        // プレフィックス付きリアルタイム出力モードで実行
        const result = await runAIWithPrefix(prompt, execOptions);
        
        // 出力ディレクトリを確保
        await ensureDir(finalOutputPath);
        
        // ```tsv ～ ``` で囲まれた部分を抽出してファイルに保存
        const tsvContent = extractTsvContent(result.stdout);
        await writeFileAsync(finalOutputPath, tsvContent, 'utf-8');
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[${baseName}] ✅ OK (${elapsed}s) -> ${finalOutputPath}`);
        
        return {
            input: inputPath,
            output: finalOutputPath,
            success: true,
            elapsed: elapsed,
        };
    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.error(`[${baseName}] ❌ NG (${elapsed}s) ${error.message}`);
        
        return {
            input: inputPath,
            output: finalOutputPath,
            success: false,
            error: error.message,
            elapsed: elapsed,
        };
    }
}

// ========================================
// 並行実行
// ========================================
async function executeParallel(filePairs, options = {}) {
    if (filePairs.length === 0) {
        console.log('\n⏭️ 実行するファイルがありません');
        return [];
    }
    
    console.log('\n🚀 並行実行開始');
    const inputFiles = filePairs.map(fp => fp.input).join(', ');
    console.log(`対象ファイル: ${inputFiles}`);
    
    const startTime = Date.now();
    
    const results = await Promise.all(
        filePairs.map(filePair => executePrompt(filePair, options))
    );
    
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🏁 並行実行完了 (合計: ${totalElapsed}秒)`);
    
    return results;
}
// ========================================
// メイン実行
// ========================================
async function main() {
    const config = parseArgs(process.argv);
    
    // ファイルが指定されていない場合
    if (config.filePairs.length === 0) {
        console.error('エラー: 実行するファイルが指定されていません（--help を参照）');
        process.exit(1);
    }
    
    // 設定表示
    console.log(`files: ${config.filePairs.length}, provider: ${config.options.provider || '(default)'}, model: ${config.options.model || '(default)'}, timeout: ${config.options.timeout}ms`);
    
    const totalStartTime = Date.now();
    
    try {
        // 並行実行
        await executeParallel(config.filePairs, config.options);
    } catch (error) {
        console.error('fatal:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
