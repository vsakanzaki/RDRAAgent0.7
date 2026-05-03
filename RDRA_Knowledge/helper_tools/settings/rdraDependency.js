'use strict';

/**
 * RDRA ZeroOne 生成の依存 DAG 定義
 * - 各ノード: id, kind, phase, prompt?, scripts?, inputs[], outputs[]
 * - kind: 'ai' | 'script'
 * - phase: 1-4（AI）、'rebuild' | 'phase5'（スクリプト）
 * 仕様（2_RDRASpec）はプロンプト依存が複雑なため menuAction の executeSpec を継続利用
 */

const INITIAL = '初期要望.txt';

const nodes = [
  // --- Phase 1（入力は初期要望のみ）---
  {
    id: 'ph1_system_overview',
    kind: 'ai',
    phase: 1,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase1/システム概要生成.md',
    inputs: [INITIAL],
    outputs: ['0_RDRAZeroOne/phase1/システム概要.json'],
  },
  {
    id: 'ph1_business_policy',
    kind: 'ai',
    phase: 1,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase1/ph1ビジネスポリシー生成.md',
    inputs: [INITIAL],
    outputs: ['0_RDRAZeroOne/phase1/ph1ビジネスポリシー.tsv'],
  },
  {
    id: 'ph1_business_parameter',
    kind: 'ai',
    phase: 1,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase1/ph1ビジネスパラメータ生成.md',
    inputs: [INITIAL],
    outputs: ['0_RDRAZeroOne/phase1/ph1ビジネスパラメータ.tsv'],
  },
  {
    id: 'ph1_business',
    kind: 'ai',
    phase: 1,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase1/ph1業務生成.md',
    inputs: [INITIAL],
    outputs: ['0_RDRAZeroOne/phase1/ph1業務.tsv'],
  },
  {
    id: 'ph1_requirement',
    kind: 'ai',
    phase: 1,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase1/ph1要求生成.md',
    inputs: [INITIAL],
    outputs: ['0_RDRAZeroOne/phase1/ph1要求.tsv'],
  },

  // --- Phase 2 ---
  {
    id: 'ph2_state',
    kind: 'ai',
    phase: 2,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase2/ph2状態生成.md',
    inputs: [
      INITIAL,
      '0_RDRAZeroOne/phase1/ph1業務.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスポリシー.tsv',
      '0_RDRAZeroOne/phase1/ph1要求.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase2/ph2状態.tsv'],
  },
  {
    id: 'ph2_activity',
    kind: 'ai',
    phase: 2,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase2/ph2アクティビティ生成.md',
    inputs: [
      INITIAL,
      '0_RDRAZeroOne/phase1/ph1業務.tsv',
      '0_RDRAZeroOne/phase1/ph1要求.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスポリシー.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase2/ph2アクティビティ.tsv'],
  },
  {
    id: 'ph2_condition',
    kind: 'ai',
    phase: 2,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase2/ph2条件生成.md',
    inputs: [
      INITIAL,
      '0_RDRAZeroOne/phase1/ph1業務.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスポリシー.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase2/ph2条件.tsv'],
  },

  // --- Phase 3 ---
  {
    id: 'ph3_buc',
    kind: 'ai',
    phase: 3,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase3/ph3BUC生成.md',
    inputs: [
      '0_RDRAZeroOne/phase1/ph1業務.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスポリシー.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスパラメータ.tsv',
      '0_RDRAZeroOne/phase1/ph1要求.tsv',
      '0_RDRAZeroOne/phase2/ph2状態.tsv',
      '0_RDRAZeroOne/phase2/ph2条件.tsv',
      '0_RDRAZeroOne/phase2/ph2アクティビティ.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase3/ph3BUC.tsv'],
  },
  {
    id: 'ph3_variation',
    kind: 'ai',
    phase: 3,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase3/ph3バリエーション生成.md',
    inputs: ['0_RDRAZeroOne/phase1/ph1ビジネスパラメータ.tsv'],
    outputs: ['0_RDRAZeroOne/phase3/ph3バリエーション.tsv'],
  },

  // --- Phase 4 ---
  {
    id: 'ph4_info',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4情報生成.md',
    inputs: [
      '0_RDRAZeroOne/phase3/ph3BUC.tsv',
      '0_RDRAZeroOne/phase3/ph3バリエーション.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase4/ph4情報.tsv'],
  },
  {
    id: 'ph4_state',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4状態生成.md',
    inputs: [
      '0_RDRAZeroOne/phase3/ph3BUC.tsv',
      '0_RDRAZeroOne/phase2/ph2状態.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase4/ph4状態.tsv'],
  },
  {
    id: 'ph4_uc_actor',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4UCアクター.md',
    inputs: [INITIAL, '0_RDRAZeroOne/phase3/ph3BUC.tsv'],
    outputs: ['0_RDRAZeroOne/phase4/ph4UCアクター.tsv'],
  },
  {
    id: 'ph4_uc_timer',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4UCタイマー.md',
    inputs: [
      '0_RDRAZeroOne/phase3/ph3BUC.tsv',
      '0_RDRAZeroOne/phase1/ph1要求.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase4/ph4UCタイマー.tsv'],
  },
  {
    id: 'ph4_uc_external',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4UC外部システム.md',
    inputs: [INITIAL, '0_RDRAZeroOne/phase3/ph3BUC.tsv'],
    outputs: ['0_RDRAZeroOne/phase4/ph4UC外部システム.tsv'],
  },
  {
    id: 'ph4_actor',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4アクター生成.md',
    inputs: ['0_RDRAZeroOne/phase3/ph3BUC.tsv'],
    outputs: ['0_RDRAZeroOne/phase4/ph4アクター.tsv'],
  },
  {
    id: 'ph4_external_system',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4外部システム生成.md',
    inputs: ['0_RDRAZeroOne/phase3/ph3BUC.tsv'],
    outputs: ['0_RDRAZeroOne/phase4/ph4外部システム.tsv'],
  },
  {
    id: 'ph4_condition',
    kind: 'ai',
    phase: 4,
    prompt: 'RDRA_Knowledge/_0_RDRAZeroOne/phase4/ph4条件生成.md',
    inputs: [
      '0_RDRAZeroOne/phase3/ph3BUC.tsv',
      '0_RDRAZeroOne/phase3/ph3バリエーション.tsv',
    ],
    outputs: ['0_RDRAZeroOne/phase4/ph4条件.tsv'],
  },

  // --- 1_RDRA 再構築（makeBUC → attachContext → rdraFileCopy）---
  {
    id: 'rebuild_1_rdrA',
    kind: 'script',
    phase: 'rebuild',
    scripts: [
      'RDRA_Knowledge/helper_tools/makeBUC.js',
      'RDRA_Knowledge/helper_tools/attachContext.js',
      'RDRA_Knowledge/helper_tools/rdraFileCopy.js',
    ],
    inputs: [
      '0_RDRAZeroOne/phase1/システム概要.json',
      '0_RDRAZeroOne/phase1/ph1要求.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスポリシー.tsv',
      '0_RDRAZeroOne/phase1/ph1ビジネスパラメータ.tsv',
      '0_RDRAZeroOne/phase1/ph1業務.tsv',
      '0_RDRAZeroOne/phase2/ph2状態.tsv',
      '0_RDRAZeroOne/phase2/ph2アクティビティ.tsv',
      '0_RDRAZeroOne/phase2/ph2条件.tsv',
      '0_RDRAZeroOne/phase3/ph3BUC.tsv',
      '0_RDRAZeroOne/phase3/ph3バリエーション.tsv',
      '0_RDRAZeroOne/phase4/ph4UCタイマー.tsv',
      '0_RDRAZeroOne/phase4/ph4UCアクター.tsv',
      '0_RDRAZeroOne/phase4/ph4UC外部システム.tsv',
      '0_RDRAZeroOne/phase4/ph4アクター.tsv',
      '0_RDRAZeroOne/phase4/ph4外部システム.tsv',
      '0_RDRAZeroOne/phase4/ph4条件.tsv',
      '0_RDRAZeroOne/phase4/ph4情報.tsv',
      '0_RDRAZeroOne/phase4/ph4状態.tsv',
    ],
    outputs: [
      '1_RDRA/システム概要.json',
      '1_RDRA/アクター.tsv',
      '1_RDRA/外部システム.tsv',
      '1_RDRA/情報.tsv',
      '1_RDRA/状態.tsv',
      '1_RDRA/条件.tsv',
      '1_RDRA/バリエーション.tsv',
      '1_RDRA/BUC.tsv',
    ],
  },

  // --- Phase5: 関連データ.txt ---
  {
    id: 'phase5_graph_data',
    kind: 'script',
    phase: 'phase5',
    scripts: ['RDRA_Knowledge/helper_tools/makeGraphData.js'],
    inputs: [
      '1_RDRA/システム概要.json',
      '1_RDRA/アクター.tsv',
      '1_RDRA/外部システム.tsv',
      '1_RDRA/情報.tsv',
      '1_RDRA/状態.tsv',
      '1_RDRA/条件.tsv',
      '1_RDRA/バリエーション.tsv',
      '1_RDRA/BUC.tsv',
    ],
    outputs: ['1_RDRA/if/関連データ.txt'],
  },
];

