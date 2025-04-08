// RoleManagerTestSetup.js
import { RoleManager } from '../../manager';
import { Role } from '../../Role';
import { Village } from '../../Village';
import { Werewolf } from '../../Werewolf';
import { Fox } from '../../Fox';
import { Mason } from '../../Mason';
import { Heretic } from '../../Heretic';
import { Seer } from '../../Seer';

test('dummy test to avoid Jest warnings', () => {
  expect(true).toBe(true);
});


// モックロールクラス
export class MockVillager extends Village {
  constructor(game) {
    super(game);
    this.name = 'villager';
    this.displayName = '村人';
    this.team = 'village';
    this.isAlive = true;
    this.state = {};
    this.applyEffects = jest.fn(); // テスト用にjest.fnを追加
  }
}

export class MockWerewolf extends Werewolf {
  constructor(game) {
    super(game);
    this.name = 'werewolf';
    this.displayName = '人狼';
    this.team = 'werewolf';
    this.isAlive = true;
    this.state = {};
    this.applyEffects = jest.fn(); // テスト用にjest.fnを追加
  }
}

export class MockSeer extends Village {
  constructor(game) {
    super(game);
    this.name = 'seer';
    this.displayName = '占い師';
    this.team = 'village';
    this.isAlive = true;
    this.state = {};
    this.applyEffects = jest.fn(); // テスト用にjest.fnを追加
  }
}

export class MockFox extends Role {
  constructor(game) {
    super(game);
    this.name = 'fox';
    this.displayName = '妖狐';
    this.team = 'fox';
    this.isAlive = true;
    this.state = {};
    this.applyEffects = jest.fn(); // テスト用にjest.fnを追加
  }
}

export class MockHeretic extends Role {
  constructor(game) {
    super(game);
    this.name = 'heretic';
    this.displayName = '背徳者';
    this.team = 'fox';
    this.isAlive = true;
    this.state = {};
    this.applyEffects = jest.fn(); // テスト用にjest.fnを追加
  }
}

export class MockMason extends Village {
  constructor(game) {
    super(game);
    this.name = 'mason';
    this.displayName = '共有者';
    this.team = 'village';
    this.isAlive = true;
    this.state = {};
    this.applyEffects = jest.fn(); // テスト用にjest.fnを追加
  }
}

// テスト用のセットアップ関数
export function setupMocks() {
  // イベントシステムモック
  const mockEvents = {};
  const mockEventSystem = {
    on: jest.fn((eventName, callback) => {
      if (!mockEvents[eventName]) {
        mockEvents[eventName] = [];
      }
      mockEvents[eventName].push(callback);
      return true;
    }),
    emit: jest.fn((eventName, data) => {
      const handlers = mockEvents[eventName] || [];
      handlers.forEach(handler => handler(data));
      return true;
    }),
    off: jest.fn((eventName, callback) => {
      if (mockEvents[eventName]) {
        mockEvents[eventName] = mockEvents[eventName].filter(handler => handler !== callback);
      }
      return true;
    })
  };

  const mockErrorHandler = {
    handleError: jest.fn(),
    createError: jest.fn(code => ({ code, message: `Error: ${code}` }))
  };

  const mockRandom = jest.fn(() => 0.5); // 固定した乱数を返す

  const mockGame = {
    playerManager: {
      getPlayer: jest.fn(id => {
        if (id === 999) return null; // 特殊なケース: ID 999は無効なプレイヤー
        return { id, name: `Player${id}`, isAlive: true };
      }),
      hasPlayer: jest.fn(id => id !== 999), // ID 999以外は有効なプレイヤーとして扱う
      getAlivePlayers: jest.fn(() => [
        { id: 0, name: 'Player0', isAlive: true },
        { id: 1, name: 'Player1', isAlive: true },
        { id: 2, name: 'Player2', isAlive: true }
      ]),
      getAllPlayers: jest.fn(() => [
        { id: 0, name: 'Player0', isAlive: true },
        { id: 1, name: 'Player1', isAlive: true },
        { id: 2, name: 'Player2', isAlive: true }
      ])
    },
    options: {
      regulations: {}
    }
  };

  return { mockEventSystem, mockErrorHandler, mockRandom, mockGame, mockEvents };
}

// RoleManager インスタンスを作成
export function createRoleManager() {
  const { mockEventSystem, mockErrorHandler, mockRandom, mockGame, mockEvents } = setupMocks();

  // RoleManagerのインスタンス作成
  const roleManager = new RoleManager(mockEventSystem, mockErrorHandler);

  // ゲームオブジェクトの参照を設定
  roleManager.game = mockGame;

  // ランダム関数をモックに置き換え
  roleManager.random = mockRandom;

  // mockEventsをRoleManagerに追加（テスト用）
  roleManager._mockEvents = mockEvents;

  // roleInstancesをMap型で初期化
  roleManager.roleInstances = new Map();

  // roleRegistryはgetterなので直接設定しない
  // 代わりにregisterRoleを使って登録する

  // TeamManagerのteamsマップを初期化
  if (roleManager.teamManager) {
    roleManager.teamManager.teams = new Map();
    roleManager.teamManager.teams.set('village', {
      name: 'village',
      displayName: '村人陣営',
      winCondition: 'eliminateWerewolves'
    });
    roleManager.teamManager.teams.set('werewolf', {
      name: 'werewolf',
      displayName: '人狼陣営',
      winCondition: 'eliminateVillagers'
    });
    roleManager.teamManager.teams.set('fox', {
      name: 'fox',
      displayName: '妖狐陣営',
      winCondition: 'survive'
    });
    roleManager.teamManager.roleManager = roleManager;
    roleManager.teamManager.game = mockGame;
  }

  // validateRoleDependenciesなどのメソッドをスパイに置き換えるのではなく、
  // テスト時に結果をモニターできるようにするためにspyOnを使用
  jest.spyOn(roleManager, 'validateRoleDependencies');
  jest.spyOn(roleManager, 'validateRoleBalance');

  // setupEventListenersを呼び出して初期化
  roleManager.setupEventListeners();

  // イベントリスナーを手動で設定（テスト用）
  mockEvents['player.death'] = [roleManager.handlePlayerDeath.bind(roleManager)];
  mockEvents['player.died'] = [roleManager.handlePlayerDeath.bind(roleManager)];
  mockEvents['phase.start.*'] = [roleManager.handlePhaseStart.bind(roleManager)];
  mockEvents['game.start'] = [roleManager.handleGameStart.bind(roleManager)];

  // モックの設定を返す
  return {
    roleManager,
    mockEventSystem,
    mockErrorHandler,
    mockRandom,
    mockGame,
    mockEvents
  };
}

