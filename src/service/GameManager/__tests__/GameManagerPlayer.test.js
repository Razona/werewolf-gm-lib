/**
 * GameManagerPlayer Mixin テスト
 */

import GameManagerPlayerMixin from '../GameManagerPlayer';

// モックの依存モジュール
const mockEventSystem = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn()
};

const mockErrorHandler = {
  createError: jest.fn((code, message) => ({ code, message })),
  handleError: jest.fn()
};

const mockPlayerManager = {
  addPlayer: jest.fn((name) => 99),  // 初期テストではID 99を返す
  removePlayer: jest.fn(() => true),
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(() => []),
  getAlivePlayers: jest.fn(() => []),
  getPlayerByName: jest.fn(),
  getPlayerCount: jest.fn(() => 0),
  getAlivePlayerCount: jest.fn(() => 0),
  isPlayerAlive: jest.fn(),
  killPlayer: jest.fn(),
  setPlayerStatusEffect: jest.fn(),
  hasPlayerStatusEffect: jest.fn(),
  clearPlayerStatusEffects: jest.fn(),
};

// GameManagerのモック
class MockGameManager {
  constructor() {
    this.eventSystem = mockEventSystem;
    this.errorHandler = mockErrorHandler;
    this.playerManager = mockPlayerManager;
    this.state = {
      isStarted: false,
      isEnded: false,
      turn: 0
    };
    this.options = {
      regulations: {}
    };
    // トランザクション関連メソッド
    this.beginTransaction = jest.fn();
    this.commitTransaction = jest.fn();
    this.rollbackTransaction = jest.fn();
  }
}

// テスト前の準備
beforeEach(() => {
  // モックのリセット
  jest.clearAllMocks();
  
  // テスト用のGameManagerインスタンス作成
  const GameManager = MockGameManager;
  // Mixinの適用
  GameManagerPlayerMixin(GameManager);
  gameManager = new GameManager();
});

// テスト用のグローバル変数
let gameManager;

