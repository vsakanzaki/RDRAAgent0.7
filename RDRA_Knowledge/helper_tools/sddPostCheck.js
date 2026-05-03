'use strict';

/**
 * メニュー 31/32/33 実行後の SDD 出力件数チェック。
 * - `report*` … 主に警告表示（従来どおり）
 * - `checkUI` / `checkUIBuc` … 戻り値で厳格判定（menu 33 等で処理停止に使用）
 */

const fs = require('fs');
const path = require('path');

const { epKey, matchScreenApiToUcEndpoint } = require('./mergeCallgraphData');

const REL_RELATION = '1_RDRA/if/関連データ.txt';
const SCREEN_JSON_CANDIDATES = ['2_RDRASpec/画面照会.json', '2_RDRASpec/ui.json'];

/**
 * @param {string} projectRoot
 * @returns {string}
 */
function relationPath(projectRoot) {
    return path.join(projectRoot, ...REL_RELATION.split('/'));
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function linesOf(text) {
    return text.replace(/\r\n/g, '\n').split('\n');
}

/**
 * @param {string} segment
 * @returns {{ left: string, right: string }[]}
 */
function parsePairSegment(segment) {
    const pairs = [];
    const chunks = segment.split('//');
    for (const chunk of chunks) {
        const p = chunk.trim();
        if (!p) continue;
        const idx = p.indexOf('@@');
        if (idx === -1) continue;
        pairs.push({
            left: p.slice(0, idx).trim(),
            right: p.slice(idx + 2).trim(),
        });
    }
    return pairs;
}

/**
 * #child <col1> <col2> <pairs...>
 * @param {string[]} lines
 * @param {string} col1
 * @param {string} col2
 * @returns {string|null}
 */
function getChildLinePayload(lines, col1, col2) {
    for (const line of lines) {
        if (!line.startsWith('#child')) continue;
        const parts = line.split('\t');
        if (parts.length < 4) continue;
        if (parts[1] === col1 && parts[2] === col2) {
            return parts.slice(3).join('\t');
        }
    }
    return null;
}

/**
 * @param {string} relationText
 * @returns {Set<string>}
 */
function extractContexts(relationText) {
    const lines = linesOf(relationText);
    const ctx = new Set();
    const sm = getChildLinePayload(lines, 'コンテキスト', '状態モデル');
    const inf = getChildLinePayload(lines, 'コンテキスト', '情報');
    if (sm) {
        for (const { left } of parsePairSegment(sm)) {
            if (left && left !== '条件コンテキスト') ctx.add(left);
        }
    }
    if (inf) {
        for (const { left } of parsePairSegment(inf)) {
            if (left && left !== '条件コンテキスト') ctx.add(left);
        }
    }
    return ctx;
}

/**
 * @param {string} relationText
 * @returns {Set<string>}
 */
function extractBUCs(relationText) {
    const lines = linesOf(relationText);
    const payload = getChildLinePayload(lines, '業務', 'BUC');
    const bucs = new Set();
    if (!payload) return bucs;
    for (const { right } of parsePairSegment(payload)) {
        if (right) bucs.add(right);
    }
    return bucs;
}

/**
 * @param {string} relationText
 * @returns {Set<string>}
 */
function extractScreensFromEdgeUcScreen(relationText) {
    const screens = new Set();
    for (const line of linesOf(relationText)) {
        if (!line.startsWith('#edge')) continue;
        const parts = line.split('\t');
        if (parts.length < 4) continue;
        if (parts[1] === 'UC' && parts[2] === '画面') {
            const payload = parts.slice(3).join('\t');
            for (const { right } of parsePairSegment(payload)) {
                if (right) screens.add(right);
            }
        }
    }
    return screens;
}

/**
 * @param {string} jsonPath
 * @returns {Set<string>}
 */
function extractScreensFromScreenJson(jsonPath) {
    const screens = new Set();
    if (!fs.existsSync(jsonPath)) return screens;
    let raw;
    try {
        raw = fs.readFileSync(jsonPath, 'utf8');
    } catch {
        return screens;
    }
    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return screens;
    }
    const businesses = data.businesses;
    if (!Array.isArray(businesses)) return screens;
    for (const b of businesses) {
        const bucs = b.BUCs;
        if (!Array.isArray(bucs)) continue;
        for (const buc of bucs) {
            const actors = buc.actors;
            if (!Array.isArray(actors)) continue;
            for (const act of actors) {
                const names = act.screen_names;
                if (!Array.isArray(names)) continue;
                for (const n of names) {
                    if (typeof n === 'string' && n.trim()) screens.add(n.trim());
                }
            }
        }
    }
    return screens;
}

