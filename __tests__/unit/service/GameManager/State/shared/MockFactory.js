/**
 * GameManagerState テスト用モックファクトリ
 * テスト中に必要なモックオブジェクトを生成
 */

/**
 * 基本的なEventSystemモックを作成
 * @returns {Object} EventSystemモック
 */
export function createEventSystemMock() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    hasListeners: jest.fn().mockReturnValue(false),
    listenerCount: jest.fn().mockReturnValue(0),
    eventNames: jest.fn().mockReturnValue([])
  };
}

/**
 * 基本的なErrorHandlerモックを作成
 * @returns {Object} ErrorHandlerモック
 */
export function createErrorHandlerMock() {
  return {
    createError: jest.fn((code, message, context) => {
      // Errorオブジェクトを生成
      const error = new Error(message);
      error.code = code;
      error.context = context;
      error.level = 'error'; // デフォルトレベル
      // 生成したエラーをスローするのではなく、返すように変更
      return error;
    }),
    handleError: jest.fn(),
    validateCondition: jest.fn(),
    setErrorPolicy: jest.fn(),
    policy: {
      throwLevel: 'error',
      logLevel: 'warning',
      emitEvents: true
    }
  };
}

/**
 * PlayerManagerモックを作成
 * @param {Object} options - カスタマイズオプション
 * @returns {Object} PlayerManagerモック
 */
export function createPlayerManagerMock(options = {}) {
  // モック内部でプレイヤーリストを保持
  let internalPlayers = options.initialPlayers || [
    { id: 0, name: 'プレイヤー0', isAlive: true, role: 'villager' },
    { id: 1, name: 'プレイヤー1', isAlive: true, role: 'werewolf' },
    ...(options.additionalPlayers || [])
  ];

  return {
    getPlayer: jest.fn((id) => internalPlayers.find(p => p.id === id) || null),
    getAllPlayers: jest.fn(() => [...internalPlayers]), // コピーを返す
    getAlivePlayers: jest.fn(() => internalPlayers.filter(p => p.isAlive)),
    isPlayerAlive: jest.fn((id) => {
      const player = internalPlayers.find(p => p.id === id);
      return player ? player.isAlive : false;
    }),
    getPlayerCount: jest.fn(() => internalPlayers.length),
    getAlivePlayerCount: jest.fn(() => internalPlayers.filter(p => p.isAlive).length),
    resetPlayers: jest.fn(() => {
      // 初期状態に戻す（オプションで指定されたもの、なければデフォルト）
      internalPlayers = options.initialPlayers || [
        { id: 0, name: 'プレイヤー0', isAlive: true, role: 'villager' },
        { id: 1, name: 'プレイヤー1', isAlive: true, role: 'werewolf' },
        ...(options.additionalPlayers || [])
      ];
    }),
    addPlayer: jest.fn((name, data = {}) => {
      const newId = data.id !== undefined ? data.id : (internalPlayers.length > 0 ? Math.max(...internalPlayers.map(p => p.id)) + 1 : 0);
      // IDの重複チェック
      if (internalPlayers.some(p => p.id === newId)) {
        console.warn(`Mock addPlayer: Player with ID ${newId} already exists.`);
        return internalPlayers.find(p => p.id === newId);
      }
      const newPlayer = {
        id: newId,
        name: name || `プレイヤー${newId}`,
        isAlive: data.isAlive !== undefined ? data.isAlive : true,
        role: data.role || null,
        statusEffects: data.statusEffects || [],
        causeOfDeath: data.causeOfDeath || null,
        deathTurn: data.deathTurn || null,
        ...data // 他のプロパティもマージ
      };
      internalPlayers.push(newPlayer);
      return newPlayer;
    }),
    removePlayer: jest.fn((id) => {
      internalPlayers = internalPlayers.filter(p => p.id !== id);
    }),
    updatePlayerState: jest.fn((id, updates) => {
      const playerIndex = internalPlayers.findIndex(p => p.id === id);
      if (playerIndex !== -1) {
        internalPlayers[playerIndex] = { ...internalPlayers[playerIndex], ...updates };
        // role がオブジェクトで渡された場合、モック内部では name だけ保持するなどの調整が必要かもしれない
        // ここではシンプルにマージする
      } else {
        console.warn(`Mock updatePlayerState: Player with ID ${id} not found.`);
      }
    }),
    restoreFromData: jest.fn((playersData) => { // 追加
      internalPlayers = playersData ? [...playersData] : [];
    })
  };
}

