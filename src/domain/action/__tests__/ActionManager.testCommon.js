/**
 * ActionManager クラスのテスト用共通設定
 * 複数のテストファイルで再利用するための共通のモックやセットアップ処理
 */

import { Action } from '../Action';
import { ActionManager } from '../ActionManager';
import EventSystem from '../../../core/event/EventSystem';
import ErrorHandler from '../../../core/error/ErrorHandler';

// テスト用のモック
jest.mock('../../../core/event/EventSystem');
jest.mock('../../../core/error/ErrorHandler');

/**
 * テスト用のセットアップを行い、ActionManagerとモックオブジェクトを返す
 * @returns {Object} セットアップされたテスト用オブジェクト群
 */
export function setupActionManagerTest() {
  // テスト用プレイヤーデータの初期定義
  const initialTestPlayers = {
    // 占い師プレイヤー
    seer: {
      id: 1,
      name: '占い師プレイヤー',
      isAlive: true,
      role: { name: 'seer', team: 'village' }
    },
    // 騎士プレイヤー
    knight: {
      id: 2,
      name: '騎士プレイヤー',
      isAlive: true,
      role: { name: 'knight', team: 'village' }
    },
    // 人狼プレイヤー
    werewolf: {
      id: 3,
      name: '人狼プレイヤー',
      isAlive: true,
      role: { name: 'werewolf', team: 'werewolf' }
    },
    // 村人プレイヤー
    villager: {
      id: 4,
      name: '村人プレイヤー',
      isAlive: true,
      isGuarded: false,
      role: { name: 'villager', team: 'village' }
    },
    // 妖狐プレイヤー
    fox: {
      id: 5,
      name: '妖狐プレイヤー',
      isAlive: true,
      role: { name: 'fox', team: 'fox' }
    }
  };

  // テスト用プレイヤーデータを初期化
  const testPlayers = JSON.parse(JSON.stringify(initialTestPlayers));

  // テスト用役職データ
  const roleDefinitions = {
    seer: {
      name: 'seer',
      team: 'village',
      actionTypes: ['fortune'],
      fortuneResult: 'white',
      mediumResult: 'white'
    },
    knight: {
      name: 'knight',
      team: 'village',
      actionTypes: ['guard'],
      fortuneResult: 'white',
      mediumResult: 'white'
    },
    werewolf: {
      name: 'werewolf',
      team: 'werewolf',
      actionTypes: ['attack'],
      fortuneResult: 'black',
      mediumResult: 'black'
    },
    villager: {
      name: 'villager',
      team: 'village',
      actionTypes: [],
      fortuneResult: 'white',
      mediumResult: 'white'
    },
    fox: {
      name: 'fox',
      team: 'fox',
      actionTypes: [],
      fortuneResult: 'white',
      mediumResult: 'white',
      // 特殊能力：襲撃耐性、占い師による呪殺効果
      isImmuneToDeath: { attack: true },
      isVulnerableTo: { fortune: true }
    }
  };

  // レギュレーション設定
  const regulations = {
    allowConsecutiveGuard: false,
    firstNightFortune: 'free'
  };

  // イベントシステムのモック
  const mockEventSystem = {
    emit: jest.fn(),
    on: jest.fn()
  };

  // エラーハンドラーのモック
  const mockErrorHandler = {
    createError: jest.fn((code, message) => {
      const error = new Error(message);
      error.code = code;
      return error;
    }),
    handleError: jest.fn()
  };

  // プレイヤーマネージャーのモック
  const mockPlayerManager = {
    getPlayer: jest.fn(id => {
      // テストプレイヤーデータから対応するプレイヤーを返す
      const player = Object.values(testPlayers).find(p => p.id === id);
      return player || null;
    }),
    getAlivePlayers: jest.fn(() => {
      // 生存プレイヤーのみ返す
      return Object.values(testPlayers).filter(p => p.isAlive);
    }),
    killPlayer: jest.fn((playerId, cause) => {
      // プレイヤーの死亡処理をシミュレート
      const player = Object.values(testPlayers).find(p => p.id === playerId);
      if (player) {
        player.isAlive = false;
        player.causeOfDeath = cause;
        return true;
      }
      return false;
    })
  };

  // ロールマネージャーのモック
  const mockRoleManager = {
    getRole: jest.fn(roleName => {
      // テスト役職データから対応する役職を返す
      return roleDefinitions[roleName] || null;
    }),
    canUseAction: jest.fn((playerId, actionType) => {
      // プレイヤーが特定のアクション種別を使用できるかチェック
      const player = mockPlayerManager.getPlayer(playerId);
      if (!player || !player.isAlive) return false;

      const role = mockRoleManager.getRole(player.role.name);
      return role && role.actionTypes && role.actionTypes.includes(actionType);
    })
  };

  // フェーズマネージャーのモック
  const mockPhaseManager = {
    getCurrentPhase: jest.fn(() => 'night'),
    getCurrentTurn: jest.fn(() => 1)
  };

  // ゲームオブジェクトのモック
  const mockGame = {
    eventSystem: mockEventSystem,
    errorHandler: mockErrorHandler,
    playerManager: mockPlayerManager,
    roleManager: mockRoleManager,
    phaseManager: mockPhaseManager,
    regulations,
    // ゲームイベント発火のヘルパーメソッド
    emit: function (eventName, data) {
      return this.eventSystem.emit(eventName, data);
    }
  };

  // 実際のActionManagerクラスを使用
  const actionManager = new ActionManager(mockGame);

  return {
    actionManager,
    testPlayers,
    mockEventSystem,
    mockErrorHandler,
    mockPlayerManager,
    mockRoleManager,
    mockPhaseManager,
    mockGame,
    roleDefinitions,
    regulations
  };
}

export default setupActionManagerTest;

// テストケースを最低1つ含める必要がある
describe('ActionManager Test Common', () => {
  test('setupActionManagerTest は必要なモックオブジェクトを提供する', () => {
    const setup = setupActionManagerTest();
    expect(setup).toBeDefined();
    expect(setup.actionManager).toBeDefined();
    expect(setup.testPlayers).toBeDefined();
  });
});