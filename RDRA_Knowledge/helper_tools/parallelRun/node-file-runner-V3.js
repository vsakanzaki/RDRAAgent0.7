/**
 * AI Code Runner V3 - マルチプロバイダー対応版
 * Claude / Gemini / Codex を切り替え可能
 * Windows/Mac/Linux 対応
 * 
 * 使用方法:
 *   node node-file-runner-V3.js prompt.txt --provider claude
 *   node node-file-runner-V3.js prompt.txt --provider gemini
 *   node node-file-runner-V3.js prompt.txt --provider codex
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const isWindows = os.platform() === 'win32';
const DEFAULT_TIMEOUT_MS = 120000;

// ========================================
// Claude 承認プロンプトの入力推定
// ========================================
function inferClaudeApprovalInput(text, options = {}) {
    if (!text) return null;

    // 番号選択式の場合に送る番号（環境差の吸収用）
    // 例: "1) Deny 2) Allow" の環境では 2 が正しいことがある
    const autoApproveNumber = Number.isFinite(options.autoApproveNumber)
        ? options.autoApproveNumber
        : (options.autoApproveNumber != null ? parseInt(options.autoApproveNumber, 10) : 1);
    const approveNumber = Number.isFinite(autoApproveNumber) && autoApproveNumber > 0 ? autoApproveNumber : 1;
    const approveNumberInput = `${approveNumber}\n`;

    // 明示的に y/n が出ている場合は y を優先（誤送信防止）
    const YN_STYLE_REGEX = /(\[y\/n\]|\(y\/n\)|\by\/n\b)/i;
    if (YN_STYLE_REGEX.test(text)) return 'y\n';

    // 番号選択っぽい場合は 1 を送る（1=Yes/Allow/Continue を想定）
    const NUMBER_SELECT_REGEX =
        /((select|choose|pick).*(option|number|choice)|enter.*(number|choice)|番号.*(入力|選択)|選択(して|してください)|入力(して|してください)|\b1\s*[\)\.].*\b2\s*[\)\.])/i;
    const NUMBERED_YES_HINT_REGEX =
        /(\b1\s*[\)\.]\s*(yes|allow|continue|approve|承認|許可|続行)|\b2\s*[\)\.]\s*(no|deny|cancel|拒否|中止))/i;
    if (NUMBER_SELECT_REGEX.test(text) || NUMBERED_YES_HINT_REGEX.test(text)) return approveNumberInput;

    // ここまで来たら形式では判別できないので、承認系の文脈だけ拾って y を返す
    const APPROVAL_CONTEXT_REGEX = /(allow|permission|permissions|approve|approval|confirm|continue\?|are you sure|許可|権限|承認|確認|続行)/i;
    if (!APPROVAL_CONTEXT_REGEX.test(text)) return null;

    // どちらとも判別できないが確認文脈に引っかかった場合のフォールバック
    return 'y\n';
}

// ========================================
// AIプロバイダー設定
// ========================================
const AI_PROVIDERS = {
    claude: {
        name: 'Claude',
        command: 'claude',
        // 引数を構築する関数
        buildArgs: (prompt, options) => {
            const args = [
                '-p',                              // print mode
                '--dangerously-skip-permissions',  // 権限確認をスキップ
                '--output-format', 'text',
            ];
            if (options.model) {
                args.push('--model', options.model);
            }
            if (options.maxTurns) {
                args.push('--max-turns', options.maxTurns.toString());
            }
            if (options.systemPrompt) {
                args.push('--system-prompt', options.systemPrompt);
            }
            // useStdinがtrueの場合はプロンプトを引数に含めない
            if (!options.useStdin && prompt) {
                args.push(prompt);
            }
            return args;
        },
        // stdin経由でプロンプトを渡すかどうか（Windowsでマルチラインプロンプト対応）
        useStdin: true,
        // 環境変数
        env: {
            NO_COLOR: '1',
            FORCE_COLOR: '0'
        }
    },
    
    gemini: {
        name: 'Gemini',
        command: 'gemini',
        buildArgs: (prompt, options) => {
            // Gemini CLI の引数形式（2025系）
            // - 位置引数が「一発実行（one-shot）」のプロンプト
            // - -p/--prompt は stdin に追記する旧仕様で、位置引数と併用するとエラーになる
            // 対話確認は --yolo で抑止する
            const args = [];
            const finalPrompt = options.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt;
            if (options.model) {
                args.push('--model', options.model);
            }
            // 実行前確認などを出さない（安全性は CLI 側/運用側で担保する）
            if (options.yolo !== false) {
                args.push('--yolo');
            }
            // 非対話（one-shot）プロンプトは位置引数で渡す
            args.push(finalPrompt);
            return args;
        },
        useStdin: false,
        env: {
            NO_COLOR: '1',
            // 一部 CLI が対話を抑止するために CI を参照することがある
            CI: '1'
        }
    },
    
    codex: {
        name: 'Codex',
        command: 'codex',
        buildArgs: (prompt, options) => {
            // OpenAI Codex CLI の引数形式
            const args = [
                '--approval-mode', 'full-auto',  // 自動承認モード
            ];
            if (options.model) {
                args.push('--model', options.model);
            }
            // プロンプトを渡す
            args.push(prompt);
            return args;
        },
        useStdin: false,
        env: {
            NO_COLOR: '1'
        }
    }
};

// デフォルトプロバイダー
const DEFAULT_PROVIDER = 'claude';

// ========================================
// プロバイダー一覧を取得
// ========================================
function getAvailableProviders() {
    return Object.keys(AI_PROVIDERS);
}

// ========================================
// ファイルからプロンプトを読み込み（同期/非同期対応）
// ========================================
function readPromptFromFileSync(filePath) {
    try {
        const absolutePath = path.resolve(filePath);
        const content = fs.readFileSync(absolutePath, 'utf-8');
        return content.trim();
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`ファイルが見つかりません: ${filePath}`);
        }
        throw new Error(`ファイル読み込みエラー: ${error.message}`);
    }
}

async function readPromptFromFile(filePath, sync = false) {
    if (sync) {
        return readPromptFromFileSync(filePath);
    }
    try {
        const absolutePath = path.resolve(filePath);
        const content = await readFileAsync(absolutePath, 'utf-8');
        return content.trim();
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`ファイルが見つかりません: ${filePath}`);
        }
        throw new Error(`ファイル読み込みエラー: ${error.message}`);
    }
}

// ========================================
// 結果をファイルに保存（同期/非同期対応）
// ========================================
function saveResultToFileSync(filePath, content) {
    const absolutePath = path.resolve(filePath);
    fs.writeFileSync(absolutePath, content, 'utf-8');
    console.log(`結果を保存しました（同期）: ${absolutePath}`);
}

async function saveResultToFile(filePath, content, sync = false) {
    if (sync) {
        return saveResultToFileSync(filePath, content);
    }
    const absolutePath = path.resolve(filePath);
    await writeFileAsync(absolutePath, content, 'utf-8');
    console.log(`結果を保存しました: ${absolutePath}`);
}

// ========================================
// 統一AI実行関数（すべてのプロバイダーで共通）
// ========================================
async function runAI(prompt, options = {}) {
    const providerName = options.provider || DEFAULT_PROVIDER;
    const provider = AI_PROVIDERS[providerName];
    
    if (!provider) {
        throw new Error(`不明なプロバイダー: ${providerName}\n利用可能: ${getAvailableProviders().join(', ')}`);
    }
    
    return new Promise((resolve, reject) => {
        // useStdinがtrueの場合はプロンプトを引数に含めない
        const promptForArgs = provider.useStdin ? '' : prompt;
        const args = provider.buildArgs(promptForArgs, options);
        // 子プロセスを起動
        const child = spawn(provider.command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,  // Windows で必須
            env: {
                ...process.env,
                ...provider.env
            }
        });
        
        let stdout = '';
        let stderr = '';
        
        // タイムアウト設定
        const timeout = setTimeout(() => {
            console.log('\n⏰ タイムアウト');
            child.kill();
            reject(new Error('タイムアウト'));
        }, options.timeout || DEFAULT_TIMEOUT_MS);
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            if (options.debug) {
                console.error('[stderr]', text);
            }
        });
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            console.log('');
            
            if (code === 0) {
                resolve({ stdout, stderr, code, provider: providerName });
            } else {
                if (stderr) {
                    console.error('エラー出力:', stderr);
                }
                reject(new Error(`終了コード ${code}`));
            }
        });
        
        child.on('error', (err) => {
            clearTimeout(timeout);
            reject(new Error(`実行エラー: ${err.message}`));
        });
        
        // stdin経由でプロンプトを渡す場合
        if (provider.useStdin) {
            child.stdin.write(prompt);
            child.stdin.end();
        }
    });
}

// ========================================
// パイプ方式でAI実行（代替方法）
// ========================================
async function runAIWithPipe(prompt, options = {}) {
    const providerName = options.provider || DEFAULT_PROVIDER;
    const provider = AI_PROVIDERS[providerName];
    
    if (!provider) {
        throw new Error(`不明なプロバイダー: ${providerName}`);
    }

    // Gemini は「stdin を読む」前提の CLI でない場合があり、pipe 方式だと対話待ち/空入力になりやすい。
    // そのため Gemini は default 方式（= -p で非対話）にフォールバックする。
    if (providerName === 'gemini') {
        return runAI(prompt, options);
    }
    
    return new Promise((resolve, reject) => {
        // パイプ用の引数（プロンプトなし）
        const args = provider.buildArgs('', options).filter(arg => arg !== '');        
        const child = spawn(provider.command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: {
                ...process.env,
                ...provider.env
            }
        });
        
        let stdout = '';
        let stderr = '';
        
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error('タイムアウト'));
        }, options.timeout || 120000);
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            console.log('');
            if (code === 0) {
                resolve({ stdout, stderr, code, provider: providerName });
            } else {
                reject(new Error(`終了コード ${code}: ${stderr}`));
            }
        });
        
        child.on('error', reject);
        
        // 標準入力にプロンプトを書き込んで閉じる
        child.stdin.write(prompt);
        child.stdin.end();
    });
}

// ========================================
// echo でパイプする方法（互換性重視）
// ========================================
async function runAIWithEcho(prompt, options = {}) {
    const providerName = options.provider || DEFAULT_PROVIDER;
    const provider = AI_PROVIDERS[providerName];
    
    if (!provider) {
        throw new Error(`不明なプロバイダー: ${providerName}`);
    }

    // Gemini は echo/pipe で stdin に流す方式より、位置引数 one-shot の方が確実。
    // そのため echo 方式も default 方式へフォールバックする。
    if (providerName === 'gemini') {
        return runAI(prompt, options);
    }
    
    return new Promise((resolve, reject) => {
        const base64Prompt = Buffer.from(prompt).toString('base64');
        
        // プロバイダーごとの基本オプションを取得
        let providerArgs = '';
        if (providerName === 'claude') {
            providerArgs = '-p --dangerously-skip-permissions';
        } else if (providerName === 'gemini') {
            providerArgs = '';
        } else if (providerName === 'codex') {
            providerArgs = '--approval-mode full-auto';
        }
        
        let command;
        if (isWindows) {
            command = `powershell -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Prompt}')) | ${provider.command} ${providerArgs}"`;
        } else {
            command = `echo "${base64Prompt}" | base64 -d | ${provider.command} ${providerArgs}`;
        }
        
        const child = spawn(command, [], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: {
                ...process.env,
                ...provider.env
            }
        });
        
        let stdout = '';
        let stderr = '';
        
        const timeout = setTimeout(() => {
            child.kill();
            reject(new Error('タイムアウト'));
        }, options.timeout || 120000);
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            console.log('');
            if (code === 0) {
                resolve({ stdout, stderr, code, provider: providerName });
            } else {
                reject(new Error(`終了コード ${code}: ${stderr}`));
            }
        });
        
        child.on('error', reject);
    });
}

// ========================================
// プレフィックス付きリアルタイム出力でAI実行（並行実行対応）
// リアルタイム優先: データ到着時に即座に出力
// ========================================
async function runAIWithPrefix(prompt, options = {}) {
    const providerName = options.provider || DEFAULT_PROVIDER;
    const provider = AI_PROVIDERS[providerName];
    
    if (!provider) {
        throw new Error(`不明なプロバイダー: ${providerName}\n利用可能: ${getAvailableProviders().join(', ')}`);
    }
    
    // プレフィックス設定（並行実行時の識別用）
    const prefix = options.prefix || '';
    const prefixStr = prefix ? `[${prefix}] ` : '';
    
    return new Promise((resolve, reject) => {
        const promptForArgs = provider.useStdin ? '' : prompt;
        const args = provider.buildArgs(promptForArgs, options);
        
        process.stdout.write(`${prefixStr}---\n`);
        process.stdout.write(`${prefixStr}${provider.name} の応答:\n`);
        
        const child = spawn(provider.command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: {
                ...process.env,
                ...provider.env
            }
        });        
        let stdout = '';
        let stderr = '';
        let needsPrefix = true;  // 次の出力にプレフィックスが必要かどうか
        
        // タイムアウト設定
        const timeout = setTimeout(() => {
            process.stdout.write(`\n${prefixStr}⏰ タイムアウト\n`);
            child.kill();
            reject(new Error('タイムアウト'));
        }, options.timeout || DEFAULT_TIMEOUT_MS);
        
        // リアルタイム優先: データ到着時に即座に出力
        const outputRealtime = (data) => {
            const text = data.toString();
            stdout += text;
            
            // 文字単位で処理し、改行後にプレフィックスを挿入
            let output = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (needsPrefix) {
                    output += prefixStr;
                    needsPrefix = false;
                }
                output += char;
                if (char === '\n') {
                    needsPrefix = true;
                }
            }
            process.stdout.write(output);
        };
        
        child.stdout.on('data', outputRealtime);
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            stderr += text;
            if (options.debug) {
                // stderr もリアルタイムで出力
                process.stderr.write(`${prefixStr}[stderr] ${text}`);
            }
        });
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            
            // 最後の行が改行で終わっていない場合は改行を追加
            if (!needsPrefix) {
                process.stdout.write('\n');
            }
            
            if (code === 0) {
                resolve({ stdout, stderr, code, provider: providerName });
            } else {
                if (stderr) {
                    process.stderr.write(`${prefixStr}エラー出力: ${stderr}\n`);
                }
                reject(new Error(`終了コード ${code}`));
            }
        });
        
        child.on('error', (err) => {
            clearTimeout(timeout);
            reject(new Error(`${prefixStr}実行エラー: ${err.message}`));
        });
        
        // stdin経由でプロンプトを渡す場合
        if (provider.useStdin) {
            child.stdin.write(prompt);
            child.stdin.end();
        }
    });
}

// ========================================
// メイン実行
// ========================================
async function main() {
    const args = process.argv.slice(2);
    const availableProviders = getAvailableProviders().join(', ');
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
AI Code Runner V3（マルチプロバイダー対応）

使い方:
  node node-file-runner-V3.js <prompt-file> [options]

オプション:
  --provider, -P <name>      AIプロバイダー (${availableProviders})
                             デフォルト: ${DEFAULT_PROVIDER}
  --output, -o <path>        結果を保存するファイル
  --system-file, -s <path>   システムプロンプトファイル
  --method <method>          実行方法 (default, pipe, echo)
  --model <model>            モデルを指定
  --auto-approve-number <n>  Claude の番号選択式確認で入力する番号（デフォルト: 1）
  --timeout <ms>             タイムアウト（ミリ秒、デフォルト: 120000）
  --sync                     ファイルI/Oを同期処理で実行
  --debug                    デバッグ出力を表示
  --help, -h                 このヘルプを表示

例:
  node node-file-runner-V3.js prompt.txt
  node node-file-runner-V3.js prompt.txt --provider gemini
  node node-file-runner-V3.js prompt.txt --provider codex -o result.txt
  node node-file-runner-V3.js prompt.txt -P claude --method pipe

利用可能なプロバイダー:
  claude  - Anthropic Claude CLI
  gemini  - Google Gemini CLI
  codex   - OpenAI Codex CLI
        `);
        return;
    }

    // オプション解析
    let promptFile = '';
    let options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--provider' || arg === '-P') {
            options.provider = args[++i];
        } else if (arg === '--output' || arg === '-o') {
            options.outputFile = args[++i];
        } else if (arg === '--system-file' || arg === '-s') {
            options.systemPromptFile = args[++i];
        } else if (arg === '--method') {
            options.method = args[++i];
        } else if (arg === '--model') {
            options.model = args[++i];
        } else if (arg === '--timeout') {
            options.timeout = parseInt(args[++i], 10);
        } else if (arg === '--auto-approve-number') {
            options.autoApproveNumber = parseInt(args[++i], 10);
        } else if (arg === '--debug') {
            options.debug = true;
        } else if (arg === '--sync') {
            options.sync = true;
        } else if (!arg.startsWith('-') && !promptFile) {
            promptFile = arg;
        }
    }

    if (!promptFile) {
        console.error('エラー: プロンプトファイルを指定してください');
        process.exit(1);
    }

    // プロバイダー検証
    const providerName = options.provider || DEFAULT_PROVIDER;
    if (!AI_PROVIDERS[providerName]) {
        console.error(`エラー: 不明なプロバイダー "${providerName}"`);
        console.error(`利用可能: ${availableProviders}`);
        process.exit(1);
    }

    try {
        const useSync = options.sync || false;
        if (useSync) {
            console.log('モード: 同期処理');
        }

        // プロンプト読み込み
        const prompt = await readPromptFromFile(promptFile, useSync);
        console.log(`プロンプトファイル: ${path.resolve(promptFile)}`);
        console.log(`プロンプト長: ${prompt.length} 文字`);
        console.log(`プロバイダー: ${AI_PROVIDERS[providerName].name}`);

        // システムプロンプト読み込み
        if (options.systemPromptFile) {
            options.systemPrompt = await readPromptFromFile(options.systemPromptFile, useSync);
            console.log(`システムプロンプトファイル: ${path.resolve(options.systemPromptFile)}`);
        }

        // 実行
        let result;
        const method = options.method || 'default';
        console.log(`方法: ${method}`);

        switch (method) {
            case 'pipe':
                result = await runAIWithPipe(prompt, options);
                break;
            case 'echo':
                result = await runAIWithEcho(prompt, options);
                break;
            default:
                result = await runAI(prompt, options);
        }

        // 出力ファイルに保存
        if (options.outputFile) {
            await saveResultToFile(options.outputFile, result.stdout, useSync);
        }

        console.log('✅ 完了');
    } catch (error) {
        console.error('❌ エラー:', error.message);
        console.error('');
        console.error('トラブルシューティング:');
        console.error(`1. ${providerName} コマンドが利用可能か確認`);
        console.error(`2. 認証が設定されているか確認`);
        console.error('3. --method pipe または --method echo を試す');
        process.exit(1);
    }
}

// ========================================
// エクスポート
// ========================================
module.exports = {
    // 統一関数
    runAI,
    runAIWithPipe,
    runAIWithEcho,
    runAIWithPrefix,  // 並行実行用（プレフィックス付きリアルタイム出力）

    // テスト/検証用
    inferClaudeApprovalInput,
    
    // ファイル操作
    readPromptFromFile,
    readPromptFromFileSync,
    saveResultToFile,
    saveResultToFileSync,
    
    // プロバイダー情報
    AI_PROVIDERS,
    DEFAULT_PROVIDER,
    getAvailableProviders,
    
    // 後方互換性のため（V2と同じ名前でエクスポート）
    runClaude: (prompt, options = {}) => runAI(prompt, { ...options, provider: 'claude' }),
    runClaudeWithPipe: (prompt, options = {}) => runAIWithPipe(prompt, { ...options, provider: 'claude' }),
    runClaudeWithEcho: (prompt, options = {}) => runAIWithEcho(prompt, { ...options, provider: 'claude' }),
};

if (require.main === module) {
    main().catch(console.error);
}

