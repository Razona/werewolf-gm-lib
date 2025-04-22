/**
 * GameManagerState テスト用フィクスチャ
 * テスト間で共通して使用するデータ構造を定義
 */

// 初期状態フィクスチャ
const initialState = {
  id: "game-12345",
  isStarted: false,
  isEnded: false,
  winner: null,
  winningPlayers: [],
  turn: 0,
  phase: null,
  players: [],
  roles: {},
  votes: [],
  actions: [],
  history: [],
  lastUpdate: 1620000000000,
  lastDeath: null
};

// ゲーム開始直後の状態
const startedGameState = {
  ...initialState,
  id: "game-12346",
  isStarted: true,
  turn: 1,
  phase: "night",
  players: [
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 1, name: "プレイヤー2", isAlive: true },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: true },
    { id: 4, name: "プレイヤー5", isAlive: true }
  ],
  roles: {
    list: ["villager", "villager", "villager", "werewolf", "seer"],
    distributed: true,
    distribution: {
      "0": "villager",
      "1": "villager",
      "2": "villager",
      "3": "werewolf",
      "4": "seer"
    }
  },
  lastUpdate: 1620001000000
};

// ゲーム進行中の状態
const progressGameState = {
  ...startedGameState,
  id: "game-12347",
  turn: 2,
  phase: "day",
  players: [
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 1, name: "プレイヤー2", isAlive: false, causeOfDeath: "attacked", deathTurn: 1 },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: true },
    { id: 4, name: "プレイヤー5", isAlive: true }
  ],
  lastDeath: { playerId: 1, cause: "attacked", turn: 1 },
  votes: {
    current: [],
    history: [
      {
        day: 1,
        votes: [
          { voter: 0, target: 3 },
          { voter: 1, target: 3 },
          { voter: 2, target: 0 },
          { voter: 3, target: 0 },
          { voter: 4, target: 3 }
        ],
        result: { executed: 3, count: 3 }
      }
    ]
  },
  actions: {
    pending: [],
    history: [
      {
        night: 1,
        actions: [
          { type: "fortune", actor: 4, target: 3, result: "werewolf" },
          { type: "attack", actor: 3, target: 1, result: "success" }
        ]
      }
    ]
  },
  history: [
    { turn: 1, phase: "night", events: ["game.start", "nightAction"] },
    { turn: 1, phase: "day", events: ["player.death"] }
  ],
  lastUpdate: 1620002000000
};

// ゲーム終了状態
const endedGameState = {
  ...progressGameState,
  id: "game-12348",
  isEnded: true,
  winner: "village",
  winningPlayers: [0, 2, 4],
  turn: 3,
  phase: "end",
  players: [
    { id: 0, name: "プレイヤー1", isAlive: true },
    { id: 1, name: "プレイヤー2", isAlive: false, causeOfDeath: "attacked", deathTurn: 1 },
    { id: 2, name: "プレイヤー3", isAlive: true },
    { id: 3, name: "プレイヤー4", isAlive: false, causeOfDeath: "execution", deathTurn: 2 },
    { id: 4, name: "プレイヤー5", isAlive: true }
  ],
  lastDeath: { playerId: 3, cause: "execution", turn: 2 },
  votes: {
    current: [],
    history: [
      {
        day: 1,
        votes: [
          { voter: 0, target: 3 },
          { voter: 1, target: 3 },
          { voter: 2, target: 0 },
          { voter: 3, target: 0 },
          { voter: 4, target: 3 }
        ],
        result: { executed: 3, count: 3 }
      },
      {
        day: 2,
        votes: [
          { voter: 0, target: 3 },
          { voter: 2, target: 3 },
          { voter: 3, target: 0 },
          { voter: 4, target: 3 }
        ],
        result: { executed: 3, count: 3 }
      }
    ]
  },
  actions: {
    pending: [],
    history: [
      {
        night: 1,
        actions: [
          { type: "fortune", actor: 4, target: 3, result: "werewolf" },
          { type: "attack", actor: 3, target: 1, result: "success" }
        ]
      },
      {
        night: 2,
        actions: [
          { type: "fortune", actor: 4, target: 0, result: "villager" }
        ]
      }
    ]
  },
  history: [
    { turn: 1, phase: "night", events: ["game.start", "nightAction"] },
    { turn: 1, phase: "day", events: ["player.death"] },
    { turn: 2, phase: "vote", events: ["vote"] },
    { turn: 2, phase: "night", events: ["player.death", "nightAction"] },
    { turn: 2, phase: "day", events: [] },
    { turn: 3, phase: "end", events: ["game.end"] }
  ],
  lastUpdate: 1620003000000
};

// 有効な保存データ
const validSaveData = {
  id: "save-123456",
  gameId: "game-12345",
  version: "1.0.0",
  timestamp: 1620002000000,
  state: { ...progressGameState },
  metadata: {
    createdAt: "2023-05-01T12:00:00Z",
    description: "テスト用保存データ"
  },
  checksum: "abc123def456" // 実際のチェックサムは計算される
};

// 不完全な保存データ（検証テスト用）
const invalidSaveData = {
  id: "save-invalid",
  gameId: "game-12345",
  // version欠落
  timestamp: 1620002000000,
  state: {
    // 必須フィールド欠落
    isStarted: true,
    turn: 2
  },
  metadata: {}
};

// 互換性のない保存データ
const incompatibleSaveData = {
  id: "save-incompatible",
  gameId: "game-12345",
  version: "99.0.0", // 互換性のないバージョン
  timestamp: 1620002000000,
  state: { ...progressGameState },
  metadata: {},
  checksum: "xyz789" // 不正なチェックサム
};

// 複雑なネスト構造を含む状態
const complexNestedState = {
  ...progressGameState,
  regulations: {
    votingRules: {
      allowSelfVote: false,
      tieBreaking: {
        method: "runoff",
        fallback: "random"
      }
    },
    actionRules: {
      guard: {
        allowConsecutive: false
      },
      fortune: {
        firstNight: "random_white"
      }
    }
  },
  options: {
    visibilityControl: {
      enabled: true,
      strictMode: false,
      settings: {
        roles: {
          showOnDeath: true
        }
      }
    }
  }
};

// 大規模プレイヤーデータを含む状態
const largePlayerState = {
  ...initialState,
  id: "game-large",
  players: Array(100).fill().map((_, i) => ({
    id: i,
    name: `プレイヤー${i}`,
    isAlive: i % 5 !== 0 // 20%のプレイヤーは死亡状態
  }))
};

// エクスポート
export default {
  initialState,
  startedGameState,
  progressGameState,
  endedGameState,
  validSaveData,
  invalidSaveData,
  incompatibleSaveData,
  complexNestedState,
  largePlayerState
};
