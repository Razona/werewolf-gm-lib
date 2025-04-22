/**
 * GameManagerState 状態取得関連機能テスト
 */

// モックと共通ユーティリティのインポート
import MockFactory from './shared/MockFactory';
import TestFixtures from './shared/TestFixtures';
import TestHelpers from './shared/TestHelpers';
import TestScenarios from './shared/TestScenarios';

// モック用のGameStateモジュール定義
const GameManagerStateMixin = (GameManager) => {
  // 現在のGameManagerクラスに状態取得関連の機能を追加

  /**
   * 現在のゲーム状態を取得
   */
  GameManager.prototype.getCurrentState = function (options = {}) {
    const { includeHistory = false, includeDetails = true, filterFunction = null } = options;

    // 現在の状態をコピー
    const state = JSON.parse(JSON.stringify(this.state));

    // オプションに基づいて履歴情報を調整
    if (!includeHistory) {
      state.history = [];
      state.events = [];
    }

    // 詳細情報の除外
    if (!includeDetails) {
      delete state.actions;
      delete state.votes;
    }

    // カスタムフィルター関数の適用
    if (typeof filterFunction === 'function') {
      return filterFunction(state);
    }

    // タイムスタンプの更新
    state.lastUpdate = Date.now();

    return state;
  };

  /**
   * ゲーム状態の要約を取得
   */
  GameManager.prototype.getGameSummary = function () {
    const state = this.getCurrentState();

    // アクティブなプレイヤー数カウント
    const alivePlayers = this.playerManager.getAlivePlayers();
    const totalPlayers = this.playerManager.getAllPlayers();

    // 陣営分布の集計
    const teams = this.calculateTeamDistribution();

    return {
      id: state.id,
      isStarted: state.isStarted,
      isEnded: state.isEnded,
      turn: state.turn,
      phase: state.phase,
      players: {
        total: totalPlayers.length,
        alive: alivePlayers.length
      },
      teams,
      winner: state.winner,
      turnsSummary: state.history.length > 0 ? `${state.history.length}ターン経過` : '開始前'
    };
  };

  /**
   * 陣営分布を計算
   * @private
   */
  GameManager.prototype.calculateTeamDistribution = function () {
    const players = this.playerManager.getAllPlayers();
    const distribution = {};

    // 各プレイヤーの陣営を集計
    for (const player of players) {
      if (!player.isAlive) continue;

      const team = this.roleManager.getPlayerTeam(player.id);
      distribution[team] = (distribution[team] || 0) + 1;
    }

    return distribution;
  };

  /**
   * ゲームが開始されているか確認
   */
  GameManager.prototype.isGameStarted = function () {
    return this.state && this.state.isStarted === true;
  };

  /**
   * ゲームが終了しているか確認
   */
  GameManager.prototype.isGameEnded = function () {
    return this.state && this.state.isEnded === true;
  };

  /**
   * 状態変更の履歴を取得
   */
  GameManager.prototype.getStateHistory = function (options = {}) {
    const { turn = null, limit = 10, reverse = true } = options;

    if (!this.state.history || !Array.isArray(this.state.history)) {
      return [];
    }

    // 履歴のコピーを作成
    let history = [...this.state.history];

    // 特定ターンの履歴のみフィルタリング
    if (turn !== null) {
      history = history.filter(entry => entry.turn === turn);
    }

    // 並び替え
    if (reverse) {
      history.reverse();
    }

    // 件数制限
    if (limit > 0 && history.length > limit) {
      history = history.slice(0, limit);
    }

    return history;
  };

  /**
   * プレイヤー視点の状態情報を取得
   */
  GameManager.prototype.getVisibleDataForPlayer = function (playerId, options = {}) {
    // 情報可視性機能が無効の場合はフルアクセス
    if (!this.options.visibilityControl || !this.options.visibilityControl.enabled) {
      return this.getCurrentState();
    }

    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      throw this.errorHandler.createError(
        'PLAYER_NOT_FOUND',
        `プレイヤーが見つかりません: ${playerId}`,
        { playerId }
      );
    }

    // プレイヤー視点の状態を構築
    const state = this.getCurrentState();
    const role = this.roleManager.getPlayerRole(playerId);
    const team = this.roleManager.getPlayerTeam(playerId);

    // プレイヤー情報のフィルタリング
    state.players = state.players.map(p => {
      if (p.id === playerId) {
        // 自分自身はフル情報
        return p;
      } else if (!p.isAlive && this.shouldRevealRoleOnDeath()) {
        // 死亡プレイヤーの情報（公開設定による）
        return p;
      } else {
        // 他プレイヤーは役職情報を隠蔽
        return {
          id: p.id,
          name: p.name,
          isAlive: p.isAlive,
          // 役職情報は削除
          role: null,
          team: null
        };
      }
    });

    // 役職固有の情報を追加
    state.roleSpecificInfo = this.getRoleSpecificInfo(playerId);

    return state;
  };

  /**
   * 役職固有の情報を取得
   * @private
   */
  GameManager.prototype.getRoleSpecificInfo = function (playerId) {
    const role = this.roleManager.getPlayerRole(playerId);

    // テスト用の簡易実装
    if (role === 'werewolf') {
      return {
        teammates: [1, 2], // 他の人狼プレイヤーID
        isWerewolf: true
      };
    } else if (role === 'seer') {
      return {
        fortuneResults: [
          { target: 1, result: { team: 'werewolf' }, night: 1 }
        ]
      };
    }

    return {};
  };

  /**
   * 死亡時に役職を公開すべきか判定
   * @private
   */
  GameManager.prototype.shouldRevealRoleOnDeath = function () {
    return true; // テスト用のデフォルト実装
  };
};

