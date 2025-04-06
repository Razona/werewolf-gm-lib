/**
 * ActionManager クラスのカバレッジ向上のためのテスト (パート1)
 * 以下の未カバー範囲に焦点を当てています：
 * - 108-173行: アクション登録と検証処理
 * - 187-210行: アクション実行順序制御
 */

import { setupActionManagerTest } from './ActionManager.testCommon';
import { Action } from '../Action';

// テスト用の日付固定
const originalDateNow = Date.now;
beforeAll(() => {
  // テスト中はDate.nowを固定値に差し替え
  global.Date.now = jest.fn(() => 1234567890);
});

afterAll(() => {
  // テスト終了後は元に戻す
  global.Date.now = originalDateNow;
});

describe('ActionManager - 追加カバレッジテスト (パート1)', () => {
  // アクション登録と検証処理の詳細テスト（108-173行）
  describe('アクション登録と検証処理', () => {
    test('存在しないプレイヤーIDでアクション登録しようとするとエラー', () => {
      const { actionManager } = setupActionManagerTest();
      
      expect(() => {
        actionManager.registerAction({
          type: 'fortune',
          actor: 999, // 存在しないID
          target: 4
        });
      }).toThrow(/プレイヤーID 999 は存在しません/);
    });
    
    test('存在しない対象プレイヤーIDでアクション登録しようとするとエラー', () => {
      const { actionManager } = setupActionManagerTest();
      
      expect(() => {
        actionManager.registerAction({
          type: 'fortune',
          actor: 1, // 占い師
          target: 999 // 存在しないID
        });
      }).toThrow(/対象プレイヤーID 999 は存在しません/);
    });
    
    test('死亡プレイヤーがアクション登録しようとするとエラー', () => {
      const { actionManager, testPlayers } = setupActionManagerTest();
      
      // 占い師を死亡状態に
      testPlayers.seer.isAlive = false;
      
      expect(() => {
        actionManager.registerAction({
          type: 'fortune',
          actor: 1, // 死亡した占い師
          target: 4
        });
      }).toThrow(/死亡しているためアクションを実行できません/);
    });
    
    test('不正なアクション種別でアクション登録しようとするとエラー', () => {
      const { actionManager } = setupActionManagerTest();
      
      expect(() => {
        actionManager.registerAction({
          type: 'invalid_action', // 不正なアクション種別
          actor: 1,
          target: 4
        });
      }).toThrow(/不正なアクション種別です/);
    });
    
    test('権限のないアクション種別でアクション登録しようとするとエラー', () => {
      const { actionManager } = setupActionManagerTest();
      
      expect(() => {
        actionManager.registerAction({
          type: 'guard', // 占い師は護衛できない
          actor: 1, // 占い師
          target: 4
        });
      }).toThrow(/アクション guard を実行する権限がありません/);
    });
    
    test('連続ガード禁止設定で同一対象への護衛を試みるとエラー', () => {
      const { actionManager, mockGame } = setupActionManagerTest();
      
      // 最後の護衛対象を設定
      actionManager.lastGuardedTarget = 4;
      
      // regulations が設定されていることを確認
      expect(mockGame.regulations.allowConsecutiveGuard).toBe(false);
      
      expect(() => {
        actionManager.registerAction({
          type: 'guard',
          actor: 2, // 騎士
          target: 4  // 前回と同じ対象
        });
      }).toThrow(/同一対象への連続護衛は禁止されています/);
    });
    
    test('アクション登録に成功するとイベントが発火される', () => {
      const { actionManager, mockEventSystem } = setupActionManagerTest();
      
      const action = actionManager.registerAction({
        type: 'fortune',
        actor: 1, // 占い師
        target: 4, // 村人
        night: 2
      });
      
      expect(action).toBeDefined();
      expect(action.id).toBeDefined();
      expect(mockEventSystem.emit).toHaveBeenCalledWith('action.register', {
        id: action.id,
        type: 'fortune',
        actor: 1,
        target: 4,
        night: 2
      });
    });
  });
  
  // アクション実行順序制御のテスト（187-210行）
  describe('アクション実行順序制御', () => {
    test('アクションが優先度順に実行される', () => {
      const { actionManager, mockEventSystem } = setupActionManagerTest();
      
      // モックメソッドを用意
      actionManager.executeAction = jest.fn().mockImplementation(action => {
        action.executed = true;
        action.result = { success: true };
        return action.result;
      });
      
      // 異なる優先度の複数アクションを登録
      const fortuneAction = new Action({
        type: 'fortune',
        actor: 1,
        target: 4,
        night: 1,
        priority: 100 // 高優先度
      });
      fortuneAction.setGame(actionManager.game);
      
      const guardAction = new Action({
        type: 'guard',
        actor: 2,
        target: 4,
        night: 1,
        priority: 80 // 中優先度
      });
      guardAction.setGame(actionManager.game);
      
      const attackAction = new Action({
        type: 'attack',
        actor: 3,
        target: 4,
        night: 1,
        priority: 60 // 低優先度
      });
      attackAction.setGame(actionManager.game);
      
      // アクションをマネージャーに追加
      actionManager.actions = [guardAction, attackAction, fortuneAction]; // 優先度と逆順で追加
      
      // 実行
      const executedCount = actionManager.executeActions('night', 1);
      
      // 結果検証
      expect(executedCount).toBe(3);
      
      // 優先度順に実行されたかの検証
      expect(actionManager.executeAction.mock.calls[0][0]).toBe(fortuneAction);
      expect(actionManager.executeAction.mock.calls[1][0]).toBe(guardAction);
      expect(actionManager.executeAction.mock.calls[2][0]).toBe(attackAction);
      
      // 完了イベントが発火されたか
      expect(mockEventSystem.emit).toHaveBeenCalledWith('action.execute.complete', {
        phase: 'night',
        turn: 1,
        executedCount: 3
      });
    });
    
    test('ゲームが異常終了状態の場合はアクションを実行せずにキャンセルする', () => {
      const { actionManager, mockGame, mockEventSystem } = setupActionManagerTest();
      
      // 異常終了フラグを設定
      mockGame.isAbnormalEnd = true;
      
      // アクションを登録
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 4,
        night: 1
      });
      action.setGame(mockGame);
      
      // isExecutable メソッドをモック
      action.isExecutable = jest.fn().mockReturnValue(true);
      
      // アクションをマネージャーに追加
      actionManager.actions = [action];
      
      // 実行
      const executedCount = actionManager.executeActions('night', 1);
      
      // 結果検証
      expect(executedCount).toBe(0);
      expect(action.cancelled).toBe(true);
      
      // 異常終了イベントが発火されたか
      expect(mockEventSystem.emit).toHaveBeenCalledWith('game.abnormal_end', {
        phase: 'night',
        turn: 1,
        actions: 1
      });
      
      // 完了イベントが発火されたか（異常終了フラグ付き）
      expect(mockEventSystem.emit).toHaveBeenCalledWith('action.execute.complete', {
        phase: 'night',
        turn: 1,
        executedCount: 0,
        aborted: true
      });
    });
  });
});
