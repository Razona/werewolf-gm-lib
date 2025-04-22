/**
 * GameManagerState テスト用ヘルパー関数
 * テスト中に繰り返し使用される検証ロジックなどを提供
 */

/**
 * 状態オブジェクトの構造を検証する
 * @param {Object} state - 検証する状態オブジェクト
 * @param {Array} requiredFields - 必須フィールドの配列
 * @returns {boolean} すべての必須フィールドが存在すればtrue
 */
export function validateStateStructure(state, requiredFields = []) {
  if (!state || typeof state !== 'object') {
    return false;
  }

  for (const field of requiredFields) {
    if (!state.hasOwnProperty(field)) {
      return false;
    }
  }

  return true;
}

/**
 * 状態オブジェクトの整合性を検証する
 * @param {Object} state - 検証する状態オブジェクト
 * @returns {boolean|Object} 整合性が正しければtrue、そうでなければエラー情報
 */
export function validateStateConsistency(state) {
  // ゲーム終了時には勝者が設定されているべき
  if (state.isEnded === true && state.winner === null) {
    return {
      isValid: false,
      message: 'ゲーム終了時には勝者が設定されているべきです',
      context: { isEnded: state.isEnded, winner: state.winner }
    };
  }

  // プレイヤー数と役職数の整合性
  if (state.roles && state.roles.distributed === true) {
    const playerIds = state.players.map(p => p.id);
    const distributionIds = Object.keys(state.roles.distribution).map(id => parseInt(id, 10));
    
    // すべてのプレイヤーに役職が割り当てられているべき
    const missingRoles = playerIds.filter(id => !distributionIds.includes(id));
    if (missingRoles.length > 0) {
      return {
        isValid: false,
        message: '役職が割り当てられていないプレイヤーがいます',
        context: { missingRoles }
      };
    }
  }

  return true;
}

/**
 * イベント発火を検証する
 * @param {Object} mockEventSystem - モック化されたEventSystem
 * @param {string} eventName - 検証するイベント名
 * @param {Object} expectedData - 期待されるイベントデータ（部分一致で検証）
 * @returns {boolean} イベントが期待通りに発火されていればtrue
 */
export function verifyEventFired(mockEventSystem, eventName, expectedData = null) {
  // イベント発火の呼び出しを検索
  const calls = mockEventSystem.emit.mock.calls.filter(call => call[0] === eventName);
  
  if (calls.length === 0) {
    return false;
  }

  // データの検証が不要な場合はtrueを返す
  if (expectedData === null) {
    return true;
  }

  // 期待されるデータが部分的に含まれているか検証
  return calls.some(call => {
    const eventData = call[1];
    
    // 期待するすべてのプロパティをチェック
    return Object.entries(expectedData).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // オブジェクトの場合は再帰的に検証（簡易的な実装）
        return JSON.stringify(eventData[key]).includes(JSON.stringify(value));
      }
      return eventData[key] === value;
    });
  });
}

/**
 * 複数のイベント発火の順序を検証する
 * @param {Object} mockEventSystem - モック化されたEventSystem
 * @param {Array} eventSequence - 期待されるイベント名の配列（順番に検証）
 * @returns {boolean} イベントが期待通りの順番で発火されていればtrue
 */
export function verifyEventSequence(mockEventSystem, eventSequence) {
  const firedEvents = mockEventSystem.emit.mock.calls.map(call => call[0]);
  
  // すべての期待イベントがfiredEventsに含まれ、かつ順序が正しいかチェック
  let lastIndex = -1;
  
  for (const eventName of eventSequence) {
    const index = firedEvents.indexOf(eventName, lastIndex + 1);
    
    if (index === -1) {
      return false; // イベントが見つからない
    }
    
    if (index <= lastIndex) {
      return false; // 順序が正しくない
    }
    
    lastIndex = index;
  }
  
  return true;
}

/**
 * 2つの状態オブジェクト間の深い比較を行う
 * @param {Object} stateA - 比較元の状態
 * @param {Object} stateB - 比較先の状態 
 * @param {Array} ignoreFields - 比較から除外するフィールドの配列
 * @returns {boolean} 2つの状態が同一であればtrue
 */
