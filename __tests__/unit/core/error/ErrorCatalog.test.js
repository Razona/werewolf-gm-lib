/**
 * ErrorCatalog unit tests
 */

const { ErrorCatalog, getErrorByCode, getErrorsByLevel } = require('../../../../src/core/error/ErrorCatalog');
const ErrorLevel = require('../../../../src/core/error/ErrorLevel');

describe('ErrorCatalog', () => {
  // Test overall structure
  test('should have appropriate error categories', () => {
    // Required categories
    const requiredCategories = [
      'PLAYER', 'ROLE', 'ACTION', 'VOTE', 'PHASE', 'SYSTEM', 'STATE', 'EXTENSION', 'WARNING', 'INFO'
    ];
    
    requiredCategories.forEach(category => {
      expect(ErrorCatalog).toHaveProperty(category);
      expect(Object.keys(ErrorCatalog[category]).length).toBeGreaterThan(0);
    });
  });

  // Test specific errors with parameterized tests
  describe.each([
    ['PLAYER', ['INVALID_PLAYER_ID', 'DEAD_PLAYER_ACTION', 'PLAYER_ALREADY_EXISTS', 'MAX_PLAYERS_REACHED']],
    ['ROLE', ['INVALID_ROLE_ASSIGNMENT', 'RESTRICTED_ABILITY', 'INVALID_ROLE_CONFIGURATION']],
    ['ACTION', ['INVALID_ACTION_TARGET', 'ACTION_PHASE_MISMATCH', 'DUPLICATE_ACTION']],
    ['VOTE', ['INVALID_VOTE_TARGET', 'DUPLICATE_VOTE', 'VOTE_PHASE_MISMATCH']],
    ['PHASE', ['INVALID_PHASE_TRANSITION', 'INCOMPLETE_PHASE_ACTIONS', 'GAME_ALREADY_STARTED']],
    ['SYSTEM', ['INTERNAL_ERROR', 'INVALID_CONFIGURATION', 'NOT_IMPLEMENTED']]
  ])('ErrorCatalog.%s', (category, requiredErrors) => {
    test(`should have all required ${category} errors`, () => {
      requiredErrors.forEach(errorName => {
        expect(ErrorCatalog[category]).toHaveProperty(errorName);
        const error = ErrorCatalog[category][errorName];
        expect(error).toBeDefined();
      });
    });
  });

  // Test error object schema with parameterized tests
  describe('error structure', () => {
    // Sample multiple errors from each category
    const sampleErrors = [];
    Object.keys(ErrorCatalog).forEach(category => {
      const categoryErrors = Object.values(ErrorCatalog[category]);
      if (categoryErrors.length > 0) {
        // Add at least one error from each category
        sampleErrors.push(categoryErrors[0]);
        
        // If category has more than one error, add another
        if (categoryErrors.length > 1) {
          sampleErrors.push(categoryErrors[categoryErrors.length - 1]);
        }
      }
    });
    
    test.each(sampleErrors)('should have correct structure for error %p', (error) => {
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('details');
      expect(error).toHaveProperty('level');
      
      // Check code format (E/W/I followed by 4 digits)
      expect(error.code).toMatch(/^[EWI]\d{4}$/);
      
      // Check level is a valid value
      expect(Object.values(ErrorLevel)).toContain(error.level);
      
      // Message should be non-empty
      expect(error.message.length).toBeGreaterThan(0);
      
      // Details should be non-empty
      expect(error.details.length).toBeGreaterThan(0);
    });
  });

  // Test error code convention with parameterized tests
  describe('error code convention', () => {
    const codePatterns = [
      { category: 'PLAYER', pattern: /^E01\d{2}$/ },
      { category: 'ROLE', pattern: /^E02\d{2}$/ },
      { category: 'ACTION', pattern: /^E03\d{2}$/ },
      { category: 'VOTE', pattern: /^E04\d{2}$/ },
      { category: 'PHASE', pattern: /^E05\d{2}$/ },
      { category: 'SYSTEM', pattern: /^E06\d{2}$/ },
      { category: 'STATE', pattern: /^E07\d{2}$/ },
      { category: 'EXTENSION', pattern: /^E08\d{2}$/ },
      { category: 'WARNING', pattern: /^W01\d{2}$/ },
      { category: 'INFO', pattern: /^I01\d{2}$/ }
    ];
    
    test.each(codePatterns)('$category error codes should follow pattern $pattern', ({ category, pattern }) => {
      Object.values(ErrorCatalog[category]).forEach(error => {
        expect(error.code).toMatch(pattern);
      });
    });
  });

  // Test utility functions
  describe('getErrorByCode', () => {
    // Valid error codes from different categories
    const testCases = [
      { code: 'E0101', category: 'PLAYER', error: 'INVALID_PLAYER_ID' },
      { code: 'E0201', category: 'ROLE', error: 'INVALID_ROLE_ASSIGNMENT' },
      { code: 'E0301', category: 'ACTION', error: 'INVALID_ACTION_TARGET' },
      { code: 'W0101', category: 'WARNING', error: 'DEPRECATED_FEATURE' },
      { code: 'I0101', category: 'INFO', error: 'GAME_STATE_CHANGE' }
    ];
    
    test.each(testCases)('should retrieve $category.$error with code $code', ({ code, category, error }) => {
      const errorObj = getErrorByCode(code);
      expect(errorObj).toBe(ErrorCatalog[category][error]);
    });
    
    test('should handle non-existent error codes gracefully', () => {
      // Test with completely invalid code
      expect(getErrorByCode('E9999')).toBeNull();
      
      // Test with malformed code
      expect(getErrorByCode('EXYZ')).toBeNull();
      
      // Test with empty string
      expect(getErrorByCode('')).toBeNull();
      
      // Test with null
      expect(getErrorByCode(null)).toBeNull();
      
      // Test with undefined
      expect(getErrorByCode(undefined)).toBeNull();
    });
  });
  
  describe('getErrorsByLevel', () => {
    // Test for all error levels
    test.each(Object.values(ErrorLevel))('should return errors of level %s', (level) => {
      const errors = getErrorsByLevel(level);
      
      // Should return an array
      expect(Array.isArray(errors)).toBe(true);
      
      // Should have at least one error of this level
      expect(errors.length).toBeGreaterThan(0);
      
      // All returned errors should have the specified level
      errors.forEach(error => {
        expect(error.level).toBe(level);
      });
    });
    
    test('should handle invalid levels gracefully', () => {
      // Test with invalid level string
      expect(getErrorsByLevel('INVALID_LEVEL')).toEqual([]);
      
      // Test with null
      expect(getErrorsByLevel(null)).toEqual([]);
      
      // Test with undefined
      expect(getErrorsByLevel(undefined)).toEqual([]);
    });
    
    test('should find expected errors for each level', () => {
      // FATAL level errors
      const fatalErrors = getErrorsByLevel(ErrorLevel.FATAL);
      expect(fatalErrors.some(e => e.code === ErrorCatalog.SYSTEM.INTERNAL_ERROR.code)).toBe(true);
      
      // ERROR level errors
      const errorLevelErrors = getErrorsByLevel(ErrorLevel.ERROR);
      expect(errorLevelErrors.some(e => e.code === ErrorCatalog.PLAYER.INVALID_PLAYER_ID.code)).toBe(true);
      
      // WARNING level errors
      const warningErrors = getErrorsByLevel(ErrorLevel.WARNING);
      expect(warningErrors.some(e => e.code === ErrorCatalog.WARNING.DEPRECATED_FEATURE.code)).toBe(true);
      
      // INFO level errors
      const infoErrors = getErrorsByLevel(ErrorLevel.INFO);
      expect(infoErrors.some(e => e.code === ErrorCatalog.INFO.GAME_STATE_CHANGE.code)).toBe(true);
    });
  });
  
  // Test error levels
  describe('ErrorLevel', () => {
    test('should have appropriate error levels in order of severity', () => {
      // Check all required levels exist
      expect(ErrorLevel.FATAL).toBeDefined();
      expect(ErrorLevel.ERROR).toBeDefined();
      expect(ErrorLevel.WARNING).toBeDefined();
      expect(ErrorLevel.INFO).toBeDefined();
      
      // Ensure consistent string values
      expect(ErrorLevel.FATAL).toBe('fatal');
      expect(ErrorLevel.ERROR).toBe('error');
      expect(ErrorLevel.WARNING).toBe('warning');
      expect(ErrorLevel.INFO).toBe('info');
      
      // Check uniqueness
      const levels = Object.values(ErrorLevel);
      const uniqueLevels = new Set(levels);
      expect(uniqueLevels.size).toBe(levels.length);
    });
  });
  
  // Comprehensive check for error uniqueness
  test('all error codes should be unique across the catalog', () => {
    const allCodes = new Set();
    let duplicates = [];
    
    // Go through all categories and errors
    Object.values(ErrorCatalog).forEach(category => {
      Object.values(category).forEach(error => {
        if (allCodes.has(error.code)) {
          duplicates.push(error.code);
        } else {
          allCodes.add(error.code);
        }
      });
    });
    
    // Should have no duplicates
    expect(duplicates).toEqual([]);
    
    // Check total count
    const totalErrorCount = Object.values(ErrorCatalog).reduce(
      (count, category) => count + Object.keys(category).length, 0
    );
    expect(allCodes.size).toBe(totalErrorCount);
  });
});