const phase1Files = [
  'システム概要.json',
  'ph1要求.tsv',
  'ph1ビジネスポリシー.tsv',
  'ph1ビジネスパラメータ.tsv',
  'ph1業務.tsv',
];
const phase2Files = ['ph2状態.tsv', 'ph2アクティビティ.tsv', 'ph2条件.tsv'];
const phase3Files = ['ph3BUC.tsv', 'ph3バリエーション.tsv'];
const phase4Files = [
  'ph4UCタイマー.tsv',
  'ph4UCアクター.tsv',
  'ph4UC外部システム.tsv',
  'ph4アクター.tsv',
  'ph4外部システム.tsv',
  'ph4条件.tsv',
  'ph4情報.tsv',
  'ph4状態.tsv',
];

const rdraFiles = [
  'システム概要.json',
  'アクター.tsv',
  '外部システム.tsv',
  '情報.tsv',
  '状態.tsv',
  '条件.tsv',
  'バリエーション.tsv',
  'BUC.tsv',
];

const specFiles = ['論理データモデル.md', 'ビジネスルール.md', '画面照会.json'];

const specPhase1Files = [
  '21_論理データ生成.md',
  '22_ビジネスルール生成.md',
  '23_画面一覧生成.md',
  '24_BUC画面生成.md',
  '25_アクター画面生成.md',
];
const specPhase2Files = ['26_画面照会生成.md'];

/**
 * メニュー7用: 指定フェーズの AI プロンプト一覧（フェーズ全体を並列実行）
 * @param {number} phaseNum
 */
function getAiPromptsForPhase(phaseNum) {
  return nodes
    .filter((n) => n.kind === 'ai' && n.phase === phaseNum)
    .map((n) => n.prompt);
}

/**
 * メニュー8用: ZeroOne パイプラインの AI ノードのみ（rebuild 除く）
 */
function getZeroOneAiNodes() {
  return nodes.filter((n) => n.kind === 'ai' && typeof n.phase === 'number');
}

function getPipelineScriptNodes() {
  return nodes.filter((n) => n.kind === 'script' && (n.phase === 'rebuild' || n.phase === 'phase5'));
}

module.exports = {
  nodes,
  INITIAL,
  phase1Files,
  phase2Files,
  phase3Files,
  phase4Files,
  rdraFiles,
  specFiles,
  specPhase1Files,
  specPhase2Files,
  getAiPromptsForPhase,
  getZeroOneAiNodes,
  getPipelineScriptNodes,
};
