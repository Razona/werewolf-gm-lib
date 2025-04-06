/**
 * ActionManager クラスのカバレッジ向上のためのテスト (パート3)
 * 以下の機能に焦点を当てています：
 * - isActionAllowed メソッド
 * - cancelAction メソッド
 * - 特殊履歴取得機能
 */

import { setupActionManagerTest } from './ActionManager.testCommon';
import { Action } from '../Action';

describe('ActionManager - 追加カバレッジテスト (パート3)', () => {
  describe('アクション許可と特殊機能', () => {
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
      const { actionManager, mockGame, mockPlayerManager } = setupActionManagerTest();
      
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
      const { actionManager, mockGame, mockPlayerManager } = setupActionManagerTest();
      
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
    
    test('実行されていない占いアクションは履歴に含まれない', () => {
      const { actionManager } = setupActionManagerTest();
      
      // 実行済みのアクション
      const action1 = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 4, // 村人
        night: 1
      });
      action1.executed = true;
      action1.result = { success: true, result: 'white' };
      
      // 未実行のアクション
      const action2 = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 3, // 人狼
        night: 2
      });
      // executed = false のまま
      
      // アクションをマネージャーに追加
      actionManager.actions = [action1, action2];
      
      // 履歴取得
      const history = actionManager.getFortuneHistory(1);
      
      // 結果検証
      expect(history).toHaveLength(1); // 実行済みのみ含まれる
      expect(history[0].night).toBe(1);
      expect(history[0].targetId).toBe(4);
    });
    
    test('未知の対象名は「不明」と表示される', () => {
      const { actionManager, mockPlayerManager } = setupActionManagerTest();
      
      // プレイヤー取得をモック
      mockPlayerManager.getPlayer.mockImplementation((id) => {
        if (id === 4) return { id: 4, name: '村人プレイヤー' };
        // id === 999 は null を返す（プレイヤーが存在しない）
        return null;
      });
      
      // テスト用のアクションを作成
      const action = new Action({
        type: 'fortune',
        actor: 1, // 占い師
        target: 999, // 存在しないプレイヤー
        night: 1
      });
      action.executed = true;
      action.result = { success: true, result: 'white' };
      
      // アクションをマネージャーに追加
      actionManager.actions = [action];
      
      // 履歴取得
      const history = actionManager.getFortuneHistory(1);
      
      // 結果検証
      expect(history).toHaveLength(1);
      expect(history[0].targetName).toBe('不明');
    });
  });
});
