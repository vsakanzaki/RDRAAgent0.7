#!/usr/bin/env node
/**
 * 依存 DAG に基づく RDRA ZeroOne 実行
 * - --menu7 : 未完了の最小フェーズを 1 回だけ、従来どおりフェーズ内全プロンプトを並列実行
 * - --menu8 : 入力が揃ったノードを波状に並列実行（ファイル単位）
 * - --from-scratch : 削除は呼び出し側。menu8 と同じく全ノードを埋めるまで実行
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const dep = require('../settings/rdraDependency');

const DEFAULT_TIMEOUT_MS = 360000;

function findProjectRootByInitialRequest(startDir) {
  let dir = path.resolve(startDir);
  const { root } = path.parse(dir);
  while (true) {
    const marker = path.join(dir, dep.INITIAL);
    if (fs.existsSync(marker)) {
      return dir;
    }
    if (dir === root) {
      throw new Error(`${dep.INITIAL} が見つからず、プロジェクトルートを特定できません`);
    }
    dir = path.dirname(dir);
  }
}

function normalizeName(s) {
  return s.normalize('NFC');
}

function fileExists(projectRoot, relPath) {
  const full = path.join(projectRoot, relPath.split('/').join(path.sep));
  if (!fs.existsSync(full)) return false;
  try {
    const dir = path.dirname(full);
    const base = path.basename(full);
    const files = fs.readdirSync(dir).map(normalizeName);
    return files.includes(normalizeName(base));
  } catch {
    return false;
  }
}

function allInputsExist(projectRoot, node) {
  return node.inputs.every((p) => fileExists(projectRoot, p));
}

function allOutputsExist(projectRoot, node) {
  return node.outputs.every((p) => fileExists(projectRoot, p));
}

function phaseDirComplete(projectRoot, phaseNum) {
  const folder = `0_RDRAZeroOne/phase${phaseNum}`;
  const files = dep[`phase${phaseNum}Files`];
  if (!files) return false;
  return files.every((fn) => fileExists(projectRoot, `${folder}/${fn}`));
}

function runParallelRunnerPrompts(projectRoot, promptRelPaths, timeoutMs) {
  if (promptRelPaths.length === 0) {
    return Promise.resolve();
  }
  const runner = path.join(projectRoot, 'RDRA_Knowledge/helper_tools/parallelRun/parallel-runner.js');
  const args = [runner, ...promptRelPaths, '--timeout', String(timeoutMs || DEFAULT_TIMEOUT_MS)];
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`parallel-runner が終了コード ${code} で終了しました`));
    });
    child.on('error', reject);
  });
}

function runNodeScript(projectRoot, scriptRelPath) {
  const scriptAbs = path.join(projectRoot, scriptRelPath.split('/').join(path.sep));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptAbs], {
      cwd: projectRoot,
      stdio: 'inherit',
    });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRelPath} が終了コード ${code} で終了しました`));
    });
    child.on('error', reject);
  });
}

async function runScriptNode(projectRoot, node) {
  if (!node.scripts || node.scripts.length === 0) {
    throw new Error(`スクリプトノード ${node.id} に scripts がありません`);
  }
  for (const s of node.scripts) {
    await runNodeScript(projectRoot, s);
  }
}

/**
 * メニュー7: 最初の未完了フェーズだけ、フェーズ内の全 AI プロンプトを並列実行。
 * Phase1〜4 が揃った後は常に 1_RDRA 再構築 + 関連データ生成（従来 executeEachPhase の最終動作）
 */
async function runMenu7(projectRoot, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const root = projectRoot || findProjectRootByInitialRequest(process.cwd());

  for (let p = 1; p <= 4; p++) {
    if (!phaseDirComplete(root, p)) {
      const prompts = dep.getAiPromptsForPhase(p);
      console.log(`\n[menu7] Phase${p} を並列実行します（${prompts.length} 本）`);
      await runParallelRunnerPrompts(root, prompts, timeoutMs);
      if (p === 4) {
        await runRebuildAndPhase5Always(root);
      }
      return;
    }
  }

  console.log('\n[menu7] Phase1〜4 は揃っています。1_RDRA を再構築し関連データを更新します。');
  await runRebuildAndPhase5Always(root);
}

/**
 * 従来 executePhase5Auto 相当: 再構築チェーンの後に makeGraphData
 */
