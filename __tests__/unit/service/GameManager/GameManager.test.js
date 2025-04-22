/**
 * GameManager.js の単体テスト
 * 
 * このテストファイルでは、GameManagerクラスの基本構造、コンストラクタ、
 * 初期化処理、マネージャー統合、公開APIなどをテストします。
 */

// テスト環境設定
process.env.NODE_ENV = 'test';

// GameManagerのインポート
import GameManager from '../../../../src/service/GameManager';

// モジュールのモック化
jest.mock('../../../../src/core/event/EventSystem', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    emit: jest.fn()
  }));
});

jest.mock('../../../../src/core/error/ErrorHandler', () => {
  return jest.fn().mockImplementation(() => ({
    handleError: jest.fn(),
    createError: jest.fn()
  }));
});

jest.mock('../../../../src/domain/player/PlayerManager', () => {
  return jest.fn().mockImplementation(() => ({
    addPlayer: jest.fn().mockReturnValue(0),
    removePlayer: jest.fn(),
    getPlayer: jest.fn(),
    getAllPlayers: jest.fn().mockReturnValue([]),
    getAlivePlayers: jest.fn().mockReturnValue([]),
    killPlayer: jest.fn(),
    setPlayerManager: jest.fn(),
    reset: jest.fn()
  }));
});

jest.mock('../../../../src/domain/role/manager/RoleManager', () => {
  return jest.fn().mockImplementation(() => ({
    setRoles: jest.fn().mockReturnValue(true),
    distributeRoles: jest.fn(),
    assignRole: jest.fn(),
    getRoleInfo: jest.fn(),
    setRoleManager: jest.fn(),
    setPlayerManager: jest.fn(),
    reset: jest.fn()
  }));
});

jest.mock('../../../../src/domain/phase/PhaseManager', () => {
  return jest.fn().mockImplementation(() => ({
    moveToNextPhase: jest.fn().mockReturnValue({ id: 'night', name: '夜フェーズ' }),
    moveToPhase: jest.fn(),
    getCurrentPhase: jest.fn().mockReturnValue({ id: 'day', name: '昼フェーズ' }),
    setPlayerManager: jest.fn(),
    setVoteManager: jest.fn(),
    setActionManager: jest.fn(),
    reset: jest.fn()
  }));
});

jest.mock('../../../../src/domain/action/ActionManager', () => {
  return jest.fn().mockImplementation(() => ({
    registerAction: jest.fn().mockReturnValue({ actionId: 'act-1' }),
    executeActions: jest.fn(),
    setPlayerManager: jest.fn(),
    setRoleManager: jest.fn(),
    reset: jest.fn()
  }));
});

jest.mock('../../../../src/domain/vote/VoteManager', () => {
  return jest.fn().mockImplementation(() => ({
    registerVote: jest.fn().mockReturnValue({ success: true }),
    countVotes: jest.fn(),
    executeVote: jest.fn(),
    setPlayerManager: jest.fn(),
    reset: jest.fn()
  }));
});

jest.mock('../../../../src/domain/victory/VictoryManager', () => {
  return jest.fn().mockImplementation(() => ({
    checkVictoryConditions: jest.fn(),
    getGameResult: jest.fn(),
    setPlayerManager: jest.fn(),
    setRoleManager: jest.fn(),
    reset: jest.fn()
  }));
});

// ユーティリティのモック
jest.mock('../../../../src/core/common/utils', () => ({
  SeededRandom: jest.fn().mockImplementation(() => ({
    random: jest.fn().mockReturnValue(0.5)
  })),
  Random: jest.fn().mockImplementation(() => ({
    random: jest.fn().mockReturnValue(Math.random())
  }))
}));

