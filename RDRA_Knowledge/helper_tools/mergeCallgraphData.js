#!/usr/bin/env node
/**
 * 3 つの部分 JSON（domain / application / ui）を統合し、
 * 3_RDRASdd/_callgraph/callgraph_data.json を生成する（Node 標準モジュールのみ）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DOMAIN_FILE = '3_RDRASdd/_callgraph/callgraph_domain_data.json';
const APP_FILE = '3_RDRASdd/_callgraph/callgraph_application_data.json';
const UI_FILE = '3_RDRASdd/_callgraph/callgraph_ui_data.json';
const OUT_FILE = '3_RDRASdd/_callgraph/callgraph_data.json';

function findProjectRootFromScript() {
    let dir = path.resolve(__dirname, '..', '..');
    const { root } = path.parse(dir);
    while (true) {
        if (fs.existsSync(path.join(dir, '初期要望.txt'))) {
            return dir;
        }
        if (dir === root) {
            return process.cwd();
        }
        dir = path.dirname(dir);
    }
}

function normMethod(m) {
    return String(m == null ? '' : m)
        .trim()
        .toUpperCase();
}

function normPath(p) {
    let s = String(p == null ? '' : p).trim();
    if (!s.startsWith('/')) s = `/${s}`;
    s = s.replace(/\/+$/, '');
    return s || '/';
}

function epKey(e) {
    if (!e || typeof e !== 'object') return '';
    return `${normMethod(e.method)} ${normPath(e.path)}`;
}

/**
 * パスパラメータ名の差（{id} と {careRecipientId} 等）のみ同一視するためのパス正規化。
 * セグメントごとの `{...}` をプレースホルダに置き換える（メソッドやパス語尾の差は同一視しない）。
 * @param {string} p
 * @returns {string}
 */
function normPathForMatch(p) {
    const base = normPath(p);
    return base.replace(/\{[^/]+\}/g, '{*}');
}

/**
 * @param {object} e endpoint or api-like { method, path }
 * @returns {string}
 */
function epKeyNorm(e) {
    if (!e || typeof e !== 'object') return '';
    return `${normMethod(e.method)} ${normPathForMatch(e.path)}`;
}

/**
 * screen の api と UC の endpoint が一致するか（完全一致またはパスパラメータ名のみ正規化一致）。
 * @param {object} screenApi
 * @param {object} ucEp
 * @returns {'exact'|'normalized'|null}
 */
function matchScreenApiToUcEndpoint(screenApi, ucEp) {
    const a = epKey(screenApi);
    const b = epKey(ucEp);
    if (a && b && a === b) return 'exact';
    const an = epKeyNorm(screenApi);
    const bn = epKeyNorm(ucEp);
    if (an && bn && an === bn) return 'normalized';
    return null;
}

function uniqueStrings(arr) {
    const out = [];
    const seen = new Set();
    for (const x of arr || []) {
        const s = String(x);
        if (!seen.has(s)) {
            seen.add(s);
            out.push(s);
        }
    }
    return out;
}

function uniqueEndpoints(arr) {
    const out = [];
    const seen = new Set();
    for (const e of arr || []) {
        if (!e || typeof e !== 'object') continue;
        const k = epKey(e);
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push({
            method: normMethod(e.method),
            path: normPath(e.path),
            label: typeof e.label === 'string' ? e.label : `△ ${normMethod(e.method)} ${normPath(e.path)}`,
        });
    }
    return out;
}

/**
 * 日本語ラベル比較用（前後空白除去・Unicode 正規化）
 * @param {string} s
 * @returns {string}
 */
function normalizeJa(s) {
    return String(s == null ? '' : s)
        .trim()
        .normalize('NFC');
}

/**
 * @param {string} c コンテキスト参照（`Foo` または `context:Foo`）
 * @returns {string} `context:Foo`
 */
function normalizeContextRef(c) {
    const s = String(c == null ? '' : c).trim();
    if (!s) return '';
    return s.startsWith('context:') ? s : `context:${s}`;
}

/**
 * @param {string} id
 * @returns {{ ctx: string, tail: string } | null}
 */
function parseServiceIdTriple(id) {
    const m = /^service:([^:]+):(.+)$/.exec(String(id || '').trim());
    if (!m) return null;
    return { ctx: m[1], tail: m[2] };
}

/**
 * domain.services[].candidateUcs（UC 日本語名）→ service id の逆引きインデックス。
 * @param {object[]} domainServices
 * @returns {Map<string, string[]>} normalizeJa(ucName) -> service ids
 */
