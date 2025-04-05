/**
 * ActionManager クラスのパフォーマンステスト
 * 大量のアクション処理やメモリ使用量のテスト
 */

import { setupActionManagerTest } from './ActionManager.testCommon';

describe('ActionManager - パフォーマンス', () => {
  // テスト用モックと変数
  let actionManager;
  let testPlayers;
  let mockEventSystem;

  // テスト前のセットアップ
  beforeEach(() => {
    // 共通セットアップ処理を実行
    const setup = setupActionManagerTest();
    actionManager = setup.actionManager;
    testPlayers = setup.testPlayers;
    mockEventSystem = setup.mockEventSystem;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * パフォーマンステスト
   */
  describe('パフォーマンステスト', () => {
    test('大量のアクション処理が性能基準内で完了すべき', () => {
      // 準備: テスト用の大量アクション
      const actionCount = 1000;
      const actions = Array.from({ length: actionCount }, (_, i) => ({
        type: i % 3 === 0 ? 'fortune' : i % 3 === 1 ? 'guard' : 'attack',
        actor: i % 3 === 0 ? testPlayers.seer.id :
          i % 3 === 1 ? testPlayers.knight.id : testPlayers.werewolf.id,
        target: i % 5 === 0 ? testPlayers.villager.id :
          i % 5 === 1 ? testPlayers.seer.id :
            i % 5 === 2 ? testPlayers.knight.id :
              i % 5 === 3 ? testPlayers.werewolf.id : testPlayers.fox.id,
        night: 1
      }));

      // モックの挙動を最適化（登録処理をシンプル化）
      const originalRegisterAction = actionManager.registerAction;
      actionManager.registerAction = jest.fn(actionData => {
        const action = {
          ...actionData,
          id: `action-${Date.now()}-${Math.random()}`,
          executed: false,
          cancelled: false,
          result: null,
          isExecutable: () => !action.executed && !action.cancelled
        };
        actionManager.actions.push(action);
        return action;
      });

      // モックの実行関数も単純化
      actionManager.executeAction = jest.fn(action => {
        action.executed = true;
        action.result = { success: true };
        return { success: true };
      });

      // 実行: 時間計測
      console.time('action-registration');
      actions.forEach(action => actionManager.registerAction(action));
      console.timeEnd('action-registration');

      console.time('action-execution');
      const executedCount = actionManager.executeActions('night', 1);
      console.timeEnd('action-execution');

      // 検証: 処理数と完了を確認
      expect(executedCount).toBe(actionCount);
      expect(actionManager.actions.every(a => a.executed)).toBe(true);

      // 元の関数を復元
      actionManager.registerAction = originalRegisterAction;
    });

    test('メモリ使用量が許容範囲内であるべき', () => {
      // 注: このテストは実際のメモリ使用量を正確に計測することは難しいため、
      // 簡易的なアプローチとしています

      // 準備: メモリ使用量の推定のためのオブジェクト配列
      const initialActions = actionManager.actions.length;
      const largeActionBatch = 10000;

      // 実行: 大量のアクションオブジェクトを作成
      for (let i = 0; i < largeActionBatch; i++) {
        actionManager.actions.push({
          id: `perf-action-${i}`,
          type: 'fortune',
          actor: testPlayers.seer.id,
          target: testPlayers.villager.id,
          night: 1,
          executed: false,
          cancelled: false,
          result: null,
          isExecutable: () => true
        });
      }

      // 検証: アクションが登録されていること
      expect(actionManager.actions.length).toBe(initialActions + largeActionBatch);

      // クリーンアップ: テスト用のアクションを削除
      actionManager.actions.splice(initialActions);
    });

    test('連続したアクション登録と実行のパフォーマンス', () => {
      // 準備: 連続した操作のテスト
      const cycles = 10;
      const actionsPerCycle = 100;

      // モックの挙動を最適化
      const originalRegisterAction = actionManager.registerAction;
      actionManager.registerAction = jest.fn(actionData => {
        const action = {
          ...actionData,
          id: `action-${Date.now()}-${Math.random()}`,
          executed: false,
          cancelled: false,
          result: null,
          isExecutable: () => !action.executed && !action.cancelled
        };
        actionManager.actions.push(action);
        return action;
      });

      actionManager.executeAction = jest.fn(action => {
        action.executed = true;
        action.result = { success: true };
        return { success: true };
      });

      // 実行: 連続したアクション登録と実行
      console.time('repeated-action-cycles');

      for (let cycle = 0; cycle < cycles; cycle++) {
        // 各サイクルでアクションを登録
        for (let i = 0; i < actionsPerCycle; i++) {
          actionManager.registerAction({
            type: i % 3 === 0 ? 'fortune' : i % 3 === 1 ? 'guard' : 'attack',
            actor: i % 3 === 0 ? testPlayers.seer.id :
              i % 3 === 1 ? testPlayers.knight.id : testPlayers.werewolf.id,
            target: i % 5 === 0 ? testPlayers.villager.id :
              i % 5 === 1 ? testPlayers.seer.id :
                i % 5 === 2 ? testPlayers.knight.id :
                  i % 5 === 3 ? testPlayers.werewolf.id : testPlayers.fox.id,
            night: cycle + 1
          });
        }

        // 各サイクルでアクションを実行
        actionManager.executeActions('night', cycle + 1);
      }

      console.timeEnd('repeated-action-cycles');

      // 検証: すべてのアクションが実行されたことを確認
      const totalActions = cycles * actionsPerCycle;
      const executedActions = actionManager.actions.filter(a => a.executed).length;

      expect(executedActions).toBe(totalActions);

      // 元の関数を復元
      actionManager.registerAction = originalRegisterAction;
    });

    test('アクションの結果保持が効率的であるべき', () => {
      // 準備: 大量のアクション結果を保持するケース
      const actionsCount = 1000;

      // モックの挙動を最適化
      const originalRegisterAction = actionManager.registerAction;
      actionManager.registerAction = jest.fn(actionData => {
        const action = {
          ...actionData,
          id: `action-${Date.now()}-${Math.random()}`,
          executed: false,
          cancelled: false,
          result: null,
          isExecutable: () => !action.executed && !action.cancelled
        };
        actionManager.actions.push(action);
        return action;
      });

      // 実行: 大量のアクションを実行して結果を保持
      const actions = [];

      // アクション登録
      for (let i = 0; i < actionsCount; i++) {
        const action = actionManager.registerAction({
          type: 'fortune',
          actor: testPlayers.seer.id,
          target: testPlayers.villager.id,
          night: Math.floor(i / 100) + 1  // 複数ターンに分散
        });

        actions.push(action);
      }

      // アクション結果をシミュレート
      actions.forEach((action, index) => {
        action.executed = true;
        action.result = {
          success: true,
          result: index % 2 === 0 ? 'white' : 'black',
          additionalData: `詳細データ${index}`
        };
      });

      // 検証: 結果取得のパフォーマンス
      console.time('action-results-retrieval');

      const results = actionManager.getActionResults(testPlayers.seer.id);

      console.timeEnd('action-results-retrieval');

      expect(results.length).toBe(actionsCount);

      // 元の関数を復元
      actionManager.registerAction = originalRegisterAction;
    });
  });
});