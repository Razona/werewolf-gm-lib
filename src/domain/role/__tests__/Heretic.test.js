/**
 * Heretic (背徳者) クラステスト
 */
describe('Heretic', () => {
  // モック設定
  const mockEventEmit = jest.fn();
  const mockEventOn = jest.fn();
  const mockGetAllPlayers = jest.fn();
  const mockGetCurrentPhase = jest.fn().mockReturnValue('night');
  const mockGetCurrentTurn = jest.fn().mockReturnValue(1);

  const mockGame = {
    eventSystem: {
      emit: mockEventEmit,
      on: mockEventOn
    },
    getAllPlayers: mockGetAllPlayers,
    phaseManager: {
      getCurrentPhase: mockGetCurrentPhase,
      getCurrentTurn: mockGetCurrentTurn
    }
  };

  // インポート
  let Heretic;
  
  beforeEach(() => {
    // モックをリセット
    jest.resetModules();
    jest.clearAllMocks();

    // Heretic クラスをインポート
    Heretic = require('../Heretic').Heretic;
  });

  describe('基本属性', () => {
    test('正しい初期属性を持つこと', () => {
      const heretic = new Heretic(mockGame);
      
      expect(heretic.name).toBe('heretic');
      expect(heretic.displayName).toBe('背徳者');
      expect(heretic.team).toBe('fox');
      expect(heretic.isAlive).toBe(true);
      expect(heretic.foxPlayerId).toBeNull(); // 最初は妖狐プレイヤーIDが未設定
    });

    test('占い結果が「白」であること', () => {
      const heretic = new Heretic(mockGame);
      expect(heretic.getFortuneResult()).toBe('white');
    });

    test('霊媒結果が「白」であること', () => {
      const heretic = new Heretic(mockGame);
      expect(heretic.getMediumResult()).toBe('white');
    });
  });

  describe('妖狐との関連付け', () => {
    test('linkToFox でプレイヤーIDを関連付けられること', () => {
      const heretic = new Heretic(mockGame);
      heretic.linkToFox(3);
      
      expect(heretic.foxPlayerId).toBe(3);
    });

    test('ゲーム開始時にイベントリスナーが登録されること', () => {
      const heretic = new Heretic(mockGame);
      heretic.onGameStart();
      
      expect(mockEventOn).toHaveBeenCalledWith('fox.death', expect.any(Function));
    });
  });

  describe('イベントハンドラー', () => {
    test('fox.death イベントで関連する妖狐が死亡したとき、背徳者も死亡すること', () => {
      const heretic = new Heretic(mockGame);
      heretic.assignToPlayer(2);
      heretic.linkToFox(3);

      // 実際のhandleFoxDeathメソッドを使用
      // (mockEventOnが実際に呼ばれているかは別途チェックする)
      const eventCallback = heretic.handleFoxDeath;
      
      // fox.death イベントをシミュレート
      eventCallback({
        foxId: 3,
        cause: 'execution'
      });
      
      // 背徳者が死亡したことを確認
      expect(heretic.isAlive).toBe(false);
      expect(mockEventEmit).toHaveBeenCalledWith('player.death', {
        playerId: 2,
        cause: 'follow_fox',
        turn: 1
      });
    });

    test('関連していない妖狐が死亡しても背徳者は死亡しないこと', () => {
      const heretic = new Heretic(mockGame);
      heretic.assignToPlayer(2);
      heretic.linkToFox(3);

      // 実際のhandleFoxDeathメソッドを使用
      const eventCallback = heretic.handleFoxDeath;
      
      // 別の妖狐の fox.death イベントをシミュレート
      eventCallback({
        foxId: 4, // 関連していない妖狐ID
        cause: 'execution'
      });
      
      // 背徳者が生存していることを確認
      expect(heretic.isAlive).toBe(true);
      expect(mockEventEmit).not.toHaveBeenCalled();
    });

    test('背徳者が既に死亡している場合、妖狐の死亡に反応しないこと', () => {
      const heretic = new Heretic(mockGame);
      heretic.assignToPlayer(2);
      heretic.linkToFox(3);
      heretic.isAlive = false; // 背徳者を死亡状態に

      // 実際のhandleFoxDeathメソッドを使用
      const eventCallback = heretic.handleFoxDeath;
      
      // fox.death イベントをシミュレート
      eventCallback({
        foxId: 3,
        cause: 'execution'
      });
      
      // イベントが発火されないことを確認
      expect(mockEventEmit).not.toHaveBeenCalled();
    });
  });

  describe('能力使用', () => {
    test('能動的な能力を持たないこと', () => {
      const heretic = new Heretic(mockGame);
      expect(heretic.canUseAbility(1)).toBe(false);
      expect(heretic.getAbilityTargets()).toEqual([]);
    });
  });

  describe('複合状態', () => {
    test('自分自身が死亡したら妖狐への連動も解除されること', () => {
      const heretic = new Heretic(mockGame);
      heretic.assignToPlayer(2);
      heretic.linkToFox(3);
      
      // 自分自身の死亡をシミュレート
      heretic.onDeath('execution');
      
      // 実際のhandleFoxDeathメソッドを使用
      const eventCallback = heretic.handleFoxDeath;
      eventCallback({
        foxId: 3,
        cause: 'execution'
      });
      
      expect(mockEventEmit).not.toHaveBeenCalledWith('player.death', expect.anything());
    });
  });
});
