/**
 * GameManagerState テスト用シナリオ
 * テストで使用する標準的なシナリオの定義
 */

import TestFixtures from './TestFixtures';

/**
 * トランザクションシナリオを実行する
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト群
 * @param {boolean} commit - コミットする場合はtrue、ロールバックする場合はfalse
 * @returns {Object} シナリオ実行結果
 */
const transactionScenario = (gameManager, mocks, commit = true) => {
  // イベント発火をモニタリングするための準備
  const firedEvents = [];
  mocks.eventSystem.emit.mockImplementation((eventName, data) => {
    firedEvents.push(eventName);
    return true;
  });
  
  // トランザクション前の状態を保存
  const stateBeforeTransaction = JSON.parse(JSON.stringify(gameManager.state));
  
  // 結果オブジェクトの初期化
  const result = {
    transactionStarted: false,
    updatesApplied: [],
    transactionEnded: false,
    stateBeforeTransaction,
    finalState: null,
    events: firedEvents,
    error: undefined
  };
  
  try {
    // トランザクション開始
    gameManager.beginTransaction();
    result.transactionStarted = true;
    
    // 状態の更新（複数回）
    const updates = [
      // 1回目の更新：ターン増加とフェーズ変更
      { turn: stateBeforeTransaction.turn + 1, phase: 'vote' },
      // 2回目の更新：プレイヤー死亡
      { 
        players: stateBeforeTransaction.players.map(p => 
          p.id === 1 ? { ...p, isAlive: false, causeOfDeath: 'execution', deathTurn: stateBeforeTransaction.turn } : p
        ),
        lastDeath: { playerId: 1, cause: 'execution', turn: stateBeforeTransaction.turn }
      }
    ];
    
    // 更新を適用
    for (const update of updates) {
      gameManager.updateState(update);
      result.updatesApplied.push(update);
    }
    
    // コミットまたはロールバック
    if (commit) {
      gameManager.commitTransaction();
    } else {
      gameManager.rollbackTransaction();
    }
    
    result.transactionEnded = true;
    result.finalState = JSON.parse(JSON.stringify(gameManager.state));
  } catch (error) {
    result.error = error;
  }
  
  return result;
};

/**
 * 状態保存と復元のシナリオを実行する
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト群
 * @param {Object} options - シナリオオプション
 * @returns {Object} シナリオ実行結果
 */
const saveLoadScenario = (gameManager, mocks, options = {}) => {
  const { 
    initialState = TestFixtures.progressGameState,
    saveId = 'test-save-123',
    includeHistory = true,
    validateOnly = false
  } = options;
  
  // 初期状態を設定
  gameManager.state = JSON.parse(JSON.stringify(initialState));
  
  // イベント発火をモニタリングするための準備
  const firedEvents = [];
  mocks.eventSystem.emit.mockImplementation((eventName, data) => {
    firedEvents.push({ event: eventName, data });
    return true;
  });
  
  // 結果オブジェクトの初期化
  const result = {
    initialState: JSON.parse(JSON.stringify(gameManager.state)),
    saveData: null,
    loadResult: null,
    finalState: null,
    events: firedEvents,
    errors: []
  };
  
  try {
    // 状態の保存
    result.saveData = gameManager.saveGameState(saveId, { includeHistory });
    
    // ゲーム状態を変更（保存後）
    gameManager.updateState({
      turn: gameManager.state.turn + 1,
      phase: 'night'
    });
    
    // 状態の読み込み
    result.loadResult = gameManager.loadGameState(result.saveData, { validateOnly });
    
    // 最終状態を記録
    result.finalState = JSON.parse(JSON.stringify(gameManager.state));
  } catch (error) {
    result.errors.push(error);
  }
  
  return result;
};

/**
 * 状態更新シナリオを実行する
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト群
 * @param {Object} updates - 適用する更新内容
 * @param {Object} options - 更新オプション
 * @returns {Object} シナリオ実行結果
 */
const stateUpdateScenario = (gameManager, mocks, updates, options = {}) => {
  // 初期状態を保存
  const initialState = JSON.parse(JSON.stringify(gameManager.state));
  
  // イベント発火をモニタリングするための準備
  const firedEvents = [];
  mocks.eventSystem.emit.mockImplementation((eventName, data) => {
    firedEvents.push({ event: eventName, data });
    return true;
  });
  
  // 結果オブジェクトの初期化
  const result = {
    initialState,
    updates,
    options,
    updatedState: null,
    events: firedEvents,
    error: null
  };
  
  try {
    // 状態更新を実行
    result.updatedState = gameManager.updateState(updates, options);
  } catch (error) {
    result.error = error;
  }
  
  return result;
};

/**
 * 勝利条件判定シナリオを実行する
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト群
 * @param {string} expectedWinner - 期待される勝者（陣営）
 * @returns {Object} シナリオ実行結果
 */
const victoryConditionScenario = (gameManager, mocks, expectedWinner) => {
  // 勝利条件をモック
  mocks.victoryManager.checkWinCondition.mockReturnValue(expectedWinner);
  
  // 結果オブジェクトの初期化
  const result = {
    initialState: JSON.parse(JSON.stringify(gameManager.state)),
    finalState: null,
    expectedWinner,
    actualWinner: null,
    events: []
  };
  
  // イベントをモニタリング
  mocks.eventSystem.emit.mockImplementation((eventName, data) => {
    if (eventName === 'game.end') {
      result.events.push({ event: eventName, data });
    }
    return true;
  });
  
  // 勝利条件のチェックと状態更新
  gameManager.updateState({
    isEnded: true,
    winner: expectedWinner,
    winningPlayers: [0, 2, 4] // テスト用の勝利プレイヤー
  });
  
  result.finalState = JSON.parse(JSON.stringify(gameManager.state));
  result.actualWinner = gameManager.state.winner;
  
  return result;
};

export default {
  transactionScenario,
  saveLoadScenario,
  stateUpdateScenario,
  victoryConditionScenario
};
