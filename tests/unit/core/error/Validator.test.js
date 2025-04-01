import Validator from '../../../../src/core/error/Validator';
import ErrorHandler from '../../../../src/core/error/ErrorHandler';

class MockErrorHandler {
  handleError(error) {
    // モック実装
  }
}

describe('Validator', () => {
  let validator;
  let errorHandler;

  beforeEach(() => {
    errorHandler = new MockErrorHandler();
    validator = new Validator(errorHandler);
  });

  describe('Initialization', () => {
    test('should create new validator instance', () => {
      expect(validator).toBeTruthy();
      expect(validator.errorHandler).toBe(errorHandler);
    });

    test('should work without error handler', () => {
      const validatorWithoutHandler = new Validator();
      expect(validatorWithoutHandler.errorHandler).toBeNull();
    });
  });

  describe('Basic Validations', () => {
    describe('validateExists', () => {
      test.each([
        'test',
        0,
        false,
        {},
        [],
        () => {},
        NaN
      ])('should pass for non-null/undefined value: %p', (value) => {
        expect(() => validator.validateExists(value)).not.toThrow();
      });

      test.each([null, undefined])('should fail for non-null/undefined value: %p', (value) => {
        expect(() => validator.validateExists(value)).toThrow('値が存在しません');
      });

      test('should include custom error message', () => {
        const customMessage = 'カスタムエラーメッセージ';
        expect(() => validator.validateExists(null, customMessage)).toThrow(customMessage);
      });

      test('should include context in error', () => {
        const context = { testId: 123 };
        expect(() => validator.validateExists(null, '値が存在しません', context)).toThrow();
      });
    });

    describe('validateCondition', () => {
      test.each([true])('should pass for condition: %p', (condition) => {
        expect(() => validator.validateCondition(condition)).not.toThrow();
      });

      test.each([false])('should fail for condition: %p', (condition) => {
        expect(() => validator.validateCondition(condition)).toThrow('条件を満たしていません');
      });

      test('should include custom error message and context', () => {
        const customMessage = 'カスタムメッセージ';
        const context = { testId: 123 };
        expect(() => validator.validateCondition(false, customMessage, context)).toThrow(customMessage);
      });

      test('should handle complex conditions', () => {
        const list = [1, 2, 3];
        expect(() => validator.validateCondition(list.includes(4), '条件を満たしていません', { list, value: 4 }))
          .toThrow('リストに含まれていません');
      });
    });
  });

  describe('Type Validation', () => {
    const typeTestCases = [
      ['test', 'string'],
      [42, 'number'],
      [true, 'boolean'],
      [{}, 'object'],
      [[], 'array'],
      [() => {}, 'function'],
      [null, 'null'],
      [undefined, 'undefined']
    ];

    test.each(typeTestCases)('should pass for %p with %s type', (value, type) => {
      expect(() => validator.validateType(value, type)).not.toThrow();
    });

    const failTypeTestCases = [
      ['test', 'number'],
      [42, 'string'],
      [true, 'object'],
      [{}, 'array'],
      [[], 'function'],
      ['test', 'null'],
      ['test', 'undefined'],
      [3.14, 'integer'],
      [-10, 'positive'],
      [-1, 'nonnegative'],
      [NaN, 'number']
    ];

    test.each(failTypeTestCases)('should fail for %p with %s type', (value, type) => {
      expect(() => validator.validateType(value, type)).toThrow();
    });
  });

  describe('Custom Validators', () => {
    test('should register a custom validator', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      validator.registerCustomValidator('isEmail', isEmail);
      expect(validator.customValidators.get('isEmail')).toBe(isEmail);
    });

    test('should execute a custom validator', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      validator.registerCustomValidator('isEmail', isEmail);
      
      expect(() => validator.executeCustomValidator('isEmail', 'test@example.com')).not.toThrow();
      expect(() => validator.executeCustomValidator('isEmail', 'invalid-email')).toThrow();
    });

    test('should handle unregistered validator', () => {
      expect(() => validator.executeCustomValidator('nonexistent', 'test'))
        .toThrow('カスタムバリデーター nonexistent が見つかりません');
    });

    test('should register a complex validator with context', () => {
      const inRange = (value, context) => {
        const { min, max } = context;
        return value >= min && value <= max;
      };
      
      validator.registerCustomValidator('inRange', inRange);
      
      expect(() => validator.executeCustomValidator('inRange', 5, { min: 1, max: 10 })).not.toThrow();
      expect(() => validator.executeCustomValidator('inRange', 15, { min: 1, max: 10 })).toThrow();
    });
  });
});
