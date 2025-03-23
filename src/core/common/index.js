/**
 * @file src/core/common/index.js
 * @description Common モジュール - 基本ユーティリティ関数と定数を提供
 */

/**
 * 人狼ゲームの各陣営を定義する定数
 * @enum {string}
 */
export const TEAM = {
  /** 村人陣営 */
  VILLAGE: 'village',
  /** 人狼陣営 */
  WEREWOLF: 'werewolf',
  /** 妖狐陣営 */
  FOX: 'fox',
  /** 中立陣営 */
  NEUTRAL: 'neutral'
};

/**
 * 基本フェーズを定義する定数
 * @enum {string}
 */
export const PHASE = {
  /** 準備フェーズ */
  PREPARATION: 'preparation',
  /** 初日夜フェーズ */
  FIRST_NIGHT: 'firstNight',
  /** 初日昼フェーズ */
  FIRST_DAY: 'firstDay',
  /** 夜フェーズ */
  NIGHT: 'night',
  /** 昼フェーズ */
  DAY: 'day',
  /** 投票フェーズ */
  VOTE: 'vote',
  /** 決選投票フェーズ */
  RUNOFF_VOTE: 'runoffVote',
  /** 処刑フェーズ */
  EXECUTION: 'execution',
  /** ゲーム終了フェーズ */
  GAME_END: 'gameEnd'
};

/**
 * 役職アクションタイプを定義する定数
 * @enum {string}
 */
export const ACTION_TYPE = {
  /** 占い */
  FORTUNE: 'fortune',
  /** 護衛 */
  GUARD: 'guard',
  /** 襲撃 */
  ATTACK: 'attack',
  /** 霊媒 */
  MEDIUM: 'medium',
  /** カスタムアクション用プレフィックス */
  CUSTOM: 'custom_'
};

/**
 * 投票タイプを定義する定数
 * @enum {string}
 */
export const VOTE_TYPE = {
  /** 処刑投票 */
  EXECUTION: 'execution',
  /** 決選投票 */
  RUNOFF: 'runoff',
  /** カスタム投票 */
  CUSTOM: 'custom'
};

/**
 * 死亡原因を定義する定数
 * @enum {string}
 */
export const DEATH_CAUSE = {
  /** 処刑による死亡 */
  EXECUTION: 'execution',
  /** 襲撃による死亡 */
  WEREWOLF: 'werewolf',
  /** 呪殺による死亡 */
  CURSE: 'curse',
  /** 後追いによる死亡 */
  FOLLOW: 'follow',
  /** その他の死亡 */
  OTHER: 'other'
};

/**
 * ユニークIDを生成する関数
 * @returns {string} ユニークID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * 配列をシャッフルする関数
 * @param {Array} array シャッフルする配列
 * @param {function} randomFn 乱数生成関数 (省略可)
 * @returns {Array} シャッフルされた新しい配列
 */
export function shuffle(array, randomFn = Math.random) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * オブジェクトの深いコピーを作成する関数
 * @param {Object} obj コピーするオブジェクト
 * @returns {Object} 深いコピーされたオブジェクト
 */
export function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCopy(item));
  }

  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key]);
    }
  }
  return copy;
}

/**
 * 現在のタイムスタンプを取得する関数
 * @returns {number} 現在のタイムスタンプ (ミリ秒)
 */
export function getTimestamp() {
  return Date.now();
}

/**
 * 基本的な乱数生成器を作成する関数
 * @param {number} seed シード値 (省略可)
 * @returns {function} 0以上1未満の乱数を返す関数
 */
export function createRandomGenerator(seed) {
  let _seed = seed || Math.floor(Math.random() * 1000000);

  return function () {
    _seed = (_seed * 9301 + 49297) % 233280;
    return _seed / 233280;
  };
}

/**
 * オブジェクトのマージユーティリティ
 * @param {Object} target マージ先のオブジェクト
 * @param {Object} source マージ元のオブジェクト
 * @param {boolean} deep 深いマージを行うかどうか
 * @returns {Object} マージされたオブジェクト
 */
export function mergeObjects(target, source, deep = false) {
  const output = { ...target };

  if (!source) {
    return output;
  }

  Object.keys(source).forEach(key => {
    if (deep && typeof source[key] === 'object' && !Array.isArray(source[key]) &&
      source[key] !== null && typeof output[key] === 'object' &&
      !Array.isArray(output[key]) && output[key] !== null) {
      output[key] = mergeObjects(output[key], source[key], deep);
    } else {
      output[key] = source[key];
    }
  });

  return output;
}

// Common モジュールのエクスポート
export default {
  TEAM,
  PHASE,
  ACTION_TYPE,
  VOTE_TYPE,
  DEATH_CAUSE,
  generateId,
  shuffle,
  deepCopy,
  getTimestamp,
  createRandomGenerator,
  mergeObjects
};