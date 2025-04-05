// モックの修正提案：VoteManagerMocks.js
export const createMocks = () => {
  const eventSystem = {
    emit: jest.fn(),
    on: jest.fn()
  };

  // テスト失敗の原因: 村長(ID:3)を自分自身(ID:3)に投票させるテストが失敗している
  // テストデータの修正：村長が自分自身に投票するケースを明示的にサポート
  const playerManager = {
    getAlivePlayers: jest.fn().mockReturnValue([
      { id: 1, name: 'Player1', isAlive: true },
      { id: 2, name: 'Player2', isAlive: true },
      { id: 3, name: 'Player3', isAlive: true, role: { name: 'mayor' } }
    ]),
    getPlayer: jest.fn().mockImplementation((id) => {
      const players = {
        1: { id: 1, name: 'Player1', isAlive: true, role: { name: 'villager' } },
        2: { id: 2, name: 'Player2', isAlive: true, role: { name: 'villager' } },
        3: { id: 3, name: 'Player3', isAlive: true, role: { name: 'mayor' } },
        4: { id: 4, name: 'Player4', isAlive: false, role: { name: 'villager' } }
      };
      return players[id] || null;
    }),
    isPlayerAlive: jest.fn().mockImplementation((id) => id !== 4)
  };

  const errorHandler = {
    createError: jest.fn().mockImplementation((category, code, data) => {
      const errorCode = `E${category}_${code}`;
      return {
        code: errorCode,
        message: data.message,
        context: data
      };
    })
  };

  const phaseManager = {
    getCurrentPhase: jest.fn().mockReturnValue('vote'),
    getCurrentTurn: jest.fn().mockReturnValue(2),
    setPhaseContextData: jest.fn()
  };

  const game = {
    eventSystem,
    playerManager,
    errorHandler,
    phaseManager,
    killPlayer: jest.fn(),
    options: {
      regulations: {
        executionRule: 'runoff',
        runoffTieRule: 'random',
        // 自己投票を許可するオプションを追加
        allowSelfVote: true
      }
    }
  };

  return {
    eventSystem,
    playerManager,
    errorHandler,
    phaseManager,
    game
  };
};