function buildCandidateUcIndex(domainServices) {
    /** @type {Map<string, string[]>} */
    const map = new Map();
    for (const s of domainServices || []) {
        if (!s || !s.id) continue;
        for (const cu of s.candidateUcs || []) {
            const k = normalizeJa(cu);
            if (!k) continue;
            if (!map.has(k)) map.set(k, []);
            map.get(k).push(s.id);
        }
    }
    return map;
}

/**
 * domain.services から照合用インデックスを構築する。
 * @param {object[]} domainServices
 */
function buildServiceIndexes(domainServices) {
    /** @type {Map<string, object>} */
    const byId = new Map();
    /** @type {Map<string, string>} lowerCaseId -> canonical id */
    const idsLower = new Map();
    for (const s of domainServices || []) {
        if (!s || !s.id) continue;
        byId.set(s.id, s);
        idsLower.set(String(s.id).toLowerCase(), s.id);
    }

    /** labelJa -> service ids */
    const byLabelJa = new Map();
    /** `context\0labelJa` -> service ids */
    const byCtxLabelJa = new Map();

    for (const s of domainServices || []) {
        if (!s || !s.id) continue;
        const ja = normalizeJa(s.labelJa);
        const ctx = String(s.context || '').trim();
        if (ja) {
            if (!byLabelJa.has(ja)) byLabelJa.set(ja, []);
            byLabelJa.get(ja).push(s.id);
        }
        if (ctx && ja) {
            const key = `${ctx}\u0000${ja}`;
            if (!byCtxLabelJa.has(key)) byCtxLabelJa.set(key, []);
            byCtxLabelJa.get(key).push(s.id);
        }
    }

    return { byId, idsLower, byLabelJa, byCtxLabelJa };
}

/**
 * raw の service ID が domain 上のいずれかに解決できるか（ヒント不要）。
 * @returns {string | null} 解決した canonical service id
 */
function resolveRawServiceId(rawId, indexes) {
    const id = String(rawId || '').trim();
    if (!id) return null;
    if (indexes.byId.has(id)) return id;
    const canonLower = indexes.idsLower.get(id.toLowerCase());
    if (canonLower) return canonLower;

    const triple = parseServiceIdTriple(id);
    if (!triple) return null;
    for (const s of indexes.byId.values()) {
        const ctxEn = String(s.context || '')
            .replace(/^context:/, '');
        if (ctxEn !== triple.ctx) continue;
        if (String(s.label || '').toLowerCase() === triple.tail.toLowerCase()) {
            return s.id;
        }
    }
    return null;
}

/**
 * @param {string} ucId
 * @param {string} serviceId
 * @param {string} rule
 * @param {Set<string>} resolved
 * @param {Set<string>} refPairSeen
 * @param {object[]} resolvedRefs
 */
function addResolvedServiceRef(ucId, serviceId, rule, resolved, refPairSeen, resolvedRefs) {
    if (!serviceId) return;
    const wasNew = !resolved.has(serviceId);
    resolved.add(serviceId);
    const pair = `${ucId}\u0000${serviceId}`;
    if (wasNew && !refPairSeen.has(pair)) {
        refPairSeen.add(pair);
        resolvedRefs.push({ ucId, serviceId, rule });
    }
}

/**
 * UC の services / serviceHints / serviceNamesJa を domain.services に照合し、
 * `ucs[].services` を正規化する。統合後はヒント用フィールドを削除する。
 *
 * 解決優先順:
 * 1) ucs[].services の ID（完全一致・大小文字・Ctx+label による正規化）
 * 2) serviceHints（context + domain の labelJa）
 * 3) domain.services[].candidateUcs と ucs[].labelJa の一致（Application連携契約ベース）
 * 4) serviceNamesJa と domain の labelJa の一意一致
 *
 * @param {object[]} ucs
 * @param {object[]} domainServices
 * @returns {{ unresolved: object[], resolvedRefs: object[] }}
 */
