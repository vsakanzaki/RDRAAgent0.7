'use strict';

/**
 * Phaseのプロンプトファイル（並列実行用）　実行のプロンプトファイル
 */
const phase1PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/アクター生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/外部システム生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/ビジネスポリシー生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/ビジネスパラメータ生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/業務生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/情報生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/状態生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/バリエーション生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/条件生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase1/初期要望分析.md'}
];

const phase2PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/アクター生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/業務生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/情報生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase2/状態生成.md' }
];

const phase3PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/BUC生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase3/情報生成.md'}
];

const phase4PromptMap = [
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase4/BUC生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase4/バリエーション生成.md'},
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase4/条件生成.md' },
  { prompt: 'RDRA_Knowledge/0_RDRAZeroOne/phase4/状態生成.md'}
];

/**
 * RDRAZeroOne　Phase1~Phase4 RDRA RDRASpecのファイル
 */
const phase1Files = [
  'アクター.tsv',
  '外部システム.tsv',
  'ビジネスポリシー.tsv',
  'ビジネスパラメータ.tsv',
  '業務.tsv',
  '情報.tsv',
  '状態.tsv',
  'バリエーション.tsv',
  '条件.tsv',
  '初期要望分析.md'
];

const phase2Files = [
  'アクター.tsv',
  '業務.tsv',
  '情報.tsv',
  '状態.tsv',
];

const phase3Files = [
  'BUC.tsv',
  '情報.tsv'
];

const phase4Files = [
  'BUC.tsv',
  '条件.tsv',
  'バリエーション.tsv',
  '状態.tsv'
];

const rdraFiles = [
  'システム概要.json',
  'BUC.tsv',
  'アクター.tsv',
  '外部システム.tsv',
  '情報.tsv',
  '状態.tsv',
  '条件.tsv',
  'バリエーション.tsv'
];

const specPhase1Files = [
  '21_論理データ生成.md',
  '22_ビジネスルール生成.md'
];
const specPhase2Files = [
  '23_画面生成.md'
];

/**
 * 仕様作成用のプロンプトマップ（並列実行用）
 */
const specPhase1PromptMap = [
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/21_論理データ生成.md' },
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase1/22_ビジネスルール生成.md' }
];
const specPhase2PromptMap = [
  { prompt: 'RDRA_Knowledge/2_RDRASpec/phase2/23_画面生成.md' },
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
};


