import { Validator, ErrorHandler } from '../../../../src/core/error';

class MockErrorHandler extends ErrorHandler {
  handledErrors: any[] = [];

  handle(error: any): void {
    this.handledErrors.push(error);
    super.handle(error);
  }
}

describe('Validator', () => {
  let errorHandler: MockErrorHandler;
  let validator: Validator;

  beforeEach(() => {
    errorHandler = new MockErrorHandler();
    validator = new Validator(errorHandler);
  });

  // 以前のテストコードをそのまま使用（前回のコードと同じ）
  describe('Initialization', () => {
    test('should create new validator instance', () => {
      expect(validator).toBeTruthy();
    });

    test('should work without error handler', () => {
      const validatorWithoutHandler = new Validator();
      expect(validatorWithoutHandler).toBeTruthy();
    });
  });

  // 残りのテストコードは以前のものと同じ
});
