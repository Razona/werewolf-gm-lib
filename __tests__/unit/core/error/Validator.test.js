import Validator from '../../../../src/core/error/Validator';

class MockErrorHandler {
  constructor() {
    this.handledErrors = [];
  }

  handleError(error) {
    this.handledErrors.push(error);
    return error;
  }
}

describe('Validator', () => {
  let errorHandler;
  let validator;
  let validatorWithoutHandler;

  beforeEach(() => {
    errorHandler = new MockErrorHandler();
    validator = new Validator(errorHandler);
    validatorWithoutHandler = new Validator();
  });

  describe('Initialization', () => {
    test('should create new validator instance', () => {
      expect(validator).toBeTruthy();
      expect(validator.errorHandler).toBe(errorHandler);
    });

    test('should work without error handler', () => {
      expect(validatorWithoutHandler).toBeTruthy();
      expect(validatorWithoutHandler.errorHandler).toBeNull();
    });
  });

  describe('Basic Validations', () => {
    describe('validateExists', () => {
      // エラーハンドラーがある場合のテスト
      test.each([
        'test',
        0,
        false,
        {},
        [],
        () => {},
        NaN
      ])('should pass for non-null/undefined value with handler: %p', (value) => {
        const result = validator.validateExists(value);
        expect(result).toBe(true);
        expect(errorHandler.handledErrors.length).toBe(0);
      });

      test.each([
        null,
        undefined
      ])('should fail for null/undefined value with handler: %p', (value) => {
        const result = validator.validateExists(value);
        expect(result).toBe(false);
        expect(errorHandler.handledErrors.length).toBe(1);
        expect(errorHandler.handledErrors[0].code).toBe('E0101');
      });

      // エラーハンドラーがない場合のテスト
      test.each([
        'test',
        0,
        false,
        {},
        [],
        () => {},
        NaN
      ])('should pass for non-null/undefined value without handler: %p', (value) => {
        expect(() => validatorWithoutHandler.validateExists(value)).not.toThrow();
      });

      test.each([
        null,
        undefined
      ])('should throw for null/undefined value without handler: %p', (value) => {
        expect(() => validatorWithoutHandler.validateExists(value)).toThrow('値が存在しません');
      });

      // カスタムメッセージのテスト
      test('should include custom error message with handler', () => {
        const customMessage = 'カスタムエラーメッセージ';
        validator.validateExists(null, { message: customMessage });
        expect(errorHandler.handledErrors[0].message).toBe(customMessage);
      });

      test('should include custom error message without handler', () => {
        const customMessage = 'カスタムエラーメッセージ';
        expect(() => validatorWithoutHandler.validateExists(null, { message: customMessage })).toThrow(customMessage);
      });

      // コンテキスト情報のテスト
      test('should include context in error with handler', () => {
        const context = { testId: 123 };
        validator.validateExists(null, { context });
        expect(errorHandler.handledErrors[0].context).toEqual(context);
      });
    });

    describe('validateCondition', () => {
      // エラーハンドラーがある場合のテスト
      test.each([
        true,
        1 === 1,
        'test' === 'test'
      ])('should pass for true condition with handler: %p', (condition) => {
        const result = validator.validateCondition(condition);
        expect(result).toBe(true);
        expect(errorHandler.handledErrors.length).toBe(0);
      });

      test.each([
        false,
        1 === 2,
        'test' === 'other'
      ])('should fail for false condition with handler: %p', (condition) => {
        const result = validator.validateCondition(condition);
        expect(result).toBe(false);
        expect(errorHandler.handledErrors.length).toBe(1);
        expect(errorHandler.handledErrors[0].code).toBe('E0901');
      });

      // エラーハンドラーがない場合のテスト
      test.each([
        true,
        1 === 1,
        'test' === 'test'
      ])('should pass for true condition without handler: %p', (condition) => {
        expect(() => validatorWithoutHandler.validateCondition(condition)).not.toThrow();
      });

      test.each([
        false,
        1 === 2,
        'test' === 'other'
      ])('should throw for false condition without handler: %p', (condition) => {
        expect(() => validatorWithoutHandler.validateCondition(condition)).toThrow('条件を満たしていません');
      });

      // カスタムメッセージとコンテキストのテスト
      test('should include custom error message and context with handler', () => {
        const customMessage = 'カスタムメッセージ';
        const context = { testId: 123 };
        validator.validateCondition(false, { message: customMessage, context });
        expect(errorHandler.handledErrors[0].message).toBe(customMessage);
        expect(errorHandler.handledErrors[0].context).toEqual(context);
      });
    });
  });

  describe('Type Validation', () => {
    const validTypeTestCases = [
      ['test', 'string'],
      [42, 'number'],
      [true, 'boolean'],
      [{}, 'object'],
      [[], 'array'],
      [() => {}, 'function'],
      [null, 'null'],
      [undefined, 'undefined'],
      [10, 'integer'],
      [5, 'positive'],
      [0, 'nonnegative']
    ];

    const invalidTypeTestCases = [
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

    // エラーハンドラーがある場合の有効な型テスト
    test.each(validTypeTestCases)('should pass for %p with %s type with handler', (value, type) => {
      const result = validator.validateType(value, type);
      expect(result).toBe(true);
      expect(errorHandler.handledErrors.length).toBe(0);
    });

    // エラーハンドラーがある場合の無効な型テスト
    test.each(invalidTypeTestCases)('should fail for %p with %s type with handler', (value, type) => {
      const result = validator.validateType(value, type);
      expect(result).toBe(false);
      expect(errorHandler.handledErrors.length).toBe(1);
      expect(errorHandler.handledErrors[0].code).toBe('E0904');
    });

    // エラーハンドラーがない場合の有効な型テスト
    test.each(validTypeTestCases)('should pass for %p with %s type without handler', (value, type) => {
      expect(() => validatorWithoutHandler.validateType(value, type)).not.toThrow();
    });

    // エラーハンドラーがない場合の無効な型テスト
    test.each(invalidTypeTestCases)('should throw for %p with %s type without handler', (value, type) => {
      expect(() => validatorWithoutHandler.validateType(value, type)).toThrow();
    });
  });

  describe('Custom Validators', () => {
    test('should register a custom validator', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const result = validator.registerCustomValidator('isEmail', isEmail);
      expect(result).toBe(true);
      expect(validator.customValidators.get('isEmail')).toBe(isEmail);
    });

    test('should execute a valid custom validator with handler', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      validator.registerCustomValidator('isEmail', isEmail);
      
      const result = validator.executeCustomValidator('isEmail', 'test@example.com');
      expect(result).toBe(true);
      expect(errorHandler.handledErrors.length).toBe(0);
    });

    test('should execute an invalid custom validator with handler', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      validator.registerCustomValidator('isEmail', isEmail);
      
      const result = validator.executeCustomValidator('isEmail', 'invalid-email');
      expect(result).toBe(false);
      expect(errorHandler.handledErrors.length).toBe(1);
      expect(errorHandler.handledErrors[0].code).toBe('E0905');
    });

    test('should execute a valid custom validator without handler', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      validatorWithoutHandler.registerCustomValidator('isEmail', isEmail);
      
      expect(() => validatorWithoutHandler.executeCustomValidator('isEmail', 'test@example.com')).not.toThrow();
    });

    test('should throw for an invalid custom validator without handler', () => {
      const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      validatorWithoutHandler.registerCustomValidator('isEmail', isEmail);
      
      expect(() => validatorWithoutHandler.executeCustomValidator('isEmail', 'invalid-email')).toThrow();
    });

    test('should handle unregistered validator', () => {
      expect(() => validator.executeCustomValidator('nonexistent', 'test'))
        .toThrow('Custom validator nonexistent not found');
    });

    test('should register and execute a complex validator with context', () => {
      const inRange = (value, context) => {
        const { min, max } = context;
        return value >= min && value <= max;
      };
      
      validator.registerCustomValidator('inRange', inRange);
      
      const validResult = validator.executeCustomValidator('inRange', 5, { min: 1, max: 10 });
      expect(validResult).toBe(true);
      
      const invalidResult = validator.executeCustomValidator('inRange', 15, { min: 1, max: 10 });
      expect(invalidResult).toBe(false);
      expect(errorHandler.handledErrors.length).toBe(1);
    });
  });

  describe('Player and Role Action Validation', () => {
    test('should validate player action with valid player', () => {
      const player = { id: 1, isAlive: true };
      const action = { type: 'test' };
      
      const result = validator.validatePlayerAction(action, player);
      expect(result).toBe(true);
    });
    
    test('should validate role action with valid role', () => {
      const role = { id: 'villager' };
      const action = { type: 'test' };
      
      const result = validator.validateRoleAction(action, role);
      expect(result).toBe(true);
    });
  });
});
