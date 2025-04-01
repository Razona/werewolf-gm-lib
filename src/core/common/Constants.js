/**
 * 人狼ゲームGM支援ライブラリの定数定義
 */

// フェーズ定義
export const PHASES = {
  PREPARATION: 'preparation',
  FIRST_NIGHT: 'firstNight',
  FIRST_DAY: 'firstDay',
  NIGHT: 'night',
  DAY: 'day',
  VOTE: 'vote',
  RUNOFF_VOTE: 'runoffVote',
  EXECUTION: 'execution',
  GAME_END: 'gameEnd'
};

// アクション種別
export const ACTION_TYPES = {
  FORTUNE: 'fortune',
  GUARD: 'guard',
  ATTACK: 'attack',
  MEDIUM: 'medium',
  SPECIAL: 'special'
};

// 陣営定義
export const TEAMS = {
  VILLAGE: 'village',
  WEREWOLF: 'werewolf',
  FOX: 'fox'
};

// 役職定義
export const ROLES = {
  VILLAGER: 'villager',
  WEREWOLF: 'werewolf',
  SEER: 'seer',
  MEDIUM: 'medium',
  KNIGHT: 'knight',
  MADMAN: 'madman',
  FOX: 'fox',
  HERETIC: 'heretic',
  MASON: 'mason'
};

// 死因定義
export const DEATH_CAUSES = {
  EXECUTION: 'execution',
  ATTACK: 'attack',
  CURSE: 'curse',
  SUICIDE: 'suicide',
  SPECIAL: 'special'
};

// 投票ルール
export const VOTE_RULES = {
  RUNOFF: 'runoff',
  RANDOM: 'random',
  NO_EXECUTION: 'no_execution',
  ALL_EXECUTION: 'all_execution'
};

// 占い結果
export const FORTUNE_RESULTS = {
  WHITE: 'white',  // 村人判定
  BLACK: 'black',  // 人狼判定
  ERROR: 'error'   // 占い失敗
};

// 霊媒結果
export const MEDIUM_RESULTS = {
  WHITE: 'white',  // 村人判定
  BLACK: 'black',  // 人狼判定
  ERROR: 'error'   // 霊媒失敗
};

// デフォルト設定値
export const DEFAULT_OPTIONS = {
  randomSeed: null,
  allowSameVoteTarget: true,
  executionRule: VOTE_RULES.RUNOFF,
  runoffTieRule: VOTE_RULES.RANDOM,
  regulations: {
    allowConsecutiveGuard: false,
    allowRoleMissing: false,
    firstDayExecution: false,
    firstNightFortune: 'random_white',
    revealRoleOnDeath: true
  },
  visibilityControl: {
    enabled: false,
    strictMode: false
  }
};