/**
 * ActionManager クラスのカバレッジ向上のためのテスト (パート2)
 * 以下の未カバー範囲に焦点を当てています：
 * - 245-247行: 短いメソッドまたは条件分岐
 * - 332-415行: 複雑なアクション間相互作用の処理
 */

import { setupActionManagerTest } from './ActionManager.testCommon';
import { Action } from '../Action';

describe('ActionManager - 追加カバレッジテスト (パート2)', () => {
  // 人狼襲撃の集計処理とアクション間相互作用のテスト（332-415行）
  describe('人狼襲撃の集計と相互作用', () => {
    test('複数の人狼による襲撃投票が集計される', () => {
      const { actionManager, mockEventSystem } = setupActionManagerTest();
      
      // 複数の人狼襲撃アクションを作成
      const attack1 = new Action({
        type: 'attack',
        actor: 3, // 人狼1
        target: 4, // 村人（2票）
        night: 1
      });
      attack1.setGame(actionManager.game);
      
      const attack2 = new Action({
        type: 'attack',
        actor: 6, // 人狼2（仮想）
        target: 4, // 村人（2票）
        night: 1
      });
      attack2.setGame(actionManager.game);
      
      const attack3 = new Action({
        type: 'attack',
        actor: 7, // 人狼3（仮想）
        target: 1, // 占い師（1票）
        night: 1
      });
      attack3.setGame(actionManager.game);
      
      // processWerewolfAttacks メソッドを呼び出す
      actionManager.processWerewolfAttacks([attack1, attack2, attack3], 1);
      
      // 村人（最多得票）への襲撃アクションは残り、それ以外はキャンセルされる
      expect(attack1.cancelled).toBe(false);
      expect(attack2.cancelled).toBe(false);
      expect(attack3.cancelled).toBe(true);
      
      // 襲撃対象決定イベントが発火されたか
      expect(mockEventSystem.emit).toHaveBeenCalledWith('werewolf.attack.target', {
        targetId: 4, // 村人
        night: 1,
        votes: { '1': 1, '4': 2 } // 占い師1票、村人2票
      });
    });
    
    test('アクション実行中にエラーが発生しても他のアクションは処理される', () => {
      const { actionManager, mockEventSystem, mockErrorHandler } = setupActionManagerTest();
      
      // 正常アクションと例外を発生させるアクションを作成
      const normalAction = new Action({
        type: 'fortune',
        actor: 1,
        target: 4,
        night: 1
      });
      normalAction.setGame(actionManager.game);
      
      const errorAction = new Action({
        type: 'guard',
        actor: 2,
        target: 4,
        night: 1
      });
      errorAction.setGame(actionManager.game);
      
      // executeAction をモック
      actionManager.executeAction = jest.fn()
        .mockImplementationOnce(() => {
          // 1回目（normalAction）は成功
          normalAction.executed = true;
          normalAction.result = { success: true };
          return normalAction.result;
        })
        .mockImplementationOnce(() => {
          // 2回目（errorAction）は例外発生
          throw new Error('テストエラー');
        });
      
      // アクションをマネージャーに追加
      actionManager.actions = [normalAction, errorAction];
      
      // コンソールエラーの出力をモック
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        // 実行
        const executedCount = actionManager.executeActions('night', 1);
        
        // 結果検証
        expect(executedCount).toBe(1); // エラーのあったアクションは成功としてカウントされない
        
        // エラーハンドリングが呼ばれたか
        expect(console.error).toHaveBeenCalled();
        expect(mockErrorHandler.handleError).toHaveBeenCalled();
        
        // 完了イベントが発火されたか
        expect(mockEventSystem.emit).toHaveBeenCalledWith('action.execute.complete', {
          phase: 'night',
          turn: 1,
          executedCount: 1
        });
      } finally {
        // 後処理
        console.error = originalConsoleError;
      }
    });
  });
  
  // アクション結果の取得機能（245-247行を含む）
  describe('アクション結果の取得機能', () => {
    test('プレイヤーのアクション結果が取得できる', () => {
      const { actionManager } = setupActionManagerTest();
      
      // テスト用アクションを登録
      const action1 = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 4, // 村人
        night: 1
      });
      action1.executed = true;
      action1.result = { success: true, result: 'white' };
      
      const action2 = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 3, // 人狼
        night: 2
      });
      action2.executed = true;
      action2.result = { success: true, result: 'black' };
      
      // 別のプレイヤーのアクション
      const action3 = new Action({
        type: 'guard',
        actor: 2, // 騎士
        target: 1, // 占い師
        night: 1
      });
      action3.executed = true;
      action3.result = { success: true, guarded: true };
      
      // アクションをマネージャーに追加
      actionManager.actions = [action1, action2, action3];
      
      // 占い師のアクション結果を取得
      const results = actionManager.getActionResults(1);
      
      // 結果検証
      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('fortune');
      expect(results[0].night).toBe(1);
      expect(results[0].result.result).toBe('white');
      expect(results[1].type).toBe('fortune');
      expect(results[1].night).toBe(2);
      expect(results[1].result.result).toBe('black');
    });
    
    test('フェーズとターンでアクションをフィルタリングできる', () => {
      const { actionManager } = setupActionManagerTest();
      
      // 異なるフェーズとターンのアクションを登録
      const fortuneAction = new Action({
        type: 'fortune', // night フェーズ
        actor: 1,
        target: 4,
        night: 1
      });
      fortuneAction.setGame(actionManager.game);
      
      const guardAction = new Action({
        type: 'guard', // night フェーズ
        actor: 2,
        target: 1,
        night: 2
      });
      guardAction.setGame(actionManager.game);
      
      const attackAction = new Action({
        type: 'attack', // night フェーズ
        actor: 3,
        target: 4,
        night: 1
      });
      attackAction.setGame(actionManager.game);
      
      // アクションをマネージャーに追加
      actionManager.actions = [fortuneAction, guardAction, attackAction];
      
      // フェーズとターンでフィルタリング
      const nightActions = actionManager.getRegisteredActions('night');
      const turn1Actions = actionManager.getRegisteredActions(null, 1);
      const nightTurn1Actions = actionManager.getRegisteredActions('night', 1);
      
      // 結果検証
      expect(nightActions).toHaveLength(3); // すべてnight
      expect(turn1Actions).toHaveLength(2); // turn=1のアクション
      expect(nightTurn1Actions).toHaveLength(2); // night+turn=1
    });
    
    test('プレイヤーIDでアクションをフィルタリングできる', () => {
      const { actionManager } = setupActionManagerTest();
      
      // 異なるプレイヤーのアクションを登録
      const action1 = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 4,
        night: 1
      });
      
      const action2 = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 3,
        night: 2
      });
      
      const action3 = new Action({
        type: 'guard',
        actor: 2, // 騎士
        target: 1,
        night: 1
      });
      
      // アクションをマネージャーに追加
      actionManager.actions = [action1, action2, action3];
      
      // プレイヤーIDでフィルタリング
      const player1Actions = actionManager.getActionsForPlayer(1);
      const player2Actions = actionManager.getActionsForPlayer(2);
      
      // 結果検証
      expect(player1Actions).toHaveLength(2);
      expect(player1Actions[0]).toBe(action1);
      expect(player1Actions[1]).toBe(action2);
      
      expect(player2Actions).toHaveLength(1);
      expect(player2Actions[0]).toBe(action3);
    });
  });
});
