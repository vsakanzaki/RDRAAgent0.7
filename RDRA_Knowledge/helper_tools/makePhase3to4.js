/* eslint-disable no-console */
'use strict';

/**
 * phase3の「条件.tsv」「状態.tsv」、phase2の「バリエーション.tsv」にコンテキスト列を追加し、
 * phase4フォルダーへ出力する。
 *
 * - 条件.tsv: 条件(バリエーション集合) ⊆ 情報.tsv(バリエーション集合) となる最初の情報行のコンテキストを採用
 * - 状態.tsv: 状態(状態モデル集合) ⊆ 情報.tsv(状態モデル集合) となる最初の情報行のコンテキストを採用
 * - バリエーション.tsv: バリエーション名 ∈ 情報.tsv(バリエーション集合) となる最初の情報行のコンテキストを採用
 * - 一致なし: それぞれ "条件コンテキスト" / "状態コンテキスト" / "バリエーションコンテキスト"
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
  const ctxIdx = colIndex(infoTsv.header, 'コンテキスト', 'phase3/情報.tsv');
  const infoIdx = colIndex(infoTsv.header, '情報', 'phase3/情報.tsv');
  const stateModelIdx = colIndex(infoTsv.header, '状態モデル', 'phase3/情報.tsv');
  const variationIdx = colIndex(infoTsv.header, 'バリエーション', 'phase3/情報.tsv');

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
  const variationIdx = colIndex(inTsv.header, 'バリエーション', 'phase3/条件.tsv');

  const outHeader = ['コンテキスト', ...inTsv.header];
  const outRows = inTsv.rows.map((r) => {
    const varSet = parseList(r[variationIdx]);
    const match = varSet.size
      ? firstMatch(infoIndex, (info) => info.context && info.variationSet.size && isSubset(varSet, info.variationSet))
      : null;
    const context = match ? match.context : '条件コンテキスト';
    return [context, ...r];
  });

  return { header: outHeader, rows: outRows };
}

function convertStates({ infoIndex, inTsv }) {
  const stateModelIdx = colIndex(inTsv.header, '状態モデル', 'phase3/状態.tsv');

  const outHeader = ['コンテキスト', ...inTsv.header];
  const outRows = inTsv.rows.map((r) => {
    const modelSet = parseList(r[stateModelIdx]);
    const match = modelSet.size
      ? firstMatch(infoIndex, (info) => info.context && info.stateModelSet.size && isSubset(modelSet, info.stateModelSet))
      : null;
    const context = match ? match.context : '状態コンテキスト';
    return [context, ...r];
  });

  return { header: outHeader, rows: outRows };
}

function convertVariations({ infoIndex, inTsv }) {
  const variationNameIdx = colIndex(inTsv.header, 'バリエーション', 'phase2/バリエーション.tsv');

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
  const phase2Dir = path.resolve(root, '0_RDRAZeroOne', 'phase2');
  const phase4Dir = path.resolve(root, '0_RDRAZeroOne', 'phase4');

  const infoPath = path.resolve(phase3Dir, '情報.tsv');
  const condInPath = path.resolve(phase3Dir, '条件.tsv');
  const stateInPath = path.resolve(phase3Dir, '状態.tsv');
  const varInPath = path.resolve(phase2Dir, 'バリエーション.tsv');

  const condOutPath = path.resolve(phase4Dir, '条件.tsv');
  const stateOutPath = path.resolve(phase4Dir, '状態.tsv');
  const varOutPath = path.resolve(phase4Dir, 'バリエーション.tsv');

  const infoTsv = parseTsv(readText(infoPath));
  const infoIndex = buildInfoIndex(infoTsv);

  const condTsv = parseTsv(readText(condInPath));
  const stateTsv = parseTsv(readText(stateInPath));
  const variationTsv = parseTsv(readText(varInPath));

  const condOut = convertConditions({ infoIndex, inTsv: condTsv });
  const stateOut = convertStates({ infoIndex, inTsv: stateTsv });
  const varOut = convertVariations({ infoIndex, inTsv: variationTsv });

  ensureDir(phase4Dir);

  fs.writeFileSync(condOutPath, toTsv(condOut.header, condOut.rows), { encoding: 'utf8' });
  fs.writeFileSync(stateOutPath, toTsv(stateOut.header, stateOut.rows), { encoding: 'utf8' });
  fs.writeFileSync(varOutPath, toTsv(varOut.header, varOut.rows), { encoding: 'utf8' });

  console.log('[makePhase3to4] done');
  console.log(`- ${path.relative(root, condOutPath)}`);
  console.log(`- ${path.relative(root, stateOutPath)}`);
  console.log(`- ${path.relative(root, varOutPath)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[makePhase3to4] error:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