/**
 * @param {string} dir
 * @param {{ recursive?: boolean }} [opts]
 * @returns {{ bodyMdCount: number, underscoreMd: string[] }}
 */
function countMarkdownOutputs(dir, opts = {}) {
    const recursive = Boolean(opts.recursive);
    const rootDir = path.resolve(dir);
    let bodyMdCount = 0;
    const underscoreMd = [];

    function walk(d) {
        if (!fs.existsSync(d)) return;
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const ent of entries) {
            const full = path.join(d, ent.name);
            if (ent.isDirectory()) {
                if (recursive) walk(full);
                continue;
            }
            if (!ent.name.endsWith('.md')) continue;
            const rel = path.relative(rootDir, full).replace(/\\/g, '/');
            if (ent.name.startsWith('_')) {
                underscoreMd.push(rel);
            } else {
                bodyMdCount += 1;
            }
        }
    }

    walk(rootDir);
    return { bodyMdCount, underscoreMd };
}

/**
 * @param {string} label
 * @param {number} expected
 * @param {number} actual
 * @param {string[]} underscoreFiles
 */
function printSummary(label, expected, actual, underscoreFiles) {
    console.log('');
    console.log(`[SDD事後チェック] ${label}`);
    console.log(`  期待件数（関連データ/画面照会から算出）: ${expected}`);
    console.log(`  実出力件数（先頭 _ 以外の .md）: ${actual}`);
    if (expected !== actual) {
        console.warn(`  警告: 件数が一致しません（不足 ${Math.max(0, expected - actual)} / 余剰 ${Math.max(0, actual - expected)}）。`);
    }
    if (underscoreFiles.length > 0) {
        console.warn(`  警告: 中間ファイル候補（先頭 _ の .md）が ${underscoreFiles.length} 件あります:`);
        underscoreFiles.slice(0, 20).forEach((f) => console.warn(`    - ${f}`));
        if (underscoreFiles.length > 20) {
            console.warn(`    ... 他 ${underscoreFiles.length - 20} 件`);
        }
    }
    if (expected === actual && underscoreFiles.length === 0) {
        console.log('  件数・中間ファイル: OK');
    }
}

/**
 * @param {string} projectRoot
 */
function reportDomain(projectRoot) {
    const relPath = relationPath(projectRoot);
    if (!fs.existsSync(relPath)) {
        console.warn(`[SDD事後チェック] domain: 関連データが見つかりません: ${REL_RELATION}`);
        return;
    }
    const text = fs.readFileSync(relPath, 'utf8');
    const expectedSet = extractContexts(text);
    const expected = expectedSet.size;
    const domainDir = path.join(projectRoot, '3_RDRASdd', 'domain');
    const { bodyMdCount, underscoreMd } = countMarkdownOutputs(domainDir, { recursive: false });
    printSummary('domain', expected, bodyMdCount, underscoreMd);
}

/**
 * @param {string} projectRoot
 */
