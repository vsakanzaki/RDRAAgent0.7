/**
 * AI Runner (library)
 * - parallel-runner.js から利用されることを想定した最小実装
 * - 単体CLIとしての実行はサポートしない（不要機能を削除）
 */

const { spawn } = require('child_process');

const DEFAULT_TIMEOUT_MS = 120000;

// ========================================
// AIプロバイダー設定
// ========================================
const AI_PROVIDERS = {
    claude: {
        name: 'Claude',
        command: 'claude',
        buildArgs: (_prompt, options) => {
            const args = [
                '-p',                              // print mode
                '--output-format', 'text',
                '--permission-mode', 'bypassPermissions',
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
            // claude は stdin で渡す（Windowsでマルチライン安定）
            return args;
        },
        useStdin: true,
        env: {
            NO_COLOR: '1',
            FORCE_COLOR: '0',
        },
    },

    gemini: {
        name: 'Gemini',
        command: 'gemini',
        buildArgs: (prompt, options) => {
            const args = [];
            const finalPrompt = options.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt;
            if (options.model) {
                args.push('--model', options.model);
            }
            // 実行前確認などを出さない
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
            CI: '1',
        },
    },

    codex: {
        name: 'Codex',
        command: 'codex',
        buildArgs: (prompt, options) => {
            const args = [
                '--approval-mode', 'full-auto',
            ];
            if (options.model) {
                args.push('--model', options.model);
            }
            args.push(prompt);
            return args;
        },
        useStdin: false,
        env: {
            NO_COLOR: '1',
        },
    },
};

const DEFAULT_PROVIDER = 'claude';

function getAvailableProviders() {
    return Object.keys(AI_PROVIDERS);
}

// ========================================
// プレフィックス付きリアルタイム出力でAI実行（並行実行対応）
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

        const child = spawn(provider.command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true, // Windows互換のため
            env: {
                ...process.env,
                ...provider.env,
            },
        });

        let stdout = '';
        let stderr = '';
        let needsPrefix = true;
        let needsPrefixErr = true;

        const timeout = setTimeout(() => {
            process.stdout.write(`\n${prefixStr}⏰ タイムアウト\n`);
            child.kill();
            reject(new Error('タイムアウト'));
        }, options.timeout || DEFAULT_TIMEOUT_MS);

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

        const errorRealtime = (data) => {
            const text = data.toString();
            stderr += text;

            // 文字単位で処理し、改行後にプレフィックスを挿入
            let output = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (needsPrefixErr) {
                    output += `${prefixStr}[stderr] `;
                    needsPrefixErr = false;
                }
                output += char;
                if (char === '\n') {
                    needsPrefixErr = true;
                }
            }
            process.stderr.write(output);
        };

        child.stdout.on('data', outputRealtime);

        // stderrは常にリアルタイム出力（並行実行でも識別できるようprefix付与）
        child.stderr.on('data', errorRealtime);

        child.on('close', (code) => {
            clearTimeout(timeout);

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

module.exports = {
    runAIWithPrefix,
    AI_PROVIDERS,
    DEFAULT_PROVIDER,
    getAvailableProviders,
};