async function runRebuildAndPhase5Always(projectRoot) {
  const pipeline = dep.getPipelineScriptNodes();
  const rebuild = pipeline.find((n) => n.id === 'rebuild_1_rdrA');
  const phase5 = pipeline.find((n) => n.id === 'phase5_graph_data');
  if (!rebuild || !phase5) {
    throw new Error('rebuild / phase5 ノードが見つかりません');
  }
  if (!allInputsExist(projectRoot, rebuild)) {
    throw new Error('Phase4 成果物が不足しており 1_RDRA を再構築できません');
  }
  console.log('\n[phase5] 1_RDRA 再構築（makeBUC → attachContext → rdraFileCopy）...');
  await runScriptNode(projectRoot, rebuild);
  console.log('\n[phase5] 関連データ.txt 作成（makeGraphData）...');
  await runScriptNode(projectRoot, phase5);
}

/**
 * メニュー8: 入力充足ノードを繰り返し並列実行し、最後に rebuild + phase5
 */
async function runMenu8(projectRoot, options = {}) {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const root = projectRoot || findProjectRootByInitialRequest(process.cwd());

  let guard = 0;
  const maxIterations = 500;

  while (guard++ < maxIterations) {
    const aiNodes = dep.getZeroOneAiNodes();
    const runnable = aiNodes.filter((n) => allInputsExist(root, n) && !allOutputsExist(root, n));
    if (runnable.length > 0) {
      const prompts = runnable.map((n) => n.prompt);
      console.log(`\n[menu8] AI 並列実行: ${runnable.length} ノード`);
      await runParallelRunnerPrompts(root, prompts, timeoutMs);
      continue;
    }

    const pipeline = dep.getPipelineScriptNodes();
    const rebuild = pipeline.find((n) => n.id === 'rebuild_1_rdrA');
    const phase5 = pipeline.find((n) => n.id === 'phase5_graph_data');

    const phase4AiDone = dep.getAiPromptsForPhase(4).length > 0 && phaseDirComplete(root, 4);
    if (phase4AiDone && rebuild && allInputsExist(root, rebuild) && !allOutputsExist(root, rebuild)) {
      console.log('\n[menu8] 1_RDRA 再構築...');
      await runScriptNode(root, rebuild);
      continue;
    }

    if (phase5 && allInputsExist(root, phase5) && !allOutputsExist(root, phase5)) {
      console.log('\n[menu8] 関連データ.txt 作成...');
      await runScriptNode(root, phase5);
      continue;
    }

    const aiNodesAll = dep.getZeroOneAiNodes();
    const incomplete = aiNodesAll.filter((n) => !allOutputsExist(root, n));
    if (incomplete.length > 0 && runnable.length === 0) {
      const blocked = incomplete.find((n) => !allInputsExist(root, n));
      if (blocked) {
        throw new Error(
          `[menu8] 未生成の AI ノードがありますが入力が不足しています: ${blocked.id}（不足入力を確認してください）`
        );
      }
    }

    console.log('\n[menu8] 完了（これ以上実行するノードはありません）');
    return;
  }
  throw new Error('[menu8] 打ち切り: ループ上限に達しました');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    menu7: false,
    menu8: false,
    fromScratch: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--menu7') opts.menu7 = true;
    else if (a === '--menu8') opts.menu8 = true;
    else if (a === '--from-scratch') opts.fromScratch = true;
    else if (a === '--timeout') opts.timeoutMs = parseInt(args[++i], 10) || DEFAULT_TIMEOUT_MS;
    else if (a === '--help' || a === '-h') opts.help = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`
Usage: node dag-runner.js [options]

Options:
  --menu7       フェーズ単位（最初の未完了フェーズのみ）
  --menu8       DAG 波状並列（未生成ノードを入力充足で実行）
  --from-scratch  menu8 と同じ（削除は menu 側で実施）
  --timeout <ms>  デフォルト ${DEFAULT_TIMEOUT_MS}
`);
    process.exit(0);
  }

  const root = findProjectRootByInitialRequest(process.cwd());

  try {
    if (opts.menu7) {
      await runMenu7(root, { timeoutMs: opts.timeoutMs });
    } else if (opts.menu8 || opts.fromScratch) {
      await runMenu8(root, { timeoutMs: opts.timeoutMs });
    } else {
      console.error('--menu7 / --menu8 / --from-scratch のいずれかを指定してください');
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findProjectRootByInitialRequest,
  runMenu7,
  runMenu8,
  runRebuildAndPhase5Always,
  fileExists,
  allInputsExist,
  allOutputsExist,
};