function reportApplication(projectRoot) {
    const relPath = relationPath(projectRoot);
    if (!fs.existsSync(relPath)) {
        console.warn(`[SDD事後チェック] application: 関連データが見つかりません: ${REL_RELATION}`);
        return;
    }
    const text = fs.readFileSync(relPath, 'utf8');
    const expectedSet = extractBUCs(text);
    const expected = expectedSet.size;
    const appDir = path.join(projectRoot, '3_RDRASdd', 'application');
    const { bodyMdCount, underscoreMd } = countMarkdownOutputs(appDir, { recursive: false });
    printSummary('application', expected, bodyMdCount, underscoreMd);
}

/**
 * @param {string} projectRoot
 */
function reportUI(projectRoot) {
    const relPath = relationPath(projectRoot);
    if (!fs.existsSync(relPath)) {
        console.warn(`[SDD事後チェック] ui: 関連データが見つかりません: ${REL_RELATION}`);
        return;
    }
    const text = fs.readFileSync(relPath, 'utf8');
    const fromEdge = extractScreensFromEdgeUcScreen(text);
    let jsonScreens = new Set();
    for (const rel of SCREEN_JSON_CANDIDATES) {
        const p = path.join(projectRoot, ...rel.split('/'));
        if (fs.existsSync(p)) {
            jsonScreens = extractScreensFromScreenJson(p);
            break;
        }
    }
    const expectedSet = new Set([...fromEdge, ...jsonScreens]);
    const expected = expectedSet.size;
    const uiDir = path.join(projectRoot, '3_RDRASdd', 'ui');
    const { bodyMdCount, underscoreMd } = countMarkdownOutputs(uiDir, { recursive: true });
    printSummary('ui（全 BUC フォルダ合計）', expected, bodyMdCount, underscoreMd);
}

/**
 * `3_RDRASdd/application/<BUC>.md` の「利用画面」表から画面名（日本語）を抽出する。
 * @param {string} appText
 * @returns {Set<string>}
 */
function extractScreenNamesFromApplicationTable(appText) {
    const screens = new Set();
    const idx = appText.indexOf('### 利用画面');
    if (idx === -1) return screens;
    const after = appText.slice(idx);
    const lines = linesOf(after);
    let i = 0;
    for (; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('画面名') && line.trim().startsWith('|')) {
            i += 1;
            break;
        }
    }
    for (; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();
        if (!line.startsWith('|')) break;
        const parts = line.split('|').map((s) => s.trim());
        if (parts.length < 2) continue;
        const screenName = parts[1];
        if (!screenName || screenName === '画面名') continue;
        if (/^[\s\-:]+$/.test(screenName)) continue;
        screens.add(screenName);
    }
    return screens;
}

/**
 * @param {string} appText
 * @returns {string|null}
 */
