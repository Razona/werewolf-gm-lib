import ErrorCatalog from '../../../../src/core/error/ErrorCatalog';
import ErrorLevel from '../../../../src/core/error/ErrorLevel';

describe('ErrorCatalog', () => {
  test('should have correct structure for error entries', () => {
    const checkErrorStructure = (error) => {
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('level');
      
      // コードの形式をチェック（E + 4桁の数字）
      expect(error.code).toMatch(/^E\d{4}$/);
      
      // メッセージが空でないことを確認
      expect(error.message.length).toBeGreaterThan(0);
      
      // エラーレベルが有効であることを確認
      expect([
        ErrorLevel.INFO, 
        ErrorLevel.WARNING, 
        ErrorLevel.ERROR, 
        ErrorLevel.FATAL
      ]).toContain(error.level);
    };

    // すべてのカテゴリとエラーを走査
    Object.keys(ErrorCatalog).forEach(category => {
      if (typeof ErrorCatalog[category] === 'object') {
        Object.values(ErrorCatalog[category]).forEach(checkErrorStructure);
      }
    });
  });

  test('should have unique error codes', () => {
    const usedCodes = new Set();

    Object.keys(ErrorCatalog).forEach(category => {
      if (typeof ErrorCatalog[category] === 'object') {
        Object.values(ErrorCatalog[category]).forEach(error => {
          expect(usedCodes.has(error.code)).toBe(false);
          usedCodes.add(error.code);
        });
      }
    });
  });

  test('should have valid error levels', () => {
    Object.keys(ErrorCatalog).forEach(category => {
      if (typeof ErrorCatalog[category] === 'object') {
        Object.values(ErrorCatalog[category]).forEach(error => {
          expect([
            ErrorLevel.INFO, 
            ErrorLevel.WARNING, 
            ErrorLevel.ERROR, 
            ErrorLevel.FATAL
          ]).toContain(error.level);
        });
      }
    });
  });

  test('should correctly retrieve errors by code', () => {
    // サンプルのエラーコードを取得
    const playerErrors = Object.values(ErrorCatalog.PLAYER);
    const sampleError = playerErrors[0];

    // getErrorByCocdeメソッドでエラーを取得
    const retrievedError = ErrorCatalog.getErrorByCode(sampleError.code);
    
    expect(retrievedError).toEqual(sampleError);
  });

  test('should correctly retrieve errors by category and key', () => {
    const playerInvalidIdError = ErrorCatalog.getError('PLAYER', 'INVALID_PLAYER_ID');
    
    expect(playerInvalidIdError).toEqual(ErrorCatalog.PLAYER.INVALID_PLAYER_ID);
  });

  test('should return null for non-existent errors', () => {
    expect(ErrorCatalog.getErrorByCode('NONEXISTENT')).toBeNull();
    expect(ErrorCatalog.getError('NONEXISTENT', 'ERROR')).toBeNull();
  });
});
