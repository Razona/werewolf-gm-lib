/**
 * ErrorLevel unit tests
 */

import { ErrorLevel } from '../../../../src/core/error/ErrorLevel';

describe('ErrorLevel', () => {
  test('should define all required error levels', () => {
    expect(ErrorLevel.INFO).toBe('info');
    expect(ErrorLevel.WARNING).toBe('warning');
    expect(ErrorLevel.ERROR).toBe('error');
    expect(ErrorLevel.FATAL).toBe('fatal');
  });
  
  test('should be frozen object (immutable)', () => {
    expect(() => {
      ErrorLevel.NEW_LEVEL = 'new';
    }).toThrow();
  });
  
  test('should have exactly 4 error levels', () => {
    expect(Object.keys(ErrorLevel).length).toBe(4);
  });
  
  test('should have unique values', () => {
    const values = Object.values(ErrorLevel);
    const unique = [...new Set(values)];
    expect(values.length).toBe(unique.length);
  });
});
