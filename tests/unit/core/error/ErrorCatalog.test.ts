import { ErrorCatalog } from '../../../../src/core/error/ErrorCatalog';
import { ErrorLevel } from '../../../../src/core/error/ErrorLevel';

describe('ErrorCatalog', () => {
  it('should have correct structure for error entries', () => {
    // コードの存在確認
    expect(ErrorCatalog.SYSTEM_INTERNAL_ERROR.code).toBe('E001');
    
    // レベルの正当性確認
    expect(ErrorCatalog.SYSTEM_INTERNAL_ERROR.level).toBe(ErrorLevel.FATAL);
    
    // メッセージと詳細の存在確認
    expect(ErrorCatalog.SYSTEM_INTERNAL_ERROR.message).toBeTruthy();
    expect(ErrorCatalog.SYSTEM_INTERNAL_ERROR.details).toBeTruthy();
  });

  it('should have unique error codes', () => {
    const codes = Object.values(ErrorCatalog).map(error => error.code);
    const uniqueCodes = new Set(codes);
    expect(codes.length).toBe(uniqueCodes.size);
  });

  it('should have valid error levels', () => {
    Object.values(ErrorCatalog).forEach(error => {
      expect([
        ErrorLevel.FATAL, 
        ErrorLevel.ERROR, 
        ErrorLevel.WARNING, 
        ErrorLevel.INFO
      ]).toContain(error.level);
    });
  });
});
