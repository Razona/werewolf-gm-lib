/**
 * Common utilities tests
 */

import * as utils from '../utils';

describe('Validation utilities', () => {
  describe('isValidPlayerId', () => {
    test('should return true for valid player IDs', () => {
      expect(utils.isValidPlayerId(0)).toBe(true);
      expect(utils.isValidPlayerId(1)).toBe(true);
      expect(utils.isValidPlayerId(999)).toBe(true);
    });

    test('should return false for invalid player IDs', () => {
      expect(utils.isValidPlayerId(-1)).toBe(false);
      expect(utils.isValidPlayerId(1.5)).toBe(false);
      expect(utils.isValidPlayerId('1')).toBe(false);
      expect(utils.isValidPlayerId(null)).toBe(false);
      expect(utils.isValidPlayerId(undefined)).toBe(false);
    });
  });

  describe('isValidRoleName', () => {
    const availableRoles = ['villager', 'werewolf', 'seer'];

    test('should return true for valid role names', () => {
      expect(utils.isValidRoleName('villager', availableRoles)).toBe(true);
      expect(utils.isValidRoleName('werewolf', availableRoles)).toBe(true);
    });

    test('should return false for invalid role names', () => {
      expect(utils.isValidRoleName('hunter', availableRoles)).toBe(false);
      expect(utils.isValidRoleName(123, availableRoles)).toBe(false);
      expect(utils.isValidRoleName(null, availableRoles)).toBe(false);
    });
  });

  // 他のテストコードも同様に元の状態に戻します
});