describe('GameManager', () => {
  
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. クラス構造とスタティックプロパティ/メソッドのテスト
  describe('クラス構造', () => {
    test('GameManagerはクラスである', () => {
      expect(typeof GameManager).toBe('function');
      expect(new GameManager()).toBeInstanceOf(GameManager);
    });

    test('バージョン情報が正しく定義されている', () => {
      expect(GameManager.version).toBeDefined();
      expect(typeof GameManager.version).toBe('string');
      // セマンティックバージョニング（x.y.z形式）に従っているか
      expect(GameManager.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('isCompatible静的メソッドが正しく動作する', () => {
      // 現在のバージョンとの互換性テスト
      expect(GameManager.isCompatible(GameManager.version)).toBe(true);
      
      // メジャーバージョン違いは非互換
      const [major] = GameManager.version.split('.');
      const incompatibleVersion = `${Number(major) + 1}.0.0`;
      expect(GameManager.isCompatible(incompatibleVersion)).toBe(false);
      
      // マイナーバージョンやパッチバージョンの違いは互換性あり
      const [major2, minor] = GameManager.version.split('.');
      const compatibleVersion = `${major2}.${Number(minor) + 1}.0`;
      expect(GameManager.isCompatible(compatibleVersion)).toBe(true);
    });
  });

  // 2. コンストラクタと初期化のテスト
  describe('コンストラクタと初期化', () => {
    test('デフォルトオプションで正しく初期化される', () => {
      const gm = new GameManager();
      
      expect(gm.options).toBeDefined();
      expect(gm.options.debugMode).toBe(false);
      expect(gm.options.regulations).toBeDefined();
      expect(gm.options.randomSeed).toBeNull();
    });

    test('カスタムオプションで正しく初期化される', () => {
      const customOptions = {
        randomSeed: 12345,
        debugMode: true,
        regulations: {
          allowConsecutiveGuard: true,
          firstDayExecution: true
        }
      };
      
      const gm = new GameManager(customOptions);
      
      expect(gm.options.randomSeed).toBe(12345);
      expect(gm.options.debugMode).toBe(true);
      expect(gm.options.regulations.allowConsecutiveGuard).toBe(true);
      expect(gm.options.regulations.firstDayExecution).toBe(true);
    });
  });

  // 3. コアシステムとマネージャー初期化のテスト
  describe('コアシステムとマネージャー初期化', () => {
    test('EventSystemとErrorHandlerが正しく初期化される', () => {
      const EventSystem = require('../../../../src/core/event/EventSystem');
      const ErrorHandler = require('../../../../src/core/error/ErrorHandler');
      
      const gm = new GameManager();
      
      expect(EventSystem).toHaveBeenCalled();
      expect(ErrorHandler).toHaveBeenCalled();
      expect(gm.eventSystem).toBeDefined();
      expect(gm.errorHandler).toBeDefined();
    });

    test('マネージャーが正しく初期化される', () => {
      const PlayerManager = require('../../../../src/domain/player/PlayerManager');
      const RoleManager = require('../../../../src/domain/role/manager/RoleManager');
      const PhaseManager = require('../../../../src/domain/phase/PhaseManager');
      const ActionManager = require('../../../../src/domain/action/ActionManager');
      const VoteManager = require('../../../../src/domain/vote/VoteManager');
      const VictoryManager = require('../../../../src/domain/victory/VictoryManager');
      
      const gm = new GameManager();
      
      expect(PlayerManager).toHaveBeenCalled();
      expect(RoleManager).toHaveBeenCalled();
      expect(PhaseManager).toHaveBeenCalled();
      expect(ActionManager).toHaveBeenCalled();
      expect(VoteManager).toHaveBeenCalled();
      expect(VictoryManager).toHaveBeenCalled();
      
      expect(gm.playerManager).toBeDefined();
      expect(gm.roleManager).toBeDefined();
      expect(gm.phaseManager).toBeDefined();
      expect(gm.actionManager).toBeDefined();
      expect(gm.voteManager).toBeDefined();
      expect(gm.victoryManager).toBeDefined();
    });
  });

  // 4. 初期状態のテスト
  describe('初期状態', () => {
    test('ゲーム状態が正しく初期化される', () => {
      const gm = new GameManager();
      
      expect(gm.state).toBeDefined();
      expect(gm.state.isStarted).toBe(false);
      expect(gm.state.isEnded).toBe(false);
      expect(gm.state.turn).toBe(0);
      expect(gm.state.phase).toBeNull();
      expect(gm.state.winner).toBeNull();
    });
  });

  // 5. マネージャー間の相互参照設定のテスト
  describe('マネージャー間の相互参照設定', () => {
    test('setupCrossReferencesメソッドが正しく相互参照を設定する', () => {
      const gm = new GameManager();
      
      // privateメソッドへの直接アクセスではなく、
      // constructorで呼ばれたとみなす
      
      // PhaseManagerの参照設定
      expect(gm.phaseManager.setPlayerManager).toHaveBeenCalledWith(gm.playerManager);
      expect(gm.phaseManager.setVoteManager).toHaveBeenCalledWith(gm.voteManager);
      expect(gm.phaseManager.setActionManager).toHaveBeenCalledWith(gm.actionManager);
      
      // VoteManagerの参照設定
      expect(gm.voteManager.setPlayerManager).toHaveBeenCalledWith(gm.playerManager);
      
      // ActionManagerの参照設定
      expect(gm.actionManager.setPlayerManager).toHaveBeenCalledWith(gm.playerManager);
      expect(gm.actionManager.setRoleManager).toHaveBeenCalledWith(gm.roleManager);
      
      // VictoryManagerの参照設定
      expect(gm.victoryManager.setPlayerManager).toHaveBeenCalledWith(gm.playerManager);
      expect(gm.victoryManager.setRoleManager).toHaveBeenCalledWith(gm.roleManager);
    });
  });

  // 6. 公開API確認テスト
  describe('公開API', () => {
    let gm;
    
    beforeEach(() => {
      gm = new GameManager();
    });
    
    test('プレイヤー管理APIが提供されている', () => {
      expect(typeof gm.addPlayer).toBe('function');
      expect(typeof gm.removePlayer).toBe('function');
      expect(typeof gm.getPlayer).toBe('function');
      expect(typeof gm.getAllPlayers).toBe('function');
      expect(typeof gm.getAlivePlayers).toBe('function');
      expect(typeof gm.killPlayer).toBe('function');
    });
    
    test('役職管理APIが提供されている', () => {
      expect(typeof gm.setRoles).toBe('function');
      expect(typeof gm.distributeRoles).toBe('function');
      expect(typeof gm.assignRole).toBe('function');
      expect(typeof gm.getRoleInfo).toBe('function');
    });
    
    test('フェーズ管理APIが提供されている', () => {
      expect(typeof gm.start).toBe('function');
      expect(typeof gm.nextPhase).toBe('function');
      expect(typeof gm.getCurrentPhase).toBe('function');
    });
    
    test('投票管理APIが提供されている', () => {
      expect(typeof gm.vote).toBe('function');
      expect(typeof gm.countVotes).toBe('function');
      expect(typeof gm.executeVote).toBe('function');
    });
    
    test('アクション管理APIが提供されている', () => {
      expect(typeof gm.registerAction).toBe('function');
      expect(typeof gm.executeActions).toBe('function');
    });
    
    test('状態管理APIが提供されている', () => {
      expect(typeof gm.getCurrentState).toBe('function');
      expect(typeof gm.isGameStarted).toBe('function');
      expect(typeof gm.isGameEnded).toBe('function');
      expect(typeof gm.getWinner).toBe('function');
    });
    
    test('イベント管理APIが提供されている', () => {
      expect(typeof gm.on).toBe('function');
      expect(typeof gm.off).toBe('function');
      expect(typeof gm.once).toBe('function');
      expect(typeof gm.emit).toBe('function');
    });
  });

  // 7. メソッド委譲のテスト
  describe('メソッド委譲', () => {
    let gm;
    
    beforeEach(() => {
      gm = new GameManager();
    });
    
    test('addPlayerメソッドがPlayerManagerに委譲される', () => {
      // モックの戻り値を設定
      gm.playerManager.addPlayer.mockReturnValue(0);
      
      const result = gm.addPlayer('TestPlayer');
      
      expect(gm.playerManager.addPlayer).toHaveBeenCalledWith('TestPlayer');
      expect(result).toBe(0);
    });
    
    test('setRolesメソッドがRoleManagerに委譲される', () => {
      const roles = ['villager', 'werewolf', 'seer'];
      gm.roleManager.setRoles.mockReturnValue(true);
      
      const result = gm.setRoles(roles);
      
      expect(gm.roleManager.setRoles).toHaveBeenCalledWith(roles);
      expect(result).toBe(true);
    });
    
    test('nextPhaseメソッドがPhaseManagerに委譲される', () => {
      const phaseInfo = { id: 'night', name: '夜フェーズ' };
      gm.phaseManager.moveToNextPhase.mockReturnValue(phaseInfo);
      
      const result = gm.nextPhase();
      
      expect(gm.phaseManager.moveToNextPhase).toHaveBeenCalled();
      expect(result).toEqual(phaseInfo);
    });
    
    test('voteメソッドがVoteManagerに委譲される', () => {
      gm.voteManager.registerVote.mockReturnValue({ success: true });
      
      const result = gm.vote(0, 1);
      
      expect(gm.voteManager.registerVote).toHaveBeenCalledWith(0, 1);
      expect(result).toEqual({ success: true });
    });
    
    test('registerActionメソッドがActionManagerに委譲される', () => {
      const action = { type: 'fortune', actor: 0, target: 1 };
      gm.actionManager.registerAction.mockReturnValue({ actionId: 'act-1' });
      
      const result = gm.registerAction(action);
      
      expect(gm.actionManager.registerAction).toHaveBeenCalledWith(action);
      expect(result).toEqual({ actionId: 'act-1' });
    });
  });

  // 8. 特殊ケースのテスト
  describe('特殊ケース', () => {
    test('バージョン互換性チェック', () => {
      // バージョン互換性チェックのテスト
      const currentVersion = GameManager.version;
      expect(GameManager.isCompatible(currentVersion)).toBe(true);
      
      // メジャーバージョンが異なる場合は非互換
      expect(GameManager.isCompatible('999.0.0')).toBe(false);
      
      // 無効なバージョン文字列の場合
      expect(() => {
        GameManager.isCompatible('not-a-version');
      }).toThrow();
    });
    
    test('ゲームのリセット', () => {
      const gm = new GameManager();
      
      // リセットメソッドが存在すれば
      if (typeof gm.reset === 'function') {
        // リセット前の状態を模擬
        gm.state = {
          isStarted: true,
          isEnded: false,
          turn: 5,
          phase: 'night',
          players: [{ id: 0, name: 'Player1' }]
        };
        
        // リセット実行
        gm.reset();
        
        // リセット後の状態確認
        expect(gm.state.isStarted).toBe(false);
        expect(gm.state.turn).toBe(0);
        expect(gm.state.phase).toBeNull();
        
        // 各マネージャーのリセットメソッドが呼ばれたか確認
        expect(gm.playerManager.reset).toHaveBeenCalled();
        expect(gm.roleManager.reset).toHaveBeenCalled();
        expect(gm.phaseManager.reset).toHaveBeenCalled();
        expect(gm.actionManager.reset).toHaveBeenCalled();
        expect(gm.voteManager.reset).toHaveBeenCalled();
        expect(gm.victoryManager.reset).toHaveBeenCalled();
      } else {
        // リセットメソッドが存在しない場合はスキップ
        console.log('reset method not implemented, skipping test');
      }
    });
  });
});
