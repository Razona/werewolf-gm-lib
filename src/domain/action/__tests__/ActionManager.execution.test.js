/**
 * ActionManager クラスのアクション実行機能テスト
 * アクションの実行順序、優先度、結果取得などをテスト
 */

import { setupActionManagerTest } from './ActionManager.testCommon';

describe('ActionManager - アクション実行機能', () => {
  // テスト用モックと変数
  let actionManager;
  let testPlayers;
  let mockEventSystem;
  let mockGame;

  // テスト前のセットアップ
  beforeEach(() => {
    // 共通セットアップ処理を実行
    const setup = setupActionManagerTest();
    actionManager = setup.actionManager;
    testPlayers = setup.testPlayers;
    mockEventSystem = setup.mockEventSystem;
    mockGame = setup.mockGame;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * アクション実行のテスト
   */
  describe('アクション実行', () => {
    test('登録されたアクションが優先度順に実行されるべき', () => {
      // 優先度の異なるアクション登録（低い優先度から順に）
      const actions = [
        {
          type: 'attack',
          actor: testPlayers.werewolf.id,
          target: testPlayers.villager.id,
          night: 1,
          priority: 60
        },
        {
          type: 'guard',
          actor: testPlayers.knight.id,
          target: testPlayers.villager.id,
          night: 1,
          priority: 80
        },
        {
          type: 'fortune',
          actor: testPlayers.seer.id,
          target: testPlayers.werewolf.id,
          night: 1,
          priority: 100
        }
      ];

      // アクションを登録
      actions.forEach(action => actionManager.registerAction(action));

      // 実行順序を記録するためのモック
      const executionOrder = [];
      jest.spyOn(actionManager, 'executeAction').mockImplementation((action) => {
        executionOrder.push(action.type);
        return { success: true };
      });

      // アクション実行
      actionManager.executeActions('night', 1);

      // 優先度の高い順（fortune → guard → attack）に実行されることを確認
      expect(executionOrder).toEqual(['fortune', 'guard', 'attack']);
    });

    test('特定のフェーズとターンのアクションのみ実行されるべき', () => {
      // 異なるターンのアクション登録
      const actions = [
        {
          type: 'fortune',
          actor: testPlayers.seer.id,
          target: testPlayers.werewolf.id,
          night: 1
        },
        {
          type: 'fortune',
          actor: testPlayers.seer.id,
          target: testPlayers.villager.id,
          night: 2
        }
      ];

      // アクションを登録
      actions.forEach(action => actionManager.registerAction(action));

      // 実行されたアクションを記録するためのモック
      const executedActions = [];
      jest.spyOn(actionManager, 'executeAction').mockImplementation((action) => {
        executedActions.push(action);
        return { success: true };
      });

      // ターン1のアクションを実行
      actionManager.executeActions('night', 1);

      // ターン1のアクションのみが実行されたことを確認
      expect(executedActions.length).toBe(1);
      expect(executedActions[0].night).toBe(1);
      expect(executedActions[0].target).toBe(testPlayers.werewolf.id);
    });

    test('すべてのアクション実行完了後にイベントが発火されるべき', () => {
      const action = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.werewolf.id,
        night: 1
      };

      // アクションを登録
      actionManager.registerAction(action);

      // 実行関数をモック
      jest.spyOn(actionManager, 'executeAction').mockImplementation(() => {
        return { success: true };
      });

      // アクション実行
      actionManager.executeActions('night', 1);

      // 完了イベントが発火されたことを確認
      expect(mockEventSystem.emit).toHaveBeenCalledWith('action.execute.complete', expect.objectContaining({
        phase: 'night',
        turn: 1
      }));
    });
  });

  /**
   * アクション結果取得のテスト
   */
  describe('アクション結果取得', () => {
    test('プレイヤーIDに基づいて自分のアクション結果のみが取得できるべき', () => {
      // 異なるプレイヤーによるアクション登録
      const actions = [
        {
          type: 'fortune',
          actor: testPlayers.seer.id,
          target: testPlayers.werewolf.id,
          night: 1
        },
        {
          type: 'guard',
          actor: testPlayers.knight.id,
          target: testPlayers.villager.id,
          night: 1
        }
      ];

      // アクションを登録
      const registeredActions = actions.map(action => actionManager.registerAction(action));

      // 結果をセット
      registeredActions[0].result = { success: true, result: 'black' };
      registeredActions[1].result = { success: true, guarded: true };

      // 占い師のアクション結果のみを取得
      const seerResults = actionManager.getActionResults(testPlayers.seer.id);

      // 占い師のアクション結果のみが含まれることを確認
      expect(seerResults.length).toBe(1);
      expect(seerResults[0].type).toBe('fortune');
      expect(seerResults[0].result.result).toBe('black');

      // 騎士のアクション結果は含まれていないことを確認
      const hasKnightResult = seerResults.some(r => r.actor === testPlayers.knight.id);
      expect(hasKnightResult).toBe(false);
    });

    test('実行されていないアクションの結果はnullであるべき', () => {
      // アクションを登録
      const action = actionManager.registerAction({
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.werewolf.id,
        night: 1
      });

      // 結果を取得
      const results = actionManager.getActionResults(testPlayers.seer.id);

      // 未実行のアクションの結果はnullであることを確認
      expect(results[0].result).toBeNull();
    });
  });

  /**
   * 一部のアクションが異常終了するケースのテスト
   */
  describe('部分的なアクション実行とエラー対応', () => {
    test('一部のアクションが異常終了しても残りのアクションは処理すべき', () => {
      // 準備: 正常なアクションと異常なアクションを混在させる
      const validAction1 = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      const validAction2 = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.seer.id,
        night: 1
      };

      const invalidAction = {
        type: 'attack',
        actor: testPlayers.werewolf.id,
        target: 999, // 存在しないターゲット
        night: 1
      };

      // カスタム executeAction 実装でエラー処理をシミュレート
      actionManager.executeAction = jest.fn(action => {
        if (action.target === 999) {
          // 異常なアクションは失敗
          return { success: false, error: 'INVALID_TARGET' };
        }

        // 正常なアクションは成功
        action.executed = true;
        action.result = { success: true };
        return { success: true };
      });

      // 実行: アクションを登録して実行
      const action1 = actionManager.registerAction(validAction1);
      const action2 = actionManager.registerAction(validAction2);
      let action3;

      try {
        action3 = actionManager.registerAction(invalidAction);
      } catch (e) {
        // 登録時にエラーになる可能性があるので無視
      }

      const executedCount = actionManager.executeActions('night', 1);

      // 検証: 正常なアクションのみ処理されていること
      expect(action1.executed).toBe(true);
      expect(action2.executed).toBe(true);
      expect(executedCount).toBe(2); // 正常なアクション2つのみがカウントされる

      // 完了イベントが発火されたか確認
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'action.execute.complete',
        expect.objectContaining({
          phase: 'night',
          turn: 1
        })
      );
    });
  });
});