function linkUcsToDomainServices(ucs, domainServices) {
    const indexes = buildServiceIndexes(domainServices);
    const candidateIndex = buildCandidateUcIndex(domainServices);
    /** @type {object[]} */
    const unresolved = [];
    /** @type {object[]} */
    const resolvedRefs = [];

    for (const uc of ucs || []) {
        if (!uc || !uc.id) continue;

        /** @type {Set<string>} */
        const resolved = new Set();
        /** @type {Set<string>} */
        const refPairSeen = new Set();
        const rawIds = [...(uc.services || [])];

        // 1) 既存の service ID 列（推測含む）を可能な限り正規化
        for (const raw of rawIds) {
            const canon = resolveRawServiceId(raw, indexes);
            if (canon) {
                addResolvedServiceRef(uc.id, canon, 'exactOrNormalizedServiceId', resolved, refPairSeen, resolvedRefs);
            }
        }

        // 2) serviceHints
        for (const h of uc.serviceHints || []) {
            if (!h || typeof h !== 'object') continue;
            const ctx = normalizeContextRef(h.context);
            const ja = normalizeJa(h.nameJa);
            if (!ctx || !ja) continue;
            const key = `${ctx}\u0000${ja}`;
            const matches = indexes.byCtxLabelJa.get(key) || [];
            if (matches.length === 1) {
                addResolvedServiceRef(uc.id, matches[0], 'serviceHints', resolved, refPairSeen, resolvedRefs);
            } else if (matches.length === 0) {
                unresolved.push({
                    ucId: uc.id,
                    source: 'serviceHints',
                    value: `${String(h.context || '').trim()}/${ja}`,
                    detail: 'no_match',
                });
            } else {
                unresolved.push({
                    ucId: uc.id,
                    source: 'serviceHints',
                    value: `${String(h.context || '').trim()}/${ja}`,
                    detail: `ambiguous:${matches.join(',')}`,
                });
            }
        }

        // 3) domain Application連携契約の candidateUcs × uc.labelJa
        const ucJa = normalizeJa(uc.labelJa);
        if (ucJa) {
            const candMatches = candidateIndex.get(ucJa) || [];
            if (candMatches.length === 1) {
                addResolvedServiceRef(uc.id, candMatches[0], 'domainCandidateUc', resolved, refPairSeen, resolvedRefs);
            } else if (candMatches.length > 1) {
                unresolved.push({
                    ucId: uc.id,
                    source: 'domainCandidateUc',
                    value: ucJa,
                    detail: `ambiguous:${candMatches.join(',')}`,
                });
            }
        }

        // 4) serviceNamesJa（補助）
        for (const nameJa of uc.serviceNamesJa || []) {
            const ja = normalizeJa(nameJa);
            if (!ja) continue;
            const matches = indexes.byLabelJa.get(ja) || [];
            if (matches.length === 1) {
                addResolvedServiceRef(uc.id, matches[0], 'serviceNamesJa', resolved, refPairSeen, resolvedRefs);
            } else if (matches.length === 0) {
                unresolved.push({
                    ucId: uc.id,
                    source: 'serviceNamesJa',
                    value: ja,
                    detail: 'no_match',
                });
            } else {
                unresolved.push({
                    ucId: uc.id,
                    source: 'serviceNamesJa',
                    value: ja,
                    detail: `ambiguous:${matches.join(',')}`,
                });
            }
        }

        // 解決不能な raw ID を記録（ヒント・candidate で救済されても誤 ID は残す）
        for (const raw of rawIds) {
            const id = String(raw || '').trim();
            if (!id) continue;
            if (resolveRawServiceId(id, indexes)) continue;
            unresolved.push({
                ucId: uc.id,
                source: 'services',
                value: id,
                detail: 'invalid_or_unknown_id',
            });
        }

        uc.services = [...resolved].sort((a, b) => String(a).localeCompare(String(b)));
        delete uc.serviceHints;
        delete uc.serviceNamesJa;
    }

    return { unresolved, resolvedRefs };
}

function mergeById(items, idKey = 'id') {
    const map = new Map();
    for (const item of items || []) {
        if (!item || typeof item !== 'object') continue;
        const id = item[idKey];
        if (!id) continue;
        if (!map.has(id)) {
            map.set(id, { ...item });
            continue;
        }
        const prev = map.get(id);
        for (const k of Object.keys(item)) {
            if (k === idKey) continue;
            const v = item[k];
            const pv = prev[k];
            if (Array.isArray(v) && Array.isArray(pv)) {
                if (k === 'endpoints') {
                    prev[k] = uniqueEndpoints([...pv, ...v]);
                } else {
                    prev[k] = uniqueStrings([...pv, ...v]);
                }
            } else if (pv === undefined) {
                prev[k] = v;
            }
        }
    }
    return [...map.values()].sort((a, b) => String(a[idKey]).localeCompare(String(b[idKey])));
}

function readPartial(projectRoot, rel) {
    const full = path.join(projectRoot, ...rel.split('/'));
    if (!fs.existsSync(full)) {
        const hint =
            ' parallel-runner は AI 終了を成功扱いにするため、プロンプトが JSON を書かずに終了した可能性があります。' +
            ' RDRA_Knowledge/_3_RDRASdd/callgraph_*_data_maker.md の「実行モード」に従い再実行するか、' +
            ' menu.js の Callgraph 部分 JSON 検証ログを確認してください。';
        throw new Error(`ファイルがありません: ${rel}.${hint}`);
    }
    const text = fs.readFileSync(full, 'utf8');
    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error(`JSON 解析エラー: ${rel} - ${e.message}`);
    }
}

