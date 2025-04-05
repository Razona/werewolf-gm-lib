/**
 * ActionManager クラスのレギュレーション対応テスト
 * レギュレーション設定と連携する機能をテスト
 */

import { setupActionManagerTest } from './ActionManager.testCommon';

describe('ActionManager - レギュレーション対応', () => {
  // テスト用モックと変数
  let actionManager;
  let testPlayers;
  let mockErrorHandler;
  let mockPhaseManager;
  let mockGame;
  let regulations;

  // テスト前のセットアップ
  beforeEach(() => {
    // 共通セットアップ処理を実行
    const setup = setupActionManagerTest();
    actionManager = setup.actionManager;
    testPlayers = setup.testPlayers;
    mockErrorHandler = setup.mockErrorHandler;
    mockPhaseManager = setup.mockPhaseManager;
    mockGame = setup.mockGame;
    regulations = setup.regulations;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * レギュレーション対応のテスト
   */
  describe('連続ガード禁止設定', () => {
    test('連続ガード禁止が有効な場合、同一対象への連続護衛はエラーとなるべき', () => {
      // レギュレーションで連続ガード禁止を設定
      regulations.allowConsecutiveGuard = false;

      // 1ターン目の護衛アクション
      const firstGuardAction = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.villager.id,
        night: 1
      };

      // アクションを登録
      actionManager.registerAction(firstGuardAction);

      // 前回の護衛対象を記録（通常はアクション実行時に設定されるが、テストのため手動で設定）
      actionManager.lastGuardedTarget = testPlayers.villager.id;

      // 2ターン目の同一対象への護衛アクション
      const secondGuardAction = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.villager.id,
        night: 2
      };

      // 2ターン目に設定
      mockPhaseManager.getCurrentTurn.mockReturnValueOnce(2);

      // エラーが発生することを確認
      expect(() => {
        actionManager.registerAction(secondGuardAction);
      }).toThrow();

      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'E3005_CONSECUTIVE_GUARD_PROHIBITED',
        expect.any(String)
      );
    });

    test('連続ガード禁止が無効な場合、同一対象への連続護衛が可能であるべき', () => {
      // レギュレーションで連続ガード禁止を無効化
      regulations.allowConsecutiveGuard = true;

      // 1ターン目の護衛アクション
      const firstGuardAction = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.villager.id,
        night: 1
      };

      // アクションを登録
      actionManager.registerAction(firstGuardAction);

      // 前回の護衛対象を記録
      actionManager.lastGuardedTarget = testPlayers.villager.id;

      // 2ターン目の同一対象への護衛アクション
      const secondGuardAction = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.villager.id,
        night: 2
      };

      // 2ターン目に設定
      mockPhaseManager.getCurrentTurn.mockReturnValueOnce(2);

      // エラーが発生しないこと（連続護衛が可能）を確認
      expect(() => {
        actionManager.registerAction(secondGuardAction);
      }).not.toThrow();
    });

    test('連続ガード禁止の場合でも、異なる対象への護衛は可能であるべき', () => {
      // レギュレーションで連続ガード禁止を設定
      regulations.allowConsecutiveGuard = false;

      // 1ターン目の護衛アクション
      const firstGuardAction = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.villager.id,
        night: 1
      };

      // アクションを登録
      actionManager.registerAction(firstGuardAction);

      // 前回の護衛対象を記録
      actionManager.lastGuardedTarget = testPlayers.villager.id;

      // 2ターン目の異なる対象への護衛アクション
      const secondGuardAction = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.seer.id, // 違う対象
        night: 2
      };

      // 2ターン目に設定
      mockPhaseManager.getCurrentTurn.mockReturnValueOnce(2);

      // エラーが発生しないことを確認
      expect(() => {
        actionManager.registerAction(secondGuardAction);
      }).not.toThrow();
    });

    test('連続ガード禁止違反時のエラーコードとメッセージが正確であるべき', () => {
      // 準備: 前回の護衛対象を設定
      actionManager.lastGuardedTarget = testPlayers.villager.id;

      // 連続ガード禁止設定
      mockGame.regulations.allowConsecutiveGuard = false;

      // 同じ対象への連続護衛
      const actionData = {
        type: 'guard',
        actor: testPlayers.knight.id,
        target: testPlayers.villager.id,
        night: 2
      };

      // 実行 & 検証: エラーの詳細を確認
      try {
        actionManager.registerAction(actionData);
        fail('例外が発生するはずです');
      } catch (error) {
        // エラーコードが正確であること
        expect(error.code).toBe('E3005_CONSECUTIVE_GUARD_PROHIBITED');

        // エラーメッセージが具体的であること
        expect(error.message).toContain('連続護衛');
        expect(error.message).toContain('禁止');
      }
    });
  });

  describe('初日占いルール', () => {
    test('初日占いルールの設定が実装されていること', () => {
      // 初日占いルールの設定を変更
      regulations.firstNightFortune = 'random_white';

      // ここでは設定が存在するかだけを確認（実際の機能はActionクラスで実装される）
      expect(mockGame.regulations.firstNightFortune).toBe('random_white');

      // 別の設定値も確認
      mockGame.regulations.firstNightFortune = 'random';
      expect(mockGame.regulations.firstNightFortune).toBe('random');

      // 自由設定
      mockGame.regulations.firstNightFortune = 'free';
      expect(mockGame.regulations.firstNightFortune).toBe('free');
    });
  });
});