/**
 * RoleManagerモックを作成
 * @param {Object} options - カスタマイズオプション
 * @returns {Object} RoleManagerモック
 */
export function createRoleManagerMock(options = {}) {
  let internalRoleList = options.roleList || ['villager', 'werewolf', 'seer'];
  let internalDistribution = options.roleDistribution || {};
  let internalIsDistributed = options.isDistributed || false;

  return {
    getRoleInfo: jest.fn((playerId) => ({
      name: internalDistribution[playerId] || 'villager',
      // team の取得ロジックが必要なら追加
    })),
    getPlayerRole: jest.fn((playerId) => internalDistribution[playerId] || 'villager'),
    getPlayerTeam: jest.fn(), // 必要なら実装
    getRoleList: jest.fn().mockReturnValue([...internalRoleList]),
    isDistributed: jest.fn().mockReturnValue(internalIsDistributed),
    getRoleDistribution: jest.fn().mockReturnValue({ ...internalDistribution }),
    canUseAbility: jest.fn().mockReturnValue({ allowed: true }),
    setRoles: jest.fn((roleList) => { internalRoleList = [...roleList]; }),
    distributeRoles: jest.fn((distribution) => {
      internalDistribution = { ...distribution };
      internalIsDistributed = true;
    }),
    resetRoles: jest.fn(() => {
      internalRoleList = options.roleList || ['villager', 'werewolf', 'seer'];
      internalDistribution = options.roleDistribution || {};
      internalIsDistributed = options.isDistributed || false;
    }),
    restoreRoleDistribution: jest.fn((distribution) => { // restoreRoleDistributionも実装
      internalDistribution = distribution ? { ...distribution } : {};
      internalIsDistributed = Object.keys(internalDistribution).length > 0;
    }),
    restoreFromData: jest.fn((rolesData) => { // 追加
      internalRoleList = rolesData?.list ? [...rolesData.list] : [];
      internalDistribution = rolesData?.distribution ? { ...rolesData.distribution } : {};
      internalIsDistributed = rolesData?.distributed !== undefined ? rolesData.distributed : false;
    })
  };
}

/**
 * PhaseManagerモックを作成
 * @param {Object} options - カスタマイズオプション
 * @returns {Object} PhaseManagerモック
 */
export function createPhaseManagerMock(options = {}) {
  let internalCurrentPhase = options.currentPhase || { id: 'day', name: '昼フェーズ' };

  return {
    getCurrentPhase: jest.fn(() => internalCurrentPhase ? { ...internalCurrentPhase } : null),
    moveToNextPhase: jest.fn(),
    moveToPhase: jest.fn((phaseId) => { /* 実際のロジックはないが、設定は可能 */ }),
    getNextPhase: jest.fn(() => options.nextPhase || { id: 'vote', name: '投票フェーズ' }),
    isValidPhaseTransition: jest.fn().mockReturnValue(true),
    setCurrentPhase: jest.fn((phase) => {
      internalCurrentPhase = phase ? { ...phase } : null;
    }),
    resetPhase: jest.fn(() => { // resetPhaseも追加
      internalCurrentPhase = options.currentPhase || { id: 'day', name: '昼フェーズ' };
    }),
    restoreFromData: jest.fn((phaseData) => { // 追加
      internalCurrentPhase = phaseData ? { ...phaseData } : null;
    })
  };
}

/**
 * VoteManagerモックを作成（restoreFromData を追加）
 */
export function createVoteManagerMock(options = {}) {
  let internalCurrentVotes = [];
  let internalHistory = [];
  return {
    getCurrentVotes: jest.fn(() => [...internalCurrentVotes]),
    getVoteHistory: jest.fn(() => [...internalHistory]),
    registerVote: jest.fn((voterId, targetId, voteOptions = {}) => {
      if (!voteOptions.silent) {
        internalCurrentVotes.push({ voterId, targetId });
      }
    }),
    resetVotes: jest.fn(() => { internalCurrentVotes = []; internalHistory = []; }),
    finalizeVotes: jest.fn(() => {
      const result = { /* 投票結果のモック */ };
      internalHistory.push({ votes: [...internalCurrentVotes], result });
      internalCurrentVotes = [];
      return result;
    }),
    restoreHistory: jest.fn((history) => { internalHistory = history ? [...history] : []; }),
    restoreFromData: jest.fn((voteData) => { // 追加
      internalCurrentVotes = voteData?.current ? [...voteData.current] : [];
      internalHistory = voteData?.history ? [...voteData.history] : [];
    })
  };
}