/**
 * screen.apis と uc.endpoints を照合し、screen.ucs / uc.screens を補完する。
 * @returns {{
 *   normalizedApiMatches: object[],
 *   unmatchedScreenApis: object[],
 *   unlinkedScreens: object[],
 *   unusedUcEndpoints: object[],
 * }}
 */
function linkScreensToUcs(screens, ucs) {
    const ucList = Array.isArray(ucs) ? ucs : [];
    /** @type {Map<string, string[]>} raw と norm の両方で UC ID を引ける */
    const ucByEp = new Map();

    function addEpIndex(key, ucId) {
        if (!key) return;
        if (!ucByEp.has(key)) ucByEp.set(key, []);
        const arr = ucByEp.get(key);
        if (!arr.includes(ucId)) arr.push(ucId);
    }

    for (const uc of ucList) {
        if (!uc || !uc.id) continue;
        for (const ep of uc.endpoints || []) {
            addEpIndex(epKey(ep), uc.id);
            addEpIndex(epKeyNorm(ep), uc.id);
        }
    }

    /** @type {object[]} */
    const normalizedApiMatches = [];
    /** @type {object[]} */
    const unmatchedScreenApis = [];

    for (const screen of screens || []) {
        if (!screen || !screen.id) continue;
        const matched = new Set();
        for (const api of screen.apis || []) {
            const kRaw = epKey(api);
            const kNorm = epKeyNorm(api);
            let uids = [];
            let matchKind = null;
            if (kRaw && ucByEp.has(kRaw)) {
                uids = ucByEp.get(kRaw);
                matchKind = 'exact';
            } else if (kNorm && ucByEp.has(kNorm)) {
                uids = ucByEp.get(kNorm);
                matchKind = 'normalized';
            }

            if (uids.length > 0) {
                for (const uid of uids) {
                    matched.add(uid);
                }
                if (matchKind === 'normalized' && kRaw) {
                    normalizedApiMatches.push({
                        screenId: screen.id,
                        filePath: screen.filePath || '',
                        screenApi: kRaw,
                        resolvedUcs: [...uids],
                        note: 'matched_via_path_param_normalize',
                    });
                }
            } else if (kRaw) {
                unmatchedScreenApis.push({
                    screenId: screen.id,
                    filePath: screen.filePath || '',
                    api: kRaw,
                    reason: 'no_matching_uc_endpoint',
                });
            }
        }
        screen.ucs = uniqueStrings([...(screen.ucs || []), ...[...matched]]);
    }

    /** @type {object[]} */
    const unlinkedScreens = [];
    for (const screen of screens || []) {
        if (!screen || !screen.id) continue;
        if (!(screen.ucs && screen.ucs.length)) {
            unlinkedScreens.push({
                screenId: screen.id,
                filePath: screen.filePath || '',
                apis: (screen.apis || []).map((a) => epKey(a)).filter(Boolean),
            });
        }
    }

    /** @type {object[]} */
    const unusedUcEndpoints = [];
    for (const uc of ucList) {
        if (!uc || !uc.id) continue;
        for (const ep of uc.endpoints || []) {
            let linked = false;
            for (const screen of screens || []) {
                for (const api of screen.apis || []) {
                    if (matchScreenApiToUcEndpoint(api, ep)) {
                        linked = true;
                        break;
                    }
                }
                if (linked) break;
            }
            if (!linked) {
                unusedUcEndpoints.push({
                    ucId: uc.id,
                    filePath: uc.filePath || '',
                    endpoint: epKey(ep),
                });
            }
        }
    }

    const screenIdsByUc = new Map();
    for (const screen of screens || []) {
        if (!screen || !screen.id) continue;
        for (const uid of screen.ucs || []) {
            if (!screenIdsByUc.has(uid)) screenIdsByUc.set(uid, []);
            screenIdsByUc.get(uid).push(screen.id);
        }
    }

    for (const uc of ucList) {
        if (!uc || !uc.id) continue;
        const extra = screenIdsByUc.get(uc.id) || [];
        uc.screens = uniqueStrings([...(uc.screens || []), ...extra]);
        uc.endpoints = uniqueEndpoints(uc.endpoints || []);
    }

    return {
        normalizedApiMatches,
        unmatchedScreenApis,
        unlinkedScreens,
        unusedUcEndpoints,
    };
}

