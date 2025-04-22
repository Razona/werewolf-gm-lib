/**
 * GameManagerState テスト用ヘルパー関数
 * テスト中に繰り返し使用される検証ロジック
 */

/**
 * 状態オブジェクトの基本構造を検証
 * @param {Object} state - 検証する状態オブジェクト
 * @returns {boolean} 検証結果
 */
export function validateStateStructure(state) {
  // 必須フィールドの存在確認
  const requiredFields = [
    'id', 'isStarted', 'isEnded', 'turn', 'players', 
    'roles', 'votes', 'actions', 'lastUpdate'
  ];
  
  for (const field of requiredFields) {
    if (!(field in state)) {
      return false;
    }
  }

  // ネストした構造の検証
  if (!state.roles || typeof state.roles !== 'object') return false;
  if (!state.votes || typeof state.votes !== 'object') return false;
  if (!state.actions || typeof state.actions !== 'object') return false;
  
  // 最低限のデータ型チェック
  if (typeof state.isStarted !== 'boolean') return false;
  if (typeof state.isEnded !== 'boolean') return false;
  if (typeof state.turn !== 'number') return false;
  if (!Array.isArray(state.players)) return false;
  
  return true;
}

/**
 * 状態オブジェクトの整合性を検証
 * @param {Object} state - 検証する状態オブジェクト
 * @returns {Object} 検証結果と問題点
 */
export function checkStateConsistency(state) {
  const issues = [];
  
  // 状態フラグの整合性
  if (state.isEnded && !state.isStarted) {
    issues.push('終了状態なのに開始状態になっていない');
  }
  
  // 終了状態の場合は勝者情報が必要
  if (state.isEnded && !state.winner) {
    issues.push('終了状態なのに勝者情報がない');
  }
  
  // ターン数と開始状態の整合性
  if (state.turn > 0 && !state.isStarted) {
    issues.push('ターンが進んでいるのに開始状態になっていない');
  }
  
  // フェーズと開始状態の整合性
  if (state.phase && !state.isStarted) {
    issues.push('フェーズが設定されているのに開始状態になっていない');
  }
  
  // 役職配布状態の整合性
  if (state.roles.distributed && (!state.roles.distribution || Object.keys(state.roles.distribution).length === 0)) {
    issues.push('役職配布済みなのに配布情報がない');
  }
  
  return {
    consistent: issues.length === 0,
    issues
  };
}

/**
 * 2つの状態オブジェクトを比較し、差分を返す
 * @param {Object} oldState - 比較元の状態
 * @param {Object} newState - 比較先の状態
 * @returns {Object} 差分情報
 */
export function compareStates(oldState, newState) {
  const differences = {
    changed: [],
    added: [],
    removed: [],
    summary: {}
  };
  
  // トップレベルフィールドの比較
  const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
  
  for (const key of allKeys) {
    // 追加されたフィールド
    if (!(key in oldState) && key in newState) {
      differences.added.push(key);
      continue;
    }
    
    // 削除されたフィールド
    if (key in oldState && !(key in newState)) {
      differences.removed.push(key);
      continue;
    }
    
    // 変更されたフィールド
    if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
      differences.changed.push(key);
      
      // 簡易的な差分内容（ネストしたオブジェクトの詳細差分は計算しない）
      if (typeof oldState[key] !== 'object' || oldState[key] === null) {
        differences.summary[key] = {
          from: oldState[key],
          to: newState[key]
        };
      } else {
        differences.summary[key] = '変更あり';
      }
    }
  }
  
  return differences;
}

/**
 * イベント発火を検証するためのヘルパー
 * @param {Object} mockEventSystem - モック化されたEventSystem
 * @param {string} eventName - 検証するイベント名
 * @param {Object} expectedData - 期待されるイベントデータ
 * @returns {boolean} 検証結果
 */
export function verifyEventFired(mockEventSystem, eventName, expectedData = null) {
  // イベントが発火されたか確認
  const eventCalls = mockEventSystem.emit.mock.calls.filter(call => call[0] === eventName);
  if (eventCalls.length === 0) {
    return false;
  }
  
  // データ内容の検証が不要な場合はtrueを返す
  if (expectedData === null) {
    return true;
  }
  
  // 最後に発火されたイベントのデータを取得
  const lastCallData = eventCalls[eventCalls.length - 1][1];
  
  // 期待されるデータのすべてのフィールドが含まれているか確認
  for (const [key, value] of Object.entries(expectedData)) {
    if (!(key in lastCallData) || JSON.stringify(lastCallData[key]) !== JSON.stringify(value)) {
      return false;
    }
  }
  
  return true;
}

/**
 * イベントの発火順序を検証するためのヘルパー
 * @param {Object} mockEventSystem - モック化されたEventSystem
 * @param {Array<string>} expectedSequence - 期待されるイベント名の配列
 * @returns {boolean} 検証結果
 */
export function verifyEventSequence(mockEventSystem, expectedSequence) {
  // 発火されたイベントの配列を取得
  const firedEvents = mockEventSystem.emit.mock.calls.map(call => call[0]);
  
  // 期待されるイベントの順序を検証
  let sequenceIndex = 0;
  for (const event of firedEvents) {
    if (event === expectedSequence[sequenceIndex]) {
      sequenceIndex++;
      if (sequenceIndex === expectedSequence.length) {
        return true; // 全シーケンスが見つかった
      }
    }
  }
  
  return false; // 期待されるシーケンスが完全に見つからなかった
}

/**
 * モックの呼び出し状況を検証するヘルパー
 * @param {jest.Mock} mock - 検証するモック関数
 * @param {number} expectedCalls - 期待される呼び出し回数
 * @param {Array} expectedArgs - 期待される引数 (省略可)
 * @returns {boolean} 検証結果
 */
export function verifyMockCalls(mock, expectedCalls, expectedArgs = null) {
  // 呼び出し回数のチェック
  if (mock.mock.calls.length !== expectedCalls) {
    return false;
  }
  
  // 引数の検証が不要な場合はtrueを返す
  if (expectedArgs === null) {
    return true;
  }
  
  // 最後の呼び出しの引数を検証
  const lastCallArgs = mock.mock.calls[mock.mock.calls.length - 1];
  
  // 引数の数が一致するか確認
  if (lastCallArgs.length !== expectedArgs.length) {
    return false;
  }
  
  // 各引数の内容を検証
  for (let i = 0; i < expectedArgs.length; i++) {
    if (JSON.stringify(lastCallArgs[i]) !== JSON.stringify(expectedArgs[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * 保存データの構造を検証するヘルパー
 * @param {Object} saveData - 検証する保存データ
 * @returns {boolean} 検証結果
 */
export function validateSaveDataStructure(saveData) {
  // 必須フィールドの検証
  const requiredFields = ['id', 'gameId', 'version', 'timestamp', 'state'];
  
  for (const field of requiredFields) {
    if (!(field in saveData)) {
      return false;
    }
  }
  
  // 状態オブジェクトの検証
  if (!validateStateStructure(saveData.state)) {
    return false;
  }
  
  // 基本的なデータ型の検証
  if (typeof saveData.id !== 'string') return false;
  if (typeof saveData.gameId !== 'string') return false;
  if (typeof saveData.version !== 'string') return false;
  if (typeof saveData.timestamp !== 'number') return false;
  
  return true;
}

export default {
  validateStateStructure,
  checkStateConsistency,
  compareStates,
  verifyEventFired,
  verifyEventSequence,
  verifyMockCalls,
  validateSaveDataStructure
};
