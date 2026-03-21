'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');

const INPUT_PH3_BUC     = path.join(projectRoot, '0_RDRAZeroOne', 'phase3', 'ph3BUC.tsv');
const INPUT_UC_ACTOR    = path.join(projectRoot, '0_RDRAZeroOne', 'phase4', 'ph4UCアクター.tsv');
const INPUT_UC_EXTERNAL = path.join(projectRoot, '0_RDRAZeroOne', 'phase4', 'ph4UC外部システム.tsv');
const INPUT_UC_TIMER    = path.join(projectRoot, '0_RDRAZeroOne', 'phase4', 'ph4UCタイマー.tsv');
const OUTPUT_BUC        = path.join(projectRoot, '1_RDRA', 'BUC.tsv');

// ph3BUC.tsv カラムインデックス（0始まり）
const PH3_COL = {
    業務:         0,
    BUC:          1,
    アクティビティ: 2,
    次:           3,
    UC:           4,
    情報:         5,
    条件:         6,
    アクター:     7,
    外部システム:  8,
    状態モデル:    9,
    From状態:    10,
    To状態:      11,
    説明:        12,
};

// 出力ヘッダー
const OUTPUT_HEADER = [
    '業務', 'BUC', '先', 'アクティビティ', '次', 'UC',
    '関連モデル1', '関連オブジェクト1', '関連モデル2', '関連オブジェクト2',
    '説明', '画面要求'
];

/**
 * TSVファイルを読み込み、ヘッダーを除いたデータ行の配列を返す
 * @param {string} filePath
 * @returns {string[][]}
 */
function readTsv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`エラー: ファイルが見つかりません: ${filePath}`);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(l => l.trimEnd())
        .filter(l => l.trim() !== '');
    // ヘッダー行をスキップ
    return lines.slice(1).map(l => l.split('\t'));
}

/**
 * 値を「,」または「、」で分割してトリムした配列を返す（空文字は除外）
 * @param {string} value
 * @returns {string[]}
 */
function splitValues(value) {
    if (!value || value.trim() === '') return [];
    return value.split(/[,、]/).map(v => v.trim()).filter(v => v !== '');
}

/**
 * ph4UCアクター.tsv を Map<UC名, [{画面, アクター, 画面要求}]> に変換
 */
function buildActorMap(rows) {
    const map = new Map();
    for (const cols of rows) {
        const uc       = (cols[0] ?? '').trim();
        const screen   = (cols[1] ?? '').trim();
        const actor    = (cols[2] ?? '').trim();
        const ioReq    = (cols[3] ?? '').trim();
        if (!uc) continue;
        if (!map.has(uc)) map.set(uc, []);
        map.get(uc).push({ screen, actor, ioReq });
    }
    return map;
}

/**
 * ph4UC外部システム.tsv を Map<UC名, [{イベント, 外部システム}]> に変換
 */
function buildExternalMap(rows) {
    const map = new Map();
    for (const cols of rows) {
        const uc       = (cols[0] ?? '').trim();
        const event    = (cols[1] ?? '').trim();
        const external = (cols[2] ?? '').trim();
        if (!uc) continue;
        if (!map.has(uc)) map.set(uc, []);
        map.get(uc).push({ event, external });
    }
    return map;
}

/**
 * ph4UCタイマー.tsv を Map<UC名, [{タイマー}]> に変換
 */
function buildTimerMap(rows) {
    const map = new Map();
    for (const cols of rows) {
        const uc    = (cols[0] ?? '').trim();
        const timer = (cols[1] ?? '').trim();
        if (!uc) continue;
        if (!map.has(uc)) map.set(uc, []);
        map.get(uc).push({ timer });
    }
    return map;
}

/**
 * 12カラムの出力行を生成する
 */
function makeRow(業務, BUC, アクティビティ, 次, UC, 関連モデル1, 関連オブジェクト1, 関連モデル2, 関連オブジェクト2, 説明, 画面要求) {
    return [業務, BUC, '', アクティビティ, 次, UC, 関連モデル1, 関連オブジェクト1, 関連モデル2, 関連オブジェクト2, 説明, 画面要求];
}

/**
 * メイン処理
 */