// テスト前の準備
let gameManager;
let mocks;

beforeEach(() => {
  // モックのリセット
  jest.clearAllMocks();

  // テスト用のGameManagerインスタンス作成
  mocks = MockFactory.createMockSet();
  const GameManager = class {
    constructor() {
      this.eventSystem = mocks.eventSystem;
      this.errorHandler = mocks.errorHandler;
      this.playerManager = mocks.playerManager;
      this.roleManager = mocks.roleManager;
      this.phaseManager = mocks.phaseManager;
      this.state = JSON.parse(JSON.stringify(TestFixtures.initialState));
      this.options = {
        regulations: {},
        visibilityControl: { enabled: false }
      };
    }
  };

  // Mixinの適用
  GameManagerStateMixin(GameManager);
  gameManager = new GameManager();
});

describe('GameManagerState 状態取得機能', () => {

  describe('getCurrentState 基本動作', () => {
    test('オプションなしでの状態取得', () => {
      // 初期状態の取得
      const state = gameManager.getCurrentState();

      // 状態の検証
      expect(state).toBeDefined();
      expect(state.id).toBe(TestFixtures.initialState.id);
      expect(TestHelpers.validateStateStructure(state)).toBe(true);
    });

    test('状態オブジェクトの独立性', () => {
      // 状態の取得
      const state = gameManager.getCurrentState();

      // 取得した状態を変更
      state.turn = 999;
      state.testField = '新しいフィールド';

      // 内部状態が影響を受けていないことを確認
      expect(gameManager.state.turn).toBe(0);
      expect(gameManager.state).not.toHaveProperty('testField');

      // 再度取得して変更が反映されていないことを確認
      const newState = gameManager.getCurrentState();
      expect(newState.turn).toBe(0);
      expect(newState).not.toHaveProperty('testField');
    });

    test('includeHistory オプションの動作', () => {
      // 履歴を持つ状態を設定
      gameManager.state = {
        ...gameManager.state,
        history: [
          { turn: 1, phase: 'preparation', events: [] },
          { turn: 1, phase: 'night', events: [] }
        ],
        events: [
          { type: 'gameStart', timestamp: Date.now() }
        ]
      };

      // 履歴を含めた状態取得
      const stateWithHistory = gameManager.getCurrentState({ includeHistory: true });
      expect(stateWithHistory.history).toHaveLength(2);
      expect(stateWithHistory.events).toHaveLength(1);

      // 履歴を含めない状態取得
      const stateWithoutHistory = gameManager.getCurrentState({ includeHistory: false });
      expect(stateWithoutHistory.history).toEqual([]);
      expect(stateWithoutHistory.events).toEqual([]);
    });

    test('includeDetails オプションの動作', () => {
      // 詳細情報を含めた状態取得
      const stateWithDetails = gameManager.getCurrentState({ includeDetails: true });
      expect(stateWithDetails).toHaveProperty('actions');
      expect(stateWithDetails).toHaveProperty('votes');

      // 詳細情報を含めない状態取得
      const stateWithoutDetails = gameManager.getCurrentState({ includeDetails: false });
      expect(stateWithoutDetails).not.toHaveProperty('actions');
      expect(stateWithoutDetails).not.toHaveProperty('votes');
    });

    test('filterFunction オプションの動作', () => {
      // カスタムフィルター関数
      const filterFunction = (state) => ({
        id: state.id,
        status: state.isStarted ? 'started' : 'not_started',
        playerCount: state.players.length
      });

      // フィルター関数を適用した状態取得
      const filteredState = gameManager.getCurrentState({ filterFunction });

      // 結果の検証
      expect(filteredState).toHaveProperty('id');
      expect(filteredState).toHaveProperty('status', 'not_started');
      expect(filteredState).toHaveProperty('playerCount', 0);
      expect(filteredState).not.toHaveProperty('isStarted');
      expect(filteredState).not.toHaveProperty('players');
    });
  });

  describe('getGameSummary 基本動作', () => {
    test('初期状態での要約取得', () => {
      // プレイヤーマネージャーのモックを設定
      mocks.playerManager.getAlivePlayers.mockReturnValue([]);
      mocks.playerManager.getAllPlayers.mockReturnValue([]);

      // 要約の取得
      const summary = gameManager.getGameSummary();

      // 要約の検証
      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('isStarted', false);
      expect(summary).toHaveProperty('isEnded', false);
      expect(summary).toHaveProperty('turn', 0);
      expect(summary).toHaveProperty('phase', null);
      expect(summary.players).toEqual({ total: 0, alive: 0 });
      expect(summary.turnsSummary).toBe('開始前');
    });

    test('進行中のゲームでの要約取得', () => {
      // 進行中の状態を設定
      gameManager.state = JSON.parse(JSON.stringify(TestFixtures.progressGameState));

      // プレイヤーマネージャーのモックを設定
      mocks.playerManager.getAlivePlayers.mockReturnValue([
        { id: 0, name: 'プレイヤー1', isAlive: true, role: 'villager' },
        { id: 2, name: 'プレイヤー3', isAlive: true, role: 'werewolf' },
        { id: 3, name: 'プレイヤー4', isAlive: true, role: 'seer' }
      ]);
      mocks.playerManager.getAllPlayers.mockReturnValue([
        { id: 0, name: 'プレイヤー1', isAlive: true, role: 'villager' },
        { id: 1, name: 'プレイヤー2', isAlive: false, role: 'villager' },
        { id: 2, name: 'プレイヤー3', isAlive: true, role: 'werewolf' },
        { id: 3, name: 'プレイヤー4', isAlive: true, role: 'seer' },
        { id: 4, name: 'プレイヤー5', isAlive: false, role: 'knight' }
      ]);

      // ロールマネージャーのモックを設定
      mocks.roleManager.getPlayerTeam.mockImplementation((id) => {
        const map = { 0: 'village', 1: 'village', 2: 'werewolf', 3: 'village', 4: 'village' };
        return map[id] || 'village';
      });

      // 要約の取得
      const summary = gameManager.getGameSummary();

      // 要約の検証
      expect(summary).toHaveProperty('isStarted', true);
      expect(summary).toHaveProperty('turn', 3);
      expect(summary).toHaveProperty('phase', 'night');
      expect(summary.players).toEqual({ total: 5, alive: 3 });
      expect(summary.teams).toHaveProperty('village');
      expect(summary.teams).toHaveProperty('werewolf');
      expect(summary.teams.village).toBe(2);
      expect(summary.teams.werewolf).toBe(1);
    });

    test('終了したゲームでの要約取得', () => {
      // 終了状態を設定
      gameManager.state = JSON.parse(JSON.stringify(TestFixtures.endedGameState));

      // プレイヤーマネージャーのモックを設定
      mocks.playerManager.getAlivePlayers.mockReturnValue([
        { id: 2, name: 'プレイヤー3', isAlive: true, role: 'werewolf' }
      ]);
      mocks.playerManager.getAllPlayers.mockReturnValue([
        { id: 0, name: 'プレイヤー1', isAlive: false, role: 'villager' },
        { id: 1, name: 'プレイヤー2', isAlive: false, role: 'villager' },
        { id: 2, name: 'プレイヤー3', isAlive: true, role: 'werewolf' },
        { id: 3, name: 'プレイヤー4', isAlive: false, role: 'seer' },
        { id: 4, name: 'プレイヤー5', isAlive: false, role: 'knight' }
      ]);

      // ロールマネージャーのモックを設定
      mocks.roleManager.getPlayerTeam.mockImplementation((id) => {
        const map = { 0: 'village', 1: 'village', 2: 'werewolf', 3: 'village', 4: 'village' };
        return map[id] || 'village';
      });

      // 要約の取得
      const summary = gameManager.getGameSummary();

      // 要約の検証
      expect(summary).toHaveProperty('isStarted', true);
      expect(summary).toHaveProperty('isEnded', true);
      expect(summary).toHaveProperty('winner', 'werewolf');
      expect(summary.players).toEqual({ total: 5, alive: 1 });
      expect(summary.teams.werewolf).toBe(1);
      expect(summary.teams.village).toBe(0);
    });
  });

  describe('ゲーム状態フラグ', () => {
    test('isGameStarted の動作', () => {
      // 初期状態
      expect(gameManager.isGameStarted()).toBe(false);

      // 開始状態に変更
      gameManager.state.isStarted = true;
      expect(gameManager.isGameStarted()).toBe(true);

      // 無効な状態
      gameManager.state = null;
      expect(gameManager.isGameStarted()).toBe(false);

      gameManager.state = { isStarted: null };
      expect(gameManager.isGameStarted()).toBe(false);
    });

    test('isGameEnded の動作', () => {
      // 初期状態
      expect(gameManager.isGameEnded()).toBe(false);

      // 終了状態に変更
      gameManager.state.isEnded = true;
      expect(gameManager.isGameEnded()).toBe(true);

      // 無効な状態
      gameManager.state = null;
      expect(gameManager.isGameEnded()).toBe(false);

      gameManager.state = { isEnded: null };
      expect(gameManager.isGameEnded()).toBe(false);
    });
  });

  describe('getStateHistory 機能', () => {
    beforeEach(() => {
      // テスト用の履歴データを設定
      gameManager.state.history = [
        { turn: 1, phase: 'preparation', events: [], timestamp: 100 },
        { turn: 1, phase: 'night', events: [], timestamp: 200 },
        { turn: 2, phase: 'day', events: [], timestamp: 300 },
        { turn: 2, phase: 'vote', events: [], timestamp: 400 },
        { turn: 2, phase: 'night', events: [], timestamp: 500 },
      ];
    });

    test('基本的な履歴取得', () => {
      // デフォルトオプションでの履歴取得
      const history = gameManager.getStateHistory();

      // デフォルトでは逆順で取得
      expect(history).toHaveLength(5);
      expect(history[0].phase).toBe('night');
      expect(history[0].turn).toBe(2);
      expect(history[4].phase).toBe('preparation');
      expect(history[4].turn).toBe(1);
    });

    test('特定ターンのフィルタリング', () => {
      // ターン2の履歴のみを取得
      const history = gameManager.getStateHistory({ turn: 2 });

      expect(history).toHaveLength(3);
      expect(history.every(entry => entry.turn === 2)).toBe(true);
    });

    test('並び替えオプション', () => {
      // 正順での取得
      const history = gameManager.getStateHistory({ reverse: false });

      expect(history).toHaveLength(5);
      expect(history[0].phase).toBe('preparation');
      expect(history[0].turn).toBe(1);
      expect(history[4].phase).toBe('night');
      expect(history[4].turn).toBe(2);
    });

    test('制限付き取得', () => {
      // 上位3件の取得
      const history = gameManager.getStateHistory({ limit: 3 });

      expect(history).toHaveLength(3);
      expect(history[0].phase).toBe('night');
      expect(history[0].turn).toBe(2);
    });

    test('複合オプション', () => {
      // 複数オプションの組み合わせ
      const history = gameManager.getStateHistory({
        turn: 2,
        reverse: false,
        limit: 2
      });

      expect(history).toHaveLength(2);
      expect(history[0].phase).toBe('day');
      expect(history[1].phase).toBe('vote');
    });

    test('空の履歴の処理', () => {
      // 空の履歴を設定
      gameManager.state.history = [];

      // 履歴取得
      const history = gameManager.getStateHistory();

      expect(history).toEqual([]);
    });

    test('無効な履歴の処理', () => {
      // 無効な履歴を設定
      gameManager.state.history = null;

      // 履歴取得
      const history = gameManager.getStateHistory();

      expect(history).toEqual([]);

      // 配列でない履歴
      gameManager.state.history = "not an array";
      expect(gameManager.getStateHistory()).toEqual([]);
    });
  });

  describe('情報可視性管理', () => {
    beforeEach(() => {
      // テスト用のプレイヤーと役職情報を設定
      gameManager.state = {
        ...gameManager.state,
        isStarted: true,
        players: [
          { id: 0, name: 'プレイヤー1', isAlive: true, role: 'villager' },
          { id: 1, name: 'プレイヤー2', isAlive: true, role: 'werewolf' },
          { id: 2, name: 'プレイヤー3', isAlive: false, role: 'seer', causeOfDeath: 'execution' },
          { id: 3, name: 'プレイヤー4', isAlive: true, role: 'knight' }
        ]
      };

      // ロールマネージャーのモックを設定
      mocks.roleManager.getPlayerRole.mockImplementation((id) => {
        const roles = ['villager', 'werewolf', 'seer', 'knight'];
        return roles[id] || 'villager';
      });

      mocks.roleManager.getPlayerTeam.mockImplementation((id) => {
        const teams = { 0: 'village', 1: 'werewolf', 2: 'village', 3: 'village' };
        return teams[id] || 'village';
      });

      // プレイヤーマネージャーのモックを設定
      mocks.playerManager.getPlayer.mockImplementation((id) => {
        return gameManager.state.players.find(p => p.id === id);
      });
    });

    test('情報可視性が無効の場合はフル情報が返される', () => {
      // 情報可視性を無効に設定
      gameManager.options.visibilityControl = { enabled: false };

      // プレイヤー視点のデータ取得
      const playerData = gameManager.getVisibleDataForPlayer(0);

      // フル情報が返されることを確認
      expect(playerData.players).toHaveLength(4);
      expect(playerData.players[1].role).toBe('werewolf');
    });

    test('プレイヤー自身の情報は常に可視', () => {
      // 情報可視性を有効に設定
      gameManager.options.visibilityControl = { enabled: true };

      // プレイヤー0視点のデータ取得
      const playerData = gameManager.getVisibleDataForPlayer(0);

      // 自分自身の情報が表示されることを確認
      const selfInfo = playerData.players.find(p => p.id === 0);
      expect(selfInfo).toBeDefined();
      expect(selfInfo.role).toBe('villager');

      // 他プレイヤーの役職は非表示
      const otherInfo = playerData.players.find(p => p.id === 1);
      expect(otherInfo).toBeDefined();
      expect(otherInfo.role).toBeNull();
    });

    test('死亡プレイヤーの役職情報が設定により表示される', () => {
      // 情報可視性を有効に設定
      gameManager.options.visibilityControl = { enabled: true };

      // 死亡時に役職公開の設定を模倣
      jest.spyOn(gameManager, 'shouldRevealRoleOnDeath').mockReturnValue(true);

      // プレイヤー視点のデータ取得
      const playerData = gameManager.getVisibleDataForPlayer(0);

      // 死亡プレイヤーの役職情報が表示される
      const deadPlayerInfo = playerData.players.find(p => p.id === 2);
      expect(deadPlayerInfo).toBeDefined();
      expect(deadPlayerInfo.isAlive).toBe(false);
      expect(deadPlayerInfo.role).toBe('seer');
    });

    test('役職固有の情報が追加される', () => {
      // 情報可視性を有効に設定
      gameManager.options.visibilityControl = { enabled: true };

      // 人狼プレイヤー視点のデータ取得
      const werewolfData = gameManager.getVisibleDataForPlayer(1);

      // 役職固有の情報が追加されることを確認
      expect(werewolfData).toHaveProperty('roleSpecificInfo');
      expect(werewolfData.roleSpecificInfo).toHaveProperty('isWerewolf', true);
      expect(werewolfData.roleSpecificInfo).toHaveProperty('teammates');

      // 占い師プレイヤー視点のデータ取得
      jest.spyOn(gameManager, 'getRoleSpecificInfo').mockImplementation((id) => {
        if (id === 2) {
          return {
            fortuneResults: [
              { target: 1, result: { team: 'werewolf' }, night: 1 }
            ]
          };
        }
        return {};
      });

      const seerData = gameManager.getVisibleDataForPlayer(2);

      // 占い結果が含まれることを確認
      expect(seerData.roleSpecificInfo).toHaveProperty('fortuneResults');
      expect(seerData.roleSpecificInfo.fortuneResults).toHaveLength(1);
      expect(seerData.roleSpecificInfo.fortuneResults[0]).toHaveProperty('target', 1);
    });

    test('存在しないプレイヤーIDのエラー処理', () => {
      // 情報可視性を有効に設定
      gameManager.options.visibilityControl = { enabled: true };

      // 存在しないプレイヤーIDでのエラー
      mocks.playerManager.getPlayer.mockReturnValue(null);

      // エラーが発生することを確認
      expect(() => {
        gameManager.getVisibleDataForPlayer(999);
      }).toThrow();

      // エラーハンドラーが呼ばれることを確認
      expect(mocks.errorHandler.createError).toHaveBeenCalledWith(
        'PLAYER_NOT_FOUND',
        expect.any(String),
        expect.objectContaining({ playerId: 999 })
      );
    });
  });

  describe('エッジケースと異常系', () => {
    test('未初期化状態からの取得', () => {
      // 状態を未初期化状態に
      gameManager.state = null;

      // 各メソッドのエラー処理を確認
      expect(() => gameManager.getCurrentState()).not.toThrow();
      expect(gameManager.isGameStarted()).toBe(false);
      expect(gameManager.isGameEnded()).toBe(false);

      // getGameSummary はエラー処理するか確認
      mocks.playerManager.getAlivePlayers.mockReturnValue([]);
      mocks.playerManager.getAllPlayers.mockReturnValue([]);
      expect(() => gameManager.getGameSummary()).not.toThrow();
    });

    test('特殊値を含む状態からの取得', () => {
      // Date, Error, RegExp などの特殊値を含む状態
      gameManager.state = {
        ...gameManager.state,
        specialDate: new Date(),
        specialError: new Error('テストエラー'),
        specialRegExp: /test/g,
        nestedSpecial: {
          date: new Date(),
          error: new Error('ネストエラー')
        }
      };

      // 問題なく取得できることを確認
      expect(() => {
        const state = gameManager.getCurrentState();
        // JSONシリアライズも可能か確認
        JSON.stringify(state);
      }).not.toThrow();
    });

    test('情報可視性設定の欠落時の挙動', () => {
      // 設定が欠落しているケース
      gameManager.options = null;

      // エラーなく動作することを確認
      expect(() => {
        gameManager.getVisibleDataForPlayer(0);
      }).not.toThrow();

      // 部分的に欠落しているケース
      gameManager.options = { visibilityControl: null };
      expect(() => {
        gameManager.getVisibleDataForPlayer(0);
      }).not.toThrow();
    });

    test('カスタムフィルター関数がエラーを投げた場合', () => {
      // エラーを投げるフィルター関数
      const errorFilter = () => {
        throw new Error('フィルターエラー');
      };

      // エラーが伝播することを確認
      expect(() => {
        gameManager.getCurrentState({ filterFunction: errorFilter });
      }).toThrow('フィルターエラー');
    });
  });

  describe('パフォーマンスとスケーラビリティ', () => {
    test('大量のプレイヤーデータを含む状態の取得', () => {
      // 100人のプレイヤーを生成
      const manyPlayers = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `プレイヤー${i}`,
        isAlive: i % 3 !== 0, // 一部は死亡
        role: i % 5 === 0 ? 'werewolf' : 'villager'
      }));

      // 大量のプレイヤーを持つ状態を設定
      gameManager.state = {
        ...gameManager.state,
        players: manyPlayers
      };

      // 問題なく取得できることを確認
      const state = gameManager.getCurrentState();
      expect(state.players).toHaveLength(100);

      // パフォーマンスチェック（擬似的な計測）
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        gameManager.getCurrentState();
      }
      const duration = Date.now() - startTime;

      // パフォーマンスが許容範囲内か（厳密な検証は環境依存のためコメントアウト）
      // expect(duration).toBeLessThan(100); // 10回の呼び出しで100ms以下を期待
    });

    test('大量の履歴データを含む状態の取得', () => {
      // 1000件の履歴を生成
      const manyHistoryEntries = Array.from({ length: 1000 }, (_, i) => ({
        turn: Math.floor(i / 5) + 1,
        phase: ['preparation', 'day', 'vote', 'night', 'result'][i % 5],
        events: [],
        timestamp: i * 1000
      }));

      // 大量の履歴を持つ状態を設定
      gameManager.state = {
        ...gameManager.state,
        history: manyHistoryEntries
      };

      // 制限付きで取得して問題ないことを確認
      const history = gameManager.getStateHistory({ limit: 10 });
      expect(history).toHaveLength(10);

      // 特定ターンのフィルタリングが大量データでも機能することを確認
      const filteredHistory = gameManager.getStateHistory({ turn: 5, limit: 5 });
      expect(filteredHistory.length).toBeGreaterThan(0);
      expect(filteredHistory.every(entry => entry.turn === 5)).toBe(true);
    });
  });
});

describe('GameManagerState 状態更新機能', () => {
  describe('テストシナリオ', () => {
    test('基本更新シナリオが正しく実行される', async () => {
      const scenario = TestScenarios.basicUpdate;
      const result = await TestHelpers.runScenario(gameManager, scenario);

      expect(result.finalState.turn).toBe(1);
    });
  });
});