function extractBucJapaneseNameFromApplication(appText) {
    const m = appText.match(/### BUC日本語名\s*\r?\n\s*([^\r\n]+)/);
    return m ? m[1].trim() : null;
}

/**
 * 画面照会 JSON の `buc_name` が一致する BUC の screen_names を収集する。
 * @param {string} projectRoot
 * @param {string} bucJapaneseName
 * @returns {Set<string>}
 */
function extractScreensFromScreenJsonForBuc(projectRoot, bucJapaneseName) {
    const screens = new Set();
    if (!bucJapaneseName) return screens;
    for (const rel of SCREEN_JSON_CANDIDATES) {
        const p = path.join(projectRoot, ...rel.split('/'));
        if (!fs.existsSync(p)) continue;
        let data;
        try {
            data = JSON.parse(fs.readFileSync(p, 'utf8'));
        } catch {
            continue;
        }
        const businesses = data.businesses;
        if (!Array.isArray(businesses)) continue;
        for (const b of businesses) {
            const bucs = b.BUCs;
            if (!Array.isArray(bucs)) continue;
            for (const buc of bucs) {
                if (buc.buc_name !== bucJapaneseName) continue;
                const actors = buc.actors;
                if (!Array.isArray(actors)) continue;
                for (const act of actors) {
                    const names = act.screen_names;
                    if (!Array.isArray(names)) continue;
                    for (const n of names) {
                        if (typeof n === 'string' && n.trim()) screens.add(n.trim());
                    }
                }
            }
        }
        break;
    }
    return screens;
}

/**
 * 1 BUC あたりの期待画面数（application の利用画面 → 無ければ画面照会の BUC 一致）。
 * @param {string} projectRoot
 * @param {string} bucEnglishName
 * @returns {{ expected: number, screens: Set<string> }}
 */
function getExpectedScreensForBuc(projectRoot, bucEnglishName) {
    const appPath = path.join(projectRoot, '3_RDRASdd', 'application', `${bucEnglishName}.md`);
    if (!fs.existsSync(appPath)) {
        return { expected: 0, screens: new Set() };
    }
    const appText = fs.readFileSync(appPath, 'utf8');
    let screens = extractScreenNamesFromApplicationTable(appText);
    if (screens.size === 0) {
        const jp = extractBucJapaneseNameFromApplication(appText);
        screens = extractScreensFromScreenJsonForBuc(projectRoot, jp || '');
    }
    return { expected: screens.size, screens };
}

/**
 * UI 仕様 `.md` の総数が、関連データと画面照会から期待される画面数と一致するか（menu 33 完了判定用）。
 * @param {string} projectRoot
 * @returns {{ ok: boolean, expected: number, actual: number, missingCount: number, underscoreFiles: string[], error?: string }}
 */
function checkUI(projectRoot) {
    const relPath = relationPath(projectRoot);
    if (!fs.existsSync(relPath)) {
        return {
            ok: false,
            expected: 0,
            actual: 0,
            missingCount: 0,
            underscoreFiles: [],
            error: `${REL_RELATION} が見つかりません`,
        };
    }
    const text = fs.readFileSync(relPath, 'utf8');
    const fromEdge = extractScreensFromEdgeUcScreen(text);
    let jsonScreens = new Set();
    for (const rel of SCREEN_JSON_CANDIDATES) {
        const p = path.join(projectRoot, ...rel.split('/'));
        if (fs.existsSync(p)) {
            jsonScreens = extractScreensFromScreenJson(p);
            break;
        }
    }
    const expectedSet = new Set([...fromEdge, ...jsonScreens]);
    const expected = expectedSet.size;
    const uiDir = path.join(projectRoot, '3_RDRASdd', 'ui');
    const { bodyMdCount, underscoreMd } = countMarkdownOutputs(uiDir, { recursive: true });
    const actual = bodyMdCount;
    const missingCount = Math.max(0, expected - actual);
    const ok = expected === actual && underscoreMd.length === 0;
    return { ok, expected, actual, missingCount, underscoreFiles: underscoreMd };
}

/**
 * 単一 BUC フォルダーの `.md` 件数が application（または画面照会）の期待画面数と一致するか。
 * @param {string} projectRoot
 * @param {string} bucEnglishName
 * @returns {{ ok: boolean, bucEnglishName: string, expected: number, actual: number, missingCount: number, underscoreFiles: string[], screenNames: string[] }}
 */
function checkUIBuc(projectRoot, bucEnglishName) {
    const { expected, screens } = getExpectedScreensForBuc(projectRoot, bucEnglishName);
    const bucUiDir = path.join(projectRoot, '3_RDRASdd', 'ui', bucEnglishName);
    const { bodyMdCount, underscoreMd } = countMarkdownOutputs(bucUiDir, { recursive: true });
    const actual = bodyMdCount;
    const missingCount = Math.max(0, expected - actual);
    const ok = expected === actual && underscoreMd.length === 0;
    return {
        ok,
        bucEnglishName,
        expected,
        actual,
        missingCount,
        underscoreFiles: underscoreMd,
        screenNames: [...screens].sort(),
    };
}

const RE_METHOD_PATH_LINE = /\*\*メソッド\/パス\*\*[：:]\s*([A-Z]+)\s+(\/[^\s`*]+)/gi;

/**
 * Markdown 内の `**メソッド/パス**:` 行から { method, path } を抽出する。
 * @param {string} text
 * @returns {{ method: string, path: string }[]}
 */
function extractMethodPathPairs(text) {
    const pairs = [];
    let m;
    const re = new RegExp(RE_METHOD_PATH_LINE.source, 'gi');
    while ((m = re.exec(text)) !== null) {
        pairs.push({ method: m[1], path: m[2] });
    }
    return pairs;
}

/**
 * @param {string} dir
 * @param {string[]} out
 */
function collectMdRecursive(dir, out) {
    if (!fs.existsSync(dir)) return;
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) collectMdRecursive(full, out);
        else if (e.isFile() && e.name.endsWith('.md') && !e.name.startsWith('_')) out.push(full);
    }
}

/**
 * `3_RDRASdd/ui/` 配下の各画面 `.md` の API 記述が、同じ BUC の `3_RDRASdd/application/<BUC>.md` にあるか検査する。
 * @param {string} projectRoot
 */
function reportApiUiAlignment(projectRoot) {
    const uiRoot = path.join(projectRoot, '3_RDRASdd', 'ui');
    const appRoot = path.join(projectRoot, '3_RDRASdd', 'application');
    if (!fs.existsSync(uiRoot)) {
        console.warn('[SDD事後チェック] api/ui: 3_RDRASdd/ui が見つかりません');
        return;
    }
    const uiFiles = [];
    collectMdRecursive(uiRoot, uiFiles);

    /** @type {{ uiRel: string, buc: string, uiEndpoint: string }[]} */
    const mismatches = [];

    for (const uiAbs of uiFiles) {
        const buc = path.basename(path.dirname(uiAbs));
        const appAbs = path.join(appRoot, `${buc}.md`);
        if (!fs.existsSync(appAbs)) continue;

        const uiText = fs.readFileSync(uiAbs, 'utf8');
        const appText = fs.readFileSync(appAbs, 'utf8');
        const uiEps = extractMethodPathPairs(uiText);
        const appEps = extractMethodPathPairs(appText);
        if (uiEps.length === 0) continue;

        const uiRel = path.relative(projectRoot, uiAbs).split(path.sep).join('/');

        for (const uiEp of uiEps) {
            let ok = false;
            for (const apEp of appEps) {
                if (matchScreenApiToUcEndpoint(uiEp, apEp)) {
                    ok = true;
                    break;
                }
            }
            if (!ok) {
                mismatches.push({
                    uiRel,
                    buc,
                    uiEndpoint: epKey(uiEp),
                });
            }
        }
    }

    console.log('');
    console.log('[SDD事後チェック] UI と Application の API 契約（メソッド/パス）');
    if (mismatches.length === 0) {
        console.log('  警告なし（抽出できた UI の **メソッド/パス** はいずれも同じ BUC の application に存在）');
        return;
    }
    console.warn(
        `  警告: UI 仕様にあり application に一致しない **メソッド/パス** が ${mismatches.length} 件あります（callgraph で UC と繋がらない原因になります）:`
    );
    mismatches.slice(0, 40).forEach((x) => {
        console.warn(`    - ${x.uiEndpoint}  ← ${x.uiRel}`);
    });
    if (mismatches.length > 40) {
        console.warn(`    ... 他 ${mismatches.length - 40} 件`);
    }
}

module.exports = {
    extractContexts,
    extractBUCs,
    extractScreensFromEdgeUcScreen,
    extractScreensFromScreenJson,
    countMarkdownOutputs,
    reportDomain,
    reportApplication,
    reportUI,
    checkUI,
    checkUIBuc,
    getExpectedScreensForBuc,
    extractScreenNamesFromApplicationTable,
    reportApiUiAlignment,
    extractMethodPathPairs,
};
