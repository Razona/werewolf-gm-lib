/**
 * 人狼ゲームGM支援ライブラリの共通ユーティリティ関数
 */

/**
 * 標準的な乱数生成器クラス
 */
export class Random {
  /**
   * 乱数生成器の初期化
   */
  constructor() {
    // 特に初期化処理は不要
  }

  /**
   * 0以上1未満の乱数を生成
   * @returns {number} - 生成された乱数
   */
  random() {
    return Math.random();
  }

  /**
   * min以上max未満の整数乱数を生成
   * @param {number} min - 最小値（以上）
   * @param {number} max - 最大値（未満）
   * @returns {number} - 生成された整数乱数
   */
  nextInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * 配列の要素をランダムに並べ替え
   * @param {Array} array - 並べ替える配列
   * @returns {Array} - 並べ替えられた新しい配列
   */
  shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * シード値を使用した決定的な乱数生成器クラス
 */
export class SeededRandom extends Random {
  /**
   * 乱数生成器の初期化
   * @param {number} seed - シード値
   */
  constructor(seed) {
    super();
    this.seed = seed;
    this.state = seed;
  }

  /**
   * シード値に基づいた0以上1未満の乱数を生成
   * @returns {number} - 生成された乱数
   */
  random() {
    // xorshift128+アルゴリズムの簡易実装
    let state = this.state;
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    this.state = state;
    
    // 0から1の範囲にマッピング
    return (state % 1000000) / 1000000;
  }

  /**
   * シードをリセット
   * @param {number} [newSeed] - 新しいシード値（省略時は元のシード値を使用）
   */
  resetSeed(newSeed) {
    this.state = newSeed !== undefined ? newSeed : this.seed;
  }
}

/**
 * プレイヤーIDの検証
 * @param {*} id - 検証するID
 * @returns {boolean} - 有効なIDであればtrue
 */
export function isValidPlayerId(id) {
  return typeof id === 'number' && id >= 0 && Number.isInteger(id);
}

/**
 * 役職名の検証
 * @param {string} roleName - 検証する役職名
 * @param {string[]} availableRoles - 有効な役職名のリスト
 * @returns {boolean} - 有効な役職名であればtrue
 */
export function isValidRoleName(roleName, availableRoles) {
  return typeof roleName === 'string' && availableRoles.includes(roleName);
}

/**
 * フェーズ名の検証
 * @param {string} phase - 検証するフェーズ名
 * @param {string[]} [allowedPhases] - 有効なフェーズのリスト（指定なしの場合は型のみチェック）
 * @returns {boolean} - 有効なフェーズ名であればtrue
 */
export function isValidPhase(phase, allowedPhases) {
  return typeof phase === 'string' && (!allowedPhases || allowedPhases.includes(phase));
}

/**
 * アクションの検証
 * @param {Object} action - 検証するアクション
 * @param {string[]} [allowedActions] - 有効なアクションタイプのリスト（指定なしの場合は型のみチェック）
 * @returns {boolean} - 有効なアクションであればtrue
 */
export function isValidAction(action, allowedActions) {
  return action && typeof action.type === 'string' && 
         (!allowedActions || allowedActions.includes(action.type));
}

/**
 * 生存プレイヤーのみをフィルタリング
 * @param {Array} players - プレイヤーリスト
 * @returns {Array} - 生存プレイヤーのみのリスト
 */
export function filterAlivePlayers(players) {
  return players.filter(player => player.isAlive);
}

/**
 * 特定の役職を持つプレイヤーの検索
 * @param {Array} players - プレイヤーリスト
 * @param {string} roleName - 検索する役職名
 * @returns {Array} - 条件に合致するプレイヤーリスト
 */
export function findPlayersByRole(players, roleName) {
  return players.filter(player => player.role && player.role.name === roleName);
}

/**
 * 投票結果の集計
 * @param {Array} votes - 投票リスト {voterId, targetId}
 * @returns {Object} - targetIdごとの得票数
 */
export function countVotes(votes) {
  const counts = {};
  votes.forEach(vote => {
    counts[vote.targetId] = (counts[vote.targetId] || 0) + 1;
  });
  return counts;
}

/**
 * 役職配布ヘルパー
 * @param {Array} roles - 配布する役職リスト
 * @param {Array} playerIds - プレイヤーIDリスト
 * @returns {Object} - プレイヤーIDと役職のマッピング
 */
export function distributeRoles(roles, playerIds) {
  const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
  const distribution = {};
  
  playerIds.forEach((playerId, index) => {
    distribution[playerId] = shuffledRoles[index % shuffledRoles.length];
  });
  
  return distribution;
}

/**
 * 同数得票プレイヤーからランダムに1人選択
 * @param {Array} tiedPlayers - 同数得票プレイヤーのリスト
 * @returns {*} - 選ばれたプレイヤー
 */
export function selectRandomTiedPlayer(tiedPlayers) {
  const index = Math.floor(Math.random() * tiedPlayers.length);
  return tiedPlayers[index];
}

/**
 * 配列からランダムに要素を1つ選択
 * @param {Array} array - 対象の配列
 * @returns {*} - ランダムに選ばれた要素
 */
export function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 一意のIDを生成
 * @returns {string} - 生成されたID
 */
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * イベント名をドット区切りで分解
 * @param {string} eventName - イベント名
 * @returns {string[]} - 分解されたイベント名の配列
 */
export function parseEventName(eventName) {
  return eventName.split('.');
}

/**
 * 階層的イベント名のマッチング
 * @param {string} eventName - チェックするイベント名
 * @param {string} pattern - マッチングパターン（* はワイルドカード）
 * @returns {boolean} - マッチすればtrue
 */
export function eventNameMatches(eventName, pattern) {
  const eventParts = parseEventName(eventName);
  const patternParts = parseEventName(pattern);
  
  if (patternParts.length > eventParts.length) return false;
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] !== '*' && patternParts[i] !== eventParts[i]) {
      return false;
    }
  }
  
  return true;
}

// デフォルトエクスポート
export default {
  // 乱数生成器
  Random,
  SeededRandom,
  
  // バリデーション
  isValidPlayerId,
  isValidRoleName,
  isValidPhase,
  isValidAction,
  
  // コレクション操作
  filterAlivePlayers,
  findPlayersByRole,
  countVotes,
  
  // ゲームロジック
  distributeRoles,
  selectRandomTiedPlayer,
  
  // 一般ユーティリティ
  randomElement,
  generateUniqueId,
  
  // イベント処理
  parseEventName,
  eventNameMatches
};
