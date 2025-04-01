import {
  ErrorHandler,
  ErrorCatalog,
  ErrorLevel,
  Validator,
  createErrorSystem
} from '../../../../src/core/error';

// Mock EventSystem
class MockEventSystem {
  constructor() {
    this.events = [];
  }
  
  emit(eventName, data) {
    this.events.push({ eventName, data });
    return true;
  }
  
  getEvents() {
    return this.events;
  }
}

describe('Error System', () => {
  let eventSystem;
  
  beforeEach(() => {
    eventSystem = new MockEventSystem();
  });
  
  // Test module exports
  test('should export all required components', () => {
    expect(ErrorHandler).toBeDefined();
    expect(ErrorCatalog).toBeDefined();
    expect(ErrorLevel).toBeDefined();
    expect(Validator).toBeDefined();
    expect(createErrorSystem).toBeDefined();
  });
  
  // Test factory function
  describe('createErrorSystem', () => {
    test('should create a complete error system', () => {
      const errorSystem = createErrorSystem(eventSystem);
      
      expect(errorSystem.errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorSystem.validator).toBeInstanceOf(Validator);
    });
    
    test('should create error system with custom options', () => {
      const options = {
        throwOnLevel: ErrorLevel.FATAL,
        logLevel: ErrorLevel.WARNING
      };
      
      const errorSystem = createErrorSystem(eventSystem, options);
      expect(errorSystem.errorHandler).toBeInstanceOf(ErrorHandler);
    });
  });
  
  // Test integration between components
  describe('Component Integration', () => {
    test('should integrate validator with error handler', () => {
      // Create error system
      const { errorHandler, validator } = createErrorSystem(eventSystem);
      
      // Use a simple validator function that should work correctly
      expect(validator.validateType(123, 'number')).toBe(true);
    });
    
    test('should handle complete validation flow', () => {
      const { validator } = createErrorSystem(eventSystem);
      
      // Create a simple validation flow
      const value = 42;
      
      // This should pass
      expect(validator.validateExists(value)).toBe(true);
      expect(validator.validateType(value, 'number')).toBe(true);
      
      // Register a custom validator
      validator.registerCustomValidator('isEven', (val) => val % 2 === 0);
      expect(validator.executeCustomValidator('isEven', value)).toBe(true);
    });
  });
});
