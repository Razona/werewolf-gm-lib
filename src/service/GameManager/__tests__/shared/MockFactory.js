/**
 * GameManagerState テスト用モックファクトリ
 * テストで必要なモックオブジェクトを一元的に管理・生成する
 */

// 基本的なEventSystemモック
const createEventSystemMock = () => ({
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  eventNames: jest.fn().mockReturnValue([]),
  listenerCount: jest.fn().mockReturnValue(0)
});

// 基本的なErrorHandlerモック
const createErrorHandlerMock = () => ({
  handleError: jest.fn(),
  createError: jest.fn().mockImplementation((code, message, context) => {
    const error = new Error(message);
    error.code = code;
    error.context = context;
    return error;
  }),
  setErrorPolicy: jest.fn(),
  validateOperation: jest.fn().mockReturnValue(true)
});

// PlayerManagerモック
const createPlayerManagerMock = () => ({
  addPlayer: jest.fn().mockImplementation((name, id = null) => {
    const playerId = id !== null ? id : Math.floor(Math.random() * 1000);
    return playerId;
  }),
  removePlayer: jest.fn().mockReturnValue(true),
  getPlayer: jest.fn().mockImplementation(id => ({
    id,
    name: `プレイヤー${id}`,
    isAlive: true
  })),
  getAllPlayers: jest.fn().mockReturnValue([
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 1, name: "プレイヤー2", isAlive: true },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: true },
    { id: 4, name: "プレイヤー5", isAlive: true }
  ]),
  getAlivePlayers: jest.fn().mockReturnValue([
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: true },
    { id: 4, name: "プレイヤー5", isAlive: true }
  ]),
  killPlayer: jest.fn().mockReturnValue(true),
  clear: jest.fn()
});

// RoleManagerモック
const createRoleManagerMock = () => ({
  setRoles: jest.fn().mockReturnValue(true),
  distributeRoles: jest.fn().mockReturnValue({
    "0": "villager",
    "1": "villager",
    "2": "villager",
    "3": "werewolf",
    "4": "seer"
  }),
  assignRole: jest.fn().mockReturnValue(true),
  getRoleInfo: jest.fn().mockImplementation(playerId => {
    const roles = {
      "0": { name: "villager", team: "village" },
      "1": { name: "villager", team: "village" },
      "2": { name: "villager", team: "village" },
      "3": { name: "werewolf", team: "werewolf" },
      "4": { name: "seer", team: "village" }
    };
    return roles[playerId] || null;
  }),
  getRoleList: jest.fn().mockReturnValue(["villager", "villager", "villager", "werewolf", "seer"]),
  isDistributed: jest.fn().mockReturnValue(true),
  getRoleDistribution: jest.fn().mockReturnValue({
    "0": "villager",
    "1": "villager",
    "2": "villager",
    "3": "werewolf",
    "4": "seer"
  })
});

// PhaseManagerモック
const createPhaseManagerMock = () => ({
  getCurrentPhase: jest.fn().mockReturnValue("night"),
  moveToNextPhase: jest.fn().mockReturnValue(true),
  moveToPhase: jest.fn().mockReturnValue(true),
  setPhase: jest.fn().mockReturnValue(true),
  getAllowedTransitions: jest.fn().mockReturnValue(["day", "vote"])
});

// VoteManagerモック
const createVoteManagerMock = () => ({
  registerVote: jest.fn().mockImplementation((voterId, targetId) => ({ voterId, targetId })),
  removeVote: jest.fn().mockReturnValue(true),
  countVotes: jest.fn().mockReturnValue({
    "0": 1,
    "3": 3,
    "4": 1
  }),
  executeVote: jest.fn().mockReturnValue({
    executed: 3,
    count: 3
  }),
  getCurrentVotes: jest.fn().mockReturnValue([
    { voter: 0, target: 3 },
    { voter: 1, target: 3 },
    { voter: 2, target: 0 },
    { voter: 3, target: 0 },
    { voter: 4, target: 3 }
  ]),
  getVoteHistory: jest.fn().mockReturnValue([])
});

// ActionManagerモック
const createActionManagerMock = () => ({
  registerAction: jest.fn().mockReturnValue(true),
  executeActions: jest.fn().mockReturnValue([
    { type: "fortune", actor: 4, target: 3, result: "werewolf" },
    { type: "attack", actor: 3, target: 1, result: "success" }
  ]),
  getActionResults: jest.fn().mockImplementation(playerId => {
    if (playerId === 4) {
      return [{ type: "fortune", target: 3, result: "werewolf" }];
    }
    return [];
  }),
  getPendingActions: jest.fn().mockReturnValue([]),
  getActionHistory: jest.fn().mockReturnValue([])
});

