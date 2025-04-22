/**
 * GameManagerState テスト用シナリオ
 * 複数のテストステップからなる標準シナリオの定義
 */

import { initialState, startedGameState, progressGameState, endedGameState } from './TestFixtures';

/**
 * 初期化～リセットのシナリオ
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト
 * @returns {Object} シナリオ実行結果
 */
export function initializationScenario(gameManager, mocks) {
  const results = {
    initialStateValid: false,
    stateResetSuccess: false,
    eventsFired: []
  };

  try {
    // 1. 初期状態の検証
    const initialGameState = gameManager.getCurrentState();
    results.initialStateValid = initialGameState && !initialGameState.isStarted && initialGameState.turn === 0;

    // 2. モックイベントのセットアップ
    mocks.eventSystem.emit.mockImplementation((event) => {
      results.eventsFired.push(event);
      return true;
    });

    // 3. 状態更新
    gameManager.updateState({
      turn: 1,
      phase: 'test',
      testField: 'テスト値'
    });

    // 4. 状態リセット
    const resetResult = gameManager.resetState();

    // 5. リセット結果の検証
    results.stateResetSuccess = resetResult &&
      !resetResult.isStarted &&
      resetResult.turn === 0 &&
      resetResult.phase === null;

    return results;
  } catch (error) {
    results.error = error;
    return results;
  }
}

/**
 * 状態更新シナリオ（基本操作）
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト
 * @returns {Object} シナリオ実行結果
 */
export function basicUpdateScenario(gameManager, mocks) {
  const results = {
    updates: [],
    finalState: null,
    events: []
  };

  try {
    // 1. 初期状態の設定
    gameManager.state = { ...initialState };

    // 2. イベント記録のセットアップ
    mocks.eventSystem.emit.mockImplementation((event) => {
      results.events.push(event);
      return true;
    });

    // 3. 単一フィールドの更新
    const update1 = gameManager.updateState({ turn: 1 });
    results.updates.push({ field: 'turn', newValue: update1.turn });

    // 4. 複数フィールドの更新
    const update2 = gameManager.updateState({
      phase: 'preparation',
      isStarted: true,
      startTime: Date.now()
    });
    results.updates.push({
      fields: ['phase', 'isStarted', 'startTime'],
      newValues: [update2.phase, update2.isStarted, update2.startTime]
    });

    // 5. ネストしたフィールドの更新
    const update3 = gameManager.updateState({
      roles: {
        list: ['villager', 'werewolf'],
        distributed: false
      }
    });
    results.updates.push({
      field: 'roles',
      newValue: update3.roles
    });

    // 6. 最終状態の取得
    results.finalState = gameManager.getCurrentState();

    return results;
  } catch (error) {
    results.error = error;
    return results;
  }
}

/**
 * トランザクションのシナリオ
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト
 * @param {boolean} shouldCommit - コミットするかロールバックするか
 * @returns {Object} シナリオ実行結果
 */
