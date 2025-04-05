/**
 * ActionManager クラスの基本機能のテスト
 * アクションの登録処理と基本的なバリデーションに関するテスト
 */

import { setupActionManagerTest } from './ActionManager.testCommon';

describe('ActionManager - 基本機能', () => {
  // テスト用モックと変数
  let actionManager;
  let testPlayers;
  let mockEventSystem;
  let mockErrorHandler;
  let mockGame;

  // テスト前のセットアップ
  beforeEach(() => {
    // 共通セットアップ処理を実行
    const setup = setupActionManagerTest();
    actionManager = setup.actionManager;
    testPlayers = setup.testPlayers;
    mockEventSystem = setup.mockEventSystem;
    mockErrorHandler = setup.mockErrorHandler;
    mockGame = setup.mockGame;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * アクション登録のテスト
   */
  describe('アクション登録', () => {
    test('有効なアクションを正常に登録すべき', () => {
      // 準備: 有効なアクションデータを作成
      const actionData = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      // 実行: アクションを登録
      const registeredAction = actionManager.registerAction(actionData);

      // 検証: 登録されたアクションが正しいこと
      expect(registeredAction).toBeDefined();
      expect(registeredAction.id).toBeTruthy();
      expect(registeredAction.type).toBe('fortune');
      expect(registeredAction.actor).toBe(testPlayers.seer.id);
      expect(registeredAction.target).toBe(testPlayers.villager.id);
      expect(registeredAction.night).toBe(1);
    });

    test('不正なプレイヤーIDでアクション登録時にエラーとなるべき', () => {
      const actionData = {
        type: 'fortune',
        actor: 999, // 存在しないプレイヤーID
        target: testPlayers.villager.id,
        night: 1
      };

      expect(() => {
        actionManager.registerAction(actionData);
      }).toThrow();

      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'E3002_INVALID_PLAYER',
        expect.any(String)
      );
    });

    test('不正なアクション種別で登録するとエラーとなるべき', () => {
      const actionData = {
        type: 'invalid_action',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      expect(() => {
        actionManager.registerAction(actionData);
      }).toThrow();

      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'E3001_INVALID_ACTION_TYPE',
        expect.any(String)
      );
    });

    test('死亡プレイヤーによるアクション登録はエラーとなるべき', () => {
      // プレイヤーを死亡状態に設定
      testPlayers.seer.isAlive = false;

      const actionData = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      expect(() => {
        actionManager.registerAction(actionData);
      }).toThrow();

      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'E3003_UNAUTHORIZED_ACTION',
        expect.any(String)
      );
    });

    test('権限のないプレイヤーのアクション登録はエラーとなるべき', () => {
      const actionData = {
        type: 'fortune', // 占いアクション
        actor: testPlayers.villager.id, // 村人（占い権限なし）
        target: testPlayers.werewolf.id,
        night: 1
      };

      expect(() => {
        actionManager.registerAction(actionData);
      }).toThrow();

      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'E3003_UNAUTHORIZED_ACTION',
        expect.any(String)
      );
    });

    test('アクション登録時にイベントが発火されるべき', () => {
      const actionData = {
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      actionManager.registerAction(actionData);

      expect(mockEventSystem.emit).toHaveBeenCalledWith('action.register', expect.objectContaining({
        type: 'fortune',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id
      }));
    });
  });

  /**
   * エラーコードとメッセージの詳細検証
   */
  describe('エラーコードとメッセージの詳細検証', () => {
    test('不正なプレイヤーIDでのエラーコードとメッセージが正確であるべき', () => {
      // 準備: 存在しないプレイヤーIDを使用
      const actionData = {
        type: 'fortune',
        actor: 999, // 存在しないプレイヤーID
        target: testPlayers.villager.id,
        night: 1
      };

      // 実行 & 検証: エラーの詳細を確認
      try {
        actionManager.registerAction(actionData);
        fail('例外が発生するはずです');
      } catch (error) {
        // エラーコードが正確であること
        expect(error.code).toBe('E3002_INVALID_PLAYER');

        // エラーメッセージが具体的であること
        expect(error.message).toContain('999');
        expect(error.message).toContain('存在しません');
      }
    });

    test('不正なアクション種別でのエラーコードとメッセージが正確であるべき', () => {
      // 準備: 不正なアクション種別
      const actionData = {
        type: 'invalid_action',
        actor: testPlayers.seer.id,
        target: testPlayers.villager.id,
        night: 1
      };

      // 実行 & 検証: エラーの詳細を確認
      try {
        actionManager.registerAction(actionData);
        fail('例外が発生するはずです');
      } catch (error) {
        // エラーコードが正確であること
        expect(error.code).toBe('E3001_INVALID_ACTION_TYPE');

        // エラーメッセージが具体的であること
        expect(error.message).toContain('invalid_action');
        expect(error.message).toContain('不正なアクション種別');
      }
    });

    test('権限のないアクション実行時のエラーコードとメッセージが正確であるべき', () => {
      // 準備: 権限のないプレイヤーのアクション
      const actionData = {
        type: 'fortune', // 占いアクション
        actor: testPlayers.villager.id, // 村人（占い権限なし）
        target: testPlayers.werewolf.id,
        night: 1
      };

      // 実行 & 検証: エラーの詳細を確認
      try {
        actionManager.registerAction(actionData);
        fail('例外が発生するはずです');
      } catch (error) {
        // エラーコードが正確であること
        expect(error.code).toBe('E3003_UNAUTHORIZED_ACTION');

        // エラーメッセージが具体的であること
        expect(error.message).toContain(testPlayers.villager.name);
        expect(error.message).toContain('fortune');
        expect(error.message).toContain('権限');
      }
    });
  });
});