export function deepCompareStates(stateA, stateB, ignoreFields = []) {
  // 両方nullまたはundefinedの場合
  if (stateA == null && stateB == null) {
    return true;
  }
  
  // 片方だけnullまたはundefinedの場合
  if (stateA == null || stateB == null) {
    return false;
  }
  
  // プリミティブ値の場合は通常の比較
  if (typeof stateA !== 'object' || typeof stateB !== 'object') {
    return stateA === stateB;
  }
  
  // 配列の場合
  if (Array.isArray(stateA) && Array.isArray(stateB)) {
    if (stateA.length !== stateB.length) {
      return false;
    }
    
    for (let i = 0; i < stateA.length; i++) {
      if (!deepCompareStates(stateA[i], stateB[i], ignoreFields)) {
        return false;
      }
    }
    
    return true;
  }
  
  // 配列の片方だけが配列の場合
  if (Array.isArray(stateA) || Array.isArray(stateB)) {
    return false;
  }
  
  // オブジェクトのキーを取得（無視フィールドを除く）
  const keysA = Object.keys(stateA).filter(key => !ignoreFields.includes(key));
  const keysB = Object.keys(stateB).filter(key => !ignoreFields.includes(key));
  
  // キー数が異なる場合
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  // 各キーの値を再帰的に比較
  for (const key of keysA) {
    if (!keysB.includes(key)) {
      return false;
    }
    
    if (!deepCompareStates(stateA[key], stateB[key], ignoreFields)) {
      return false;
    }
  }
  
  return true;
}

/**
 * スナップショットと状態を比較して整合性を検証する
 * @param {Object} originalState - 元の状態（更新前/スナップショット）
 * @param {Object} updatedState - 更新後の状態
 * @param {Object} updates - 適用された更新内容
 * @returns {boolean} 整合性が正しければtrue
 */
export function verifyStateUpdate(originalState, updatedState, updates) {
  // すべての更新が適用されているか確認
  for (const [key, value] of Object.entries(updates)) {
    // ネストしたオブジェクトの場合
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
        typeof updatedState[key] === 'object' && !Array.isArray(updatedState[key])) {
      if (!verifyStateUpdate(originalState[key] || {}, updatedState[key], value)) {
        return false;
      }
    } 
    // 配列またはプリミティブ値の場合
    else if (JSON.stringify(updatedState[key]) !== JSON.stringify(value)) {
      return false;
    }
  }
  
  // 更新されていないフィールドが変更されていないことを確認
  const updateKeys = Object.keys(updates);
  for (const key of Object.keys(originalState)) {
    if (!updateKeys.includes(key) && 
        key !== 'lastUpdate' && // lastUpdateは除外
        JSON.stringify(originalState[key]) !== JSON.stringify(updatedState[key])) {
      return false;
    }
  }
  
  return true;
}

// トランザクションのメタデータを検証
export function verifyTransactionMetadata(transaction, expectedMetadata) {
  if (!transaction) return false;
  
  // 基本的なトランザクション状態
  if (transaction.active !== true) return false;
  if (!transaction.snapshot) return false;
  if (!Array.isArray(transaction.changes)) return false;
  if (!transaction.timestamp) return false;
  
  // メタデータの検証
  if (expectedMetadata) {
    for (const [key, value] of Object.entries(expectedMetadata)) {
      if (transaction.metadata[key] !== value) {
        return false;
      }
    }
  }
  
  return true;
}

// 保存データの構造を検証
export function validateSaveDataStructure(saveData) {
  const requiredFields = ['id', 'gameId', 'version', 'timestamp', 'state'];
  
  for (const field of requiredFields) {
    if (!saveData || !saveData.hasOwnProperty(field)) {
      return false;
    }
  }
  
  return true;
}

export default {
  validateStateStructure,
  validateStateConsistency,
  verifyEventFired,
  verifyEventSequence,
  deepCompareStates,
  verifyStateUpdate,
  verifyTransactionMetadata,
  validateSaveDataStructure
};