export function transactionScenario(gameManager, mocks, shouldCommit = true) {
  const results = {
    transactionStarted: false,
    stateBeforeTransaction: null,
    updatesApplied: [],
    transactionEnded: false,
    finalState: null,
    events: []
  };

  try {
    // 1. 初期状態の設定
    gameManager.state = { ...startedGameState };
    if (mocks.playerManager) mocks.playerManager.restoreFromData(startedGameState.players);
    if (mocks.roleManager) mocks.roleManager.restoreFromData(startedGameState.roles);
    if (mocks.phaseManager) mocks.phaseManager.restoreFromData(startedGameState.phase);
    if (mocks.voteManager) mocks.voteManager.restoreFromData(startedGameState.votes);
    if (mocks.actionManager) mocks.actionManager.restoreFromData(startedGameState.actions);

    results.stateBeforeTransaction = gameManager.getCurrentState();

    // 2. イベント記録のセットアップ
    mocks.eventSystem.emit.mockImplementation((event) => {
      results.events.push(event);
      return true;
    });

    // 3. トランザクションの開始
    results.transactionStarted = gameManager.beginTransaction();

    // 4. トランザクション内での更新
    const update1 = gameManager.updateState({ turn: gameManager.state.turn + 1 });
    results.updatesApplied.push({ field: 'turn', newValue: update1.turn });

    // プレイヤー1を死亡させる更新
    const playerUpdates = gameManager.state.players.map(p =>
      p.id === 1 ? { ...p, isAlive: false, causeOfDeath: 'execution', deathTurn: update1.turn } : p
    );
    const update2 = gameManager.updateState({
      phase: 'vote',
      players: playerUpdates
    });
    // ★コミットテスト用ワークアラウンド: PlayerManagerモックの状態も更新
    if (mocks.playerManager && typeof mocks.playerManager.updatePlayerState === 'function') {
      mocks.playerManager.updatePlayerState(1, { isAlive: false, causeOfDeath: 'execution', deathTurn: update1.turn });
    }
    results.updatesApplied.push({ fields: ['phase', 'players'], newValues: [update2.phase, 'プレイヤー死亡'] });

    // 5. トランザクションの終了（コミットまたはロールバック）
    if (shouldCommit) {
      results.transactionEnded = gameManager.commitTransaction();
    } else {
      results.transactionEnded = gameManager.rollbackTransaction();
    }

    // 6. 最終状態の取得
    results.finalState = gameManager.getCurrentState();

    return results;
  } catch (error) {
    results.error = error;
    return results;
  }
}

/**
 * 保存と復元のシナリオ
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト
 * @returns {Object} シナリオ実行結果
 */
export function saveLoadScenario(gameManager, mocks) {
  const results = {
    initialState: null,
    savedData: null,
    stateChanged: false,
    loadResult: false,
    stateAfterLoad: null,
    events: []
  };

  try {
    // 1. 初期状態の設定
    gameManager.state = JSON.parse(JSON.stringify(progressGameState));
    results.initialState = JSON.parse(JSON.stringify(gameManager.state));

    // 2. イベント記録のセットアップ
    mocks.eventSystem.emit.mockImplementation((event) => {
      results.events.push(event);
      return true;
    });

    // 3. 状態の保存
    results.savedData = gameManager.saveGameState('test-save-1', {
      metadata: {
        description: 'テスト用セーブデータ',
        tags: ['test', 'scenario']
      }
    });

    // 4. 状態の変更
    gameManager.updateState({
      turn: gameManager.state.turn + 1,
      phase: 'day',
      players: gameManager.state.players.map(p =>
        p.id === 0 ? { ...p, isAlive: false, causeOfDeath: 'attack', deathTurn: gameManager.state.turn } : p
      )
    });
    results.stateChanged = true;

    // 5. 保存データからの復元
    results.loadResult = gameManager.loadGameState(results.savedData);

    // 6. 復元後の状態取得
    results.stateAfterLoad = gameManager.getCurrentState();

    return results;
  } catch (error) {
    results.error = error;
    return results;
  }
}

/**
 * ゲームフロー統合シナリオ
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト
 * @returns {Object} シナリオ実行結果
 */
