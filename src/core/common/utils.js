/**
 * 人狼ゲームGM支援ライブラリの共通ユーティリティ関数
 */

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
