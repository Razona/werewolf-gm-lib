/**
 * Phase クラスのテスト
 * 
 * 人狼ゲームのフェーズを表現する Phase クラスのテスト
 */

import Phase from '../Phase';

// モック
jest.mock('../../../core/event/EventSystem');

describe('Phase クラス', () => {
  // テスト前に実行する共通処理
  beforeEach(() => {
    // Date.now のモック化
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    
    // EventSystem のモック化は jest.mock でインポート時に行う
  });

  // テスト後に実行する共通処理
  afterEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('インスタンス生成', () => {
    test('必須パラメータのみで正常に生成できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack']
      });

      expect(phase).toBeInstanceOf(Phase);
      expect(phase.id).toBe('night');
      expect(phase.displayName).toBe('夜フェーズ');
      expect(phase.allowedActions).toEqual(['fortune', 'guard', 'attack']);
    });

    test('全パラメータを指定して正常に生成できる', () => {
      const visibilityPolicy = {
        showDeadPlayers: true,
        showRoles: false,
        showVotes: false
      };
      const metadata = { custom: 'data' };

      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        description: '役職能力を使用します',
        allowedActions: ['fortune', 'guard', 'attack'],
        requiredActions: ['fortune'],
        timeLimit: 60,
        visibilityPolicy,
        metadata
      });

      expect(phase).toBeInstanceOf(Phase);
      expect(phase.id).toBe('night');
      expect(phase.displayName).toBe('夜フェーズ');
      expect(phase.description).toBe('役職能力を使用します');
      expect(phase.allowedActions).toEqual(['fortune', 'guard', 'attack']);
      expect(phase.requiredActions).toEqual(['fortune']);
      expect(phase.timeLimit).toBe(60);
      expect(phase.visibilityPolicy).toEqual(visibilityPolicy);
      expect(phase.metadata).toEqual(metadata);
    });

    test('IDがない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          displayName: '夜フェーズ',
          allowedActions: ['fortune', 'guard', 'attack']
        });
      }).toThrow('フェーズIDは必須です');
    });

    test('displayNameがない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          id: 'night',
          allowedActions: ['fortune', 'guard', 'attack']
        });
      }).toThrow('フェーズ表示名は必須です');
    });

    test('allowedActionsがない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          id: 'night',
          displayName: '夜フェーズ'
        });
      }).toThrow('許可アクションリストは必須です');
    });

    test('allowedActionsが配列でない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          id: 'night',
          displayName: '夜フェーズ',
          allowedActions: 'fortune'
        });
      }).toThrow('許可アクションリストは配列である必要があります');
    });
  });

  describe('属性の検証', () => {
    test('フェーズIDが正確に設定・取得できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      expect(phase.id).toBe('night');
    });

    test('表示名が正確に設定・取得できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      expect(phase.displayName).toBe('夜フェーズ');
    });

    test('説明文が正確に設定・取得できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        description: '役職能力を使用します',
        allowedActions: []
      });

      expect(phase.description).toBe('役職能力を使用します');
    });

    test('説明文が指定されない場合、デフォルト値が設定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      expect(phase.description).toBe(''); // デフォルト値は空文字列
    });

    test('allowedActionsが正確に設定・取得できる', () => {
      const allowedActions = ['fortune', 'guard', 'attack'];
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions
      });

      expect(phase.allowedActions).toEqual(allowedActions);
      // 配列のコピーが返されることを確認（オリジナルの変更防止）
      expect(phase.allowedActions).not.toBe(allowedActions);
    });

    test('requiredActionsが正確に設定・取得できる', () => {
      const requiredActions = ['fortune'];
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack'],
        requiredActions
      });

      expect(phase.requiredActions).toEqual(requiredActions);
      // 配列のコピーが返されることを確認
      expect(phase.requiredActions).not.toBe(requiredActions);
    });

    test('requiredActionsが指定されない場合、デフォルト値が設定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack']
      });

      expect(phase.requiredActions).toEqual([]);
    });

    test('timeLimitが正確に設定・取得できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60
      });

      expect(phase.timeLimit).toBe(60);
    });

    test('timeLimitが指定されない場合、デフォルト値が設定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      expect(phase.timeLimit).toBeNull(); // デフォルト値はnull（時間制限なし）
    });

    test('metadataが正確に設定・取得できる', () => {
      const metadata = { custom: 'data' };
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        metadata
      });

      expect(phase.metadata).toEqual(metadata);
      // オブジェクトのコピーが返されることを確認
      expect(phase.metadata).not.toBe(metadata);
    });

    test('metadataが指定されない場合、デフォルト値が設定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      expect(phase.metadata).toEqual({});
    });
  });

  describe('可視性ポリシーのテスト', () => {
    test('デフォルトの可視性ポリシーが設定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      // デフォルト値の検証
      expect(phase.visibilityPolicy).toEqual({
        showDeadPlayers: true,
        showRoles: false,
        showVotes: false
      });
    });

    test('カスタム可視性ポリシーが設定できる', () => {
      const customPolicy = {
        showDeadPlayers: false,
        showRoles: true,
        showVotes: true
      };

      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        visibilityPolicy: customPolicy
      });

      expect(phase.visibilityPolicy).toEqual(customPolicy);
      // オブジェクトのコピーが返されることを確認
      expect(phase.visibilityPolicy).not.toBe(customPolicy);
    });

    test('可視性ポリシーを動的に更新できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      const newPolicy = {
        showDeadPlayers: false,
        showRoles: true,
        showVotes: true
      };

      phase.updateVisibilityPolicy(newPolicy);
      expect(phase.visibilityPolicy).toEqual(newPolicy);
    });

    test('可視性ポリシーを部分的に更新できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      // 初期状態
      expect(phase.visibilityPolicy).toEqual({
        showDeadPlayers: true,
        showRoles: false,
        showVotes: false
      });

      // 部分更新
      phase.updateVisibilityPolicy({ showRoles: true });

      // 他のプロパティは維持され、指定したプロパティのみ更新される
      expect(phase.visibilityPolicy).toEqual({
        showDeadPlayers: true,
        showRoles: true,
        showVotes: false
      });
    });
    
    test('不正なプロパティを含む可視性ポリシー更新は無視される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      // 初期状態
      expect(phase.visibilityPolicy).toEqual({
        showDeadPlayers: true,
        showRoles: false,
        showVotes: false
      });

      // 不正なプロパティを含む更新
      phase.updateVisibilityPolicy({
        showRoles: true,
        invalidProperty: 'value'
      });

      // 有効なプロパティのみが更新され、無効なプロパティは無視される
      expect(phase.visibilityPolicy).toEqual({
        showDeadPlayers: true,
        showRoles: true,
        showVotes: false
      });
      expect(phase.visibilityPolicy.invalidProperty).toBeUndefined();
    });
  });

  describe('ライフサイクルメソッドテスト', () => {
    // ゲームオブジェクトのモック作成
    const mockEventEmit = jest.fn();
    const mockGame = {
      eventSystem: {
        emit: mockEventEmit
      },
      phaseManager: {
        getCurrentTurn: jest.fn().mockReturnValue(2)
      }
    };

    beforeEach(() => {
      // 各テスト前にモックをリセット
      mockEventEmit.mockClear();
    });

    test('onPhaseStartメソッドが適切に動作する', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      phase.onPhaseStart(mockGame);

      // 開始時刻が設定されている
      expect(phase.startTime).toBe(1000);

      // 適切なイベントが発火された
      expect(mockEventEmit).toHaveBeenCalledWith('phase.start.night', {
        phase: 'night',
        turn: 2,
        displayName: '夜フェーズ',
        startTime: 1000
      });
    });

    test('onPhaseEndメソッドが適切に動作する', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      // Date.nowを更新して経過時間をシミュレート
      jest.spyOn(Date, 'now').mockImplementation(() => 6000);

      phase.onPhaseEnd(mockGame);

      // 経過時間が計算されている
      expect(phase.duration).toBe(5000);

      // 適切なイベントが発火された
      expect(mockEventEmit).toHaveBeenCalledWith('phase.end.night', {
        phase: 'night',
        turn: 2,
        displayName: '夜フェーズ',
        startTime: 1000,
        endTime: 6000,
        duration: 5000
      });
    });

    test('開始されていないフェーズに対してonPhaseEndを呼ぶとエラーになる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: []
      });

      expect(() => {
        phase.onPhaseEnd(mockGame);
      }).toThrow('フェーズが開始されていません');
    });
  });

  describe('時間制限機能テスト', () => {
    test('時間制限が設定されている場合、残り時間が正確に計算される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60 // 60秒
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      // 10秒経過した状態をシミュレート
      jest.spyOn(Date, 'now').mockImplementation(() => 11000);

      // 残り時間は50秒
      expect(phase.getRemainingTime()).toBe(50);
    });

    test('時間制限がない場合、残り時間はnullを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: null // 時間制限なし
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      expect(phase.getRemainingTime()).toBeNull();
    });

    test('フェーズが開始されていない場合、残り時間はnullを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60
      });

      // フェーズはまだ開始されていない
      expect(phase.getRemainingTime()).toBeNull();
    });

    test('時間制限内であればisTimeLimitReachedはfalseを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60 // 60秒
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      // 10秒経過した状態をシミュレート
      jest.spyOn(Date, 'now').mockImplementation(() => 11000);

      expect(phase.isTimeLimitReached()).toBe(false);
    });

    test('時間制限を超過した場合、isTimeLimitReachedはtrueを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60 // 60秒
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      // 70秒経過した状態をシミュレート
      jest.spyOn(Date, 'now').mockImplementation(() => 71000);

      expect(phase.isTimeLimitReached()).toBe(true);
    });

    test('時間制限がない場合、isTimeLimitReachedは常にfalseを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: null // 時間制限なし
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      // 非常に長い時間経過してもfalse
      jest.spyOn(Date, 'now').mockImplementation(() => 100000000);

      expect(phase.isTimeLimitReached()).toBe(false);
    });

    test('フェーズが開始されていない場合、isTimeLimitReachedはfalseを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60
      });

      // フェーズはまだ開始されていない
      expect(phase.isTimeLimitReached()).toBe(false);
    });

    test('ちょうど時間制限と同じ時間が経過した場合、isTimeLimitReachedはtrueを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 60 // 60秒
      });

      // フェーズ開始を模擬
      phase.startTime = 1000;

      // 60秒ちょうど経過した状態をシミュレート
      jest.spyOn(Date, 'now').mockImplementation(() => 61000);

      expect(phase.isTimeLimitReached()).toBe(true);
    });
  });

  describe('アクション許可チェックテスト', () => {
    test('許可されたアクションがtrueと判定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack']
      });

      expect(phase.isActionAllowed('fortune')).toBe(true);
      expect(phase.isActionAllowed('guard')).toBe(true);
      expect(phase.isActionAllowed('attack')).toBe(true);
    });

    test('許可されていないアクションがfalseと判定される', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack']
      });

      expect(phase.isActionAllowed('vote')).toBe(false);
      expect(phase.isActionAllowed('execution')).toBe(false);
    });

    test('不正な引数の場合はfalseを返す', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack']
      });

      expect(phase.isActionAllowed('')).toBe(false);
      expect(phase.isActionAllowed(null)).toBe(false);
      expect(phase.isActionAllowed(undefined)).toBe(false);
      expect(phase.isActionAllowed(123)).toBe(false);
    });

    test('大文字小文字を区別する', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune']
      });

      expect(phase.isActionAllowed('fortune')).toBe(true);
      expect(phase.isActionAllowed('Fortune')).toBe(false);
      expect(phase.isActionAllowed('FORTUNE')).toBe(false);
    });
  });

  describe('エッジケース処理', () => {
    test('非常に長いIDや表示名でも正常に処理できる', () => {
      const longId = 'a'.repeat(1000);
      const longName = 'あ'.repeat(1000);

      const phase = new Phase({
        id: longId,
        displayName: longName,
        allowedActions: []
      });

      expect(phase.id).toBe(longId);
      expect(phase.displayName).toBe(longName);
    });

    test('特殊文字を含むIDや表示名でも正常に処理できる', () => {
      const specialId = 'night-special_#$%';
      const specialName = '夜フェーズ！＃＄％＆';

      const phase = new Phase({
        id: specialId,
        displayName: specialName,
        allowedActions: []
      });

      expect(phase.id).toBe(specialId);
      expect(phase.displayName).toBe(specialName);
    });

    test('非常に多くのallowedActionsでも正常に処理できる', () => {
      const manyActions = Array.from({ length: 1000 }, (_, i) => `action${i}`);

      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: manyActions
      });

      expect(phase.allowedActions).toEqual(manyActions);
      expect(phase.allowedActions.length).toBe(1000);
    });

    test('マイナスの時間制限は0として扱われる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: -60
      });

      expect(phase.timeLimit).toBe(0);
    });

    test('数値でない時間制限はnullとして扱われる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: [],
        timeLimit: 'invalid'
      });

      expect(phase.timeLimit).toBeNull();
    });
  });
});
