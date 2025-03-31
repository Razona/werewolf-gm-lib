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

  describe('isValidPhase', () => {
    const allowedPhases = ['night', 'day', 'vote'];

    test('should return true for valid phases', () => {
      expect(utils.isValidPhase('night', allowedPhases)).toBe(true);
      expect(utils.isValidPhase('day', allowedPhases)).toBe(true);
    });

    test('should return false for invalid phases', () => {
      expect(utils.isValidPhase('evening', allowedPhases)).toBe(false);
      expect(utils.isValidPhase(123, allowedPhases)).toBe(false);
    });

    test('should validate string type only when no allowedPhases provided', () => {
      expect(utils.isValidPhase('any_phase')).toBe(true);
      expect(utils.isValidPhase(123)).toBe(false);
    });
  });

  describe('isValidAction', () => {
    const allowedActions = ['vote', 'attack', 'fortune'];

    test('should return true for valid actions', () => {
      expect(utils.isValidAction({ type: 'vote' }, allowedActions)).toBe(true);
      expect(utils.isValidAction({ type: 'attack', target: 1 }, allowedActions)).toBe(true);
    });

    test('should return false for invalid actions', () => {
      expect(utils.isValidAction({ type: 'heal' }, allowedActions)).toBe(false);
      expect(utils.isValidAction({ kind: 'vote' }, allowedActions)).toBe(false);
      expect(utils.isValidAction(null, allowedActions)).toBe(false);
    });
  });
});

describe('Collection utilities', () => {
  describe('filterAlivePlayers', () => {
    const players = [
      { id: 1, name: 'Player1', isAlive: true },
      { id: 2, name: 'Player2', isAlive: false },
      { id: 3, name: 'Player3', isAlive: true }
    ];

    test('should filter only alive players', () => {
      const result = utils.filterAlivePlayers(players);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });
  });

  describe('findPlayersByRole', () => {
    const players = [
      { id: 1, name: 'Player1', role: { name: 'villager' } },
      { id: 2, name: 'Player2', role: { name: 'werewolf' } },
      { id: 3, name: 'Player3', role: { name: 'villager' } }
    ];

    test('should find players with matching role', () => {
      const result = utils.findPlayersByRole(players, 'villager');
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    test('should return empty array when no matches', () => {
      const result = utils.findPlayersByRole(players, 'seer');
      expect(result.length).toBe(0);
    });
  });

  describe('countVotes', () => {
    const votes = [
      { voterId: 1, targetId: 3 },
      { voterId: 2, targetId: 3 },
      { voterId: 3, targetId: 1 },
      { voterId: 4, targetId: 2 }
    ];

    test('should count votes correctly', () => {
      const result = utils.countVotes(votes);
      expect(result[1]).toBe(1);
      expect(result[2]).toBe(1);
      expect(result[3]).toBe(2);
    });
  });
});

describe('Game logic utilities', () => {
  describe('distributeRoles', () => {
    const roles = ['villager', 'werewolf', 'seer'];
    const playerIds = [1, 2, 3, 4, 5];

    test('should distribute roles to all players', () => {
      const result = utils.distributeRoles(roles, playerIds);
      
      // All players should have a role
      expect(Object.keys(result).length).toBe(playerIds.length);
      
      // All players should be assigned a role from the roles array
      Object.values(result).forEach(role => {
        expect(roles.includes(role)).toBe(true);
      });
    });

    test('should cycle through roles when more players than roles', () => {
      const result = utils.distributeRoles(['villager', 'werewolf'], [1, 2, 3]);
      expect(Object.keys(result).length).toBe(3);
    });
  });

  describe('selectRandomTiedPlayer', () => {
    // This is hard to test deterministically because it's random
    // We can at least verify it returns one of the tied players
    test('should select one of the tied players', () => {
      const tiedPlayers = [1, 2, 3];
      const result = utils.selectRandomTiedPlayer(tiedPlayers);
      expect(tiedPlayers.includes(result)).toBe(true);
    });
  });

  describe('randomElement', () => {
    test('should return an element from the array', () => {
      const array = [1, 2, 3, 4, 5];
      const result = utils.randomElement(array);
      expect(array.includes(result)).toBe(true);
    });
  });
});

describe('Event utilities', () => {
  describe('parseEventName', () => {
    test('should split event name by dots', () => {
      expect(utils.parseEventName('game.start')).toEqual(['game', 'start']);
      expect(utils.parseEventName('phase.night.start')).toEqual(['phase', 'night', 'start']);
    });
  });

  describe('eventNameMatches', () => {
    test('should match exact event names', () => {
      expect(utils.eventNameMatches('game.start', 'game.start')).toBe(true);
    });

    test('should match with wildcards', () => {
      expect(utils.eventNameMatches('game.start', 'game.*')).toBe(true);
      expect(utils.eventNameMatches('phase.night.start', 'phase.*.*')).toBe(true);
    });

    test('should not match unrelated events', () => {
      expect(utils.eventNameMatches('game.start', 'game.end')).toBe(false);
      expect(utils.eventNameMatches('game.start', 'phase.*')).toBe(false);
    });

    test('should handle pattern longer than event name', () => {
      expect(utils.eventNameMatches('game', 'game.start')).toBe(false);
    });
  });
});