function main() {
    // 入力ファイル読み込み
    const ph3Rows      = readTsv(INPUT_PH3_BUC);
    const actorRows    = readTsv(INPUT_UC_ACTOR);
    const externalRows = readTsv(INPUT_UC_EXTERNAL);
    const timerRows    = readTsv(INPUT_UC_TIMER);

    // 補完データのインデックス作成
    const actorMap    = buildActorMap(actorRows);
    const externalMap = buildExternalMap(externalRows);
    const timerMap    = buildTimerMap(timerRows);

    // 出力行を構築
    const outputRows = [];

    // 重複排除用セット: "UC\t関連モデル1\t関連オブジェクト1\t関連モデル2\t関連オブジェクト2"
    const seenRelations = new Set();

    // ph3BUC.tsv の行を処理（同一アクティビティが複数行ある場合は最初の行でUC展開を行う）
    const processedActivities = new Set(); // "業務\tBUC\tアクティビティ" で管理

    for (const cols of ph3Rows) {
        const 業務         = (cols[PH3_COL.業務] ?? '').trim();
        const BUC          = (cols[PH3_COL.BUC] ?? '').trim();
        const アクティビティ = (cols[PH3_COL.アクティビティ] ?? '').trim();
        const 次           = (cols[PH3_COL.次] ?? '').trim();
        const UC           = (cols[PH3_COL.UC] ?? '').trim();
        const 情報         = (cols[PH3_COL.情報] ?? '').trim();
        const 条件         = (cols[PH3_COL.条件] ?? '').trim();
        const 説明         = (cols[PH3_COL.説明] ?? '').trim();

        const actKey = `${業務}\t${BUC}\t${アクティビティ}`;

        // 同一アクティビティは初回のみ処理（ph3BUC.tsv に同一アクティビティが複数行ある場合の重複防止）
        if (processedActivities.has(actKey)) continue;
        processedActivities.add(actKey);

        if (!UC) {
            // UC なし：1行のみ出力
            outputRows.push(makeRow(業務, BUC, アクティビティ, 次, '', '', '', '', '', 説明, ''));
            continue;
        }

        // UC あり：関連モデル行を展開
        const relRows = [];

        // 1. 情報行
        for (const info of splitValues(情報)) {
            const relKey = `${UC}\t情報\t${info}\t\t`;
            if (!seenRelations.has(relKey)) {
                seenRelations.add(relKey);
                relRows.push(makeRow(業務, BUC, アクティビティ, 次, UC, '情報', info, '', '', 説明, ''));
            }
        }

        // 2. 条件行
        for (const cond of splitValues(条件)) {
            const relKey = `${UC}\t条件\t${cond}\t\t`;
            if (!seenRelations.has(relKey)) {
                seenRelations.add(relKey);
                relRows.push(makeRow(業務, BUC, アクティビティ, 次, UC, '条件', cond, '', '', 説明, ''));
            }
        }

        // 3. 画面行（ph4UCアクター.tsv）
        const actorEntries = actorMap.get(UC) ?? [];
        for (const { screen, actor, ioReq } of actorEntries) {
            const relKey = `${UC}\t画面\t${screen}\tアクター\t${actor}`;
            if (!seenRelations.has(relKey)) {
                seenRelations.add(relKey);
                relRows.push(makeRow(業務, BUC, アクティビティ, 次, UC, '画面', screen, 'アクター', actor, 説明, ioReq));
            }
        }

        // 4. イベント行（ph4UC外部システム.tsv）
        const externalEntries = externalMap.get(UC) ?? [];
        for (const { event, external } of externalEntries) {
            const relKey = `${UC}\tイベント\t${event}\t外部システム\t${external}`;
            if (!seenRelations.has(relKey)) {
                seenRelations.add(relKey);
                relRows.push(makeRow(業務, BUC, アクティビティ, 次, UC, 'イベント', event, '外部システム', external, 説明, ''));
            }
        }

        // 5. タイマー行（ph4UCタイマー.tsv）
        const timerEntries = timerMap.get(UC) ?? [];
        for (const { timer } of timerEntries) {
            const relKey = `${UC}\tタイマー\t${timer}\t\t`;
            if (!seenRelations.has(relKey)) {
                seenRelations.add(relKey);
                relRows.push(makeRow(業務, BUC, アクティビティ, 次, UC, 'タイマー', timer, '', '', 説明, ''));
            }
        }

        // 関連モデル行が1件もない場合は UC のみの1行を出力
        if (relRows.length === 0) {
            outputRows.push(makeRow(業務, BUC, アクティビティ, 次, UC, '', '', '', '', 説明, ''));
        } else {
            outputRows.push(...relRows);
        }
    }

    // TSV文字列を組み立て
    const lines = [OUTPUT_HEADER.join('\t')];
    for (const row of outputRows) {
        // 常に12カラムを保証
        const normalized = Array.from({ length: 12 }, (_, i) => row[i] ?? '');
        lines.push(normalized.join('\t'));
    }

    fs.writeFileSync(OUTPUT_BUC, lines.join('\n') + '\n', 'utf-8');
    console.log(`BUC.tsv を出力しました: ${OUTPUT_BUC}`);
    console.log(`  出力行数: ${outputRows.length} 行（ヘッダー除く）`);
}

main();
