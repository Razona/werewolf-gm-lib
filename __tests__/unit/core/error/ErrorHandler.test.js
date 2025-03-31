/**
 * ErrorHandler unit tests
 */

const ErrorHandler = require('../../../../src/core/error/ErrorHandler');
const { ErrorCatalog } = require('../../../../src/core/error/ErrorCatalog');
const ErrorLevel = require('../../../../src/core/error/ErrorLevel');

// Mock EventSystem
class MockEventSystem {
  constructor() {
    this.emittedEvents = [];
  }
  
  emit(eventName, data) {
    this.emittedEvents.push({ eventName, data });
    return true;
  }
  
  getEmittedEvents() {
    return this.emittedEvents;
  }
  
  clearEmittedEvents() {
    this.emittedEvents = [];
  }
  
  // Helper to find events by name pattern
  findEvents(pattern) {
    return this.emittedEvents.filter(e => 
      typeof pattern === 'string' 
        ? e.eventName === pattern 
        : pattern.test(e.eventName)
    );
  }
}

describe('ErrorHandler', () => {
  let eventSystem;
  let errorHandler;
  let consoleErrorSpy;
  let consoleWarnSpy;
  let consoleInfoSpy;
  
  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    
    eventSystem = new MockEventSystem();
    errorHandler = new ErrorHandler(eventSystem);
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    
    eventSystem.clearEmittedEvents();
  });
  
  // Test creation
  describe('Initialization', () => {
    test('should create a new error handler with default policy', () => {
      expect(errorHandler).toBeInstanceOf(ErrorHandler);
      expect(errorHandler.policy).toBeDefined();
      expect(errorHandler.errorHistory).toEqual([]);
      expect(errorHandler.unhandledErrors).toEqual([]);
      expect(errorHandler.errorCounts).toBeInstanceOf(Map);
    });
    
    test('should create error handler with custom policy', () => {
      const customOptions = {
        policy: {
          throwOnLevel: ErrorLevel.FATAL,
          logLevel: ErrorLevel.ERROR,
          historyLimit: 100
        }
      };
      
      const customHandler = new ErrorHandler(eventSystem, customOptions);
      
      expect(customHandler.policy.throwOnLevel).toBe(ErrorLevel.FATAL);
      expect(customHandler.policy.logLevel).toBe(ErrorLevel.ERROR);
      expect(customHandler.policy.historyLimit).toBe(100);
    });
    
    test('should handle creation without event system', () => {
      const handlerWithoutEvents = new ErrorHandler();
      
      // Should still be able to create and handle errors
      expect(() => {
        handlerWithoutEvents.createError('E0101', 'Test error');
      }).not.toThrow();
    });
  });
  
  // Test error policy
  describe('Error Policy', () => {
    test('should have default error policy values', () => {
      // Check default policy values
      expect(errorHandler.policy.throwOnLevel).toBe(ErrorLevel.ERROR);
      expect(errorHandler.policy.emitAll).toBe(true);
      expect(errorHandler.policy.logLevel).toBe(ErrorLevel.WARNING);
      expect(errorHandler.policy.recordHistory).toBe(true);
      expect(errorHandler.policy.historyLimit).toBeGreaterThan(0);
      expect(errorHandler.policy.diagnosticInfo).toBe(true);
    });
    
    test('should update error policy partially', () => {
      // Update only some policy settings
      errorHandler.setErrorPolicy({
        throwOnLevel: ErrorLevel.FATAL,
        emitAll: false
      });
      
      // Changed settings should be updated
      expect(errorHandler.policy.throwOnLevel).toBe(ErrorLevel.FATAL);
      expect(errorHandler.policy.emitAll).toBe(false);
      
      // Other settings should remain default
      expect(errorHandler.policy.logLevel).toBe(ErrorLevel.WARNING);
      expect(errorHandler.policy.recordHistory).toBe(true);
    });
    
    test('should emit policy change event', () => {
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      const policyEvents = eventSystem.findEvents('error.policy.change');
      expect(policyEvents.length).toBe(1);
      expect(policyEvents[0].data.policy.throwOnLevel).toBe(ErrorLevel.FATAL);
    });
    
    test('should handle policy update without event system', () => {
      const handlerWithoutEvents = new ErrorHandler();
      
      // Should not throw when updating policy without event system
      expect(() => {
        handlerWithoutEvents.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      }).not.toThrow();
    });
  });
  
  // Test error creation
  describe('Creating Errors', () => {
    const testCases = [
      { 
        name: 'player error', 
        code: ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code, 
        context: { playerId: 123 } 
      },
      { 
        name: 'role error', 
        code: ErrorCatalog.ROLE.RESTRICTED_ABILITY.code, 
        context: { roleName: 'seer', ability: 'guard' } 
      },
      { 
        name: 'action error', 
        code: ErrorCatalog.ACTION.INVALID_ACTION_TARGET.code, 
        context: { action: 'fortune', target: 456 } 
      }
    ];
    
    test.each(testCases)('should create a $name from error code', ({ code, context }) => {
      const error = errorHandler.register(code, context);
      
      // Error structure should be correct
      expect(error.code).toBe(code);
      expect(error.message).toBeDefined();
      expect(error.level).toBeDefined();
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeGreaterThan(0);
    });
    
    test('should create error with custom message', () => {
      const customMessage = 'カスタムエラーメッセージ';
      const error = errorHandler.createError(
        ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        customMessage,
        { playerId: 123 }
      );
      
      expect(error.code).toBe(ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code);
      expect(error.message).toBe(customMessage);
      expect(error.context.playerId).toBe(123);
    });
    
    test('should handle unknown error codes gracefully', () => {
      // Completely unknown code
      const error1 = errorHandler.register('UNKNOWN_CODE', { data: 'test' });
      expect(error1.code).toBe(ErrorCatalog.SYSTEM.INTERNAL_ERROR.code);
      expect(error1.context.originalCode).toBe('UNKNOWN_CODE');
      
      // Malformed but similar to real code
      const error2 = errorHandler.register('E0100', { data: 'test' });
      expect(error2.code).toBe(ErrorCatalog.SYSTEM.INTERNAL_ERROR.code);
      expect(error2.context.originalCode).toBe('E0100');
      
      // Empty code
      const error3 = errorHandler.register('', { data: 'test' });
      expect(error3.code).toBe(ErrorCatalog.SYSTEM.INTERNAL_ERROR.code);
      
      // Non-string code
      const error4 = errorHandler.register(12345, { data: 'test' });
      expect(error4.code).toBe(ErrorCatalog.SYSTEM.INTERNAL_ERROR.code);
    });
    
    test('should add diagnostic information for errors', () => {
      // Create a fatal error which should include stack trace
      const error = errorHandler.createError(
        ErrorCatalog.SYSTEM.INTERNAL_ERROR.code,
        'Fatal system error',
        { operation: 'test' }
      );
      
      expect(error.details).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });
  });
  
  // Test error handling
  describe('Handling Errors', () => {
    // Test cases for different error levels
    const errorLevelTestCases = [
      { 
        level: ErrorLevel.FATAL, 
        code: ErrorCatalog.SYSTEM.INTERNAL_ERROR.code,
        shouldThrow: true,
        consoleMethod: 'error'
      },
      { 
        level: ErrorLevel.ERROR, 
        code: ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        shouldThrow: true,
        consoleMethod: 'error'
      },
      { 
        level: ErrorLevel.WARNING, 
        code: ErrorCatalog.WARNING.DEPRECATED_FEATURE.code,
        shouldThrow: false,
        consoleMethod: 'warn'
      },
      { 
        level: ErrorLevel.INFO, 
        code: ErrorCatalog.INFO.GAME_STATE_CHANGE.code,
        shouldThrow: false,
        consoleMethod: 'info'
      }
    ];
    
    // Test default behavior with default policy
    test.each(errorLevelTestCases)(
      'should handle $level level error appropriately with default policy',
      ({ level, code, shouldThrow, consoleMethod }) => {
        const error = errorHandler.createError(code, `Test ${level} error`, { level });
        
        if (shouldThrow) {
          expect(() => errorHandler.handleError(error)).toThrow();
        } else {
          expect(() => errorHandler.handleError(error)).not.toThrow();
          expect(errorHandler.unhandledErrors.length).toBe(1);
        }
        
        // Check console output
        const consoleSpy = consoleMethod === 'error' ? consoleErrorSpy :
                          consoleMethod === 'warn' ? consoleWarnSpy : consoleInfoSpy;
        
        if (level === ErrorLevel.INFO && errorHandler.policy.logLevel === ErrorLevel.WARNING) {
          // INFO level should not be logged with default WARNING log level
          expect(consoleSpy).not.toHaveBeenCalled();
        } else {
          expect(consoleSpy).toHaveBeenCalled();
        }
      }
    );
    
    // Test with custom policy
    test('should respect custom error policy for throwing', () => {
      // Set policy to only throw on FATAL
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // ERROR level should not throw
      const error = errorHandler.createError(
        ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        'Test error',
        {}
      );
      
      expect(() => errorHandler.handleError(error)).not.toThrow();
      
      // FATAL level should still throw
      const fatalError = errorHandler.createError(
        ErrorCatalog.SYSTEM.INTERNAL_ERROR.code,
        'Test fatal error',
        {}
      );
      
      expect(() => errorHandler.handleError(fatalError)).toThrow();
    });
    
    test('should respect custom error policy for logging', () => {
      // Set policy to only log ERROR and above
      errorHandler.setErrorPolicy({ logLevel: ErrorLevel.ERROR });
      
      // WARNING level should not be logged
      const warningError = errorHandler.createError(
        ErrorCatalog.WARNING.DEPRECATED_FEATURE.code,
        'Test warning',
        {}
      );
      
      errorHandler.handleError(warningError);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      
      // ERROR level should be logged
      const error = errorHandler.createError(
        ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        'Test error',
        {}
      );
      
      try {
        errorHandler.handleError(error);
      } catch (e) {
        // Ignore thrown error
      }
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    test('should emit appropriate error events', () => {
      // Set policy to not throw (so we can check all events)
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // Create and handle error
      const errorCode = ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code;
      const error = errorHandler.createError(
        errorCode,
        'Test error',
        { playerId: 123, phase: 'night', actionType: 'fortune' }
      );
      
      errorHandler.handleError(error);
      
      // Check emitted events
      const emittedEvents = eventSystem.getEmittedEvents();
      
      // Should have these specific events
      expect(eventSystem.findEvents('error').length).toBe(1);
      expect(eventSystem.findEvents(`error.${ErrorLevel.ERROR}`).length).toBe(1);
      expect(eventSystem.findEvents(`error.code.${errorCode}`).length).toBe(1);
      expect(eventSystem.findEvents('error.player.123').length).toBe(1);
      expect(eventSystem.findEvents('error.phase.night').length).toBe(1);
      expect(eventSystem.findEvents('error.action.fortune').length).toBe(1);
    });
    
    test('should disable event emission if emitAll is false', () => {
      // Set policy to not throw and not emit
      errorHandler.setErrorPolicy({ 
        throwOnLevel: ErrorLevel.FATAL,
        emitAll: false
      });
      
      // Create and handle error
      const error = errorHandler.createError(
        ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        'Test error',
        { playerId: 123 }
      );
      
      errorHandler.handleError(error);
      
      // No events should be emitted
      expect(eventSystem.getEmittedEvents().length).toBe(0);
    });
    
    test('should add error to history based on policy', () => {
      // First with recording enabled (default)
      const error1 = errorHandler.createError(
        ErrorCatalog.WARNING.DEPRECATED_FEATURE.code,
        'Test warning',
        {}
      );
      
      errorHandler.handleError(error1);
      expect(errorHandler.errorHistory.length).toBe(1);
      
      // Now with recording disabled
      errorHandler.clearErrorHistory();
      errorHandler.setErrorPolicy({ recordHistory: false });
      
      const error2 = errorHandler.createError(
        ErrorCatalog.WARNING.DEPRECATED_FEATURE.code,
        'Test warning 2',
        {}
      );
      
      errorHandler.handleError(error2);
      expect(errorHandler.errorHistory.length).toBe(0);
    });
    
    test('should enforce history limit', () => {
      // Set a small history limit
      errorHandler.setErrorPolicy({ historyLimit: 2 });
      
      // Create 3 errors
      for (let i = 0; i < 3; i++) {
        const error = errorHandler.createError(
          ErrorCatalog.WARNING.DEPRECATED_FEATURE.code,
          `Test ${i}`,
          { index: i }
        );
        
        errorHandler.handleError(error);
      }
      
      // Should only keep the latest 2
      const history = errorHandler.getErrorHistory();
      expect(history.length).toBe(2);
      expect(history[0].context.index).toBe(1);
      expect(history[1].context.index).toBe(2);
    });
    
    test('should handle complex error chains', () => {
      // Set not to throw
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // Create multiple related errors
      const errorA = errorHandler.createError(
        ErrorCatalog.PHASE.GAME_NOT_STARTED.code,
        'Game not started',
        { operation: 'startTurn' }
      );
      
      const errorB = errorHandler.createError(
        ErrorCatalog.ACTION.ACTION_PHASE_MISMATCH.code,
        'Invalid action phase',
        { actionType: 'startTurn', phase: null, causedBy: errorA.code }
      );
      
      const errorC = errorHandler.createError(
        ErrorCatalog.SYSTEM.INTERNAL_ERROR.code,
        'System failure',
        { operation: 'gameLoop', causedBy: errorB.code }
      );
      
      // Handle the errors in sequence
      errorHandler.handleError(errorA);
      errorHandler.handleError(errorB);
      try {
        errorHandler.handleError(errorC); // Should throw as it's FATAL
      } catch (e) {
        // Expected
      }
      
      // Should have all three in history
      expect(errorHandler.errorHistory.length).toBe(3);
      
      // First two should be in unhandled
      expect(errorHandler.unhandledErrors.length).toBe(2);
      
      // Error counts should reflect all three
      expect(errorHandler.errorCounts.get(errorA.code)).toBe(1);
      expect(errorHandler.errorCounts.get(errorB.code)).toBe(1);
      expect(errorHandler.errorCounts.get(errorC.code)).toBe(1);
    });
  });
  
  // Test error reporting
  describe('Error Reporting', () => {
    beforeEach(() => {
      // Set up a diverse set of errors for reporting
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // Create errors of different levels
      const errors = [
        { code: ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code, context: { playerId: 1 } },
        { code: ErrorCatalog.ROLE.RESTRICTED_ABILITY.code, context: { roleName: 'seer' } },
        { code: ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code, context: { playerId: 2 } }, // Duplicate
        { code: ErrorCatalog.WARNING.DEPRECATED_FEATURE.code, context: { feature: 'old' } },
        { code: ErrorCatalog.INFO.GAME_STATE_CHANGE.code, context: { state: 'new' } }
      ];
      
      errors.forEach(({ code, context }) => {
        const error = errorHandler.register(code, context);
        errorHandler.handleError(error);
      });
    });
    
    test('should create basic error report', () => {
      const report = errorHandler.createErrorReport(false);
      
      // Check basic properties
      expect(report.totalErrors).toBe(5);
      expect(report.unhandledErrors).toBe(5);
      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.policy).toEqual(errorHandler.policy);
      
      // Check error counts
      expect(report.errorCounts[ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code]).toBe(2);
      expect(report.errorCounts[ErrorCatalog.ROLE.RESTRICTED_ABILITY.code]).toBe(1);
      expect(report.errorCounts[ErrorCatalog.WARNING.DEPRECATED_FEATURE.code]).toBe(1);
      expect(report.errorCounts[ErrorCatalog.INFO.GAME_STATE_CHANGE.code]).toBe(1);
      
      // Basic report should not include detailed info
      expect(report.history).toBeUndefined();
      expect(report.levelCounts).toBeUndefined();
    });
    
    test('should create detailed error report', () => {
      const report = errorHandler.createErrorReport(true);
      
      // Should include detailed info
      expect(report.history).toBeDefined();
      expect(report.history.length).toBe(5);
      expect(report.levelCounts).toBeDefined();
      expect(report.unhandledErrors).toBeDefined();
      
      // Check level counts
      expect(report.levelCounts[ErrorLevel.ERROR]).toBe(3); // 2 player errors + 1 role error
      expect(report.levelCounts[ErrorLevel.WARNING]).toBe(1);
      expect(report.levelCounts[ErrorLevel.INFO]).toBe(1);
    });
    
    test('should handle report creation with no errors', () => {
      // Clear history and create report
      errorHandler.clearErrorHistory();
      const report = errorHandler.createErrorReport(true);
      
      // Should have zero counts but valid structure
      expect(report.totalErrors).toBe(0);
      expect(report.history).toEqual([]);
      expect(report.lastError).toBeNull();
      
      // Level counts should all be zero
      expect(report.levelCounts[ErrorLevel.FATAL]).toBe(0);
      expect(report.levelCounts[ErrorLevel.ERROR]).toBe(0);
      expect(report.levelCounts[ErrorLevel.WARNING]).toBe(0);
      expect(report.levelCounts[ErrorLevel.INFO]).toBe(0);
    });
  });
  
  // Test error history management
  describe('Error History Management', () => {
    beforeEach(() => {
      // Create some errors
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // Add different error types
      [
        ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        ErrorCatalog.WARNING.DEPRECATED_FEATURE.code,
        ErrorCatalog.ACTION.INVALID_ACTION_TARGET.code
      ].forEach(code => {
        const error = errorHandler.register(code, {});
        errorHandler.handleError(error);
      });
    });
    
    test('should clear error history', () => {
      // Verify errors exist
      expect(errorHandler.getErrorHistory().length).toBe(3);
      
      // Clear history
      errorHandler.clearErrorHistory();
      
      // Verify it's empty
      expect(errorHandler.getErrorHistory().length).toBe(0);
      
      // Should emit clear event
      const clearEvent = eventSystem.findEvents('error.history.clear');
      expect(clearEvent.length).toBe(1);
    });
    
    test('should get error history with limit', () => {
      // Create more errors
      [
        ErrorCatalog.ROLE.RESTRICTED_ABILITY.code,
        ErrorCatalog.VOTE.INVALID_VOTE_TARGET.code
      ].forEach(code => {
        const error = errorHandler.register(code, {});
        errorHandler.handleError(error);
      });
      
      // Get limited history
      const limitedHistory = errorHandler.getErrorHistory(2);
      expect(limitedHistory.length).toBe(2);
      
      // Should be the most recent 2 errors
      expect(limitedHistory[0].code).toBe(ErrorCatalog.ROLE.RESTRICTED_ABILITY.code);
      expect(limitedHistory[1].code).toBe(ErrorCatalog.VOTE.INVALID_VOTE_TARGET.code);
    });
    
    test('should clear unhandled errors', () => {
      // Verify unhandled errors exist
      expect(errorHandler.unhandledErrors.length).toBe(3);
      
      // Clear unhandled errors
      errorHandler.clearUnhandledErrors();
      
      // Verify it's empty
      expect(errorHandler.unhandledErrors.length).toBe(0);
      
      // Should emit clear event
      const clearEvent = eventSystem.findEvents('error.unhandled.clear');
      expect(clearEvent.length).toBe(1);
    });
    
    test('should reset error counts', () => {
      // Verify error counts exist
      expect(errorHandler.errorCounts.size).toBe(3);
      
      // Reset counts
      errorHandler.resetErrorCounts();
      
      // Verify it's empty
      expect(errorHandler.errorCounts.size).toBe(0);
      
      // Should emit reset event
      const resetEvent = eventSystem.findEvents('error.counts.reset');
      expect(resetEvent.length).toBe(1);
    });
    
    test('should handle history methods without event system', () => {
      const handlerWithoutEvents = new ErrorHandler();
      
      // Add some errors
      const error = handlerWithoutEvents.createError(
        ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code,
        'Test error'
      );
      
      try {
        handlerWithoutEvents.handleError(error);
      } catch (e) {
        // Expected to throw
      }
      
      // Should not throw when calling history methods
      expect(() => {
        handlerWithoutEvents.clearErrorHistory();
        handlerWithoutEvents.clearUnhandledErrors();
        handlerWithoutEvents.resetErrorCounts();
      }).not.toThrow();
    });
  });
  
  // Test error filtering
  describe('Error Filtering', () => {
    beforeEach(() => {
      // Create a diverse set of errors
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // Create errors of various levels
      [
        { code: ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code, level: ErrorLevel.ERROR },
        { code: ErrorCatalog.ROLE.RESTRICTED_ABILITY.code, level: ErrorLevel.ERROR },
        { code: ErrorCatalog.WARNING.DEPRECATED_FEATURE.code, level: ErrorLevel.WARNING },
        { code: ErrorCatalog.WARNING.UNEXPECTED_STATE.code, level: ErrorLevel.WARNING },
        { code: ErrorCatalog.INFO.GAME_STATE_CHANGE.code, level: ErrorLevel.INFO }
      ].forEach(({ code }) => {
        const error = errorHandler.register(code, {});
        errorHandler.handleError(error);
      });
    });
    
    test('should filter errors by level', () => {
      // Get errors by level
      const errorLevelErrors = errorHandler.getErrorsByLevel(ErrorLevel.ERROR);
      const warningLevelErrors = errorHandler.getErrorsByLevel(ErrorLevel.WARNING);
      const infoLevelErrors = errorHandler.getErrorsByLevel(ErrorLevel.INFO);
      const fatalLevelErrors = errorHandler.getErrorsByLevel(ErrorLevel.FATAL);
      
      // Check counts
      expect(errorLevelErrors.length).toBe(2);
      expect(warningLevelErrors.length).toBe(2);
      expect(infoLevelErrors.length).toBe(1);
      expect(fatalLevelErrors.length).toBe(0); // No fatal errors created
      
      // Check error types
      expect(errorLevelErrors[0].code).toBe(ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code);
      expect(warningLevelErrors[0].code).toBe(ErrorCatalog.WARNING.DEPRECATED_FEATURE.code);
      expect(infoLevelErrors[0].code).toBe(ErrorCatalog.INFO.GAME_STATE_CHANGE.code);
    });
    
    test('should handle getErrorsByLevel with invalid parameters', () => {
      // Test with invalid level
      expect(errorHandler.getErrorsByLevel('INVALID_LEVEL')).toEqual([]);
      expect(errorHandler.getErrorsByLevel(null)).toEqual([]);
      expect(errorHandler.getErrorsByLevel(undefined)).toEqual([]);
      expect(errorHandler.getErrorsByLevel(123)).toEqual([]);
    });
  });
  
  // Test native error creation
  describe('Native Error Creation', () => {
    test('should convert error structure to native Error object', () => {
      // Create error that will be converted to native Error
      const errorCode = ErrorCatalog.SYSTEM.INTERNAL_ERROR.code;
      const errorMsg = 'Critical system failure';
      const error = errorHandler.createError(errorCode, errorMsg, { operation: 'test' });
      
      try {
        errorHandler.handleError(error);
        // Should not reach here
        expect(true).toBe(false);
      } catch (e) {
        // Check that the thrown error is a native Error with our properties
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe(errorMsg);
        expect(e.code).toBe(errorCode);
        expect(e.level).toBe(error.level);
        expect(e.context).toEqual(error.context);
        expect(e.timestamp).toBe(error.timestamp);
        expect(e.stack).toBeDefined();
      }
    });
    
    test('should preserve stack trace in native error', () => {
      // Mock a stack trace
      const mockStack = 'Error: Test\n    at line1\n    at line2';
      
      // Create error with mock stack
      const error = errorHandler.createError(
        ErrorCatalog.SYSTEM.INTERNAL_ERROR.code,
        'Test error',
        {}
      );
      
      error.stack = mockStack;
      
      try {
        errorHandler.handleError(error);
        // Should not reach here
        expect(true).toBe(false);
      } catch (e) {
        // Native error should have the mock stack
        expect(e.stack).toBe(mockStack);
      }
    });
  });
});
