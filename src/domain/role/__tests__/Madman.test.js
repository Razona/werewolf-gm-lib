/**
 * Madman (狂人) クラステスト
 */

describe('Madman', () => {
  // モック設定
  const mockEventEmit = jest.fn();
  const mockGetAllPlayers = jest.fn();
  
  let Madman;
  let madman;
  
  // モックゲームの作成
  const mockGame = {
    eventSystem: {
      emit: mockEventEmit
    },
    getAllPlayers: mockGetAllPlayers
  };
  
  beforeEach(() => {
    // モック関数のリセット
    jest.clearAllMocks();
    
    // モジュールの再読み込み
    jest.resetModules();
    Madman = require('../Madman').Madman;
    
    // テスト用のインスタンス作成
    madman = new Madman(mockGame);
    madman.playerId = 1;
    madman.isAlive = true;
  });
  
  describe('初期化', () => {
    test('正しく初期化されること', () => {
      expect(madman.name).toBe('madman');
      expect(madman.displayName).toBe('狂人');
      expect(madman.team).toBe('werewolf');
      expect(madman.actions).toEqual([]);
    });
    
    test('メタデータが正しく設定されていること', () => {
      expect(madman.metadata.description).toContain('人狼陣営');
      expect(madman.metadata.abilities).toContain('特殊能力なし');
      expect(madman.metadata.winCondition).toContain('人狼陣営の勝利条件');
    });
  });
  
  describe('占い・霊媒結果', () => {
    test('占い結果が村人(white)であること', () => {
      expect(madman.getFortuneResult()).toBe('white');
    });
    
    test('霊媒結果が村人(white)であること', () => {
      expect(madman.getMediumResult()).toBe('white');
    });
  });
  
  describe('能力関連', () => {
    test('能力が使用できないこと', () => {
      expect(madman.canUseAbility(1)).toBe(false);
    });
    
    test('能力対象が空配列であること', () => {
      expect(madman.getAbilityTargets()).toEqual([]);
    });
    
    test('夜行動が何も行わないこと', () => {
      expect(madman.onNightAction(2, 1)).toBeNull();
    });
  });
  
  describe('ゲーム開始時の処理', () => {
    test('ゲーム開始時に人狼プレイヤー情報を取得すること', () => {
      // 人狼プレイヤーを含むプレイヤーリストをモック
      const allPlayers = [
        { id: 1, name: '狂人プレイヤー', role: { name: 'madman' } },
        { id: 2, name: '人狼プレイヤー1', role: { name: 'werewolf' } },
        { id: 3, name: '村人プレイヤー', role: { name: 'villager' } },
        { id: 4, name: '人狼プレイヤー2', role: { name: 'werewolf' } }
      ];
      mockGetAllPlayers.mockReturnValue(allPlayers);
      
      // ゲーム開始処理
      madman.onGameStart();
      
      // イベント発火の確認
      expect(mockEventEmit).toHaveBeenCalledWith('madman.know_werewolves', {
        playerId: 1,
        werewolves: [
          { id: 2, name: '人狼プレイヤー1' },
          { id: 4, name: '人狼プレイヤー2' }
        ]
      });
    });
    
    test('人狼プレイヤーがいない場合はイベントを発火しないこと', () => {
      // 人狼プレイヤーを含まないプレイヤーリストをモック
      const allPlayers = [
        { id: 1, name: '狂人プレイヤー', role: { name: 'madman' } },
        { id: 3, name: '村人プレイヤー1', role: { name: 'villager' } },
        { id: 5, name: '村人プレイヤー2', role: { name: 'villager' } }
      ];
      mockGetAllPlayers.mockReturnValue(allPlayers);
      
      // ゲーム開始処理
      madman.onGameStart();
      
      // イベント発火されていないこと
      expect(mockEventEmit).not.toHaveBeenCalled();
    });
  });
  
  describe('人狼プレイヤーの取得', () => {
    test('人狼プレイヤーのみをフィルタリングすること', () => {
      // 様々な役職のプレイヤーリストをモック
      const allPlayers = [
        { id: 1, name: '狂人プレイヤー', role: { name: 'madman' } },
        { id: 2, name: '人狼プレイヤー1', role: { name: 'werewolf' } },
        { id: 3, name: '村人プレイヤー', role: { name: 'villager' } },
        { id: 4, name: '人狼プレイヤー2', role: { name: 'werewolf' } },
        { id: 5, name: '占い師プレイヤー', role: { name: 'seer' } }
      ];
      mockGetAllPlayers.mockReturnValue(allPlayers);
      
      // 人狼プレイヤー取得
      const werewolves = madman.getWerewolfPlayers();
      
      // 人狼のみフィルタリングされていることを確認
      expect(werewolves).toHaveLength(2);
      expect(werewolves[0].id).toBe(2);
      expect(werewolves[1].id).toBe(4);
    });
    
    test('役職情報がないプレイヤーは除外されること', () => {
      // 役職情報が欠けているプレイヤーを含むリスト
      const allPlayers = [
        { id: 1, name: '狂人プレイヤー', role: { name: 'madman' } },
        { id: 2, name: '人狼プレイヤー', role: { name: 'werewolf' } },
        { id: 3, name: '役職なし', role: null },
        { id: 4, name: '不完全なプレイヤー' } // role自体がない
      ];
      mockGetAllPlayers.mockReturnValue(allPlayers);
      
      // 人狼プレイヤー取得
      const werewolves = madman.getWerewolfPlayers();
      
      // 人狼のみが含まれること
      expect(werewolves).toHaveLength(1);
      expect(werewolves[0].id).toBe(2);
    });
  });
});
