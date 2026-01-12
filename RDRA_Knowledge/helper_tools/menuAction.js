const { exec, spawn } = require('child_process');
const fs = require('fs');


// RDRA設定（プロンプトマップ／成果物ファイル定義）は settings に集約
const {
    phase1PromptMap,
    phase2PromptMap,
    phase3PromptMap,
    phase4PromptMap,
    specPhase1PromptMap,
    specPhase2PromptMap,
    phase1Files,
    phase2Files,
    phase3Files,
    phase4Files,
    rdraFiles,
    specFiles,
} = require('./settings/rdraConfig');

// Phase5：システム概要生成プロンプト
const phase5SystemOverviewPrompt = 'RDRA_Knowledge/0_RDRAZeroOne/phase5/システム概要生成.md';

/**
 * menu.js から「実行部分」を切り出したアクション実装。
 * - createMenuAction({ rl, promptUser }) により実行ディスパッチ関数を生成する
 */
function createMenuAction({ rl, promptUser }) {
    // メニュー「2」(一括要件定義)の自動連続実行フラグ
    let isAllPhaseAutoRunning = false;

    // メニュー「1」：Phase4 実行後に Phase5 を自動実行するためのフラグ
    let autoRunPhase5AfterPhase4 = false;

    // メニュー「2」：今回の一括実行で Phase4 を実行した場合、1_RDRA が既に存在していても Phase5 を1回実行する
    let forceRunPhase5AfterPhase4InAllPhase = false;

    /**
     * プラットフォームに応じたクリップボードコマンドを生成する
     * @param {string} filePath - コピーするファイルのパス
     * @returns {string|null} クリップボードコマンド文字列、またはサポートされていない場合null
     */
    function getClipboardCommand(filePath) {
        const platform = process.platform;
        if (platform === 'win32') {
            // Windowsの場合：PowerShellを使用
            const windowsPath = filePath.replace(/\//g, '\\');
            return `powershell -Command "Get-Content -Path ${windowsPath} -Encoding UTF8 | Set-Clipboard"`;
        } else if (platform === 'darwin') {
            // macOSの場合：pbcopyを使用
            return `cat "${filePath}" | pbcopy`;
        } else {
            return null;
        }
    }

    /**
     * プラットフォームに応じたブラウザ起動コマンドを生成する
     * @param {string} url - 開くURL
     * @returns {string|null} ブラウザ起動コマンド文字列、またはサポートされていない場合null
     */
    function getBrowserCommand(url) {
        const platform = process.platform;
        if (platform === 'win32') {
            // Windowsの場合：startコマンドを使用
            return `powershell -Command "Start-Process ${url}"`;
        } else if (platform === 'darwin') {
            // macOSの場合：openコマンドを使用
            return `open "${url}"`;
        } else {
            return null;
        }
    }

    /**
     * 指定した配列のファイル名が全て指定フォルダー内に存在するか確認する
     * @param {string[]} fileNames - チェックするファイル名の配列
     * @param {string} folderPath - 検査するフォルダーのパス
     * @returns {boolean} - 全て存在すればtrue、1つでもなければfalse
     */
    function checkAllFilesExistInFolder(fileNames, folderPath) {
        try {
            const filesInDir = fs.readdirSync(folderPath);
            return fileNames.every(file => filesInDir.includes(file));
        } catch (err) {
            console.error(`ディレクトリの読み込みエラー: ${err}`);
            return false;
        }
    }

    function waitForEnterThenNext() {
        console.log('続行するにはEnterキーを押してください...');
        process.stdin.once('data', () => {
            promptUser();
        });
    }

    /**
     * Phase番号に対応するファイル配列とプロンプトマップを取得
     */
    function getPhaseConfig(phaseNumber) {
        const configs = {
            1: { files: phase1Files, promptMap: phase1PromptMap },
            2: { files: phase2Files, promptMap: phase2PromptMap },
            3: { files: phase3Files, promptMap: phase3PromptMap },
            4: { files: phase4Files, promptMap: phase4PromptMap }
        };
        return configs[phaseNumber];
    }

    /**
     * 指定されたPhaseを並列実行する（parallel-runner.jsを使用）
     * @param {number} phaseNumber - 実行するPhase番号 (1-4)
     */
    function executePhaseParallel(phaseNumber) {
	    const fs = require('fs');
	    	    
	    console.log(`Phase${phaseNumber}を並列実行します...`);
	    
	    // 出力フォルダが存在しない場合は作成
	    const outputDir = `0_RDRAZeroOne/phase${phaseNumber}`;
	    if (!fs.existsSync(outputDir)) {
	        fs.mkdirSync(outputDir, { recursive: true });
	        console.log(`出力フォルダを作成しました: ${outputDir}`);
	    }
	    
	    // 既にphaseが完了しているか確認
	    const phaseExist = checkAllFilesExistInFolder(config.files, outputDir);
	    if (phaseExist) {
	        console.log(`phase${phaseNumber}は既に定義されています。`);
	        // phase4の実行が発生していないので、phase5自動実行フラグは落とす
	        if (phaseNumber === 4) {
	            autoRunPhase5AfterPhase4 = false;
	        }
	        // メニュー2の自動連続実行中は次の不足フェーズへ進める
	        if (isAllPhaseAutoRunning) {
	            executeMissingPhasesTo5();
	            return;
	        }
	        waitForEnterThenNext();
	        return;
	    }
	    
	    // parallel-runner.jsに渡す引数を構築（プロンプトファイルのパスのみ）
	    const args = config.promptMap.map(pair => pair.prompt);
	    
	    console.log('実行するプロンプトファイル:');
	    config.promptMap.forEach(pair => {
	        console.log(`  ${pair.prompt}`);
	    });
	    console.log('');
	    
	    const child = spawn('node', [
	        'RDRA_Knowledge/helper_tools/parallelRun/parallel-runner.js',
	        ...args
	    ], {
	        stdio: 'inherit',
	        shell: true
	    });
	    
	    child.on('close', (code) => {
	        if (code === 0) {
	            console.log('');
	            console.log(`Phase${phaseNumber}の並列実行が完了しました。`);
	            // メニュー2の自動連続実行中は次の不足フェーズへ
	            if (isAllPhaseAutoRunning) {
	                // Phase4 を今回実行した場合は、1_RDRA が既に揃っていても Phase5 を更新する
	                if (phaseNumber === 4) {
	                    forceRunPhase5AfterPhase4InAllPhase = true;
	                }
	                executeMissingPhasesTo5();
	                return;
	            }
	            // メニュー1：Phase4を実行した直後はPhase5を自動実行
	            if (phaseNumber === 4 && autoRunPhase5AfterPhase4) {
	                autoRunPhase5AfterPhase4 = false;
	                executePhase5Auto();
	                return;
	            }
	        } else {
	            console.error(`Phase${phaseNumber}の並列実行がエラーで終了しました。終了コード: ${code}`);
	            isAllPhaseAutoRunning = false;
	            autoRunPhase5AfterPhase4 = false;
	            forceRunPhase5AfterPhase4InAllPhase = false;
	        }
	        waitForEnterThenNext();
	    });
	    
	    child.on('error', (error) => {
	        console.error(`エラー: ${error.message}`);
	        isAllPhaseAutoRunning = false;
	        autoRunPhase5AfterPhase4 = false;
	        forceRunPhase5AfterPhase4InAllPhase = false;
	        waitForEnterThenNext();
	    });
    }

    /**
     * Phase5を実行する（1_RDRAへコピー＋システム概要.json作成＋関連データ.txt作成）
     */
    function executePhase5Auto() {
	    console.log('Phase5を実行します（1_RDRAへコピー + システム概要.json作成 + 関連データ.txt作成）...');

	    // 1) Phase3/4の生成ファイルを1_RDRAへコピー
	    const copyProc = spawn('node', ['RDRA_Knowledge/helper_tools/rdraFileCopy.js'], {
	        stdio: 'inherit',
	        shell: true
	    });

	    copyProc.on('close', (code) => {
	        if (code !== 0) {
	            console.error(`Phase5(コピー)がエラーで終了しました。終了コード: ${code}`);
	            isAllPhaseAutoRunning = false;
	            forceRunPhase5AfterPhase4InAllPhase = false;
	            waitForEnterThenNext();
	            return;
	        }

	        console.log('Phase5(コピー)が完了しました。システム概要.jsonを作成します...');

	        // 2) システム概要.json 生成（Claude Code等にファイル作成させる）
	        const overviewProc = spawn('node', [
	            'RDRA_Knowledge/helper_tools/parallelRun/parallel-runner.js',
	            phase5SystemOverviewPrompt
	        ], {
	            stdio: 'inherit',
	            shell: true
	        });

	        overviewProc.on('close', (code2) => {
	            if (code2 === 0) {
	                console.log('Phase5(システム概要)が完了しました。関連データ.txtを作成します...');
	            } else {
	                console.error(`Phase5(システム概要)がエラーで終了しました。終了コード: ${code2}`);
	                isAllPhaseAutoRunning = false;
	            }
	            
	            // 3) 関連データ.txt 作成（makeGraphData.js が 1_RDRA/関連データ.txt を出力する）
	            const graphDataProc = spawn('node', ['RDRA_Knowledge/helper_tools/makeGraphData.js'], {
	                stdio: 'inherit',
	                shell: true
	            });
	            
	            graphDataProc.on('close', (code3) => {
	                if (code3 === 0) {
	                    console.log('Phase5(関連データ)が完了しました。');
	                    if (isAllPhaseAutoRunning) {
	                        executeMissingPhasesTo5();
	                        return;
	                    }
	                } else {
	                    console.error(`Phase5(関連データ)がエラーで終了しました。終了コード: ${code3}`);
	                    isAllPhaseAutoRunning = false;
	                }
	                waitForEnterThenNext();
	            });
	            
	            graphDataProc.on('error', (error) => {
	                console.error(`Phase5(関連データ) エラー: ${error.message}`);
	                isAllPhaseAutoRunning = false;
	                forceRunPhase5AfterPhase4InAllPhase = false;
	                waitForEnterThenNext();
	            });
	        });

	        overviewProc.on('error', (error) => {
	            console.error(`Phase5(システム概要) エラー: ${error.message}`);
	            isAllPhaseAutoRunning = false;
	            forceRunPhase5AfterPhase4InAllPhase = false;
	            waitForEnterThenNext();
	        });
	    });

	    copyProc.on('error', (error) => {
	        console.error(`Phase5(コピー) エラー: ${error.message}`);
	        isAllPhaseAutoRunning = false;
	        forceRunPhase5AfterPhase4InAllPhase = false;
	        waitForEnterThenNext();
	    });
    }

    /**
     * メニュー2：Phase1?5を上から確認し、未定義の最初のフェーズから最終まで連続実行する
     */
    function executeMissingPhasesTo5() {
	    // Phase1?4：不足している最初のフェーズを実行
	    if (!checkAllFilesExistInFolder(phase1Files, '0_RDRAZeroOne/phase1')) { executePhaseParallel(1); return; }
	    if (!checkAllFilesExistInFolder(phase2Files, '0_RDRAZeroOne/phase2')) { executePhaseParallel(2); return; }
	    if (!checkAllFilesExistInFolder(phase3Files, '0_RDRAZeroOne/phase3')) { executePhaseParallel(3); return; }
	    if (!checkAllFilesExistInFolder(phase4Files, '0_RDRAZeroOne/phase4')) { executePhaseParallel(4); return; }

	    // Phase5：1_RDRA が揃っていなければ実行（コピー + システム概要）
	    // ただし、メニュー2で Phase4 を今回実行した場合は、1_RDRA が既に揃っていても Phase5 を更新する
	    if (forceRunPhase5AfterPhase4InAllPhase || !checkAllFilesExistInFolder(rdraFiles, '1_RDRA')) {
	        forceRunPhase5AfterPhase4InAllPhase = false;
	        executePhase5Auto();
	        return;
	    }

	    // 完了
	    console.log('すべてのフェーズが定義されています。');
	    isAllPhaseAutoRunning = false;
	    forceRunPhase5AfterPhase4InAllPhase = false;
	    waitForEnterThenNext();
    }

    /**
     * フェーズ単位のRDRA定義を実行する（定義されていないフェーズがあれば実行する）
     */
    function executeEachPhase() {
	    // メニュー1用フラグは毎回リセット
	    autoRunPhase5AfterPhase4 = false;
	    // メニュー2用フラグが残っていても影響しないようにリセット
	    forceRunPhase5AfterPhase4InAllPhase = false;

	    const phaseExist1 = checkAllFilesExistInFolder(phase1Files, '0_RDRAZeroOne/phase1');
	    if (phaseExist1) {
	        console.log('phase1は定義されています。');
	    } else {
	        executePhaseParallel(1);
	        return;
	    }
	    const phaseExist2 = checkAllFilesExistInFolder(phase2Files, '0_RDRAZeroOne/phase2');
	    if (phaseExist2) {
	        console.log('phase2は定義されています。');
	    } else {
	        executePhaseParallel(2);
	        return;
	    }
	    const phaseExist3 = checkAllFilesExistInFolder(phase3Files, '0_RDRAZeroOne/phase3');
	    if (phaseExist3) {
	        console.log('phase3は定義されています。');
	    } else {
	        executePhaseParallel(3);
	        return;
	    }
	    const phaseExist4 = checkAllFilesExistInFolder(phase4Files, '0_RDRAZeroOne/phase4');
	    if (phaseExist4) {
	        console.log('phase4は定義されています。');
	    } else {
	        // Phase4を実行した後にPhase5を自動実行する
	        autoRunPhase5AfterPhase4 = true;
	        executePhaseParallel(4);
	        return;
	    }
	    // Phase4が揃っているなら、1_RDRA が既に存在していても Phase5 を実行して更新する
	    executePhase5Auto();
	    return;
    }

    /**
     * 全フェーズのRDRA定義を実行する（定義されていないフェーズがあれば実行する）
     */
    function executeAllPhase() {
	    console.log('全フェーズのRDRA定義を行います...');
	    isAllPhaseAutoRunning = true;
	    executeMissingPhasesTo5();
    }

    /**
     * 仕様作成を並列実行する（論理データ/UI/ビジネスルール）
     */
    function executeSpec() {
        console.log('仕様の作成を実行します（phase1 → phase2）...');

        // 仕様生成は時間がかかることがあるため、タイムアウトを長めに設定する
        const specTimeoutMs = 600000; // 10分

        // 出力フォルダが存在しない場合は作成
        const outputDir = '2_RDRASpec';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`出力フォルダを作成しました: ${outputDir}`);
        }

        const runParallel = async (promptMap, label) => {
            const args = promptMap.map(pair => pair.prompt);
            promptMap.forEach(pair => {
                console.log(`  ${pair.prompt}`);
            });
            console.log('');

            try {
                const code = await new Promise((resolve, reject) => {
                    const child = spawn('node', [
                        'RDRA_Knowledge/helper_tools/parallelRun/parallel-runner.js',
                        ...args,
                        '--timeout',
                        String(specTimeoutMs),
                    ], {
                        stdio: 'inherit',
                        shell: true
                    });

                    child.on('close', (exitCode) => resolve(exitCode ?? 1));
                    child.on('error', (error) => reject(error));
                });
                return code === 0 ? 0 : 1;
            } catch (error) {
                console.error(`エラー: ${error.message}`);
                return 1;
            }
        };

        // Phase1（論理データ/ビジネスルール）を先に実行し、成功したら Phase2（画面生成）を実行する
        (async () => {
            const code1 = await runParallel(specPhase1PromptMap, 'spec-phase1');
            if (code1 !== 0) {
                console.error(`仕様(phase1)がエラーで終了しました。`);
                waitForEnterThenNext();
                return;
            }

            const code2 = await runParallel(specPhase2PromptMap, 'spec-phase2');
            if (code2 === 0) {
                console.log('');
                console.log('仕様の作成が完了しました。');
            } else {
                console.error(`仕様(phase2)がエラーで終了しました。`);
            }
            waitForEnterThenNext();
        })();
    }

    /**
     * 関連データを作成しRDRAGraphを表示する
     */
    function showRDRAGraph() {
        console.log('関連データを作成しています...');
        exec('node RDRA_Knowledge/helper_tools/makeGraphData.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`エラー: ${error}`);
                promptUser();
                return;
            }
            console.log('関連データの作成が完了しました。');
            console.log('RDRAGraphを表示しています...');

            const clipboardCmd = getClipboardCommand('1_RDRA/関連データ.txt');
            const browserCmd = getBrowserCommand('https://vsa.co.jp/rdratool/graph/v0.94/index.html?clipboard');

            if (!clipboardCmd || !browserCmd) {
                console.error('このOSではクリップボード操作またはブラウザ起動がサポートされていません。');
                promptUser();
                return;
            }

            exec(clipboardCmd, (clipError) => {
                if (clipError) {
                    console.error(`クリップボードエラー: ${clipError}`);
                } else {
                    console.log('データをクリップボードにコピーしました。');
                    exec(browserCmd, (browserError) => {
                        if (browserError) {
                            console.error(`ブラウザ起動エラー: ${browserError}`);
                        } else {
                            console.log('ブラウザでRDRAGraphを開きました。');
                        }
                        promptUser();
                    });
                }
            });
        });
    }

    /**
     * ZeroOneデータをクリップボードにコピーする
     */
    function makeZeroOneData() {
        console.log('ZeroOneデータをクリップボードにコピーします...');
        exec('node RDRA_Knowledge/helper_tools/makeZeroOneData.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`エラー: ${error}`);
                promptUser();
                return;
            }
            if (stdout) {
                console.log(stdout);
            }
            if (stderr) {
                console.error(stderr);
            }
            console.log('ZeroOneデータの処理が完了しました。');
            
            // makeZeroOneData.jsが完了してからcopyToClipboard.jsを実行
            exec('node RDRA_Knowledge/helper_tools/copyToClipboard.js zeroone', (error2, stdout2, stderr2) => {
                if (error2) {
                    console.error(`エラー: ${error2}`);
                    promptUser();
                    return;
                }
                if (stdout2) {
                    console.log(stdout2);
                }
                if (stderr2) {
                    console.error(stderr2);
                }
                console.log('データはクリップボードにコピーされました。スプレッドシートに貼り付けてください。');
                
                // クリップボードコピーが完了してからブラウザを開き、その後promptUserを呼ぶ
                const browserCmd = getBrowserCommand('https://docs.google.com/spreadsheets/d/1h7J70l6DyXcuG0FKYqIpXXfdvsaqjdVFwc6jQXSh9fM/edit?gid=1240873646#gid=1240873646');
                if (browserCmd) {
                    exec(browserCmd, (browserError) => {
                        if (browserError) {
                            console.error(`ブラウザ起動エラー: ${browserError}`);
                        } else {
                            console.log('スプレッドシートをブラウザで開きました。');
                        }
                        // ブラウザ起動後（成功/失敗問わず）にpromptUserを呼ぶ
                        promptUser();
                    });
                } else {
                    // ブラウザコマンドが無い場合もpromptUserを呼ぶ
                    promptUser();
                }
            });
        });
    }

    /**
     * アクター別画面を表示する
     */
    function showActorUI() {
        console.log('画面照会（BUC/アクター）を表示する');
        if (!fs.existsSync('2_RDRASpec/画面照会.json') && !fs.existsSync('2_RDRASpec/ui.json')) {
            console.error('エラー: 2_RDRASpec/画面照会.json（または ui.json）が存在しません。');
            console.error('先にメニュー21で仕様ファイルを作成してください。');
            promptUser();
            return;
        }

        // 既にサーバーが起動しているかチェック
        if (global.bucActorUIServer && !global.bucActorUIServer.killed) {
            console.log('サーバーは既に起動しています。ブラウザで画面を開きます...');
            const browserCmd = getBrowserCommand('http://localhost:3002/');
            if (browserCmd) {
                exec(browserCmd, (browserError) => {
                    if (browserError) {
                        console.error(`ブラウザ起動エラー: ${browserError}`);
                    }
                });
            }
            console.log('画面照会（BUC/アクター）を表示しました。');
            promptUser();
            return;
        }

        console.log('HTTPサーバーを起動してブラウザで画面を開きます...');

        // HTTPサーバーを起動
        const serverProcess = spawn('node', ['RDRA_Knowledge/helper_tools/web_tool/bucActorUI.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: false
        });

        let serverStarted = false;

        serverProcess.stdout.on('data', (data) => {
            console.log(`${data}`);
            if (!serverStarted && data.toString().includes('簡易HTTPサーバーが起動しました')) {
                serverStarted = true;
                // サーバー起動後、少し待ってからブラウザを開く
                setTimeout(() => {
                    const browserCmd = getBrowserCommand('http://localhost:3002/');
                    if (browserCmd) {
                        exec(browserCmd, (browserError) => {
                            if (browserError) {
                                console.error(`ブラウザ起動エラー: ${browserError}`);
                            }
                        });
                    }
                }, 500);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`${data}`);
        });

        serverProcess.on('error', (error) => {
            console.error(`サーバー起動エラー: ${error}`);
        });

        serverProcess.on('close', (code) => {
            console.log('画面照会（BUC/アクター）サーバーが終了しました。');
            global.bucActorUIServer = null;
        });

        // プロセスIDを保存
        global.bucActorUIServer = serverProcess;

        console.log('画面照会（BUC/アクター）を表示しました。');
        console.log('画面の「閉じる」ボタンでサーバーを停止できます。');
        promptUser();
    }

    /**
     * 生成された成果物を削除する
     */
    function deleteGeneratedFiles() {
        console.log('生成された成果物を削除しています...');
        exec('node RDRA_Knowledge/helper_tools/deleteFiles.js', (error, stdout, stderr) => {
            if (error) {
                console.error(`エラー: ${error}`);
            } else {
                console.log('成果物の削除が完了しました。');
                if (stdout) console.log(stdout);
            }
            promptUser();
        });
    }

    /**
     * プログラムを終了する
     */
    function exitProgram() {
        console.log('プログラムを終了します。');
        if (global.bucActorUIServer) {
            global.bucActorUIServer.kill('SIGTERM');
        }
        rl.close();
        process.exit(0);
    }

    /**
     * ユーザーの選択に応じて処理を実行する
     * @param {string} option - 選択された番号
     */
    function executeOption(option) {
        switch (option) {
            case '1':
                executeEachPhase();
                break;
            case '2':
                executeAllPhase();
                break;
            case '11':
                if (checkAllFilesExistInFolder(rdraFiles, '1_RDRA')) {
                    console.log('RDRAGraphを表示する。');
                    showRDRAGraph();
                } else {
                    console.log('1_RDRAフォルダーにRDRA定義が生成されていません。');
                    waitForEnterThenNext();
                }
                break;
            case '12':
                if (checkAllFilesExistInFolder(rdraFiles, '1_RDRA')) {
                    console.log('ZeroOneデータをクリップボードにコピーします...');
                    makeZeroOneData();
                } else {
                    console.log('1_RDRAフォルダーにRDRA定義が生成されていません。');
                    waitForEnterThenNext();
                }
                break;
            case '21':
                // 仕様生成の前提として「関連データ.txt」の存在をチェックする
                if (fs.existsSync('1_RDRA/関連データ.txt')) {
                    executeSpec();
                } else {
                    console.log('1_RDRA/関連データ.txt が存在しません。先にメニュー11で関連データを作成してください。');
                    waitForEnterThenNext();
                }
                break;
            case '22':
                // 画面定義ファイルは「画面照会.json」を正としつつ、過去互換で ui.json も許容する
                if (
                    checkAllFilesExistInFolder(specPhase2Files, '2_RDRASpec/phase1')
                ) {
                    console.log('画面照会（BUC/アクター）を表示する。');
                    showActorUI();
                } else {
                    console.log('2_RDRASpecフォルダーに仕様ファイルが生成されていません。');
                    console.log('必要ファイル: 論理データモデル.md / ビジネスルール.md / 画面照会.json');
                    waitForEnterThenNext();
                }
                break;
            case '0':
                exitProgram();
                break;
            case '99':
                deleteGeneratedFiles();
                break;
            default:
                console.log('無効な選択肢です。選択肢の番号を入力してください。');
                break;
        }
    }

    return executeOption;
}

module.exports = { createMenuAction };

