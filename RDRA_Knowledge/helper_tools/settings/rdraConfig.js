'use strict';

/**
 * Phaseのプロンプトファイル（並列実行用）　実行のプロンプトファイル
 */
const phase1PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/システム概要生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/ビジネスポリシー生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/ビジネスパラメータ生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/業務生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/状態生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/要求生成.md'},
];
const phase2PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/BUC生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/アクター生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/バリエーション生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/外部システム生成.md'},
];
const phase3PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/UCアクター.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/UCタイマー.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/UC外部システム.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/UC条件.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/情報生成.md'},
];
const phase4PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase4/BUC生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase4/条件関連生成.md'},
];
/**
 * RDRAZeroOne　Phase1~Phase4 RDRA RDRASpecのファイル
 */
const phase1Files = [
  'システム概要.json',
  '要求.tsv',
  'ビジネスポリシー.tsv',
  'ビジネスパラメータ.tsv',
  '状態.tsv',
  '業務.tsv',
];

const phase2Files = [
  'BUC.tsv',
  'アクター.tsv',
  'バリエーション.tsv',
  '外部システム.tsv',
];

const phase3Files = [
  'UCアクター.tsv',
  'UCタイマー.tsv',
  'UC外部システム.tsv',
  'UC条件.tsv',
  '情報.tsv',
];

const phase4Files = [
  'BUC.tsv',
  '条件関連.tsv',
  '条件.tsv',
  'バリエーション.tsv',
  '状態.tsv',
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

// RDRASpec（仕様）成果物ファイル
// NOTE: 画面定義は「画面照会.json」を正とする（過去互換で ui.json を扱う箇所は menuAction 側で分岐）
const specFiles = [
  '論理データモデル.md',
  'ビジネスルール.md',
  '画面照会.json'
];

const specPhase1Files = [
  '21_論理データ生成.md',
  '22_ビジネスルール生成.md',
  '23_画面一覧生成.md',
  '24_BUC画面生成.md',
  '25_アクター画面生成.md'
];
const specPhase2Files = [
  '26_画面照会生成.md'
];

/**
 * 仕様作成用のプロンプトマップ（並列実行用）
 */
const specPhase1PromptMap = [
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/21_論理データ生成.md' },
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/22_ビジネスルール生成.md' },
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/23_画面一覧生成.md' },
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/24_BUC画面生成.md' },
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/25_アクター画面生成.md' },
];
const specPhase2PromptMap = [
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase2/26_画面照会生成.md' },
];

module.exports = {
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
  specPhase1Files,
  specPhase2Files,
};


