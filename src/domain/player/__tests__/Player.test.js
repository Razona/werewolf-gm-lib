/**
 * Player class tests
 */

describe('Player', () => {
  // Import the Player class
  let Player;
  
  beforeEach(() => {
    // Clear the module cache between tests to ensure a fresh import
    jest.resetModules();
    Player = require('../Player').Player;
  });

  describe('Initialization', () => {
    test('should initialize with id and name correctly', () => {
      const player = new Player(1, 'TestPlayer');
      expect(player.id).toBe(1);
      expect(player.name).toBe('TestPlayer');
    });

    test('should have default properties set correctly', () => {
      const player = new Player(1, 'TestPlayer');
      expect(player.isAlive).toBe(true);
      expect(player.role).toBeNull();
      expect(player.causeOfDeath).toBeNull();
      expect(player.deathTurn).toBeNull();
      expect(player.statusEffects).toEqual([]);
    });

    test('should throw specific error for invalid parameters', () => {
      expect(() => new Player(null, 'TestPlayer')).toThrow('Player ID must be a valid number');
      expect(() => new Player(1, '')).toThrow('Player name must be a non-empty string');
      expect(() => new Player(1, null)).toThrow('Player name must be a non-empty string');
    });

    test('should handle edge case values', () => {
      // 極端な値でも正常に動作するか
      const player = new Player(Number.MAX_SAFE_INTEGER, 'ExtremeIDPlayer');
      expect(player.id).toBe(Number.MAX_SAFE_INTEGER);
      
      // 長い名前
      const longNamePlayer = new Player(1, 'A'.repeat(255));
      expect(longNamePlayer.name).toBe('A'.repeat(255));
      
      // 特殊文字を含む名前
      const specialCharPlayer = new Player(2, '名前✓☆♠!@#');
      expect(specialCharPlayer.name).toBe('名前✓☆♠!@#');
    });
  });

  describe('Status methods', () => {
    test('kill() should set player to dead state', () => {
      const player = new Player(1, 'TestPlayer');
      const result = player.kill('execution', 2);
      
      expect(result).toBe(true);
      expect(player.isAlive).toBe(false);
      expect(player.causeOfDeath).toBe('execution');
      expect(player.deathTurn).toBe(2);
    });

    test('kill() should return false if player is already dead', () => {
      const player = new Player(1, 'TestPlayer');
      player.kill('execution', 2);
      
      const result = player.kill('attack', 3);
      expect(result).toBe(false);
      expect(player.causeOfDeath).toBe('execution'); // Should retain original cause
      expect(player.deathTurn).toBe(2); // Should retain original turn
    });

    test('setRole() should assign role correctly', () => {
      const player = new Player(1, 'TestPlayer');
      
      // Test with string role
      const result1 = player.setRole('villager');
      expect(result1).toBe(true);
      expect(player.role).toBe('villager');
      
      // Test with object role
      const roleObj = { name: 'werewolf', team: 'werewolf' };
      const result2 = player.setRole(roleObj);
      expect(result2).toBe(true);
      expect(player.role).toEqual(roleObj);
    });

    test('setRole() should handle complex role objects', () => {
      const player = new Player(1, 'TestPlayer');
      
      // 複雑な役職オブジェクトを設定
      const complexRole = {
        name: 'werewolf',
        team: 'werewolf',
        abilities: ['attack', 'communicate'],
        metadata: { displayName: '人狼', description: '夜に人を襲撃できる' }
      };
      
      const result = player.setRole(complexRole);
      expect(result).toBe(true);
      expect(player.role).toEqual(complexRole);
    });

    test('setRole() should return false when player is dead', () => {
      const player = new Player(1, 'TestPlayer');
      player.kill('execution', 2);
      
      const result = player.setRole('villager');
      expect(result).toBe(false);
      expect(player.role).toBeNull(); // Role should not change
    });
  });

  describe('Status effect methods', () => {
    test('addStatusEffect() should add effect correctly', () => {
      const player = new Player(1, 'TestPlayer');
      const effect = { type: 'guarded', turn: 1, source: 2 };
      
      const result = player.addStatusEffect(effect);
      expect(result).toBe(true);
      expect(player.statusEffects).toContainEqual(effect);
    });

    test('addStatusEffect() should not add duplicate effect types', () => {
      const player = new Player(1, 'TestPlayer');
      const effect1 = { type: 'guarded', turn: 1, source: 2 };
      const effect2 = { type: 'guarded', turn: 1, source: 3 };
      
      player.addStatusEffect(effect1);
      const result = player.addStatusEffect(effect2);
      
      expect(result).toBe(false);
      expect(player.statusEffects.length).toBe(1);
      expect(player.statusEffects[0]).toEqual(effect1); // Should keep the first effect
    });

    test('addStatusEffect() should return false when player is dead', () => {
      const player = new Player(1, 'TestPlayer');
      player.kill('execution', 2);
      
      const effect = { type: 'guarded', turn: 3, source: 2 };
      const result = player.addStatusEffect(effect);
      
      expect(result).toBe(false);
      expect(player.statusEffects).toEqual([]);
    });

    test('removeStatusEffect() should remove effect correctly', () => {
      const player = new Player(1, 'TestPlayer');
      const effect = { type: 'guarded', turn: 1, source: 2 };
      
      player.addStatusEffect(effect);
      const result = player.removeStatusEffect('guarded');
      
      expect(result).toBe(true);
      expect(player.statusEffects).toEqual([]);
    });

    test('removeStatusEffect() should return false if effect not found', () => {
      const player = new Player(1, 'TestPlayer');
      const result = player.removeStatusEffect('guarded');
      
      expect(result).toBe(false);
    });

    test('hasStatusEffect() should detect effect correctly', () => {
      const player = new Player(1, 'TestPlayer');
      const effect = { type: 'guarded', turn: 1, source: 2 };
      
      player.addStatusEffect(effect);
      
      expect(player.hasStatusEffect('guarded')).toBe(true);
      expect(player.hasStatusEffect('poisoned')).toBe(false);
    });

    test('should manage multiple status effects correctly', () => {
      const player = new Player(1, 'TestPlayer');
      const effect1 = { type: 'guarded', turn: 1, source: 2 };
      const effect2 = { type: 'poisoned', turn: 1, source: 3 };
      const effect3 = { type: 'silenced', turn: 1, source: 4 };
      
      player.addStatusEffect(effect1);
      player.addStatusEffect(effect2);
      player.addStatusEffect(effect3);
      
      expect(player.statusEffects.length).toBe(3);
      expect(player.hasStatusEffect('guarded')).toBe(true);
      expect(player.hasStatusEffect('poisoned')).toBe(true);
      expect(player.hasStatusEffect('silenced')).toBe(true);
      
      // 特定のエフェクトを削除しても他は残る
      player.removeStatusEffect('poisoned');
      expect(player.statusEffects.length).toBe(2);
      expect(player.hasStatusEffect('poisoned')).toBe(false);
      expect(player.hasStatusEffect('guarded')).toBe(true);
      expect(player.hasStatusEffect('silenced')).toBe(true);
    });
  });
});
