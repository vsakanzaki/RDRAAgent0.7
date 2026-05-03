'use strict';

/**
 * RDRA 成果物ファイル定義・仕様プロンプト（並列実行用）
 * ZeroOne の AI プロンプトマップは rdraDependency.js に集約済み
 */
const dep = require('./rdraDependency');

/** 仕様作成用プロンプト（executeSpec 用） */
const specPhase1PromptMap = [
  { prompt: 'RDRA_Knowledge/_2_RDRASpec/phase1/21_論理データ生成.md' },
  { prompt: 'RDRA_Knowledge/_2_RDRASpec/phase1/22_ビジネスルール生成.md' },
  { prompt: 'RDRA_Knowledge/_2_RDRASpec/phase1/23_画面一覧生成.md' },
  { prompt: 'RDRA_Knowledge/_2_RDRASpec/phase1/24_BUC画面生成.md' },
  { prompt: 'RDRA_Knowledge/_2_RDRASpec/phase1/25_アクター画面生成.md' },
];
const specPhase2PromptMap = [{ prompt: 'RDRA_Knowledge/_2_RDRASpec/phase2/26_画面照会生成.md' }];
const createDomainPromptMap = [{ prompt: 'RDRA_Knowledge/_3_RDRASdd/31_Create_Domain.md' }];
const createApplicationPromptMap = [{ prompt: 'RDRA_Knowledge/_3_RDRASdd/32_Create_Application.md' }];
const createUIPromptMap = [{ prompt: 'RDRA_Knowledge/_3_RDRASdd/33_Create_UI.md' }];
const createCallgraphPromptMap = [
    { prompt: 'RDRA_Knowledge/_3_RDRASdd/callgraph_domain_data_maker.md' },
    { prompt: 'RDRA_Knowledge/_3_RDRASdd/callgraph_application_data_maker.md' },
    { prompt: 'RDRA_Knowledge/_3_RDRASdd/callgraph_ui_data_maker.md' },
];

/** parallel-runner がプロンプト先頭に付与する固定行（プロジェクトルート行以外） */
const CONTEXT_HEADER_LINES = [
  '- 本プロンプト中のすべての相対パス（入力・出力）は、上記プロジェクトルートを基準に解釈する',
  '- `RDRA_Knowledge/` 配下には絶対に出力しない（知識・プロンプト置き場）',
  '- 出力先は必ず `0_RDRAZeroOne/`, `1_RDRA/`, `2_RDRASpec/`, `3_RDRASdd/` のいずれか配下とする',
  '- 既存ファイルは上書きする',
];

/**
 * AI 実行用: プロジェクトルート基準の出力ルールをプロンプト先頭に付与するヘッダ文字列
 * @param {string} projectRoot - 初期要望.txt があるディレクトリの絶対パス
 * @returns {string}
 */
function buildContextHeader(projectRoot) {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('buildContextHeader: projectRoot は必須の string です');
  }
  return [
    '# 実行コンテキスト（自動付与・厳守）',
    `- プロジェクトルート（絶対パス）: ${projectRoot}`,
    ...CONTEXT_HEADER_LINES,
    '',
    '---',
    '',
    '',
  ].join('\n');
}

module.exports = {
  phase1Files: dep.phase1Files,
  phase2Files: dep.phase2Files,
  phase3Files: dep.phase3Files,
  phase4Files: dep.phase4Files,
  rdraFiles: dep.rdraFiles,
  specFiles: dep.specFiles,
  specPhase1Files: dep.specPhase1Files,
  specPhase2Files: dep.specPhase2Files,
  specPhase1PromptMap,
  specPhase2PromptMap,
  createDomainPromptMap,
  createApplicationPromptMap,
  createUIPromptMap,
  createCallgraphPromptMap,
  CONTEXT_HEADER_LINES,
  buildContextHeader,
};