/**
 * ActionManagerモックを作成（restoreFromData を追加）
 */
export function createActionManagerMock(options = {}) {
  let internalPendingActions = [];
  let internalHistory = [];
  return {
    getPendingActions: jest.fn(() => [...internalPendingActions]),
    getActionHistory: jest.fn(() => [...internalHistory]),
    registerAction: jest.fn((action, actionOptions = {}) => {
      if (!actionOptions.silent) {
        internalPendingActions.push({ ...action, id: `action-${Date.now()}` });
      }
    }),
    resetActions: jest.fn(() => { internalPendingActions = []; internalHistory = []; }),
    resolveActions: jest.fn(() => {
      const results = internalPendingActions.map(a => ({ ...a, success: true })); // 結果のモック
      internalHistory.push(...results);
      internalPendingActions = [];
      return results;
    }),
    restoreHistory: jest.fn((history) => { internalHistory = history ? [...history] : []; }),
    restoreFromData: jest.fn((actionData) => { // 追加
      internalPendingActions = actionData?.pending ? [...actionData.pending] : [];
      internalHistory = actionData?.history ? [...actionData.history] : [];
    })
  };
}

/**
 * 特定のテストシナリオ用のモックセットを作成
 * @param {string} scenario - シナリオ名 ('init', 'gameRunning', 'error', 'performance')
 * @param {Object} scenarioOptions - シナリオ固有のモックカスタマイズオプション
 * @returns {Object} モックセット
 */
export function createMockSet(scenario = 'init', scenarioOptions = {}) {
  // 基本的なモックを作成
  const mockEventSystem = createEventSystemMock();
  const mockErrorHandler = createErrorHandlerMock();

  // オプションから各マネージャーのオプションを取得
  const playerManagerOptions = scenarioOptions.playerManagerOptions || {};
  const roleManagerOptions = scenarioOptions.roleManagerOptions || {};
  const phaseManagerOptions = scenarioOptions.phaseManagerOptions || {};

  // シナリオ別の設定
  switch (scenario) {
    case 'init':
      return {
        eventSystem: mockEventSystem,
        errorHandler: mockErrorHandler,
        playerManager: createPlayerManagerMock(playerManagerOptions),
        roleManager: createRoleManagerMock(roleManagerOptions),
        phaseManager: createPhaseManagerMock(phaseManagerOptions)
      };

    case 'gameRunning':
      return {
        eventSystem: mockEventSystem,
        errorHandler: mockErrorHandler,
        playerManager: createPlayerManagerMock({
          playerCount: 7,
          alivePlayerCount: 5,
          additionalPlayers: [
            { id: 2, name: 'プレイヤー2', isAlive: true, role: 'seer' },
            { id: 3, name: 'プレイヤー3', isAlive: false, role: 'knight', causeOfDeath: 'execution', deathTurn: 2 },
            { id: 4, name: 'プレイヤー4', isAlive: false, role: 'villager', causeOfDeath: 'attack', deathTurn: 1 }
          ],
          ...playerManagerOptions // 個別オプションで上書き可能に
        }),
        roleManager: createRoleManagerMock({
          roleMap: { 0: 'villager', 1: 'werewolf', 2: 'seer', 3: 'knight', 4: 'villager' },
          teamMap: { 0: 'village', 1: 'werewolf', 2: 'village', 3: 'village', 4: 'village' },
          ...roleManagerOptions // 個別オプションで上書き可能に
        }),
        phaseManager: createPhaseManagerMock({
          currentPhase: { id: 'night', name: '夜フェーズ' },
          ...phaseManagerOptions // 個別オプションで上書き可能に
        })
      };

    case 'error':
      // エラーシナリオ用のモック設定
      const errorMocks = {
        eventSystem: mockEventSystem,
        errorHandler: mockErrorHandler,
        playerManager: createPlayerManagerMock(playerManagerOptions),
        roleManager: createRoleManagerMock(roleManagerOptions),
        phaseManager: createPhaseManagerMock(phaseManagerOptions)
      };

      // エラーが発生するモック動作を設定
      errorMocks.playerManager.getPlayer.mockImplementation(() => null);
      errorMocks.errorHandler.validateCondition.mockReturnValue(false);

      return errorMocks;

    case 'performance':
      // パフォーマンステスト用の大規模データを持つモック
      return {
        eventSystem: mockEventSystem,
        errorHandler: mockErrorHandler,
        playerManager: createPlayerManagerMock({
          playerCount: 100,
          alivePlayerCount: 80,
          additionalPlayers: Array(98).fill().map((_, i) => ({
            id: i + 2,
            name: `プレイヤー${i + 2}`,
            isAlive: i < 80,
            role: i % 5 === 0 ? 'werewolf' : 'villager'
          })),
          ...playerManagerOptions
        }),
        roleManager: createRoleManagerMock(roleManagerOptions),
        phaseManager: createPhaseManagerMock(phaseManagerOptions)
      };

    default:
      return {
        eventSystem: mockEventSystem,
        errorHandler: mockErrorHandler,
        playerManager: createPlayerManagerMock(playerManagerOptions),
        roleManager: createRoleManagerMock(roleManagerOptions),
        phaseManager: createPhaseManagerMock(phaseManagerOptions)
      };
  }
}

