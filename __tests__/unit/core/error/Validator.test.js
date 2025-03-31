const { Validator } = require('../../../../src/core/error/Validator');

class MockErrorHandler {
  constructor() {
    this.handledErrors = [];
  }

  handle(error) {
    this.handledErrors.push(error);
  }
}

describe('Validator', () => {
  let errorHandler;
  let validator;

  beforeEach(() => {
    errorHandler = new MockErrorHandler();
    validator = new Validator(errorHandler);
  });

  describe('Initialization', () => {
    test('should create new validator instance', () => {
      expect(validator).toBeTruthy();
    });

    test('should work without error handler', () => {
      const validatorWithoutHandler = new Validator();
      expect(validatorWithoutHandler).toBeTruthy();
    });
  });

  describe('Basic Validations', () => {
    describe('validateExists', () => {
      const testCases = [
        { value: 'test', expected: true },
        { value: 0, expected: true },
        { value: false, expected: true },
        { value: {}, expected: true },
        { value: [], expected: true },
        { value: '', expected: true },
        { value: NaN, expected: true },
        { value: null, expected: false },
        { value: undefined, expected: false }
      ];

      testCases.forEach(({ value, expected }) => {
        test(`should ${expected ? 'pass' : 'fail'} for non-null/undefined value: ${value}`, () => {
          const result = validator.validateExists(value, { 
            message: 'Custom error message',
            context: { testValue: value }
          });
          expect(result).toBe(expected);
        });
      });

      test('should include custom error message', () => {
        validator.validateExists(null, { message: 'Custom not null message' });
        expect(errorHandler.handledErrors[0].message).toBe('Custom not null message');
      });

      test('should include context in error', () => {
        const context = { playerId: 1 };
        validator.validateExists(null, { context });
        expect(errorHandler.handledErrors[0].context).toEqual(context);
      });
    });

    describe('validateCondition', () => {
      const testCases = [
        { condition: true, expected: true },
        { condition: 1 === 1, expected: true },
        { condition: false, expected: false },
        { condition: 1 === 2, expected: false }
      ];

      testCases.forEach(({ condition, expected }) => {
        test(`should ${expected ? 'pass' : 'fail'} for condition: ${condition}`, () => {
          const result = validator.validateCondition(condition, {
            message: 'Custom condition message',
            context: { condition }
          });
          expect(result).toBe(expected);
        });
      });

      test('should include custom error message and context', () => {
        const context = { playerId: 1 };
        validator.validateCondition(false, { 
          message: 'Custom condition failed', 
          context 
        });
        const error = errorHandler.handledErrors[0];
        expect(error.message).toBe('Custom condition failed');
        expect(error.context).toEqual(context);
      });

      test('should handle complex conditions', () => {
        const complexCondition = () => {
          const arr = [1, 2, 3];
          return arr.length > 2;
        };
        const result = validator.validateCondition(complexCondition());
        expect(result).toBe(true);
      });
    });
  });

  describe('Type Validation', () => {
    const typeTestCases = [
      { value: 'test', type: 'string', expected: true },
      { value: 42, type: 'number', expected: true },
      { value: true, type: 'boolean', expected: true },
      { value: {}, type: 'object', expected: true },
      { value: [], type: 'array', expected: true },
      { value: () => {}, type: 'function', expected: true },
      { value: null, type: 'null', expected: true },
      { value: undefined, type: 'undefined', expected: true },
      { value: 10, type: 'integer', expected: true },
      { value: 10, type: 'positive', expected: true },
      { value: 0, type: 'nonnegative', expected: true },
      
      { value: 'test', type: 'number', expected: false },
      { value: 42, type: 'string', expected: false },
      { value: true, type: 'object', expected: false },
      { value: {}, type: 'array', expected: false },
      { value: [], type: 'function', expected: false },
      { value: 'test', type: 'null', expected: false },
      { value: 'test', type: 'undefined', expected: false },
      { value: 3.14, type: 'integer', expected: false },
      { value: -10, type: 'positive', expected: false },
      { value: -1, type: 'nonnegative', expected: false },
      { value: NaN, type: 'number', expected: false }
    ];

    typeTestCases.forEach(({ value, type, expected }) => {
      test(`should ${expected ? 'pass' : 'fail'} for ${value} with ${type} type`, () => {
        const result = validator.validateType(value, type, {
          message: 'Type validation failed',
          context: { value, type }
        });
        expect(result).toBe(expected);
      });
    });
  });

  describe('Custom Validators', () => {
    test('should register a custom validator', () => {
      const customValidator = (value) => value > 10;
      validator.registerCustomValidator('greaterThanTen', customValidator);
      expect(() => validator.executeCustomValidator('greaterThanTen', 15)).not.toThrow();
    });

    test('should execute a custom validator', () => {
      const customValidator = (value) => value > 10;
      validator.registerCustomValidator('greaterThanTen', customValidator);
      const result = validator.executeCustomValidator('greaterThanTen', 15);
      expect(result).toBe(true);
    });

    test('should handle unregistered validator', () => {
      expect(() => validator.executeCustomValidator('nonexistent', 10))
        .toThrow('Custom validator nonexistent not found');
    });

    test('should register a complex validator with context', () => {
      const complexValidator = (value, context) => {
        return value > context.threshold;
      };
      validator.registerCustomValidator('complexValidation', complexValidator);
      const result = validator.executeCustomValidator('complexValidation', 15, { threshold: 10 });
      expect(result).toBe(true);
    });
  });
});
