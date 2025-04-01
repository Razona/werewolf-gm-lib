import { ErrorHandler } from '../../../../src/core/error/ErrorHandler';
import { ErrorCatalog } from '../../../../src/core/error/ErrorCatalog';
import { ErrorLevel } from '../../../../src/core/error/ErrorLevel';

// Mock EventSystem
class MockEventSystem {
  constructor() {
    this.emittedEvents = [];
  }
  
  emit(eventName, data) {
    this.emittedEvents.push({ eventName, data });
    return true;
  }
}

describe('ErrorHandler', () => {
  let eventSystem;
  let errorHandler;
  let consoleErrorSpy;
  
  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    eventSystem = new MockEventSystem();
    errorHandler = new ErrorHandler(eventSystem);
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  // Test creation
  describe('Initialization', () => {
    test('should create a new error handler with default policy', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.policy).toBeDefined();
    });
    
    test('should create error handler with custom policy', () => {
      const customOptions = {
        throwOnLevel: ErrorLevel.FATAL,
        logLevel: ErrorLevel.ERROR
      };
      
      const customHandler = new ErrorHandler(eventSystem, customOptions);
      
      expect(customHandler.policy.throwOnLevel).toBe(ErrorLevel.FATAL);
      expect(customHandler.policy.logLevel).toBe(ErrorLevel.ERROR);
    });
    
    test('should handle creation without event system', () => {
      const handlerWithoutEvents = new ErrorHandler();
      expect(handlerWithoutEvents).toBeInstanceOf(ErrorHandler);
    });
  });
  
  // Basic error handling test
  describe('Handling Errors', () => {
    test('should log errors', () => {
      const error = {
        code: 'E0101',
        message: 'Test error',
        level: ErrorLevel.ERROR
      };
      
      errorHandler.handleError(error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
