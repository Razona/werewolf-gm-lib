/**
 * @file test/core/error/ErrorHandler.test.js
 * @description ErrorHandler の単体テスト
 */

import { ErrorHandler, GameError } from '../../../src/core/error/ErrorHandler';
import ErrorCatalog from '../../../src/core/error/ErrorCatalog';

describe('ErrorHandler', () => {
  let mockGame;
  let errorHandler;
  
  beforeEach(() => {
    // モック関数をリセット
    jest.resetAllMocks();
    
    // コンソール出力をモック化
    console.error = jest.fn();
    console.warn = jest.fn();
    
    // モックゲームオブジェクト
    mockGame = {
      eventSystem: {
        emit: jest.fn()
      },
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
    
    // ErrorHandler インスタンスの作成
    errorHandler = new ErrorHandler(mockGame);
  });
  
  describe('handleError()', () => {
    test('エラーを適切に処理する', () => {
      const result = errorHandler.handleError('INVALID_TARGET', { targetId: 123 });
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_TARGET');
      expect(result.error).toMatchObject({
        code: 'E003',
        message: expect.any(String),
        context: { targetId: 123 }
      });
      
      // ログ出力されることを確認
      expect(console.error).toHaveBeenCalled();
      
      // イベントが発火されることを確認
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('error', expect.any(Object));
    });
    
    test('未定義のエラーコードを適切に処理する', () => {
      const result = errorHandler.handleError('NONEXISTENT_ERROR');
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('UNKNOWN_ERROR');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Undefined error code'));
    });
    
    test('エラーレベルに応じてスローする', () => {
      // fatal レベルのエラーはスローされる
      errorHandler.setErrorPolicy({ throwLevel: 'fatal' });
      
      expect(() => {
        errorHandler.handleError('UNKNOWN_ERROR');
      }).toThrow(GameError);
      
      // warning レベルのエラーはスローされない
      errorHandler.setErrorPolicy({ throwLevel: 'error' });
      
      expect(() => {
        errorHandler.handleError('ALREADY_INITIALIZED');
      }).not.toThrow();
    });
  });
  
  describe('setErrorPolicy()', () => {
    test('エラーポリシーを設定する', () => {
      const newPolicy = {
        logLevel: 'error',
        throwLevel: 'fatal',
        emitAll: false
      };
      
      const result = errorHandler.setErrorPolicy(newPolicy);
      
      expect(result).toEqual(newPolicy);
      expect(errorHandler.errorPolicy).toEqual(newPolicy);
    });
    
    test('部分的なポリシー更新を処理する', () => {
      const initialPolicy = { ...errorHandler.errorPolicy };
      const partialUpdate = { logLevel: 'error' };
      
      errorHandler.setErrorPolicy(partialUpdate);
      
      expect(errorHandler.errorPolicy).toEqual({
        ...initialPolicy,
        ...partialUpdate
      });
    });
  });
  
  describe('validateOperation()', () => {
    test('すべての検証に合格したら成功を返す', () => {
      // モックの戻り値を設定
      mockGame.getPlayer.mockImplementation((id) => ({ id, isAlive: true }));
      
      const operation = { playerId: 1, targetId: 2 };
      const validations = {
        'isAlive': 'DEAD_PLAYER',
        'isValidTarget': 'INVALID_TARGET'
      };
      
      const result = errorHandler.validateOperation(operation, validations);
      
      expect(result.success).toBe(true);
    });
    
    test('検証に失敗したらエラーを返す', () => {
      // プレイヤーは死亡している
      mockGame.getPlayer.mockImplementation((id) => {
        if (id === 1) return { id: 1, isAlive: false };
        return { id, isAlive: true };
      });
      
      const operation = { playerId: 1, targetId: 2 };
      const validations = {
        'isAlive': 'DEAD_PLAYER',
        'isValidTarget': 'INVALID_TARGET'
      };
      
      const result = errorHandler.validateOperation(operation, validations);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('DEAD_PLAYER');
    });
    
    test('複数の検証ルールを順番に処理する', () => {
      // すべての検証が失敗する設定
      mockGame.getPlayer.mockImplementation(() => null);
      mockGame.phaseManager.getCurrentPhase.mockReturnValue({ id: 'night' });
      
      const operation = { playerId: 1, targetId: 2, phase: 'day' };
      const validations = {
        'isAlive': 'DEAD_PLAYER',
        'isValidTarget': 'INVALID_TARGET',
        'isCorrectPhase': 'INVALID_PHASE_TRANSITION'
      };
      
      const result = errorHandler.validateOperation(operation, validations);
      
      // 最初の検証（isAlive）で失敗する
      expect(result.success).toBe(false);
      expect(result.reason).toBe('DEAD_PLAYER');
    });
    
    test('関数形式の検証ルールをサポートする', () => {
      const operation = { value: -5 };
      const validations = {
        [(data) => data.value > 0]: 'VALIDATION_ERROR'
      };
      
      const result = errorHandler.validateOperation(operation, validations);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('VALIDATION_ERROR');
    });
    
    test('パラメータ付きの検証ルールをサポートする', () => {
      // isPositiveNumber のモック実装を登録
      errorHandler.registerValidationRule('isPositiveNumber', (data, field) => {
        return data[field] > 0;
      });
      
      const operation = { count: -5, value: 10 };
      const validations = {
        'isPositiveNumber:count': 'VALIDATION_ERROR'
      };
      
      const result = errorHandler.validateOperation(operation, validations);
      
      expect(result.success).toBe(false);
      expect(result.reason).toBe('VALIDATION_ERROR');
      
      // 正の値では検証に合格する
      const validOperation = { count: 5 };
      const validResult = errorHandler.validateOperation(validOperation, validations);
      
      expect(validResult.success).toBe(true);
    });
  });
  
  describe('registerValidationRule()', () => {
    test('新しい検証ルールを登録する', () => {
      const ruleFn = jest.fn().mockReturnValue(true);
      
      const result = errorHandler.registerValidationRule('customRule', ruleFn);
      
      expect(result).toBe(true);
      
      // 登録したルールが使用できることを確認
      const operation = { test: true };
      errorHandler.runValidation('customRule', operation);
      
      expect(ruleFn).toHaveBeenCalledWith(operation, undefined);
    });
    
    test('関数でない検証ルールの登録を拒否する', () => {
      console.error = jest.fn(); // エラーログをモック化
      
      const result = errorHandler.registerValidationRule('badRule', 'not a function');
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
    
    test('既存のルールを上書きする際に警告を出す', () => {
      console.warn = jest.fn(); // 警告ログをモック化
      
      // 最初の登録
      errorHandler.registerValidationRule('existingRule', () => true);
      
      // 上書き
      errorHandler.registerValidationRule('existingRule', () => false);
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Overriding existing validation rule'));
    });
  });
  
  describe('registerErrorDefinition()', () => {
    test('新しいエラー定義を登録する', () => {
      const errorDef = {
        message: 'カスタムエラー',
        details: 'カスタムエラーの詳細',
        level: 'warning'
      };
      
      const result = errorHandler.registerErrorDefinition('CUSTOM_ERROR', errorDef);
      
      expect(result).toBe(true);
      
      // 登録したエラーが使用できることを確認
      const errorResult = errorHandler.handleError('CUSTOM_ERROR');
      
      expect(errorResult.reason).toBe('CUSTOM_ERROR');
      expect(errorResult.error.message).toBe('カスタムエラー');
    });
    
    test('無効なエラーコードの登録を拒否する', () => {
      console.error = jest.fn(); // エラーログをモック化
      
      const result = errorHandler.registerErrorDefinition('', { message: 'Test', level: 'info' });
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
    
    test('必須プロパティが欠けているエラー定義の登録を拒否する', () => {
      console.error = jest.fn(); // エラーログをモック化
      
      // レベルが欠けている
      const result = errorHandler.registerErrorDefinition('TEST_ERROR', { message: 'Test' });
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('GameError', () => {
    test('GameErrorインスタンスが適切に作成される', () => {
      const error = new GameError('E123', 'テストエラー', { foo: 'bar' }, '詳細情報');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('GameError');
      expect(error.code).toBe('E123');
      expect(error.message).toBe('テストエラー');
      expect(error.context).toEqual({ foo: 'bar' });
      expect(error.details).toBe('詳細情報');
      expect(error.timestamp).toBeGreaterThan(0);
    });
  });
});