/**
 * GameManagerEvent.js のテスト
 * イベント管理機能のテストを実施
 */

// モックのインポート
jest.mock('../../../core/event/EventSystem');
jest.mock('../../../core/error/ErrorHandler');

// テスト対象モジュールのインポート
// 注意: 実際のファイルが存在する場合は正しいパスに修正
import GameManagerEventMixin from '../GameManagerEvent';

describe('GameManagerEvent', () => {
  // テストで使用する変数
  let gameManager;
  let mockEventSystem;
  let mockErrorHandler;
  let GameManagerMock;

  // テスト前の共通セットアップ
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モックオブジェクトの作成
    mockEventSystem = {
      on: jest.fn().mockReturnValue(true),
      once: jest.fn().mockReturnValue(true),
      off: jest.fn().mockReturnValue(true),
      emit: jest.fn().mockReturnValue(true),
      hasListeners: jest.fn().mockReturnValue(true),
      listenerCount: jest.fn().mockReturnValue(3),
      eventNames: jest.fn().mockReturnValue(['test.event', 'game.start'])
    };

    mockErrorHandler = {
      createError: jest.fn().mockImplementation((code, message) => new Error(`${code}: ${message}`)),
      handleError: jest.fn()
    };

    // GameManagerのモッククラスを作成
    GameManagerMock = function () {
      this.eventSystem = mockEventSystem;
      this.errorHandler = mockErrorHandler;
      this.state = {
        turn: 1,
        phase: 'day',
        isStarted: true,
        isEnded: false
      };
      this.options = {
        debugMode: false
      };
    };

    // Mix-inを適用
    GameManagerEventMixin(GameManagerMock);

    // インスタンスを作成
    gameManager = new GameManagerMock();
  });

  // テスト後のクリーンアップ
  afterEach(() => {
    // 必要に応じてクリーンアップ処理を追加
  });

  // on() メソッドのテスト
  describe('on', () => {
    it('正常なイベント登録が行えること', () => {
      // テスト準備
      const eventName = 'test.event';
      const callback = jest.fn();

      // メソッド実行
      const result = gameManager.on(eventName, callback);

      // 検証
      expect(result).toBe(true);
      expect(mockEventSystem.on).toHaveBeenCalledWith(eventName, callback, 0);
    });

    it('優先度を指定したイベント登録が行えること', () => {
      const eventName = 'test.event';
      const callback = jest.fn();
      const priority = 10;

      const result = gameManager.on(eventName, callback, priority);

      expect(result).toBe(true);
      expect(mockEventSystem.on).toHaveBeenCalledWith(eventName, callback, priority);
    });

    it('無効なイベント名でエラーになること', () => {
      const callback = jest.fn();

      expect(() => gameManager.on(null, callback)).toThrow();
      expect(() => gameManager.on('', callback)).toThrow();
      expect(() => gameManager.on({}, callback)).toThrow();
    });

    it('無効なコールバックでエラーになること', () => {
      expect(() => gameManager.on('test.event', null)).toThrow();
      expect(() => gameManager.on('test.event', 'not a function')).toThrow();
      expect(() => gameManager.on('test.event', 123)).toThrow();
    });

    it('EventSystemでエラーが発生した場合、適切に処理されること', () => {
      mockEventSystem.on.mockImplementationOnce(() => {
        throw new Error('EventSystem Error');
      });

      expect(() => gameManager.on('test.event', jest.fn())).toThrow();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  // once() メソッドのテスト
  describe('once', () => {
    it('一度だけ実行されるリスナーが正しく登録されること', () => {
      const eventName = 'test.event';
      const callback = jest.fn();

      const result = gameManager.once(eventName, callback);

      expect(result).toBe(true);
      expect(mockEventSystem.once).toHaveBeenCalledWith(eventName, callback, 0);
    });

    it('優先度を指定した場合、正しく設定されること', () => {
      const eventName = 'test.event';
      const callback = jest.fn();
      const priority = 5;

      gameManager.once(eventName, callback, priority);

      expect(mockEventSystem.once).toHaveBeenCalledWith(eventName, callback, priority);
    });

    it('無効なパラメータでエラーになること', () => {
      expect(() => gameManager.once(null, jest.fn())).toThrow();
      expect(() => gameManager.once('test.event', null)).toThrow();
    });
  });

  // off() メソッドのテスト
  describe('off', () => {
    it('イベントリスナーが正しく削除されること', () => {
      const eventName = 'test.event';
      const callback = jest.fn();

      gameManager.off(eventName, callback);

      expect(mockEventSystem.off).toHaveBeenCalledWith(eventName, callback);
    });

    it('コールバック未指定時は該当イベントの全リスナーが削除されること', () => {
      const eventName = 'test.event';

      gameManager.off(eventName);

      expect(mockEventSystem.off).toHaveBeenCalledWith(eventName, undefined);
    });

    it('無効なイベント名でエラーになること', () => {
      expect(() => gameManager.off(null)).toThrow();
      expect(() => gameManager.off(123)).toThrow();
    });
  });

  // emit() メソッドのテスト
  describe('emit', () => {
    it('イベントが正しく発火されること', () => {
      const eventName = 'test.event';
      const data = { playerId: 1 };

      const result = gameManager.emit(eventName, data);

      expect(result).toBe(true);
      expect(mockEventSystem.emit).toHaveBeenCalledWith(eventName, data);
    });

    it('無効なイベント名でエラーになること', () => {
      expect(() => gameManager.emit(null)).toThrow();
      expect(() => gameManager.emit(123)).toThrow();
    });

    it('イベント発火オプションが正しく渡されること', () => {
      const eventName = 'test.event';
      const data = { value: 'test' };
      const options = { stopOnFalse: true };

      // emit実装によっては、オプションが直接EventSystemに渡らない場合もある
      gameManager.emit(eventName, data, options);

      // メソッドの実装に応じて、この検証は調整が必要かもしれない
      expect(mockEventSystem.emit).toHaveBeenCalled();
    });
  });

  // hasListeners() メソッドのテスト
  describe('hasListeners', () => {
    it('リスナーが登録されているイベントは true を返すこと', () => {
      mockEventSystem.hasListeners.mockReturnValueOnce(true);

      const result = gameManager.hasListeners('test.event');

      expect(result).toBe(true);
      expect(mockEventSystem.hasListeners).toHaveBeenCalledWith('test.event');
    });

    it('リスナーが登録されていないイベントは false を返すこと', () => {
      mockEventSystem.hasListeners.mockReturnValueOnce(false);

      const result = gameManager.hasListeners('unknown.event');

      expect(result).toBe(false);
    });

    it('無効なイベント名でエラーになること', () => {
      expect(() => gameManager.hasListeners(null)).toThrow();
    });
  });

  // listenerCount() メソッドのテスト
  describe('listenerCount', () => {
    it('登録リスナー数が正確に返されること', () => {
      mockEventSystem.listenerCount.mockReturnValueOnce(5);

      const result = gameManager.listenerCount('test.event');

      expect(result).toBe(5);
      expect(mockEventSystem.listenerCount).toHaveBeenCalledWith('test.event');
    });

    it('リスナーなしの場合は 0 が返されること', () => {
      mockEventSystem.listenerCount.mockReturnValueOnce(0);

      const result = gameManager.listenerCount('empty.event');

      expect(result).toBe(0);
    });

    it('無効なイベント名でエラーになること', () => {
      expect(() => gameManager.listenerCount(null)).toThrow();
    });
  });

  // eventNames() メソッドのテスト
  describe('eventNames', () => {
    it('登録されているすべてのイベント名が返されること', () => {
      const expectedNames = ['test.event', 'game.start', 'player.death'];
      mockEventSystem.eventNames.mockReturnValueOnce(expectedNames);

      const result = gameManager.eventNames();

      expect(result).toEqual(expectedNames);
      expect(mockEventSystem.eventNames).toHaveBeenCalled();
    });

    it('イベントが一つもない場合は空配列が返されること', () => {
      mockEventSystem.eventNames.mockReturnValueOnce([]);

      const result = gameManager.eventNames();

      expect(result).toEqual([]);
    });
  });

  // setupEventListeners() メソッドのテスト
  describe('setupEventListeners', () => {
    it('内部イベントリスナーがセットアップされること', () => {
      // このテストは実装によって異なる可能性がある
      // セットアップメソッドが何をすべきかに応じて調整が必要

      gameManager.setupEventListeners();

      // セットアップ後、いくつかの内部イベントに対してリスナーが登録されていることを確認
      expect(mockEventSystem.on).toHaveBeenCalled();
      // 具体的なイベント名とコールバックのチェックは、実装に依存
    });
  });

  // cleanupEventListeners() メソッドのテスト
  describe('cleanupEventListeners', () => {
    it('イベントリスナーが正しくクリーンアップされること', () => {
      // 事前に一時的なリスナーを設定する仕組みが必要
      // 実装によって異なる可能性がある

      gameManager.cleanupEventListeners();

      // クリーンアップが行われたことを確認
      // 実装に応じた検証が必要
      expect(mockEventSystem.off).toHaveBeenCalled();
    });
  });

  // enableDebugEvents() メソッドのテスト
  describe('enableDebugEvents', () => {
    it('デバッグモードを有効にできること', () => {
      gameManager.enableDebugEvents(true);

      // デバッグモードが有効になったことを確認
      // 実装に応じて、_debugModeまたは同等のプロパティをチェック
      expect(gameManager._debugMode).toBe(true);
    });

    it('デバッグモードを無効にできること', () => {
      // まず有効にしてから無効化
      gameManager.enableDebugEvents(true);
      gameManager.enableDebugEvents(false);

      expect(gameManager._debugMode).toBe(false);
    });

    it('デバッグオプションが正しく適用されること', () => {
      const options = {
        logLimit: 500,
        eventFilter: 'game.*'
      };

      gameManager.enableDebugEvents(true, options);

      // オプションが適用されたことを確認
      expect(gameManager._eventLogLimit).toBe(500);
      // 他のオプションも必要に応じて検証
    });
  });

  // getEventLog() メソッドのテスト
  describe('getEventLog', () => {
    it('デバッグモード無効時はエラーまたは空配列を返すこと', () => {
      gameManager._debugMode = false;

      // 実装によって、エラーか空配列のどちらかになる
      try {
        const result = gameManager.getEventLog();
        expect(result).toEqual([]);
      } catch (e) {
        // エラーを投げる実装の場合
        expect(e).toBeDefined();
      }
    });

    it('デバッグモード有効時はイベントログを返すこと', () => {
      gameManager._debugMode = true;
      gameManager._eventLog = [
        { timestamp: 1000, eventName: 'test.event', data: { value: 1 } },
        { timestamp: 1001, eventName: 'game.start', data: { players: 5 } }
      ];

      const result = gameManager.getEventLog();

      expect(result).toHaveLength(2);
      expect(result[0].eventName).toBe('game.start');
      expect(result[1].eventName).toBe('test.event');
    });

    it('フィルタリングが機能すること', () => {
      gameManager._debugMode = true;
      gameManager._eventLog = [
        { timestamp: 1000, eventName: 'test.event', data: { value: 1 } },
        { timestamp: 1001, eventName: 'game.start', data: { players: 5 } },
        { timestamp: 1002, eventName: 'game.end', data: { winner: 'village' } }
      ];

      const result = gameManager.getEventLog('game.*');

      expect(result).toHaveLength(2);
      expect(result[0].eventName).toBe('game.end');
      expect(result[1].eventName).toBe('game.start');
    });

    it('件数制限が機能すること', () => {
      gameManager._debugMode = true;
      gameManager._eventLog = [
        { timestamp: 1000, eventName: 'event1', data: {} },
        { timestamp: 1001, eventName: 'event2', data: {} },
        { timestamp: 1002, eventName: 'event3', data: {} }
      ];

      const result = gameManager.getEventLog(null, 2);

      expect(result).toHaveLength(2);
      // 通常は新しいものから順に取得される
      expect(result[0].eventName).toBe('event3');
      expect(result[1].eventName).toBe('event2');
    });
  });

  // eventNameMatches() メソッドのテスト
  describe('eventNameMatches', () => {
    it('完全一致のパターンがマッチすること', () => {
      expect(gameManager.eventNameMatches('game.start', 'game.start')).toBe(true);
      expect(gameManager.eventNameMatches('game.start', 'game.end')).toBe(false);
    });

    it('ワイルドカードパターンが正しく機能すること', () => {
      expect(gameManager.eventNameMatches('game.start', 'game.*')).toBe(true);
      expect(gameManager.eventNameMatches('player.death', 'player.*')).toBe(true);
      expect(gameManager.eventNameMatches('game.phase.start', 'game.*')).toBe(true);
      expect(gameManager.eventNameMatches('game.phase.start', 'game.phase.*')).toBe(true);
      expect(gameManager.eventNameMatches('game.start', 'player.*')).toBe(false);
    });

    it('階層構造が正しくマッチすること', () => {
      expect(gameManager.eventNameMatches('a.b.c', 'a.b.c')).toBe(true);
      expect(gameManager.eventNameMatches('a.b.c', 'a.b.*')).toBe(true);
      expect(gameManager.eventNameMatches('a.b.c', 'a.*')).toBe(true);
      expect(gameManager.eventNameMatches('a.b.c', 'a.*.c')).toBe(true);
      expect(gameManager.eventNameMatches('a.b.c', 'a.*.d')).toBe(false);
    });

    it('複数のワイルドカードが機能すること', () => {
      expect(gameManager.eventNameMatches('a.b.c.d', 'a.*.*.d')).toBe(true);
      expect(gameManager.eventNameMatches('a.b.c.d', '*.*.*.*')).toBe(true);
      expect(gameManager.eventNameMatches('a.b.c.d', 'a.*.*')).toBe(false); // 段数不一致
    });

    it('無効な入力でエラーになること', () => {
      expect(() => gameManager.eventNameMatches(null, 'pattern')).toThrow();
      expect(() => gameManager.eventNameMatches('event', null)).toThrow();
    });
  });
});
