/* eslint-disable no-console */
'use strict';

/**
 * phase4の「ph4条件.tsv」、phase3の「ph3バリエーション.tsv」にコンテキスト列を追加し、
 * phase4の「ph4状態.tsv」にコンテキスト列を付与して、1_RDRAフォルダーへ出力する。
 *
 * - 条件.tsv:       条件(バリエーション集合) ⊆ 情報.tsv(バリエーション集合) となる最初の情報行のコンテキストを採用
 * - バリエーション.tsv: バリエーション名 ∈ 情報.tsv(バリエーション集合) となる最初の情報行のコンテキストを採用
 * - 状態.tsv:       ph4状態.tsvの状態モデル ∈ 情報.tsv(状態モデル集合) となる最初の情報行のコンテキストを採用
 * - 一致なし: それぞれ "条件コンテキスト" / "バリエーションコンテキスト" / "状態コンテキスト"
 */

const fs = require('fs');
const path = require('path');

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, { encoding: 'utf8' });
}

function splitLines(text) {
  // Preserve empty cells; drop final empty line only.
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function parseTsv(text) {
  const lines = splitLines(text).filter((l) => l !== '');
  if (lines.length === 0) return { header: [], rows: [] };

  const header = lines[0].split('\t');
  const rows = [];
  for (const line of lines.slice(1)) {
    if (line.trim() === '') continue;
    const cols = line.split('\t');
    // Pad to header length (keep missing trailing columns).
    while (cols.length < header.length) cols.push('');
    rows.push(cols);
  }
  return { header, rows };
}

function toTsv(header, rows) {
  const outLines = [];
  outLines.push(header.join('\t'));
  for (const row of rows) {
    outLines.push(row.join('\t'));
  }
  return `${outLines.join('\n')}\n`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function colIndex(header, name, fileLabel) {
  const idx = header.indexOf(name);
  if (idx === -1) {
    throw new Error(`Missing column "${name}" in ${fileLabel}. Header: ${header.join(', ')}`);
  }
  return idx;
}

function normalizeToken(s) {
  return String(s ?? '').trim();
}

function parseList(cell) {
  const raw = normalizeToken(cell);
  if (!raw) return new Set();
  // Support Japanese comma "、" and common commas.
  const parts = raw
    .split(/[、,，]/g)
    .map((p) => p.trim())
    .filter(Boolean);
  return new Set(parts);
}

function isSubset(sub, sup) {
  for (const v of sub) {
    if (!sup.has(v)) return false;
  }
  return true;
}

function firstMatch(list, predicate) {
  for (const item of list) {
    if (predicate(item)) return item;
  }
  return null;
}

function buildInfoIndex(infoTsv) {
  const ctxIdx = colIndex(infoTsv.header, 'コンテキスト', 'phase4/ph4情報.tsv');
  const infoIdx = colIndex(infoTsv.header, '情報', 'phase4/ph4情報.tsv');
  const stateModelIdx = colIndex(infoTsv.header, '状態モデル', 'phase4/ph4情報.tsv');
  const variationIdx = colIndex(infoTsv.header, 'バリエーション', 'phase4/ph4情報.tsv');

  return infoTsv.rows.map((r) => {
    const context = normalizeToken(r[ctxIdx]);
    const infoName = normalizeToken(r[infoIdx]);
    const variationSet = parseList(r[variationIdx]);

    const stateModelCell = normalizeToken(r[stateModelIdx]);
    const stateModelSet = stateModelCell ? parseList(stateModelCell) : (infoName ? new Set([infoName]) : new Set());

    return {
      context,
      variationSet,
      stateModelSet,
    };
  });
}

function convertConditions({ infoIndex, inTsv }) {
  const variationIdx = colIndex(inTsv.header, 'バリエーション', 'phase4/ph4条件.tsv');
  const stateModelIdx = inTsv.header.indexOf('状態モデル');

  const outHeader = ['コンテキスト', ...inTsv.header];
  const outRows = inTsv.rows.map((r) => {
    const varSet = parseList(r[variationIdx]);
    const match = varSet.size
      ? firstMatch(infoIndex, (info) => info.context && info.variationSet.size && isSubset(varSet, info.variationSet))
      : null;
    const context = match ? match.context : '条件コンテキスト';

    // 出力用に行コピーを作成し、バリエーション列と状態モデル列の半角カンマを読点に置換する
    const outRow = r.slice();
    outRow[variationIdx] = outRow[variationIdx].replace(/,/g, '、');
    if (stateModelIdx !== -1) {
      outRow[stateModelIdx] = outRow[stateModelIdx].replace(/,/g, '、');
    }

    return [context, ...outRow];
  });

  return { header: outHeader, rows: outRows };
}

function buildStateTsv({ infoIndex, stateTsv }) {
  const stateLabel = 'phase4/ph4状態.tsv';
  const stateModelIdx = colIndex(stateTsv.header, '状態モデル', stateLabel);
  const stateIdx      = colIndex(stateTsv.header, '状態',       stateLabel);
  const ucIdx         = colIndex(stateTsv.header, '遷移UC',     stateLabel);
  const toIdx         = colIndex(stateTsv.header, '遷移先状態', stateLabel);
  const descIdx       = colIndex(stateTsv.header, '説明',       stateLabel);

  const outHeader = ['コンテキスト', '状態モデル', '状態', '遷移UC', '遷移先状態', '状態モデル・状態の説明'];
  const outRows = [];

  for (const r of stateTsv.rows) {
    const stateModel = normalizeToken(r[stateModelIdx]);
    if (!stateModel) continue;

    const match = firstMatch(infoIndex, (info) =>
      info.context && info.stateModelSet.size && info.stateModelSet.has(stateModel)
    );
    const context = match ? match.context : '状態コンテキスト';

    outRows.push([
      context,
      stateModel,
      normalizeToken(r[stateIdx]),
      normalizeToken(r[ucIdx]),
      normalizeToken(r[toIdx]),
      normalizeToken(r[descIdx]),
    ]);
  }

  return { header: outHeader, rows: outRows };
}

function convertVariations({ infoIndex, inTsv }) {
  const variationNameIdx = colIndex(inTsv.header, 'バリエーション', 'phase3/ph3バリエーション.tsv');

  const outHeader = ['コンテキスト', ...inTsv.header];
  const outRows = inTsv.rows.map((r) => {
    const name = normalizeToken(r[variationNameIdx]);
    const match = name
      ? firstMatch(infoIndex, (info) => info.context && info.variationSet.size && info.variationSet.has(name))
      : null;
    const context = match ? match.context : 'バリエーションコンテキスト';
    return [context, ...r];
  });

  return { header: outHeader, rows: outRows };
}

function main() {
  // リポジトリ直下（初期要望.txt / 0_RDRAZeroOne などがある場所）を基準にする
  // このスクリプトは RDRA_Knowledge/helper_tools 配下にあるため、2階層上がプロジェクトルート。
  const root = path.resolve(__dirname, '..', '..');
  const phase3Dir = path.resolve(root, '0_RDRAZeroOne', 'phase3');
  const phase4Dir = path.resolve(root, '0_RDRAZeroOne', 'phase4');
  const rdraDir   = path.resolve(root, '1_RDRA');

  const infoPath   = path.resolve(phase4Dir, 'ph4情報.tsv');
  const condInPath = path.resolve(phase4Dir, 'ph4条件.tsv');
  const varInPath   = path.resolve(phase3Dir, 'ph3バリエーション.tsv');
  const stateInPath = path.resolve(phase4Dir, 'ph4状態.tsv');

  const condOutPath  = path.resolve(rdraDir, '条件.tsv');
  const varOutPath   = path.resolve(rdraDir, 'バリエーション.tsv');
  const stateOutPath = path.resolve(rdraDir, '状態.tsv');

  const infoTsv = parseTsv(readText(infoPath));
  const infoIndex = buildInfoIndex(infoTsv);

  const condTsv = parseTsv(readText(condInPath));
  const variationTsv = parseTsv(readText(varInPath));
  const stateTsv = parseTsv(readText(stateInPath));

  const condOut = convertConditions({ infoIndex, inTsv: condTsv });
  const varOut = convertVariations({ infoIndex, inTsv: variationTsv });
  const stateOut = buildStateTsv({ infoIndex, stateTsv });

  ensureDir(rdraDir);

  fs.writeFileSync(condOutPath, toTsv(condOut.header, condOut.rows), { encoding: 'utf8' });
  fs.writeFileSync(varOutPath, toTsv(varOut.header, varOut.rows), { encoding: 'utf8' });
  fs.writeFileSync(stateOutPath, toTsv(stateOut.header, stateOut.rows), { encoding: 'utf8' });

  console.log('[attachContext] done');
  console.log(`- ${path.relative(root, condOutPath)}`);
  console.log(`- ${path.relative(root, varOutPath)}`);
  console.log(`- ${path.relative(root, stateOutPath)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[attachContext] error:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