function main() {
    const projectRoot = findProjectRootFromScript();
    process.chdir(projectRoot);

    let domain;
    let app;
    let ui;
    try {
        domain = readPartial(projectRoot, DOMAIN_FILE);
        app = readPartial(projectRoot, APP_FILE);
        ui = readPartial(projectRoot, UI_FILE);
    } catch (e) {
        console.error(e.message || e);
        process.exit(1);
        return;
    }

    const contexts = mergeById(domain.contexts || []);
    const services = mergeById(domain.services || []);
    const entities = mergeById(domain.entities || []);
    const appBucs = mergeById(app.appBucs || []);
    let ucs = mergeById(app.ucs || []);
    const uiBucs = mergeById(ui.uiBucs || []);
    let screens = mergeById(ui.screens || []);

    for (const s of screens) {
        if (s && s.apis) s.apis = uniqueEndpoints(s.apis);
    }
    for (const u of ucs) {
        if (u && u.endpoints) u.endpoints = uniqueEndpoints(u.endpoints);
        if (u && u.services) u.services = uniqueStrings(u.services);
    }

    const { unresolved: unresolvedServiceRefs, resolvedRefs: resolvedServiceRefs } = linkUcsToDomainServices(
        ucs,
        services
    );

    const linkDiag = linkScreensToUcs(screens, ucs);

    const out = {
        contexts,
        services,
        entities,
        appBucs,
        ucs,
        uiBucs,
        screens,
    };

    const diag = {};
    if (resolvedServiceRefs.length > 0) {
        diag.resolvedServiceRefs = resolvedServiceRefs;
    }
    if (unresolvedServiceRefs.length > 0) {
        diag.unresolvedServiceRefs = unresolvedServiceRefs;
    }
    if (linkDiag.normalizedApiMatches.length > 0) {
        diag.normalizedApiMatches = linkDiag.normalizedApiMatches;
    }
    if (linkDiag.unmatchedScreenApis.length > 0) {
        diag.unmatchedScreenApis = linkDiag.unmatchedScreenApis;
    }
    if (linkDiag.unlinkedScreens.length > 0) {
        diag.unlinkedScreens = linkDiag.unlinkedScreens;
    }
    if (linkDiag.unusedUcEndpoints.length > 0) {
        diag.unusedUcEndpoints = linkDiag.unusedUcEndpoints;
    }
    if (Object.keys(diag).length > 0) {
        out.mergeDiagnostics = diag;
        if (resolvedServiceRefs.length > 0) {
            const byRule = resolvedServiceRefs.reduce((acc, r) => {
                acc[r.rule] = (acc[r.rule] || 0) + 1;
                return acc;
            }, {});
            console.log(`[mergeCallgraphData] resolvedServiceRefs: ${resolvedServiceRefs.length} ${JSON.stringify(byRule)}`);
        }
        if (unresolvedServiceRefs.length > 0) {
            console.warn(
                `[mergeCallgraphData] unresolvedServiceRefs: ${unresolvedServiceRefs.length} (see mergeDiagnostics in ${OUT_FILE})`
            );
        }
        if (linkDiag.normalizedApiMatches.length > 0) {
            console.warn(
                `[mergeCallgraphData] normalizedApiMatches: ${linkDiag.normalizedApiMatches.length} (UI と UC のパスパラメータ名差のみで結線)`
            );
        }
        if (linkDiag.unmatchedScreenApis.length > 0) {
            console.warn(
                `[mergeCallgraphData] unmatchedScreenApis: ${linkDiag.unmatchedScreenApis.length} (画面 API がどの UC endpoint にも一致しない)`
            );
        }
        if (linkDiag.unlinkedScreens.length > 0) {
            console.warn(`[mergeCallgraphData] unlinkedScreens: ${linkDiag.unlinkedScreens.length} (ucs が空の画面)`);
        }
        if (linkDiag.unusedUcEndpoints.length > 0) {
            console.warn(
                `[mergeCallgraphData] unusedUcEndpoints: ${linkDiag.unusedUcEndpoints.length} (どの画面 api からも参照されない UC endpoint)`
            );
        }
    }

    const outPath = path.join(projectRoot, ...OUT_FILE.split('/'));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
    console.log(`統合完了: ${OUT_FILE}`);
}

if (require.main === module) {
    main();
}

module.exports = {
    mergeById,
    linkScreensToUcs,
    linkUcsToDomainServices,
    buildServiceIndexes,
    buildCandidateUcIndex,
    resolveRawServiceId,
    normalizeJa,
    normalizeContextRef,
    normMethod,
    normPath,
    normPathForMatch,
    epKey,
    epKeyNorm,
    matchScreenApiToUcEndpoint,
};
