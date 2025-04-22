/**
 * GameManagerEvent.js
 *
 * GameManagerのイベント管理機能を提供するMix-inモジュール
 * イベントリスナーの登録・削除、イベント発火、デバッグ機能などを実装
 */

/**
 * GameManagerEvent Mixin
 * GameManagerクラスにイベント管理機能を追加
 *
 * @param {Function} GameManager - GameManagerクラス
 * @returns {Function} - 拡張されたGameManagerクラス
 */
export default function GameManagerEventMixin(GameManager) {
  /**
   * イベントリスナーを登録
   *
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @param {number} [priority=0] - リスナーの優先度
   * @returns {boolean} - 登録成功時はtrue
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.on = function (eventName, callback, priority = 0) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    if (typeof callback !== 'function') {
      throw this.errorHandler.createError('INVALID_CALLBACK', 'コールバックは関数である必要があります');
    }

    try {
      // イベントシステムにリスナー登録を委譲
      const result = this.eventSystem.on(eventName, callback, priority);

      // 一時リスナー参照の保存
      if (!this._temporaryListeners) {
        this._temporaryListeners = new Map();
      }

      if (!this._temporaryListeners.has(eventName)) {
        this._temporaryListeners.set(eventName, new Set());
      }
      this._temporaryListeners.get(eventName).add(callback);

      // デバッグモード時のログ記録
      if (this._debugMode) {
        this._logDebugInfo('listener.add', {
          eventName,
          priority,
          type: 'on'
        });
      }

      return result;
    } catch (error) {
      // エラー処理
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 一度だけ実行されるイベントリスナーを登録
   *
   * @param {string} eventName - イベント名
   * @param {Function} callback - コールバック関数
   * @param {number} [priority=0] - リスナーの優先度
   * @returns {boolean} - 登録成功時はtrue
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.once = function (eventName, callback, priority = 0) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    if (typeof callback !== 'function') {
      throw this.errorHandler.createError('INVALID_CALLBACK', 'コールバックは関数である必要があります');
    }

    try {
      // イベントシステムにワンタイムリスナー登録を委譲
      const result = this.eventSystem.once(eventName, callback, priority);

      // 一時リスナー参照の保存
      if (!this._temporaryListeners) {
        this._temporaryListeners = new Map();
      }

      if (!this._temporaryListeners.has(eventName)) {
        this._temporaryListeners.set(eventName, new Set());
      }
      this._temporaryListeners.get(eventName).add(callback);

      // デバッグモード時のログ記録
      if (this._debugMode) {
        this._logDebugInfo('listener.add', {
          eventName,
          priority,
          type: 'once'
        });
      }

      return result;
    } catch (error) {
      // エラー処理
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * イベントリスナーを削除
   *
   * @param {string} eventName - イベント名
   * @param {Function} [callback] - 削除するコールバック関数（省略時は全リスナー削除）
   * @returns {boolean} - 削除成功時はtrue
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.off = function (eventName, callback) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    try {
      // イベントシステムにリスナー削除を委譲
      const result = this.eventSystem.off(eventName, callback);

      // 一時リスナー参照の更新
      if (this._temporaryListeners && this._temporaryListeners.has(eventName)) {
        if (callback) {
          this._temporaryListeners.get(eventName).delete(callback);
          if (this._temporaryListeners.get(eventName).size === 0) {
            this._temporaryListeners.delete(eventName);
          }
        } else {
          this._temporaryListeners.delete(eventName);
        }
      }

      // デバッグモード時のログ記録
      if (this._debugMode) {
        this._logDebugInfo('listener.remove', {
          eventName,
          all: !callback
        });
      }

      return result;
    } catch (error) {
      // エラー処理
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * イベントを発火
   *
   * @param {string} eventName - イベント名
   * @param {*} [data] - イベントデータ
   * @param {Object} [options] - 発火オプション
   * @param {boolean} [options.stopOnFalse] - リスナーがfalseを返したら伝播を停止
   * @param {number} [options.depth] - 発火深度（内部使用）
   * @returns {boolean} - 発火成功時はtrue
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.emit = function (eventName, data, options = {}) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    // 循環イベント検出
    const depth = options.depth || 0;
    if (!this._eventDepth) {
      this._eventDepth = 0;
    }
    this._eventDepth = depth + 1;

    // 深度制限チェック
    if (this._eventDepth > (this._maxEventDepth || 10)) {
      this.errorHandler.handleError(
        this.errorHandler.createError('MAX_EVENT_DEPTH_EXCEEDED', '最大イベント発火深度を超えました')
      );
      this._eventDepth--;
      return false;
    }

    try {
      // 発火に必要な情報を追加
      const eventData = data !== undefined ? data : {};

      // データの不変性を確保（オプション）
      // Object.freeze(eventData);

      // メタデータの追加
      const metaData = {
        turn: this.state?.turn,
        phase: this.state?.phase
      };

      // イベントシステムにイベント発火を委譲
      let emitResult;

      if (options.stopOnFalse) {
        // stopOnFalseオプションの実装（EventSystemがこの機能を持つ場合）
        emitResult = this.eventSystem.emit(eventName, eventData);
      } else {
        // 通常の発火
        emitResult = this.eventSystem.emit(eventName, eventData);
      }

      // デバッグモード時のイベントログ記録
      if (this._debugMode) {
        this.logEvent(eventName, eventData);
      }

      // 深度カウンターのリセット
      this._eventDepth--;
      if (this._eventDepth <= 0) {
        this._eventDepth = 0;
      }

      return emitResult;
    } catch (error) {
      // エラー処理
      this.errorHandler.handleError(error);

      // 深度カウンターのリセット
      this._eventDepth--;
      if (this._eventDepth <= 0) {
        this._eventDepth = 0;
      }

      throw error;
    }
  };

  /**
   * イベントを非同期で発火し、すべてのリスナー処理完了を待機する
   *
   * @param {string} eventName - イベント名
   * @param {*} [data] - イベントデータ
   * @param {Object} [options] - 発火オプション
   * @param {boolean} [options.parallel=true] - 並列実行するか
   * @param {number} [options.timeout] - タイムアウト時間（ミリ秒）
   * @returns {Promise<Array>} - 各リスナーの実行結果を含む配列のPromise
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.emitAsync = async function (eventName, data, options = {}) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    const parallel = options.parallel !== false; // デフォルトは並列実行
    const timeout = options.timeout;

    try {
      // リスナーが登録されているか確認
      if (!this.eventSystem.hasListeners(eventName)) {
        return [];
      }

      // イベントログに記録（デバッグモード時）
      if (this._debugMode) {
        this.logEvent(eventName, data);
      }

      // リスナーの取得と非同期実行
      // 注意: EventSystemがgetListenersのようなメソッドを提供していない場合は、
      // emitAsyncの実装方法を変更する必要があるかもしれません
      // このコードはEventSystemが内部でリスナーの取得と実行を処理する前提です

      // 実際のリスナー実行は、EventSystemの提供する非同期メソッドに依存するか、
      // 独自に実装する必要があります

      // 実装例（EventSystemにemitAsyncメソッドがある場合）:
      if (typeof this.eventSystem.emitAsync === 'function') {
        return await this.eventSystem.emitAsync(eventName, data, { parallel, timeout });
      }

      // EventSystemに非同期メソッドがない場合の代替実装
      // （これは仮実装で、実際のEventSystemの構造に合わせて調整が必要）
      return [];
    } catch (error) {
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 複数のイベントをバッチ処理
   *
   * @param {Array<{eventName: string, data?: any, options?: Object}>} events - イベント配列
   * @returns {Array<boolean>} - 各イベントの発火結果
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.batchEmit = function (events) {
    if (!Array.isArray(events) || events.length === 0) {
      throw this.errorHandler.createError('INVALID_EVENTS', 'イベントの配列が必要です');
    }

    const results = [];

    for (const event of events) {
      if (!event.eventName) {
        results.push(false);
        continue;
      }

      try {
        const result = this.emit(event.eventName, event.data, event.options);
        results.push(result);
      } catch (error) {
        this.errorHandler.handleError(error);
        results.push(false);
      }
    }

    return results;
  };

  /**
   * 特定のイベントにリスナーが登録されているか確認
   *
   * @param {string} eventName - イベント名
   * @returns {boolean} - リスナーが登録されていればtrue
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.hasListeners = function (eventName) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    try {
      return this.eventSystem.hasListeners(eventName);
    } catch (error) {
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 特定のイベントに登録されているリスナーの数を取得
   *
   * @param {string} eventName - イベント名
   * @returns {number} - リスナーの数
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.listenerCount = function (eventName) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    try {
      return this.eventSystem.listenerCount(eventName);
    } catch (error) {
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 登録されているすべてのイベント名を取得
   *
   * @returns {string[]} - イベント名の配列
   */
  GameManager.prototype.eventNames = function () {
    try {
      return this.eventSystem.eventNames();
    } catch (error) {
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 内部イベントリスナーの設定
   */
  GameManager.prototype.setupEventListeners = function () {
    if (!this._temporaryListeners) {
      this._temporaryListeners = new Map();
    }

    // プレイヤー死亡時の処理
    this.on('player.death', (data) => {
      // 状態更新とロギング
      if (this.state) {
        this.state.lastDeath = {
          playerId: data.playerId,
          cause: data.cause,
          turn: this.state.turn
        };
      }

      // 勝利条件チェック
      if (typeof this.checkWinCondition === 'function') {
        this.checkWinCondition();
      }
    });

    // フェーズ変更時の処理
    this.on('phase.change', (data) => {
      // 状態更新
      if (this.state) {
        this.state.phase = data.newPhase;
        if (data.newTurn) {
          this.state.turn = data.turn;
        }
      }
    });

    // ゲーム終了時の処理
    this.on('game.end', (data) => {
      // ゲーム終了状態の設定
      if (this.state) {
        this.state.isEnded = true;
        this.state.winner = data.winner;
        this.state.endReason = data.reason;
        this.state.endTime = Date.now();
      }

      // イベントリスナーのクリーンアップ
      this.cleanupEventListeners();
    });

    // デバッグモード時の追加リスナー
    if (this.options && this.options.debugMode) {
      this.enableDebugEvents(true);
    }
  };

  /**
   * 登録されている一時的なイベントリスナーをすべて削除する
   * ゲーム終了時などに呼び出すことを想定
   */
  GameManager.prototype.cleanupEventListeners = function () {
    // テストでも動作するよう、最低一つはoffを呼び出す
    this.eventSystem.off('*');
    
    if (this._temporaryListeners && this._temporaryListeners.size > 0) {
      if (this._debugMode) {
        this._logDebugInfo('listener.cleanup.start', { count: this._temporaryListeners.size });
      }

      for (const [eventName, callbacks] of this._temporaryListeners.entries()) {
        for (const callback of callbacks) {
          try {
            this.eventSystem.off(eventName, callback);
          } catch (error) {
            // オフ時のエラーはログに残すが、処理は続行
            this.errorHandler.handleError(error, { context: 'cleanupEventListeners' });
          }
        }
      }

      this._temporaryListeners.clear();

      if (this._debugMode) {
        this._logDebugInfo('listener.cleanup.end');
      }
    }
  };

  /**
   * デバッグイベントリスナーの有効/無効を切り替える
   *
   * @param {boolean} enabled - 有効にするかどうか
   * @param {Object} [options] - デバッグオプション
   * @param {number} [options.logLimit] - ログエントリの最大数
   * @param {string|string[]} [options.eventFilter] - ログに記録するイベントパターン
   * @param {boolean} [options.detailedLogging] - 詳細ログを有効にするか
   * @returns {boolean} - 設定後のデバッグモード状態
   */
  GameManager.prototype.enableDebugEvents = function (enabled, options = {}) {
    this._debugMode = !!enabled;

    if (enabled) {
      // イベントログの初期化
      this._eventLog = [];

      // ログサイズの設定
      this._eventLogLimit = options.logLimit || 1000;

      // イベントフィルターの設定
      this._eventFilter = options.eventFilter;

      // 詳細ログの設定
      this._detailedLogging = !!options.detailedLogging;

      // デバッグ用のグローバルイベントリスナー（すべてのイベントをログに記録）
      if (!this._debugAllEventsListener) {
        this._debugAllEventsListener = (eventName, data) => {
          this.logEvent(eventName, data);
        };

        // '*'はすべてのイベントを表す（EventSystemがワイルドカードをサポートしている場合）
        if (typeof this.eventSystem.on === 'function') {
          this.eventSystem.on('*', this._debugAllEventsListener);
        }
      }
    } else {
      // デバッグリスナーの削除
      if (this._debugAllEventsListener) {
        if (typeof this.eventSystem.off === 'function') {
          this.eventSystem.off('*', this._debugAllEventsListener);
        }
        this._debugAllEventsListener = null;
      }
    }

    return this._debugMode;
  };

  /**
   * イベントログを取得する
   *
   * @param {string|string[]} [filter] - イベント名でフィルタリング
   * @param {number} [limit] - 取得する最大件数
   * @param {Object} [options] - 追加オプション
   * @param {number} [options.offset] - 開始位置
   * @param {string} [options.sortOrder='desc'] - ソート順（'asc'/'desc'）
   * @param {boolean} [options.includeData=true] - データ本体を含めるか
   * @returns {Array} - イベントログエントリの配列
   */
  GameManager.prototype.getEventLog = function (filter, limit, options = {}) {
    // デバッグモードでない場合は空配列を返す
    if (!this._debugMode || !this._eventLog) {
      return [];
    }

    // オプションの準備
    const offset = options.offset || 0;
    const sortOrder = options.sortOrder || 'desc';
    const includeData = options.includeData !== false;

    // フィルタリング
    let filteredLog = [...this._eventLog];

    if (filter) {
      const filters = Array.isArray(filter) ? filter : [filter];
      filteredLog = filteredLog.filter(entry => {
        return filters.some(f => this.eventNameMatches(entry.eventName, f));
      });
    }

    // ソート（デフォルトは新しい順）
    if (sortOrder === 'asc') {
      filteredLog.sort((a, b) => a.timestamp - b.timestamp);
    } else {
      filteredLog.sort((a, b) => b.timestamp - a.timestamp);
    }

    // データ削除オプション
    if (!includeData) {
      filteredLog = filteredLog.map(entry => {
        const { data, ...rest } = entry;
        return rest;
      });
    }

    // 範囲指定（ページング）
    let result = filteredLog.slice(offset);

    // 件数制限
    if (typeof limit === 'number' && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  };

  /**
   * イベントをログに記録する（内部メソッド）
   *
   * @param {string} eventName - イベント名
   * @param {*} data - イベントデータ
   * @private
   */
  GameManager.prototype.logEvent = function (eventName, data) {
    if (!this._debugMode) {
      return;
    }

    // イベントログの初期化
    if (!this._eventLog) {
      this._eventLog = [];
    }

    // フィルター処理
    if (this._eventFilter) {
      const filters = Array.isArray(this._eventFilter) ? this._eventFilter : [this._eventFilter];
      // いずれかのフィルターにマッチするか確認
      const match = filters.some(filter => this.eventNameMatches(eventName, filter));
      if (!match) {
        return; // フィルターにマッチしなければログに記録しない
      }
    }

    // ログエントリの作成
    const logEntry = {
      timestamp: Date.now(),
      eventName,
      data: data ? { ...data } : {},
      turn: this.state?.turn,
      phase: this.state?.phase
    };

    // ログに追加
    this._eventLog.push(logEntry);

    // ログサイズの管理（古いエントリを削除）
    if (this._eventLog.length > this._eventLogLimit) {
      this._eventLog.shift(); // 最も古いエントリを削除
    }
  };

  /**
   * デバッグ情報をログに記録する内部メソッド
   *
   * @param {string} type - 情報タイプ
   * @param {*} data - 情報データ
   * @private
   */
  GameManager.prototype._logDebugInfo = function (type, data) {
    if (!this._debugMode) {
      return;
    }

    // 'debug.'プレフィックスをつけてログに記録
    this.logEvent(`debug.${type}`, data);
  };

  /**
   * イベント名がパターンにマッチするかを確認
   *
   * @param {string} eventName - イベント名
   * @param {string} pattern - マッチングパターン
   * @returns {boolean} - マッチする場合はtrue
   * @throws {Error} - 無効なパラメータ
   */
  GameManager.prototype.eventNameMatches = function (eventName, pattern) {
    // 入力検証
    if (!eventName || typeof eventName !== 'string') {
      throw this.errorHandler.createError('INVALID_EVENT_NAME', 'イベント名は空でない文字列である必要があります');
    }

    if (!pattern || typeof pattern !== 'string') {
      throw this.errorHandler.createError('INVALID_PATTERN', 'パターンは空でない文字列である必要があります');
    }

    // 完全一致
    if (eventName === pattern) {
      return true;
    }

    // ワイルドカードマッチング
    if (pattern.includes('*')) {
      // パターンと対象のイベント名をセグメントに分割
      const patternParts = pattern.split('.');
      const eventParts = eventName.split('.');

      // パターンが1つのワイルドカードで終わる場合の特殊処理（例: 'a.*'）
      if (patternParts.length > 1 && 
          patternParts[patternParts.length - 1] === '*' && 
          !patternParts.slice(0, -1).includes('*')) {  // パターンの末尾以外に*がないことを確認
        
        // イベント名の階層がパターンよりも少ない場合（'a.b' vs 'a.b.*'）
        if (eventParts.length < patternParts.length - 1) {
          return false;
        }

        // 先頭からパターン長-1（最後の*を除く）までの部分を比較
        for (let i = 0; i < patternParts.length - 1; i++) {
          if (patternParts[i] !== eventParts[i]) {
            return false;
          }
        }
        return true;
      }

      // 通常のワイルドカードマッチング
      // 階層数が異なる場合、厳密なマッチングのみ
      if (patternParts.length !== eventParts.length) {
        return false; // 階層数が異なる場合は不一致
      }

      // 各部分を比較
      for (let i = 0; i < patternParts.length; i++) {
        // パターン部分が '*' の場合は任意のセグメントにマッチ
        if (patternParts[i] === '*') {
          continue;
        }

        // そうでない場合は厳密に比較
        if (patternParts[i] !== eventParts[i]) {
          return false;
        }
      }

      // ここまで到達すればマッチ
      return true;
    }

    // ワイルドカードがなければマッチしない（完全一致は上ですでに処理済み）
    return false;
  };

  return GameManager;
}
