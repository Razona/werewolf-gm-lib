// RoleManager.init.test.js
import { createRoleManager } from './setup/RoleManagerTestSetup';
import { RoleManager } from '../manager/RoleManager';

// モック
jest.mock('../../../core/event/EventSystem');
jest.mock('../../../core/error/ErrorHandler');

describe('RoleManager Initialization', () => {
  let roleManager, mockEventSystem, mockErrorHandler, mockRandom, mockGame;

  beforeEach(() => {
    const setup = createRoleManager();
    roleManager = setup.roleManager;
    mockEventSystem = setup.mockEventSystem;
    mockErrorHandler = setup.mockErrorHandler;
    mockRandom = setup.mockRandom;
    mockGame = setup.mockGame;
  });

  test('should initialize with event system and error handler', () => {
    expect(roleManager.eventSystem).toBe(mockEventSystem);
    expect(roleManager.errorHandler).toBe(mockErrorHandler);
    expect(roleManager.random).toBe(mockRandom);
  });

  test('should initialize event listeners', () => {
    // イベントリスナーの登録を確認
    expect(mockEventSystem.on).toHaveBeenCalledWith('player.death', expect.any(Function));
    expect(mockEventSystem.on).toHaveBeenCalledWith('phase.start.*', expect.any(Function));
    expect(mockEventSystem.on).toHaveBeenCalledWith('game.start', expect.any(Function));
  });

  test('should initialize with default visibility rules', () => {
    expect(roleManager.visibilityRules).toBeDefined();
    expect(roleManager.visibilityRules.revealRoleOnDeath).toBeDefined();
  });

  test('should initialize with standard teams', () => {
    expect(roleManager.teamRegistry.has('village')).toBe(true);
    expect(roleManager.teamRegistry.has('werewolf')).toBe(true);
    expect(roleManager.teamRegistry.has('fox')).toBe(true);
  });

  test('should initialize role registry and instances map', () => {
    expect(roleManager.roleRegistry).toBeDefined();
    expect(roleManager.roleRegistry instanceof Map).toBe(true);
    expect(roleManager.roleInstances).toBeDefined();
    expect(roleManager.roleInstances instanceof Map).toBe(true);
  });

  test('should initialize with role distribution flag set to false', () => {
    expect(roleManager.roleDistributed).toBe(false);
  });

  test('should correctly set game reference', () => {
    expect(roleManager.game).toBe(mockGame);
  });

  test('should use default random function if none provided', () => {
    // ランダム関数を指定せずに初期化
    const { mockEventSystem, mockErrorHandler } = setupMocks();
    const roleManagerWithoutRandom = new RoleManager(mockEventSystem, mockErrorHandler);

    // デフォルトのランダム関数はMath.randomに基づくはず
    expect(roleManagerWithoutRandom.random).toBeDefined();
    expect(typeof roleManagerWithoutRandom.random).toBe('function');
  });
});

// 追加のモックのみ、このテストファイル用に独自に定義
function setupMocks() {
  return {
    mockEventSystem: {
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn()
    },
    mockErrorHandler: {
      handleError: jest.fn(),
      createError: jest.fn(code => ({ code, message: `Error: ${code}` }))
    }
  };
}