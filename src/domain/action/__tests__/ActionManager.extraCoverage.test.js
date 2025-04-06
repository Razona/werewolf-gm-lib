/**
 * ActionManager クラスのカバレッジ向上のためのテスト
 * 以下の未カバー範囲に焦点を当てています：
 * - 108-173行: アクション登録と検証処理
 * - 187-210行: アクション実行順序制御
 * - 245-247行: 短いメソッドまたは条件分岐
 * - 332-415行: 複雑なアクション間相互作用の処理
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

describe('ActionManager - 追加カバレッジテスト', () => {
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
    
    test('プレイヤーが特定のアクション種別を実行可能か判定できる', () => {
      const { actionManager } = setupActionManagerTest();
      
      // 判定
      const canSeerFortune = actionManager.isActionAllowed(1, 'fortune'); // 占い師が占える
      const canVillagerFortune = actionManager.isActionAllowed(4, 'fortune'); // 村人は占えない
      const canDeadSeerFortune = actionManager.isActionAllowed(999, 'fortune'); // 存在しないプレイヤー
      
      // 結果検証
      expect(canSeerFortune).toBe(true);
      expect(canVillagerFortune).toBe(false);
      expect(canDeadSeerFortune).toBe(false);
    });
    
    test('アクションのキャンセルができる', () => {
      const { actionManager } = setupActionManagerTest();
      
      // テスト用アクションを登録
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 4,
        night: 1
      });
      action.setGame(actionManager.game);
      action.cancel = jest.fn().mockReturnValue({ success: true, cancelled: true });
      
      // アクションをマネージャーに追加
      actionManager.actions = [action];
      
      // キャンセル実行
      const result = actionManager.cancelAction(action.id);
      
      // 結果検証
      expect(result).toBe(true);
      expect(action.cancel).toHaveBeenCalled();
    });
    
    test('存在しないアクションIDのキャンセルは失敗する', () => {
      const { actionManager } = setupActionManagerTest();
      
      // 存在しないIDでキャンセル
      const result = actionManager.cancelAction('non-existent-id');
      
      // 結果検証
      expect(result).toBe(false);
    });
    
    test('キャンセル処理中に例外が発生した場合は失敗する', () => {
      const { actionManager, mockErrorHandler } = setupActionManagerTest();
      
      // テスト用アクションを登録
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 4,
        night: 1
      });
      action.setGame(actionManager.game);
      action.cancel = jest.fn().mockImplementation(() => {
        throw new Error('テストエラー');
      });
      
      // アクションをマネージャーに追加
      actionManager.actions = [action];
      
      // キャンセル実行
      const result = actionManager.cancelAction(action.id);
      
      // 結果検証
      expect(result).toBe(false);
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });
  
  // 特殊メソッドのテスト（占い/護衛履歴取得）
  describe('特殊履歴取得メソッド', () => {
    test('占い結果履歴を取得できる', () => {
      const { actionManager, mockGame } = setupActionManagerTest();
      
      // テスト用の占いアクションを作成
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
      
      // アクションをマネージャーに追加
      actionManager.actions = [action1, action2];
      
      // 履歴取得
      const history = actionManager.getFortuneHistory(1);
      
      // 結果検証
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        night: 1,
        targetId: 4,
        targetName: '村人プレイヤー', // 実際に返される値
        result: 'white'
      });
      expect(history[1]).toEqual({
        night: 2,
        targetId: 3,
        targetName: '人狼プレイヤー', // 実際に返される値
        result: 'black'
      });
    });
    
    test('護衛結果履歴を取得できる', () => {
      const { actionManager, mockGame } = setupActionManagerTest();
      
      // テスト用の護衛アクションを作成
      const action1 = new Action({
        type: 'guard',
        actor: 2, // 騎士
        target: 1, // 占い師
        night: 1
      });
      action1.executed = true;
      action1.result = { success: true, guarded: true };
      
      const action2 = new Action({
        type: 'guard',
        actor: 2, // 騎士
        target: 4, // 村人
        night: 2
      });
      action2.executed = true;
      action2.result = { success: true, guarded: true };
      
      // アクションをマネージャーに追加
      actionManager.actions = [action1, action2];
      
      // 履歴取得
      const history = actionManager.getGuardHistory(2);
      
      // 結果検証
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        night: 1,
        targetId: 1,
        targetName: '占い師プレイヤー', // 実際に返される値
        result: true
      });
      expect(history[1]).toEqual({
        night: 2,
        targetId: 4,
        targetName: '村人プレイヤー', // 実際に返される値
        result: true
      });
    });
  });
});