// VictoryManagerモック
const createVictoryManagerMock = () => ({
  checkWinCondition: jest.fn().mockReturnValue(null),
  getGameResult: jest.fn().mockReturnValue(null)
});

// すべてのモックを作成して返す
const createMockSet = () => ({
  eventSystem: createEventSystemMock(),
  errorHandler: createErrorHandlerMock(),
  playerManager: createPlayerManagerMock(),
  roleManager: createRoleManagerMock(),
  phaseManager: createPhaseManagerMock(),
  voteManager: createVoteManagerMock(),
  actionManager: createActionManagerMock(),
  victoryManager: createVictoryManagerMock()
});

// 成功シナリオ用のモック設定
const setupSuccessScenarioMocks = (mocks) => {
  // 成功シナリオ用のモック設定を行う
  mocks.errorHandler.validateOperation.mockReturnValue(true);
  mocks.playerManager.getPlayer.mockImplementation(id => ({
    id,
    name: `プレイヤー${id}`,
    isAlive: true
  }));
  mocks.roleManager.getRoleInfo.mockImplementation(playerId => {
    const roles = {
      "0": { name: "villager", team: "village" },
      "1": { name: "villager", team: "village" },
      "2": { name: "villager", team: "village" },
      "3": { name: "werewolf", team: "werewolf" },
      "4": { name: "seer", team: "village" }
    };
    return roles[playerId];
  });
};

// エラーシナリオ用のモック設定
const setupErrorScenarioMocks = (mocks, errorCode = 'VALIDATION_ERROR', errorMessage = 'バリデーションエラー') => {
  // エラーシナリオ用のモック設定
  mocks.errorHandler.validateOperation.mockReturnValue(false);
  mocks.errorHandler.createError.mockImplementation((code, message, context) => {
    const error = new Error(message || errorMessage);
    error.code = code || errorCode;
    error.context = context;
    return error;
  });
  
  // エラーを発生させるメソッド設定
  mocks.playerManager.getPlayer.mockImplementation(id => {
    if (id === 999) {
      throw new Error('プレイヤーが見つかりません');
    }
    return {
      id,
      name: `プレイヤー${id}`,
      isAlive: true
    };
  });
};

// パフォーマンステスト用のモック設定
const setupPerformanceTestMocks = (mocks, playerCount = 100) => {
  // 大量のプレイヤーデータを生成
  const largePlayers = Array(playerCount).fill().map((_, i) => ({
    id: i,
    name: `プレイヤー${i}`,
    isAlive: i % 5 !== 0 // 20%のプレイヤーは死亡状態
  }));
  
  mocks.playerManager.getAllPlayers.mockReturnValue(largePlayers);
  mocks.playerManager.getAlivePlayers.mockReturnValue(
    largePlayers.filter(p => p.isAlive)
  );
  
  // 大量の役職分布データを生成
  const largeRoleDistribution = {};
  largePlayers.forEach(p => {
    largeRoleDistribution[p.id] = p.id % 5 === 0 ? 'werewolf' : 'villager';
  });
  
  mocks.roleManager.getRoleDistribution.mockReturnValue(largeRoleDistribution);
};

// 統合テスト用のモックセット
const createIntegrationMockSet = () => {
  const mocks = createMockSet();
  
  // イベント伝播の連携設定
  mocks.eventSystem.emit.mockImplementation((eventName, data) => {
    // イベントに応じたモック反応を実装
    if (eventName === 'player.death') {
      // プレイヤー死亡時の処理
      const playerId = data.playerId;
      mocks.playerManager.getAllPlayers.mockImplementation(() => {
        const players = createPlayerManagerMock().getAllPlayers();
        const targetPlayer = players.find(p => p.id === playerId);
        if (targetPlayer) {
          targetPlayer.isAlive = false;
          targetPlayer.causeOfDeath = data.cause;
          targetPlayer.deathTurn = data.turn;
        }
        return players;
      });
      
      mocks.playerManager.getAlivePlayers.mockImplementation(() => {
        return mocks.playerManager.getAllPlayers().filter(p => p.isAlive);
      });
    }
    return true;
  });
  
  return mocks;
};

export default {
  createEventSystemMock,
  createErrorHandlerMock,
  createPlayerManagerMock,
  createRoleManagerMock,
  createPhaseManagerMock,
  createVoteManagerMock,
  createActionManagerMock,
  createVictoryManagerMock,
  createMockSet,
  setupSuccessScenarioMocks,
  setupErrorScenarioMocks,
  setupPerformanceTestMocks,
  createIntegrationMockSet
};