/**
 * GameManagerインスタンス用のモックを作成
 * @param {Object} mocks - 使用するモック群
 * @param {Object} state - 初期状態
 * @returns {Object} GameManagerモック
 */
export function createGameManagerMock(mocks = {}, state = {}) {
  // デフォルトのモックを用意
  const defaultMocks = createMockSet();
  const mergedMocks = { ...defaultMocks, ...mocks };

  // GameManagerの基本状態
  const defaultState = {
    id: 'game-mock-1',
    isStarted: false,
    isEnded: false,
    turn: 0,
    phase: null,
    players: [],
    roles: {
      list: [],
      distributed: false,
      distribution: {}
    },
    votes: {
      current: [],
      history: []
    },
    actions: {
      pending: [],
      history: []
    },
    winner: null,
    winningPlayers: [],
    winReason: null,
    regulations: {},
    options: {},
    startTime: null,
    endTime: null,
    lastUpdate: Date.now(),
    history: [],
    events: [],
    lastDeath: null
  };

  // GameManagerモック
  return {
    eventSystem: mergedMocks.eventSystem,
    errorHandler: mergedMocks.errorHandler,
    playerManager: mergedMocks.playerManager,
    roleManager: mergedMocks.roleManager,
    phaseManager: mergedMocks.phaseManager,
    state: { ...defaultState, ...state },
    options: {
      regulations: {},
      visibilityControl: {
        enabled: false
      }
    },

    // トランザクション関連のモックメソッド
    transaction: {
      active: false,
      snapshot: null,
      changes: [],
      timestamp: null,
      metadata: {}
    },
    beginTransaction: jest.fn(function () {
      this.transaction.active = true;
      this.transaction.timestamp = Date.now();
      this.transaction.changes = [];
      return true;
    }),
    commitTransaction: jest.fn(function () {
      this.transaction.active = false;
      return true;
    }),
    rollbackTransaction: jest.fn(function () {
      this.transaction.active = false;
      return true;
    }),

    // イベントリスナー関連のパススルーメソッド
    on: jest.fn(function (event, callback) {
      return this.eventSystem.on(event, callback);
    }),
    off: jest.fn(function (event, callback) {
      return this.eventSystem.off(event, callback);
    }),
    once: jest.fn(function (event, callback) {
      return this.eventSystem.once(event, callback);
    }),
    emit: jest.fn(function (event, data) {
      return this.eventSystem.emit(event, data);
    })
  };
}

export default {
  createEventSystemMock,
  createErrorHandlerMock,
  createPlayerManagerMock,
  createRoleManagerMock,
  createPhaseManagerMock,
  createMockSet,
  createGameManagerMock
};
