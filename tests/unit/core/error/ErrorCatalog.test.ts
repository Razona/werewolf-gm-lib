import ErrorCatalog from '../../../../src/core/error/ErrorCatalog';
import ErrorLevel from '../../../../src/core/error/ErrorLevel';

describe('ErrorCatalog', () => {
  it('should have correct structure for error entries', () => {
    // コードの存在確認
    expect(ErrorCatalog.SYSTEM.INTERNAL_ERROR.code).toBe('E0601');
    
    // レベルの正当性確認
    expect(ErrorCatalog.SYSTEM.INTERNAL_ERROR.level).toBe(ErrorLevel.FATAL);
    
    // メッセージと詳細の存在確認
    expect(ErrorCatalog.SYSTEM.INTERNAL_ERROR.message).toBeTruthy();
    expect(ErrorCatalog.SYSTEM.INTERNAL_ERROR.details).toBeTruthy();
  });

  it('should have unique error codes', () => {
    // 全てのエラーコードを抽出
    const codes: string[] = [];
    
    // カテゴリを巡回
    Object.keys(ErrorCatalog).forEach(category => {
      // 各カテゴリのエラーを巡回
      if (ErrorCatalog[category] && typeof ErrorCatalog[category] === 'object') {
        Object.values(ErrorCatalog[category]).forEach((error: any) => {
          if (error && error.code) {
            codes.push(error.code);
          }
        });
      }
    });
    
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it('should have valid error levels', () => {
    const validLevels = [
      ErrorLevel.FATAL, 
      ErrorLevel.ERROR, 
      ErrorLevel.WARNING, 
      ErrorLevel.INFO
    ];
    
    // カテゴリを巡回
    Object.keys(ErrorCatalog).forEach(category => {
      // 各カテゴリのエラーを巡回
      if (ErrorCatalog[category] && typeof ErrorCatalog[category] === 'object') {
        Object.values(ErrorCatalog[category]).forEach((error: any) => {
          if (error && error.level) {
            expect(validLevels).toContain(error.level);
          }
        });
      }
    });
  });
  
  it('should correctly retrieve errors by code', () => {
    // 有効なエラーコードを使用
    const error = ErrorCatalog.getErrorByCode('E0601'); // SYSTEM.INTERNAL_ERROR
    expect(error).toBeDefined();
    expect(error?.code).toBe('E0601');
    expect(error?.level).toBe(ErrorLevel.FATAL);
    
    // 存在しないエラーコード
    const nonExistentError = ErrorCatalog.getErrorByCode('INVALID');
    expect(nonExistentError).toBeNull();
  });
});
