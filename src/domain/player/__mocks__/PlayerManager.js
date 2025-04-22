/**
 * PlayerManager クラスのモック
 */

const mockPlayerManager = jest.fn().mockImplementation(() => {
  return {
    // プレイヤー管理
    addPlayer: jest.fn().mockImplementation(name => {
      return Math.floor(Math.random() * 100); // ランダムなID
    }),
    removePlayer: jest.fn().mockReturnValue(true),
    
    // プレイヤー情報取得
    getPlayer: jest.fn().mockImplementation(id => {
      if (id === 0) return { id: 0, name: 'Player1', isAlive: true };
      if (id === 1) return { id: 1, name: 'Player2', isAlive: true };
      return null;
    }),
    getAllPlayers: jest.fn().mockReturnValue([
      { id: 0, name: 'Player1', isAlive: true },
      { id: 1, name: 'Player2', isAlive: true }
    ]),
    getAlivePlayers: jest.fn().mockReturnValue([
      { id: 0, name: 'Player1', isAlive: true },
      { id: 1, name: 'Player2', isAlive: true }
    ]),
    
    // プレイヤー状態
    isPlayerAlive: jest.fn().mockReturnValue(true),
    killPlayer: jest.fn().mockReturnValue(true),
    
    // その他の機能
    getPlayerCount: jest.fn().mockReturnValue(2),
    getAlivePlayerCount: jest.fn().mockReturnValue(2),
    initialize: jest.fn(),
    reset: jest.fn()
  };
});

export default mockPlayerManager;
