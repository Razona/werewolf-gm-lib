/**
 * ErrorLevelのテスト
 */

const ErrorLevel = require('../../../../src/core/error/ErrorLevel');

describe('ErrorLevel', () => {
  it('should define all required error levels', () => {
    // すべての必要なエラーレベルが定義されていることを確認
    expect(ErrorLevel.FATAL).toBeDefined();
    expect(ErrorLevel.ERROR).toBeDefined();
    expect(ErrorLevel.WARNING).toBeDefined();
    expect(ErrorLevel.INFO).toBeDefined();
    
    // 適切な文字列値が設定されていることを確認
    expect(ErrorLevel.FATAL).toBe('fatal');
    expect(ErrorLevel.ERROR).toBe('error');
    expect(ErrorLevel.WARNING).toBe('warning');
    expect(ErrorLevel.INFO).toBe('info');
  });

  it('should be frozen object (immutable)', () => {
    // Object.freezeで凍結されているか確認
    expect(() => {
      ErrorLevel.TEST = 'test';
    }).toThrow();
  });

  it('should have exactly 4 error levels', () => {
    // 正確に4つのレベルがあるか確認
    expect(Object.keys(ErrorLevel).length).toBe(4);
  });

  it('should have unique values', () => {
    // すべての値がユニークであることを確認
    const values = Object.values(ErrorLevel);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });
});
