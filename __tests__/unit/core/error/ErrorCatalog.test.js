import { ErrorCatalog } from '../../../../src/core/error/ErrorCatalog';
import { ErrorLevel } from '../../../../src/core/error/ErrorLevel';

describe('ErrorCatalog', () => {
  // Test overall structure
  test('should have appropriate error categories', () => {
    // Required categories
    const requiredCategories = [
      'PLAYER', 'ROLE', 'GAME', 'VALIDATION', 'ACTION', 'VOTE'
    ];
    
    requiredCategories.forEach(category => {
      expect(ErrorCatalog).toHaveProperty(category);
      expect(Object.keys(ErrorCatalog[category]).length).toBeGreaterThan(0);
    });
  });

  // Test error object schema
  test('error objects should have correct structure', () => {
    // Check a few sample errors
    const playerError = ErrorCatalog.PLAYER.INVALID_PLAYER_ID;
    expect(playerError).toHaveProperty('code');
    expect(playerError).toHaveProperty('message');
    expect(playerError).toHaveProperty('level');
    
    // Check code format (E followed by 4 digits)
    expect(playerError.code).toMatch(/^E\d{4}$/);
    
    // Check level is a valid value
    expect(Object.values(ErrorLevel)).toContain(playerError.level);
    
    // Message should be non-empty
    expect(playerError.message.length).toBeGreaterThan(0);
  });

  // Test utility functions
  test('getErrorByCode should retrieve errors correctly', () => {
    // Test with valid error code
    const error = ErrorCatalog.getErrorByCode('E0101');
    expect(error).toBe(ErrorCatalog.PLAYER.INVALID_PLAYER_ID);
    
    // Test with invalid code
    expect(ErrorCatalog.getErrorByCode('INVALID')).toBeNull();
  });
  
  test('getError should retrieve errors correctly', () => {
    // Test with valid category and key
    const error = ErrorCatalog.getError('PLAYER', 'INVALID_PLAYER_ID');
    expect(error).toBe(ErrorCatalog.PLAYER.INVALID_PLAYER_ID);
    
    // Test with invalid category
    expect(ErrorCatalog.getError('INVALID', 'KEY')).toBeNull();
    
    // Test with invalid key
    expect(ErrorCatalog.getError('PLAYER', 'INVALID_KEY')).toBeNull();
  });
  
  // Comprehensive check for error uniqueness
  test('all error codes should be unique across the catalog', () => {
    const allCodes = new Set();
    let duplicates = [];
    
    // Go through all categories and errors
    Object.values(ErrorCatalog).forEach(category => {
      if (typeof category === 'object' && category !== null && !Array.isArray(category)) {
        Object.values(category).forEach(error => {
          if (error && error.code) {
            if (allCodes.has(error.code)) {
              duplicates.push(error.code);
            } else {
              allCodes.add(error.code);
            }
          }
        });
      }
    });
    
    // Should have no duplicates
    expect(duplicates).toEqual([]);
  });
});
