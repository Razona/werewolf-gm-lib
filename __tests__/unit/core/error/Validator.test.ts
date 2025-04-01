import { ErrorHandler } from '../../../../src/core/error/ErrorHandler';
import { Validator } from '../../../../src/core/error/Validator';

class MockErrorHandler {
  handledErrors: any[] = [];

  register(errorCode: string, context: any = {}, message?: string): any {
    const error = { errorCode, context, message };
    this.handledErrors.push(error);
    return error;
  }

  handleError(error: any): any {
    // すでにregisterで追加されているので何もしない
    return error;
  }
}

describe('Validator', () => {
  let errorHandler: MockErrorHandler;
  let validator: Validator;

  beforeEach(() => {
    errorHandler = new MockErrorHandler();
    validator = new Validator(errorHandler as any);
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
});
