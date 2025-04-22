/**
 * GameManagerState テスト用フィクスチャ
 * 標準的なテスト用データ構造を提供
 */

// 初期状態フィクスチャ（ゲーム開始前の状態）
export const initialState = {
  id: "game-test-1",
  version: "1.0.0",
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

// ゲーム開始状態フィクスチャ（基本的なゲーム開始直後の状態）
export const startedGameState = {
  ...initialState,
  id: "game-test-2",
  isStarted: true,
  turn: 1,
  phase: "preparation",
  players: [
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 1, name: "プレイヤー2", isAlive: true },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: true },
    { id: 4, name: "プレイヤー5", isAlive: true }
  ],
  roles: {
    list: ["villager", "villager", "werewolf", "seer", "knight"],
    distributed: true,
    distribution: {
      0: "villager",
      1: "villager",
      2: "werewolf",
      3: "seer",
      4: "knight"
    }
  },
  startTime: Date.now() - 1000,
  lastUpdate: Date.now()
};

// ゲーム進行中状態フィクスチャ（数ターン進行した中間状態）
export const progressGameState = {
  ...startedGameState,
  id: "game-test-3",
  turn: 3,
  phase: "night",
  players: [
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 1, name: "プレイヤー2", isAlive: false, causeOfDeath: "execution", deathTurn: 2 },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: true },
    { id: 4, name: "プレイヤー5", isAlive: false, causeOfDeath: "attack", deathTurn: 2 }
  ],
  actions: {
    pending: [
      { id: "action-1", type: "fortune", actor: 3, target: 2, night: 3 }
    ],
    history: [
      { id: "action-0", type: "fortune", actor: 3, target: 0, night: 1, result: { team: "village" } },
      { id: "action-0", type: "guard", actor: 4, target: 3, night: 1, result: { success: true } },
      { id: "action-0", type: "attack", actor: 2, target: 3, night: 1, result: { success: false, reason: "guarded" } },
      { id: "action-0", type: "fortune", actor: 3, target: 2, night: 2, result: { team: "werewolf" } },
      { id: "action-0", type: "attack", actor: 2, target: 4, night: 2, result: { success: true } }
    ]
  },
  votes: {
    current: [],
    history: [
      {
        day: 2,
        votes: [
          { voter: 0, target: 1 },
          { voter: 2, target: 1 },
          { voter: 3, target: 1 },
          { voter: 4, target: 0 },
          { voter: 1, target: 0 }
        ],
        result: { executed: 1, count: 3 }
      }
    ]
  },
  history: [
    { turn: 1, phase: "preparation", events: [], summary: "ゲーム開始" },
    { turn: 1, phase: "night", events: [], summary: "初日夜" },
    { turn: 2, phase: "day", events: [], summary: "2日目昼" },
    { turn: 2, phase: "vote", events: [], summary: "2日目投票" },
    { turn: 2, phase: "night", events: [], summary: "2日目夜" }
  ],
  events: [
    { type: "playerDeath", turn: 2, playerId: 1, cause: "execution" },
    { type: "playerDeath", turn: 2, playerId: 4, cause: "attack" }
  ],
  lastDeath: { playerId: 4, cause: "attack", turn: 2 }
};

// ゲーム終了状態フィクスチャ（勝敗が決定した終了状態）
export const endedGameState = {
  ...progressGameState,
  id: "game-test-4",
  isEnded: true,
  turn: 4,
  phase: "end",
  players: [
    { id: 0, name: "プレイヤー1", isAlive: false, causeOfDeath: "attack", deathTurn: 3 },
    { id: 1, name: "プレイヤー2", isAlive: false, causeOfDeath: "execution", deathTurn: 2 },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: false, causeOfDeath: "attack", deathTurn: 3 },
    { id: 4, name: "プレイヤー5", isAlive: false, causeOfDeath: "attack", deathTurn: 2 }
  ],
  winner: "werewolf",
  winningPlayers: [2],
  winReason: "村人陣営全滅",
  endTime: Date.now(),
  lastUpdate: Date.now()
};

// 複雑なネスト構造を持つ状態
export const complexNestedState = {
  ...startedGameState,
  id: "game-test-complex",
  nestedStructure: {
    level1: {
      level2: {
        level3: {
          data: "ネストデータ"
        },
        array: [1, 2, 3, { nestedInArray: "配列内のオブジェクト" }]
      },
      siblingData: "兄弟データ"
    },
    array: [
      { id: 1, data: "配列アイテム1" },
      { id: 2, data: "配列アイテム2", nested: { deepData: "深いデータ" } }
    ]
  }
};

// 保存データのフィクスチャ
export const validSaveData = {
  id: "save-test-1",
  gameId: "game-test-2",
  version: "1.0.0",
  timestamp: Date.now(),
  state: startedGameState,
  metadata: {
    createdBy: "system",
    description: "テスト用保存データ",
    tags: ["test"]
  },
  checksum: "test-checksum-1234"
};

// 別バージョンの保存データ
export const oldVersionSaveData = {
  ...validSaveData,
  id: "save-test-2",
  version: "0.9.0",
  state: {
    ...startedGameState,
    // 旧バージョン特有のフィールド
    oldField: "旧バージョンデータ"
  }
};

// 不完全な保存データ（検証失敗用）
export const incompleteSaveData = {
  id: "save-test-3",
  version: "1.0.0",
  // state フィールドが欠けている
  timestamp: Date.now(),
  metadata: {}
};

export default {
  initialState,
  startedGameState,
  progressGameState,
  endedGameState,
  complexNestedState,
  validSaveData,
  oldVersionSaveData,
  incompleteSaveData
};