export function gameFlowScenario(gameManager, mocks) {
  const results = {
    stateTransitions: [],
    events: [],
    finalState: null
  };

  try {
    // 1. 初期状態の設定
    gameManager.state = JSON.parse(JSON.stringify(initialState));

    // 2. イベント記録のセットアップ
    mocks.eventSystem.emit.mockImplementation((event, data) => {
      results.events.push({ event, data });
      return true;
    });

    // 3. ゲーム開始処理
    gameManager.updateState({
      isStarted: true,
      turn: 1,
      phase: 'preparation',
      startTime: Date.now(),
      players: [
        { id: 0, name: 'プレイヤー1', isAlive: true },
        { id: 1, name: 'プレイヤー2', isAlive: true },
        { id: 2, name: 'プレイヤー3', isAlive: true }
      ],
      roles: {
        list: ['villager', 'werewolf', 'seer'],
        distributed: true,
        distribution: { 0: 'villager', 1: 'werewolf', 2: 'seer' }
      }
    });
    results.stateTransitions.push({ phase: 'preparation', turn: 1, event: 'ゲーム開始' });

    // 4. 初日夜フェーズへの移行
    gameManager.updateState({
      phase: 'night'
    });
    results.stateTransitions.push({ phase: 'night', turn: 1, event: '初日夜' });

    // 5. 夜アクションの処理
    gameManager.updateState({
      actions: {
        pending: [],
        history: [
          { id: 'action-1', type: 'fortune', actor: 2, target: 1, night: 1, result: { team: 'werewolf' } },
          { id: 'action-2', type: 'attack', actor: 1, target: 0, night: 1, result: { success: true } }
        ]
      }
    });

    // 6. プレイヤー死亡処理
    gameManager.updateState({
      players: [
        { id: 0, name: 'プレイヤー1', isAlive: false, causeOfDeath: 'attack', deathTurn: 1 },
        { id: 1, name: 'プレイヤー2', isAlive: true },
        { id: 2, name: 'プレイヤー3', isAlive: true }
      ]
    });

    // 7. 2日目朝への移行
    gameManager.updateState({
      turn: 2,
      phase: 'day',
      lastDeath: { playerId: 0, cause: 'attack', turn: 1 }
    });
    results.stateTransitions.push({ phase: 'day', turn: 2, event: '2日目朝' });

    // 8. 投票フェーズへの移行
    gameManager.updateState({
      phase: 'vote'
    });
    results.stateTransitions.push({ phase: 'vote', turn: 2, event: '投票フェーズ' });

    // 9. 投票処理
    gameManager.updateState({
      votes: {
        current: [
          { voter: 1, target: 2 },
          { voter: 2, target: 1 }
        ],
        history: []
      }
    });

    // 10. 決選投票
    gameManager.updateState({
      votes: {
        current: [
          { voter: 1, target: 2 },
          { voter: 2, target: 1 }
        ],
        history: []
      }
    });

    // 11. 運営の介入（人狼側勝利）
    gameManager.updateState({
      isEnded: true,
      winner: 'werewolf',
      winningPlayers: [1],
      winReason: '投票同数によるランダム勝利',
      endTime: Date.now()
    });
    results.stateTransitions.push({ phase: 'vote', turn: 2, event: 'ゲーム終了' });

    // 12. 最終状態の取得
    results.finalState = gameManager.getCurrentState();

    return results;
  } catch (error) {
    results.error = error;
    return results;
  }
}

/**
 * エラー回復シナリオ
 * @param {Object} gameManager - テスト対象のGameManagerインスタンス
 * @param {Object} mocks - モックオブジェクト
 * @returns {Object} シナリオ実行結果
 */
export function errorRecoveryScenario(gameManager, mocks) {
  const results = {
    initialState: null,
    transactionStarted: false,
    errorThrown: false,
    errorHandled: false,
    stateAfterError: null,
    events: []
  };

  try {
    // 1. 初期状態の設定
    gameManager.state = JSON.parse(JSON.stringify(progressGameState));
    results.initialState = JSON.parse(JSON.stringify(gameManager.state));

    // 2. イベント記録のセットアップ
    mocks.eventSystem.emit.mockImplementation((event) => {
      results.events.push(event);
      return true;
    });

    // 3. トランザクション開始
    results.transactionStarted = gameManager.beginTransaction();

    // 4. エラー発生
    try {
      // エラーを発生させる更新
      const invalidUpdate = {
        invalidField: () => { }, // 関数は通常シリアライズできない
        players: null // 必須フィールドにnullを設定
      };

      gameManager.updateState(invalidUpdate);
    } catch (error) {
      results.errorThrown = true;

      // 5. エラー発生後のロールバック
      gameManager.rollbackTransaction();
      results.errorHandled = true;
    }

    // 6. エラー後の状態取得
    results.stateAfterError = gameManager.getCurrentState();

    // 7. 新しいトランザクションでの正常処理
    if (results.errorHandled) {
      gameManager.beginTransaction();
      gameManager.updateState({ turn: gameManager.state.turn + 1 });
      gameManager.commitTransaction();
    }

    return results;
  } catch (error) {
    results.error = error;
    return results;
  }
}

export default {
  initializationScenario,
  basicUpdateScenario,
  transactionScenario,
  saveLoadScenario,
  gameFlowScenario,
  errorRecoveryScenario
};