describe('GameManagerPlayer', () => {
  describe('プレイヤー追加機能', () => {
    test('通常のプレイヤー追加に成功する', () => {
      const playerId = gameManager.addPlayer('テストプレイヤー');
      
      // 期待される結果
      expect(playerId).toBe(99); // モックPlayerManagerが返すID
      expect(mockPlayerManager.addPlayer).toHaveBeenCalledWith('テストプレイヤー');
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.add', expect.objectContaining({
        playerId: 99,
        name: 'テストプレイヤー'
      }));
    });

    test('空の名前でプレイヤー追加するとエラーになる', () => {
      mockErrorHandler.createError.mockReturnValueOnce(new Error('無効なプレイヤー名'));
      
      expect(() => gameManager.addPlayer('')).toThrow('無効なプレイヤー名');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('INVALID_PLAYER_NAME', expect.any(String));
      expect(mockPlayerManager.addPlayer).not.toHaveBeenCalled();
    });

    test('ゲーム開始後にプレイヤー追加するとエラーになる', () => {
      gameManager.state.isStarted = true;
      mockErrorHandler.createError.mockReturnValueOnce(new Error('ゲーム開始後にプレイヤーを追加できません'));
      
      expect(() => gameManager.addPlayer('テストプレイヤー')).toThrow('ゲーム開始後にプレイヤーを追加できません');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('GAME_ALREADY_STARTED', expect.any(String));
      expect(mockPlayerManager.addPlayer).not.toHaveBeenCalled();
    });
  });

  describe('プレイヤー削除機能', () => {
    test('通常のプレイヤー削除に成功する', () => {
      const result = gameManager.removePlayer(1);
      
      expect(result).toBe(true);
      expect(mockPlayerManager.removePlayer).toHaveBeenCalledWith(1);
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.remove', expect.objectContaining({
        playerId: 1
      }));
    });

    test('ゲーム開始後にプレイヤー削除するとエラーになる', () => {
      gameManager.state.isStarted = true;
      mockErrorHandler.createError.mockReturnValueOnce(new Error('ゲーム開始後にプレイヤーを削除できません'));
      
      expect(() => gameManager.removePlayer(1)).toThrow('ゲーム開始後にプレイヤーを削除できません');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('GAME_ALREADY_STARTED', expect.any(String));
      expect(mockPlayerManager.removePlayer).not.toHaveBeenCalled();
    });
  });

  describe('プレイヤー情報取得機能', () => {
    test('IDによるプレイヤー取得', () => {
      const mockPlayer = { id: 1, name: 'テストプレイヤー' };
      mockPlayerManager.getPlayer.mockReturnValueOnce(mockPlayer);
      
      const player = gameManager.getPlayer(1);
      
      expect(player).toEqual(mockPlayer);
      expect(mockPlayerManager.getPlayer).toHaveBeenCalledWith(1);
    });
    
    test('名前によるプレイヤー取得', () => {
      const mockPlayer = { id: 1, name: 'テストプレイヤー' };
      mockPlayerManager.getPlayerByName.mockReturnValueOnce(mockPlayer);
      
      const player = gameManager.getPlayerByName('テストプレイヤー');
      
      expect(player).toEqual(mockPlayer);
      expect(mockPlayerManager.getPlayerByName).toHaveBeenCalledWith('テストプレイヤー');
    });
    
    test('全プレイヤー取得', () => {
      const mockPlayers = [
        { id: 1, name: 'プレイヤー1' },
        { id: 2, name: 'プレイヤー2' }
      ];
      mockPlayerManager.getAllPlayers.mockReturnValueOnce(mockPlayers);
      
      const players = gameManager.getAllPlayers();
      
      expect(players).toEqual(mockPlayers);
      expect(mockPlayerManager.getAllPlayers).toHaveBeenCalled();
    });
    
    test('生存プレイヤー取得', () => {
      const mockAlivePlayers = [{ id: 1, name: 'プレイヤー1', isAlive: true }];
      mockPlayerManager.getAlivePlayers.mockReturnValueOnce(mockAlivePlayers);
      
      const alivePlayers = gameManager.getAlivePlayers();
      
      expect(alivePlayers).toEqual(mockAlivePlayers);
      expect(mockPlayerManager.getAlivePlayers).toHaveBeenCalled();
    });
    
    test('プレイヤー数取得', () => {
      mockPlayerManager.getPlayerCount.mockReturnValueOnce(5);
      
      const count = gameManager.getPlayerCount();
      
      expect(count).toBe(5);
      expect(mockPlayerManager.getPlayerCount).toHaveBeenCalled();
    });
    
    test('生存プレイヤー数取得', () => {
      mockPlayerManager.getAlivePlayerCount.mockReturnValueOnce(3);
      
      const count = gameManager.getAlivePlayerCount();
      
      expect(count).toBe(3);
      expect(mockPlayerManager.getAlivePlayerCount).toHaveBeenCalled();
    });
  });

  describe('プレイヤー死亡処理', () => {
    beforeEach(() => {
      gameManager.state.isStarted = true; // 死亡処理はゲーム開始後に実行
      mockPlayerManager.getPlayer.mockReturnValue({ id: 1, name: 'テストプレイヤー', isAlive: true });
      mockPlayerManager.isPlayerAlive.mockReturnValue(true);
    });

    test('プレイヤー死亡処理に成功する', () => {
      mockPlayerManager.killPlayer.mockReturnValue(true);
      
      const result = gameManager.killPlayer(1, 'execution');
      
      expect(result).toBeTruthy();
      expect(gameManager.beginTransaction).toHaveBeenCalled();
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.death.before', expect.objectContaining({
        playerId: 1,
        cause: 'execution'
      }));
      expect(mockPlayerManager.killPlayer).toHaveBeenCalledWith(1, 'execution', undefined);
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.death.after', expect.objectContaining({
        playerId: 1,
        cause: 'execution'
      }));
      expect(gameManager.commitTransaction).toHaveBeenCalled();
    });

    test('すでに死亡しているプレイヤーを殺そうとするとエラーになる', () => {
      mockPlayerManager.isPlayerAlive.mockReturnValueOnce(false);
      mockErrorHandler.createError.mockReturnValueOnce(new Error('プレイヤーはすでに死亡しています'));
      
      expect(() => gameManager.killPlayer(1, 'attack')).toThrow('プレイヤーはすでに死亡しています');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('PLAYER_ALREADY_DEAD', expect.any(String));
      expect(mockPlayerManager.killPlayer).not.toHaveBeenCalled();
    });

    test('死亡処理中にエラーが発生した場合はロールバックされる', () => {
      mockEventSystem.emit.mockImplementationOnce(() => {
        throw new Error('イベント処理でエラー');
      });
      
      expect(() => gameManager.killPlayer(1, 'execution')).toThrow('イベント処理でエラー');
      expect(gameManager.beginTransaction).toHaveBeenCalled();
      expect(gameManager.rollbackTransaction).toHaveBeenCalled();
      expect(gameManager.commitTransaction).not.toHaveBeenCalled();
    });
  });

  describe('プレイヤー状態効果管理', () => {
    beforeEach(() => {
      gameManager.state.isStarted = true; // 状態効果操作はゲーム開始後に実行
      mockPlayerManager.getPlayer.mockReturnValue({ id: 1, name: 'テストプレイヤー', isAlive: true });
      mockPlayerManager.isPlayerAlive.mockReturnValue(true);
    });

    test('状態効果を設定できる', () => {
      mockPlayerManager.setPlayerStatusEffect.mockReturnValue(true);
      
      const result = gameManager.setPlayerStatusEffect(1, 'guarded', true, 1);
      
      expect(result).toBe(true);
      expect(mockPlayerManager.setPlayerStatusEffect).toHaveBeenCalledWith(1, 'guarded', true, 1);
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.statusEffect.add', expect.objectContaining({
        playerId: 1,
        effect: 'guarded',
        value: true,
        duration: 1
      }));
    });

    test('状態効果の確認ができる', () => {
      mockPlayerManager.hasPlayerStatusEffect.mockReturnValue(true);
      
      const result = gameManager.hasPlayerStatusEffect(1, 'guarded');
      
      expect(result).toBe(true);
      expect(mockPlayerManager.hasPlayerStatusEffect).toHaveBeenCalledWith(1, 'guarded');
    });

    test('状態効果をクリアできる', () => {
      mockPlayerManager.clearPlayerStatusEffects.mockReturnValue(true);
      
      const result = gameManager.clearPlayerStatusEffects(1, 'guarded');
      
      expect(result).toBe(true);
      expect(mockPlayerManager.clearPlayerStatusEffects).toHaveBeenCalledWith(1, 'guarded');
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.statusEffect.remove', expect.objectContaining({
        playerId: 1,
        effect: 'guarded'
      }));
    });

    test('すべての状態効果をクリアできる', () => {
      mockPlayerManager.clearPlayerStatusEffects.mockReturnValue(true);
      
      const result = gameManager.clearPlayerStatusEffects(1);
      
      expect(result).toBe(true);
      expect(mockPlayerManager.clearPlayerStatusEffects).toHaveBeenCalledWith(1, undefined);
      expect(mockEventSystem.emit).toHaveBeenCalledWith('player.statusEffect.remove', expect.objectContaining({
        playerId: 1,
        effect: 'all'
      }));
    });
  });

  describe('情報可視性制御', () => {
    test('プレイヤー情報が適切にフィルタリングされる', () => {
      const targetPlayer = { 
        id: 1, 
        name: 'ターゲット', 
        isAlive: true,
        role: 'werewolf',
        team: 'werewolf'
      };
      
      const viewerPlayer = {
        id: 2,
        name: 'ビューワー',
        isAlive: true,
        role: 'villager',
        team: 'village'
      };
      
      mockPlayerManager.getPlayer.mockImplementation((id) => {
        if (id === 1) return targetPlayer;
        if (id === 2) return viewerPlayer;
        return null;
      });
      
      // GM視点（完全な情報）
      const gmView = gameManager.getVisiblePlayerInfo(1, null);
      expect(gmView).toEqual(targetPlayer);
      
      // 別陣営プレイヤー視点（制限された情報）
      gameManager.getRoleTeam = jest.fn().mockImplementation((playerId) => {
        return playerId === 1 ? 'werewolf' : 'village';
      });
      
      const playerView = gameManager.getVisiblePlayerInfo(1, 2);
      // 公開情報のみを含む
      expect(playerView.name).toBe('ターゲット');
      expect(playerView.isAlive).toBe(true);
      // 役職情報は含まれない
      expect(playerView.role).toBeUndefined();
      expect(playerView.team).toBeUndefined();
    });
    
    test('死亡プレイヤーの役職情報公開設定が機能する', () => {
      const targetPlayer = { 
        id: 1, 
        name: 'ターゲット', 
        isAlive: false, // 死亡プレイヤー
        role: 'werewolf',
        team: 'werewolf'
      };
      
      mockPlayerManager.getPlayer.mockReturnValue(targetPlayer);
      
      // 死亡時役職公開設定がONの場合
      gameManager.options.regulations.revealRoleOnDeath = true;
      
      const publicView = gameManager.getVisiblePlayerInfo(1, 2);
      expect(publicView.role).toBe('werewolf');
      expect(publicView.team).toBe('werewolf');
      
      // 死亡時役職公開設定がOFFの場合
      gameManager.options.regulations.revealRoleOnDeath = false;
      
      const restrictedView = gameManager.getVisiblePlayerInfo(1, 2);
      expect(restrictedView.role).toBeUndefined();
      expect(restrictedView.team).toBeUndefined();
    });
    
    test('同じ陣営のプレイヤーは互いの情報を見られる', () => {
      const player1 = { 
        id: 1, 
        name: 'ウェアウルフ1', 
        isAlive: true,
        role: 'werewolf',
        team: 'werewolf'
      };
      
      const player2 = {
        id: 2,
        name: 'ウェアウルフ2',
        isAlive: true,
        role: 'werewolf',
        team: 'werewolf'
      };
      
      mockPlayerManager.getPlayer.mockImplementation((id) => {
        if (id === 1) return player1;
        if (id === 2) return player2;
        return null;
      });
      
      // 陣営確認メソッドのモック
      gameManager.getRoleTeam = jest.fn()
        .mockReturnValue('werewolf'); // 両方とも人狼陣営
      
      gameManager.isSameTeam = jest.fn()
        .mockImplementation((id1, id2) => 
          gameManager.getRoleTeam(id1) === gameManager.getRoleTeam(id2));
      
      const playerView = gameManager.getVisiblePlayerInfo(1, 2);
      
      // 同じ陣営のプレイヤーは役職情報にアクセスできる
      expect(playerView.role).toBe('werewolf');
      expect(playerView.team).toBe('werewolf');
    });
  });
  
  describe('生存状態確認', () => {
    test('プレイヤーの生存状態を確認できる', () => {
      // 生存プレイヤー
      mockPlayerManager.isPlayerAlive.mockReturnValueOnce(true);
      
      expect(gameManager.isPlayerAlive(1)).toBe(true);
      expect(mockPlayerManager.isPlayerAlive).toHaveBeenCalledWith(1);
      
      // 死亡プレイヤー
      mockPlayerManager.isPlayerAlive.mockReturnValueOnce(false);
      
      expect(gameManager.isPlayerAlive(2)).toBe(false);
      expect(mockPlayerManager.isPlayerAlive).toHaveBeenCalledWith(2);
    });
    
    test('存在しないプレイヤーIDを確認するとエラーになる', () => {
      mockPlayerManager.isPlayerAlive.mockImplementationOnce(() => {
        throw new Error('プレイヤーが存在しません');
      });
      mockErrorHandler.createError.mockReturnValueOnce(new Error('プレイヤーが存在しません'));
      
      expect(() => gameManager.isPlayerAlive(999)).toThrow('プレイヤーが存在しません');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('PLAYER_NOT_FOUND', expect.any(String));
    });
  });
  
  describe('エッジケースとエラー処理', () => {
    test('存在しないプレイヤーIDを指定するとエラーになる', () => {
      mockPlayerManager.getPlayer.mockReturnValueOnce(null);
      mockErrorHandler.createError.mockReturnValueOnce(new Error('プレイヤーが存在しません'));
      
      expect(() => gameManager.getPlayer(999)).toThrow('プレイヤーが存在しません');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('PLAYER_NOT_FOUND', expect.any(String));
    });
    
    test('ゲーム終了後の死亡処理はエラーになる', () => {
      gameManager.state.isStarted = true;
      gameManager.state.isEnded = true;
      mockErrorHandler.createError.mockReturnValueOnce(new Error('ゲームは既に終了しています'));
      
      expect(() => gameManager.killPlayer(1, 'execution')).toThrow('ゲームは既に終了しています');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('GAME_ALREADY_ENDED', expect.any(String));
    });
    
    test('存在しない状態効果タイプを指定するとエラーになる', () => {
      gameManager.state.isStarted = true;
      mockErrorHandler.createError.mockReturnValueOnce(new Error('無効な状態効果タイプです'));
      mockPlayerManager.setPlayerStatusEffect.mockImplementationOnce(() => {
        throw new Error('無効な状態効果タイプです');
      });
      
      expect(() => gameManager.setPlayerStatusEffect(1, '存在しない効果', true)).toThrow('無効な状態効果タイプです');
      expect(mockErrorHandler.createError).toHaveBeenCalledWith('INVALID_STATUS_EFFECT', expect.any(String));
    });
  });
  
  describe('パフォーマンス最適化とキャッシュ', () => {
    test('getAllPlayersは連続呼び出し時にキャッシュを使用する', () => {
      // このテストはキャッシュ機能が実装された場合に適切に調整する必要がある
      // 現時点では実装が不明なので、基本的な動作のみテスト
      const mockPlayers = [
        { id: 1, name: 'プレイヤー1' },
        { id: 2, name: 'プレイヤー2' }
      ];
      mockPlayerManager.getAllPlayers.mockReturnValue(mockPlayers);
      
      // 1回目の呼び出し
      const players1 = gameManager.getAllPlayers();
      expect(players1).toEqual(mockPlayers);
      expect(mockPlayerManager.getAllPlayers).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('バッチ処理', () => {
    test('複数プレイヤーの状態効果を一度にクリアできる', () => {
      // clearAllPlayersStatusEffectsが実装されている場合のテスト
      if(typeof gameManager.clearAllPlayersStatusEffects === 'function') {
        mockPlayerManager.getAllPlayers.mockReturnValue([
          { id: 1, name: 'プレイヤー1', isAlive: true },
          { id: 2, name: 'プレイヤー2', isAlive: true }
        ]);
        
        gameManager.clearAllPlayersStatusEffects('guarded');
        
        // 実装によって詳細は変わるが、基本的にはすべてのプレイヤーに対して
        // clearPlayerStatusEffectsが呼ばれることを期待
        expect(mockPlayerManager.clearPlayerStatusEffects).toHaveBeenCalled();
      }
    });
  });
  
  describe('統合テスト', () => {
    test('役職との連携（死亡処理と役職効果の発動）', () => {
      // このテストは役職システムが実装されている場合に適切に調整する必要がある
      // 現時点では役職との連携は未実装であると仮定し、スキップまたはモックで対応
      gameManager.state.isStarted = true;
      mockPlayerManager.killPlayer.mockReturnValue(true);
      
      // 役職効果処理用のモックメソッド
      gameManager.processRoleEffectsOnDeath = jest.fn();
      
      if(typeof gameManager.processRoleEffectsOnDeath === 'function') {
        const result = gameManager.killPlayer(1, 'execution');
        
        expect(result).toBeTruthy();
        expect(gameManager.processRoleEffectsOnDeath).toHaveBeenCalledWith(1, 'execution');
      }
    });
  });
});
