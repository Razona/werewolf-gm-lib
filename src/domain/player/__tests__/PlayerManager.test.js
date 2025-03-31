/**
 * PlayerManager class tests
 */

describe('PlayerManager', () => {
  // Mocks
  const mockEventEmit = jest.fn();
  const mockEventSystem = {
    emit: mockEventEmit,
    on: jest.fn()
  };

  const mockErrorHandler = {
    handleError: jest.fn((errorCode, context) => {
      throw new Error(`${errorCode}: ${JSON.stringify(context)}`);
    })
  };

  // Import the PlayerManager class
  let PlayerManager;
  let Player;
  
  beforeEach(() => {
    // Clear the module cache between tests to ensure a fresh import
    jest.resetModules();
    jest.clearAllMocks();
    
    // モック呼び出し履歴もクリア
    if (mockEventEmit) mockEventEmit.mockClear();
    if (mockErrorHandler && mockErrorHandler.handleError) {
      mockErrorHandler.handleError.mockClear();
    }
    
    // Import the modules
    PlayerManager = require('../PlayerManager').PlayerManager;
    Player = require('../Player').Player;
  });

  describe('Initialization and Basic Setup', () => {
    test('should initialize with event system and error handler', () => {
      const manager = new PlayerManager(mockEventSystem, mockErrorHandler);
      expect(manager.eventSystem).toBe(mockEventSystem);
      expect(manager.errorHandler).toBe(mockErrorHandler);
      expect(manager.players).toBeInstanceOf(Map);
      expect(manager.nameToId).toBeInstanceOf(Map);
      expect(manager.nextId).toBe(0);
    });
  });

  describe('Player CRUD Operations', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PlayerManager(mockEventSystem, mockErrorHandler);
    });
    
    describe('Adding Players', () => {
      test('addPlayer() should add player and return id', () => {
        const id = manager.addPlayer('TestPlayer');
        
        expect(id).toBe(0); // First player gets id 0
        expect(manager.players.size).toBe(1);
        expect(manager.nameToId.get('TestPlayer')).toBe(0);
        
        const player = manager.players.get(0);
        expect(player).toBeInstanceOf(Player);
        expect(player.name).toBe('TestPlayer');
        
        expect(mockEventEmit).toHaveBeenCalledWith('player.add', {
          playerId: 0,
          name: 'TestPlayer'
        });
      });
      
      test('addPlayer() should increment ids for multiple players', () => {
        const id1 = manager.addPlayer('Player1');
        const id2 = manager.addPlayer('Player2');
        
        expect(id1).toBe(0);
        expect(id2).toBe(1);
        expect(manager.players.size).toBe(2);
        expect(manager.nextId).toBe(2);
      });
      
      test('should throw error with detailed context for duplicate player', () => {
        manager.addPlayer('DuplicatePlayer');
        
        try {
          manager.addPlayer('DuplicatePlayer');
          fail('Expected error was not thrown');
        } catch (error) {
          // エラーメッセージだけでなくコンテキストもチェック
          expect(error.message).toMatch(/PLAYER.DUPLICATE_PLAYER/);
          expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
            'PLAYER.DUPLICATE_PLAYER',
            expect.objectContaining({
              name: 'DuplicatePlayer',
              existingId: expect.any(Number)
            })
          );
        }
      });
      
      test('addPlayer() should throw error for invalid names', () => {
        expect(() => {
          manager.addPlayer('');
        }).toThrow(/VALIDATION.INVALID_PARAMETER/);
        
        expect(() => {
          manager.addPlayer(null);
        }).toThrow(/VALIDATION.INVALID_PARAMETER/);
      });
    });
    
    describe('Retrieving Players', () => {  
      test('getPlayer() should return player by id', () => {
        const id = manager.addPlayer('TestPlayer');
        const player = manager.getPlayer(id);
        
        expect(player).toBeInstanceOf(Player);
        expect(player.name).toBe('TestPlayer');
      });
      
      test('getPlayer() should return null for non-existent player', () => {
        const player = manager.getPlayer(999);
        expect(player).toBeNull();
      });
      
      test('getPlayerByName() should return player by name', () => {
        manager.addPlayer('NamedPlayer');
        const player = manager.getPlayerByName('NamedPlayer');
        
        expect(player).toBeInstanceOf(Player);
        expect(player.name).toBe('NamedPlayer');
      });
      
      test('getPlayerByName() should return null for non-existent name', () => {
        const player = manager.getPlayerByName('NonExistent');
        expect(player).toBeNull();
      });
    });
    
    describe('Removing Players', () => {
      test('removePlayer() should remove player correctly', () => {
        const id = manager.addPlayer('RemoveMe');
        const result = manager.removePlayer(id);
        
        expect(result).toBe(true);
        expect(manager.players.has(id)).toBe(false);
        expect(manager.nameToId.has('RemoveMe')).toBe(false);
        
        expect(mockEventEmit).toHaveBeenCalledWith('player.remove', {
          playerId: id,
          name: 'RemoveMe'
        });
      });
      
      test('removePlayer() should throw error for non-existent player', () => {
        expect(() => {
          manager.removePlayer(999);
        }).toThrow(/PLAYER.PLAYER_NOT_FOUND/);
      });
    });
  });

  describe('Player State Management', () => {
    let manager;
    let playerId;
    
    beforeEach(() => {
      manager = new PlayerManager(mockEventSystem, mockErrorHandler);
      playerId = manager.addPlayer('StatusPlayer');
      mockEventEmit.mockClear(); // Clear previous calls from addPlayer
    });
    
    test('killPlayer() should set player to dead state', () => {
      const result = manager.killPlayer(playerId, 'execution', 2);
      
      expect(result).toBe(true);
      
      const player = manager.getPlayer(playerId);
      expect(player.isAlive).toBe(false);
      expect(player.causeOfDeath).toBe('execution');
      expect(player.deathTurn).toBe(2);
      
      expect(mockEventEmit).toHaveBeenCalledWith('player.death', {
        playerId,
        name: 'StatusPlayer',
        cause: 'execution',
        turn: 2
      });
    });
    
    test('killPlayer() should throw error for non-existent player', () => {
      expect(() => {
        manager.killPlayer(999, 'execution', 2);
      }).toThrow(/PLAYER.PLAYER_NOT_FOUND/);
    });
    
    test('assignRole() should assign role to player', () => {
      const result = manager.assignRole(playerId, 'villager');
      
      expect(result).toBe(true);
      
      const player = manager.getPlayer(playerId);
      expect(player.role).toBe('villager');
      
      expect(mockEventEmit).toHaveBeenCalledWith('player.role.assign', {
        playerId,
        name: 'StatusPlayer',
        role: 'villager'
      });
    });

    test('should handle complex role objects', () => {
      mockEventEmit.mockClear();
      
      // 複雑な役職オブジェクトを設定
      const complexRole = {
        name: 'werewolf',
        team: 'werewolf',
        abilities: ['attack', 'communicate'],
        metadata: { displayName: '人狼', description: '夜に人を襲撃できる' }
      };
      
      manager.assignRole(playerId, complexRole);
      
      // 役職が正しく設定されたか
      const player = manager.getPlayer(playerId);
      expect(player.role).toEqual(complexRole);
      
      // 正しいイベントが発火されたか
      expect(mockEventEmit).toHaveBeenCalledWith('player.role.assign', {
        playerId,
        name: 'StatusPlayer',
        role: complexRole
      });
    });
    
    test('assignRole() should throw error for non-existent player', () => {
      expect(() => {
        manager.assignRole(999, 'villager');
      }).toThrow(/PLAYER.PLAYER_NOT_FOUND/);
    });
  });

  describe('Player Querying Operations', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PlayerManager(mockEventSystem, mockErrorHandler);
      manager.addPlayer('Player1'); // id: 0
      manager.addPlayer('Player2'); // id: 1
      manager.addPlayer('Player3'); // id: 2
      
      manager.assignRole(0, 'villager');
      manager.assignRole(1, 'werewolf');
      manager.assignRole(2, 'villager');
      
      manager.killPlayer(1, 'execution', 1);
    });
    
    test('getAllPlayers() should return all players', () => {
      const players = manager.getAllPlayers();
      
      expect(players.length).toBe(3);
      expect(players[0].name).toBe('Player1');
      expect(players[1].name).toBe('Player2');
      expect(players[2].name).toBe('Player3');
    });
    
    test('getAlivePlayers() should return only alive players', () => {
      const players = manager.getAlivePlayers();
      
      expect(players.length).toBe(2);
      expect(players[0].name).toBe('Player1');
      expect(players[1].name).toBe('Player3');
    });
    
    test('getPlayersByRole() should return players with matching role', () => {
      const villagers = manager.getPlayersByRole('villager');
      
      expect(villagers.length).toBe(2);
      expect(villagers[0].name).toBe('Player1');
      expect(villagers[1].name).toBe('Player3');
      
      const werewolves = manager.getPlayersByRole('werewolf');
      expect(werewolves.length).toBe(1);
      expect(werewolves[0].name).toBe('Player2');
    });
    
    test('getPlayersByRole() should return empty array for non-matching role', () => {
      const nonExistentRole = manager.getPlayersByRole('seer');
      expect(nonExistentRole).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PlayerManager(mockEventSystem, mockErrorHandler);
    });

    test('should handle cascading error scenarios', () => {
      // 存在しないプレイヤーへの一連の操作
      expect(() => manager.getPlayer(999)).not.toThrow(); // nullを返すべき
      expect(() => manager.removePlayer(999)).toThrow(/PLAYER.PLAYER_NOT_FOUND/);
      expect(() => manager.killPlayer(999, 'execution')).toThrow(/PLAYER.PLAYER_NOT_FOUND/);
      expect(() => manager.assignRole(999, 'villager')).toThrow(/PLAYER.PLAYER_NOT_FOUND/);
      
      // 死亡したプレイヤーへの連続操作
      const id = manager.addPlayer('DeadOperationsPlayer');
      manager.killPlayer(id, 'execution', 1);
      
      // 死亡プレイヤーへの役職割り当てはエラーを発生させるはず
      expect(() => manager.assignRole(id, 'villager')).toThrow(/PLAYER.DEAD_PLAYER_ACTION/);
    });
  });

  describe('Event Emissions', () => {
    let manager;
    
    beforeEach(() => {
      manager = new PlayerManager(mockEventSystem, mockErrorHandler);
      mockEventEmit.mockClear();
    });

    test('should emit events with correct data and order', () => {
      // プレイヤー追加
      const playerId = manager.addPlayer('EventTestPlayer');
      expect(mockEventEmit).toHaveBeenNthCalledWith(1, 'player.add', {
        playerId,
        name: 'EventTestPlayer'
      });
      
      // 役職割り当て
      mockEventEmit.mockClear();
      manager.assignRole(playerId, 'villager');
      expect(mockEventEmit).toHaveBeenNthCalledWith(1, 'player.role.assign', {
        playerId,
        name: 'EventTestPlayer',
        role: 'villager'
      });
      
      // プレイヤー死亡処理
      mockEventEmit.mockClear();
      manager.killPlayer(playerId, 'execution', 2);
      expect(mockEventEmit).toHaveBeenNthCalledWith(1, 'player.death', {
        playerId,
        name: 'EventTestPlayer',
        cause: 'execution',
        turn: 2
      });
    });
  });
});