// 標準役職を登録
export function setupStandardRoles(roleManager) {
  roleManager.registerRole('villager', MockVillager);
  roleManager.registerRole('werewolf', MockWerewolf);
  roleManager.registerRole('seer', MockSeer);
  roleManager.registerRole('fox', MockFox);
  roleManager.registerRole('heretic', MockHeretic);
  roleManager.registerRole('mason', MockMason);
  return roleManager;
}

// 役職配布のセットアップ
export function setupRoleDistribution(playerIds, roleList) {
  const { roleManager, mockEventSystem, mockErrorHandler, mockRandom, mockGame, mockEvents } = createRoleManager();
  setupStandardRoles(roleManager);
  mockEventSystem.emit.mockClear();
  return { roleManager, mockEventSystem, mockErrorHandler, mockGame, playerIds, roleList, mockEvents };
}

// 役職割り当てのセットアップ
export function setupRoleAssignments(assignments) {
  const { roleManager, mockEventSystem, mockErrorHandler, mockGame, mockEvents } = createRoleManager();
  setupStandardRoles(roleManager);

  // ゲームオブジェクトの参照を明示的に設定
  roleManager.game = mockGame;

  // mockGameをmockGameとしても設定（テスト互換性のため）
  roleManager.mockGame = mockGame;

  // 実際のインスタンスを作るのではなく、モックのインスタンスを直接作成
  assignments.forEach(({ playerId, roleName }) => {
    let roleInstance;

    // 役職名に応じて適切なクラスのインスタンスを作成
    switch (roleName) {
      case 'villager':
        roleInstance = new MockVillager(mockGame);
        break;
      case 'werewolf':
        roleInstance = new MockWerewolf(mockGame);
        break;
      case 'seer':
        roleInstance = new MockSeer(mockGame);
        break;
      case 'fox':
        roleInstance = new MockFox(mockGame);
        break;
      case 'heretic':
        roleInstance = new MockHeretic(mockGame);
        break;
      case 'mason':
        roleInstance = new MockMason(mockGame);
        break;
      default:
        roleInstance = new MockVillager(mockGame);
    }

    // 共通のプロパティを設定
    roleInstance.playerId = playerId;
    roleInstance.setReference = jest.fn();
    roleInstance.onGameStart = jest.fn();
    roleInstance.onPhaseStart = jest.fn();
    roleInstance.onDeath = jest.fn();
    roleInstance.onTargeted = jest.fn();
    roleInstance.onTurnEnd = jest.fn();
    roleInstance.updateState = jest.fn();

    // applyEffectsを必ず追加
    roleInstance.applyEffects = jest.fn();

    // roleInstancesマップに追加
    roleManager.roleInstances.set(playerId, roleInstance);

    // イベント発行（割り当て通知）
    mockEventSystem.emit('role.assigned', {
      playerId,
      roleName,
      role: roleInstance
    });
  });

  mockEventSystem.emit.mockClear();
  return { roleManager, mockEventSystem, mockErrorHandler, mockGame, mockEvents };
}

// テスト互換性のための関数を追加
export function setupRoleDistributionWithGameWin() {
  const setup = setupRoleDistribution([0, 1, 2], ['villager', 'werewolf', 'seer']);

  // ゲーム勝利処理をモック
  setup.roleManager.processWinCondition = jest.fn().mockImplementation((teamId) => {
    // チーム勝利イベントを発行
    setup.mockEventSystem.emit('team.victory', {
      teamId,
      reason: 'テスト用勝利条件'
    });

    // ゲーム勝利イベントを発行
    setup.mockEventSystem.emit('game.win', {
      team: teamId,
      reason: 'テスト用勝利条件'
    });

    // ゲーム終了イベントも発行
    setup.mockEventSystem.emit('game.end', {
      winner: teamId,
      reason: 'テスト用勝利条件'
    });

    return {
      satisfied: true,
      reason: 'テスト用勝利条件'
    };
  });

  setup.roleManager.getWinningTeam = jest.fn().mockReturnValue({
    team: 'village',
    reason: 'テスト用勝利条件'
  });

  return setup;
}

// getVisibleRolesの修正バージョン（GMビュー用）
export function getGMView(roleManager) {
  const result = [];

  // すべての役職を返す（GM視点）
  roleManager.roleInstances.forEach((role, playerId) => {
    result.push({
      playerId,
      name: role.name,
      displayName: role.displayName || role.name,
      team: role.team
    });
  });

  return result;
}