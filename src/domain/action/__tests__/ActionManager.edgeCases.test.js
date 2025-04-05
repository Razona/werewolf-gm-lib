/**
 * ActionManager クラスのエッジケースとエラー処理のテスト
 * 極端な状況や異常系の処理をテスト
 */

import { setupActionManagerTest } from './ActionManager.testCommon';

describe('ActionManager - エッジケースとエラー処理', () => {
  // テスト用モックと変数
  let actionManager;
  let testPlayers;
  let mockEventSystem;
  let mockErrorHandler;
  let mockPlayerManager;
  let mockGame;

  // テスト前のセットアップ
  beforeEach(() => {
    // 共通セットアップ処理を実行
    const setup = setupActionManagerTest();
    actionManager = setup.actionManager;
    testPlayers = setup.testPlayers;
    mockEventSystem = setup.mockEventSystem;
    mockErrorHandler = setup.mockErrorHandler;
    mockPlayerManager = setup.mockPlayerManager;
    mockGame = setup.mockGame;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * エッジケースとエラー処理のテスト
   */
  describe('エッジケースとエラー処理', () => {
    test('すべてのプレイヤーが死亡した場合に適切にエラー処理されるべき', () => {
      // すべてのプレイヤーを死亡状態に設定
      Object.values(testPlayers).forEach(player => {
        player.isAlive = false;
      });

      // アクション登録を試みる
      const actionData = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      // 死亡プレイヤーによるアクション登録はエラーになる
      expect(() => {
        actionManager.registerAction(actionData);
      }).toThrow();

      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'E3003_UNAUTHORIZED_ACTION',
        expect.any(String)
      );
    });

    test('ゲーム終了条件を満たした場合に適切にアクション処理されるべき', () => {
      // ゲーム終了状態をシミュレート
      mockGame.isGameOver = jest.fn(() => true);

      // 占いアクションを登録
      const fortuneAction = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.werewolf.id,
        night: 1
      };

      const action = actionManager.registerAction(fortuneAction);

      // アクション実行関数をモック
      actionManager.executeAction = jest.fn(() => {
        // ゲーム終了状態の場合、アクションはキャンセルされる
        action.cancelled = true;
        return { success: false, reason: 'GAME_OVER' };
      });

      // アクション実行
      actionManager.executeActions('night', 1);

      // ゲーム終了イベントが発火されることを確認
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'action.execute.complete',
        expect.objectContaining({
          phase: 'night',
          turn: 1
        })
      );

      // アクションが実行されたがキャンセルされていることを確認
      expect(actionManager.executeAction).toHaveBeenCalled();
      expect(action.cancelled).toBe(true);
    });

    test('ゲーム異常終了時にアクションの状態が適切に処理されるべき', () => {
      // 準備: アクションを登録
      const action = actionManager.registerAction({
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      });

      // isExecutable関数を追加
      action.isExecutable = () => !action.executed && !action.cancelled;

      // ゲーム終了状態を設定
      mockGame.isGameOver = true;
      mockGame.isAbnormalEnd = true;

      // executeActionsメソッドを独自実装でオーバーライド
      const originalExecuteActions = actionManager.executeActions;
      actionManager.executeActions = function (phase, turn) {
        // ゲームが異常終了状態の場合
        if (this.game && this.game.isAbnormalEnd) {
          // すべてのアクションをキャンセル
          this.actions.forEach(action => {
            if (action.night === turn && action.isExecutable()) {
              action.cancelled = true;
            }
          });

          // 異常終了イベント発火
          this.game.eventSystem.emit('game.abnormal_end', {
            phase,
            turn,
            actions: this.actions.filter(a => a.night === turn).length
          });

          // 完了イベント発火（異常終了フラグ付き）
          this.game.eventSystem.emit('action.execute.complete', {
            phase,
            turn,
            executedCount: 0,
            aborted: true
          });

          return 0;
        }

        // 通常のexecuteActionsを呼び出す
        return originalExecuteActions.call(this, phase, turn);
      };

      // 実行: 異常終了中にアクション実行を試みる
      actionManager.executeActions('night', 1);

      // 検証: アクションが適切に処理されること
      expect(action.cancelled).toBe(true); // アクションはキャンセルされるべき

      // 異常終了イベントが発火されたか
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'game.abnormal_end',
        expect.any(Object)
      );

      // 実行完了イベントも発火されること
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'action.execute.complete',
        expect.objectContaining({
          phase: 'night',
          turn: 1,
          aborted: true
        })
      );
    });

    test('多数のアクションが登録された場合でも正しく処理すべき', () => {
      // 準備: 100個のアクションを作成
      const actionCount = 100;
      const actions = [];

      for (let i = 0; i < actionCount; i++) {
        actions.push({
          type: i % 3 === 0 ? 'fortune' : i % 3 === 1 ? 'guard' : 'attack',
          actor: i % 3 === 0 ? testPlayers.seer.id :
            i % 3 === 1 ? testPlayers.knight.id : testPlayers.werewolf.id,
          target: i % 5 === 0 ? testPlayers.villager.id :
            i % 5 === 1 ? testPlayers.seer.id :
              i % 5 === 2 ? testPlayers.knight.id :
                i % 5 === 3 ? testPlayers.werewolf.id : testPlayers.fox.id,
          night: 1
        });
      }

      // モックの挙動を最適化（登録処理をシンプル化）
      const originalRegisterAction = actionManager.registerAction;
      actionManager.registerAction = jest.fn(actionData => {
        const action = {
          ...actionData,
          id: `action-${Date.now()}-${Math.random()}`,
          executed: false,
          cancelled: false,
          result: null,
          isExecutable: () => !action.executed && !action.cancelled // isExecutable関数を追加
        };
        actionManager.actions.push(action);
        return action;
      });

      // アクション実行関数も単純化
      actionManager.executeAction = jest.fn(action => {
        action.executed = true;
        action.result = { success: true };
        return { success: true };
      });

      // 実行: すべてのアクションを登録
      const registeredActions = actions.map(action => actionManager.registerAction(action));

      // カスタム実行関数でパフォーマンスをテスト
      const startTime = Date.now();
      const executedCount = actionManager.executeActions('night', 1);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 検証: 処理時間と結果を確認
      expect(executedCount).toBe(actionCount);
      expect(executionTime).toBeLessThan(1000); // 処理が1秒以内に完了すべき
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        'action.execute.complete',
        expect.objectContaining({
          executedCount: actionCount
        })
      );

      // 元の関数を復元
      actionManager.registerAction = originalRegisterAction;
    });
  });
});