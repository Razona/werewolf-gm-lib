/**
 * @file test/core/integration.test.js
 * @description コアレイヤーの統合テスト
 */

import { EventSystem, ErrorHandler, GameError } from '../src/core';

describe('コアレイヤーの統合テスト', () => {
  let eventSystem;
  let errorHandler;
  let mockGame;

  beforeEach(() => {
    // コンソール出力をモック化
    console.error = jest.fn();

    // EventSystem の初期化
    eventSystem = new EventSystem();

    // モックゲームオブジェクト
    mockGame = {
      eventSystem,
      getPlayer: jest.fn(),
      phaseManager: {
        getCurrentPhase: jest.fn()
      },
      roleManager: {
        isValidRole: jest.fn()
      },
      gameStarted: true,
      gameEnded: false
    };

    // ErrorHandler の初期化
    errorHandler = new ErrorHandler(mockGame);
  });

  test('エラーイベントがEventSystemを通じて発火される', () => {
    // イベントリスナーを設定
    const errorListener = jest.fn();
    eventSystem.on('error', errorListener);

    // エラーを発生させる
    errorHandler.handleError('INVALID_TARGET', { targetId: 123 });

    // リスナーが呼び出されたことを確認
    expect(errorListener).toHaveBeenCalled();
    expect(errorListener).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'E003',
        message: expect.any(String),
        context: { targetId: 123 }
      })
    );
  });

  test('致命的なエラーが発生した場合にエラーイベントが発火されてからエラーがスローされる', () => {
    // エラー発火ポリシーを設定
    errorHandler.setErrorPolicy({
      throwLevel: 'fatal',
      emitAll: true
    });

    // イベントリスナーを設定
    const errorListener = jest.fn();
    eventSystem.on('error', errorListener);

    // 致命的なエラーを発生させる（UNKNOWN_ERRORはfatalレベル）
    expect(() => {
      errorHandler.handleError('UNKNOWN_ERROR');
    }).toThrow(GameError);

    // リスナーが呼び出されたことを確認
    expect(errorListener).toHaveBeenCalled();
  });

  test('エラーポリシーに基づいてエラーイベントが制御される', () => {
    // エラー発火ポリシーを変更（infoレベルのエラーはイベント発火しない）
    errorHandler.setErrorPolicy({
      emitAll: false
    });

    // warningレベルのエラー用のリスナー
    const errorListener = jest.fn();
    eventSystem.on('error', errorListener);

    // warningレベルのエラーを発生させる（ALREADY_INITIALIZEDはwarningレベル）
    errorHandler.handleError('ALREADY_INITIALIZED');

    // ポリシーが emitAll: false の場合、warningレベルのエラーではイベントは発火されない
    expect(errorListener).not.toHaveBeenCalled();

    // errorレベルのエラーではイベントが発火される
    errorHandler.handleError('INVALID_TARGET');
    expect(errorListener).toHaveBeenCalled();
  });

  test('ゲームワークフローの基本的なシナリオ', () => {
    // 検証ルールの登録
    errorHandler.registerValidationRule('isValidMove', (data) => {
      return data.from >= 0 && data.to >= 0;
    });

    // イベントリスナーの登録
    const moveListener = jest.fn();
    const errorListener = jest.fn();

    eventSystem.on('piece.move', moveListener);
    eventSystem.on('error', errorListener);

    // 有効な移動
    const validMove = { from: 0, to: 1 };
    const validationResult = errorHandler.validateOperation(validMove, {
      'isValidMove': 'VALIDATION_ERROR'
    });

    if (validationResult.success) {
      eventSystem.emit('piece.move', validMove);
    }

    // 無効な移動
    const invalidMove = { from: -1, to: 1 };
    const invalidResult = errorHandler.validateOperation(invalidMove, {
      'isValidMove': 'VALIDATION_ERROR'
    });

    if (invalidResult.success) {
      eventSystem.emit('piece.move', invalidMove);
    }

    // 検証
    expect(moveListener).toHaveBeenCalledTimes(1);
    expect(moveListener).toHaveBeenCalledWith(validMove);
    expect(errorListener).toHaveBeenCalledTimes(1);
  });

  test('エラー検証とイベント発火の連携', () => {
    // プレイヤーモックの設定
    mockGame.getPlayer.mockImplementation((id) => {
      if (id === 1) return { id: 1, isAlive: true, name: 'Player 1' };
      if (id === 2) return { id: 2, isAlive: true, name: 'Player 2' };
      return null;
    });

    // イベントリスナーの登録
    const actionListener = jest.fn();
    const invalidActionListener = jest.fn();

    eventSystem.on('action.register', actionListener);
    eventSystem.on('action.invalid', invalidActionListener);

    // アクション処理関数
    const processAction = (action) => {
      // アクションの検証
      const validationResult = errorHandler.validateOperation(action, {
        'isAlive': 'DEAD_PLAYER',
        'isValidTarget': 'INVALID_TARGET'
      });

      if (validationResult.success) {
        // 有効なアクションを登録
        eventSystem.emit('action.register', action);
        return true;
      } else {
        // 無効なアクションのイベント発火
        eventSystem.emit('action.invalid', {
          action,
          reason: validationResult.reason,
          error: validationResult.error
        });
        return false;
      }
    };

    // 有効なアクション
    const validAction = { type: 'attack', actor: 1, target: 2 };
    const validResult = processAction(validAction);

    // 無効なアクション（存在しないターゲット）
    const invalidAction = { type: 'attack', actor: 1, target: 999 };
    const invalidResult = processAction(invalidAction);

    // 検証
    expect(validResult).toBe(true);
    expect(invalidResult).toBe(false);

    expect(actionListener).toHaveBeenCalledTimes(1);
    expect(actionListener).toHaveBeenCalledWith(validAction);

    expect(invalidActionListener).toHaveBeenCalledTimes(1);
    expect(invalidActionListener).toHaveBeenCalledWith(
      expect.objectContaining({
        action: invalidAction,
        reason: 'INVALID_TARGET'
      })
    );
  });
});
