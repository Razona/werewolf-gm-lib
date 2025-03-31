/**
 * Error System module integration tests
 */

const {
  ErrorHandler,
  ErrorCatalog,
  ErrorLevel,
  Validator,
  createErrorSystem
} = require('../../../../src/core/error');

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
        policy: {
          throwOnLevel: ErrorLevel.FATAL,
          logLevel: ErrorLevel.WARNING
        }
      };
      
      const errorSystem = createErrorSystem(eventSystem, options);
      
      expect(errorSystem.errorHandler.policy.throwOnLevel).toBe(ErrorLevel.FATAL);
      expect(errorSystem.errorHandler.policy.logLevel).toBe(ErrorLevel.WARNING);
    });
  });
  
  // Test integration between components
  describe('Component Integration', () => {
    test('should integrate validator with error handler', () => {
      // Create error system
      const { errorHandler, validator } = createErrorSystem(eventSystem);
      
      // Configure error handler not to throw (for this test)
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.FATAL });
      
      // Use validator which should use error handler internally
      validator.validateCondition(false, ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code);
      
      // Check that error was emitted through event system
      const errorEvents = eventSystem.events.filter(e => e.eventName === 'error');
      expect(errorEvents.length).toBe(1);
      expect(errorEvents[0].data.code).toBe(ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code);
    });
    
    test('should handle complete validation flow', () => {
      const { errorHandler, validator } = createErrorSystem(eventSystem);
      
      // Set up mock game objects
      const player = { id: 1, name: 'Player 1', isAlive: true };
      const role = { 
        name: 'seer',
        canUseAbility: () => true
      };
      const gameState = {
        currentPhase: 'night',
        hasStarted: true,
        hasEnded: false,
        getPlayer: () => player
      };
      const action = {
        type: 'fortune',
        actor: 1,
        target: 2
      };
      
      // Configure to throw on ERROR
      errorHandler.setErrorPolicy({ throwOnLevel: ErrorLevel.ERROR });
      
      // Validation should pass
      expect(() => {
        validator.validatePlayerAction(action, player, gameState);
        validator.validateRoleAction(action, role, gameState);
        validator.validateGameState(action, gameState);
      }).not.toThrow();
      
      // Make player dead (should cause validation to fail)
      player.isAlive = false;
      
      // Now validation should throw
      expect(() => {
        validator.validatePlayerAction(action, player, gameState);
      }).toThrow();
      
      // Confirm error was emitted and has correct properties
      const deadPlayerEvents = eventSystem.events.filter(
        e => e.eventName === 'error.code.E0103' // DEAD_PLAYER_ACTION code
      );
      expect(deadPlayerEvents.length).toBe(1);
      expect(deadPlayerEvents[0].data.context.playerId).toBe(1);
    });
  });
});
