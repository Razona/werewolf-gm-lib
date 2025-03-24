/**
 * @file src/core/event/EventSystem.js
 * @description イベント発行・購読を管理するイベントシステム
 */

/**
 * イベント発行・購読を管理するイベントシステムクラス
 */
export class EventSystem {
  /**
   * EventSystem コンストラクタ
   * @param {Object} options - オプション
   * @param {number} options.maxHistorySize - イベント履歴の最大サイズ
   */
  constructor(options = {}) {
    /**
     * イベントリスナーマップ
     * @type {Map<string, Array<function>>}
     * @private
     */
    this.listeners = new Map();

    /**
     * イベント履歴
     * @type {Array<Object>}
     * @private
     */
    this.history = [];

    /**
     * イベント履歴の最大サイズ
     * @type {number}
     * @private
     */
    this.maxHistorySize = options.maxHistorySize || 100;
    
    /**
     * ワイルドカードリスナー
     * @type {Array<function>}
     * @private
     */
    this.wildcardListeners = [];
  }

  /**
   * イベントリスナーを登録する
   * @param {string} eventName - イベント名
   * @param {function} callback - コールバック関数
   * @returns {EventSystem} チェーン用のインスタンス
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('コールバックは関数である必要があります');
    }

    if (eventName === '*') {
      this.wildcardListeners.push(callback);
      return this;
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
    return this;
  }

  /**
   * 一度だけ実行されるイベントリスナーを登録する
   * @param {string} eventName - イベント名
   * @param {function} callback - コールバック関数
   * @returns {EventSystem} チェーン用のインスタンス
   */
  once(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new Error('コールバックは関数である必要があります');
    }

    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      callback(...args);
    };
    
    return this.on(eventName, onceWrapper);
  }

  /**
   * イベントリスナーを削除する
   * @param {string} eventName - イベント名
   * @param {function} [callback] - 特定のコールバック（省略時は全てのリスナーを削除）
   * @returns {EventSystem} チェーン用のインスタンス
   */
  off(eventName, callback) {
    if (eventName === '*') {
      if (!callback) {
        this.wildcardListeners = [];
      } else {
        const index = this.wildcardListeners.indexOf(callback);
        if (index !== -1) {
          this.wildcardListeners.splice(index, 1);
        }
      }
      return this;
    }

    if (!this.listeners.has(eventName)) {
      return this;
    }

    if (!callback) {
      // イベント名のすべてのリスナーを削除
      this.listeners.delete(eventName);
    } else {
      // 特定のコールバックを削除
      const listeners = this.listeners.get(eventName);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.listeners.delete(eventName);
      }
    }

    return this;
  }

  /**
   * イベントを発火する
   * @param {string} eventName - イベント名
   * @param {Object} [data={}] - イベントデータ
   * @returns {EventSystem} チェーン用のインスタンス
   */
  emit(eventName, data = {}) {
    // イベント履歴に追加
    const eventRecord = {
      event: eventName,
      data,
      timestamp: Date.now()
    };
    
    this.history.push(eventRecord);

    // 履歴サイズを制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // ワイルドカードリスナーを呼び出し
    for (const listener of this.wildcardListeners) {
      try {
        listener(eventName, data);
      } catch (error) {
        console.error(`EventSystem: Error in wildcard listener for ${eventName}`, error);
      }
    }

    // 特定のイベントリスナーがなければ終了
    if (!this.listeners.has(eventName)) {
      return this;
    }

    // リスナーを実行
    const listeners = this.listeners.get(eventName);
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error(`EventSystem: Error in listener for ${eventName}`, error);
      }
    }

    return this;
  }

  /**
   * すべてのイベントに応答するリスナーを登録する（ワイルドカード）
   * @param {function} callback - コールバック関数
   * @returns {EventSystem} チェーン用のインスタンス
   */
  onAny(callback) {
    return this.on('*', callback);
  }

  /**
   * イベント履歴を取得する
   * @param {string} [eventName=null] - 特定のイベント名（省略時は全履歴）
   * @returns {Array<Object>} イベント履歴
   */
  getHistory(eventName = null) {
    if (!eventName) {
      return [...this.history];
    }
    return this.history.filter(entry => entry.event === eventName);
  }

  /**
   * イベント履歴をクリアする
   * @returns {EventSystem} チェーン用のインスタンス
   */
  clearHistory() {
    this.history = [];
    return this;
  }

  /**
   * 登録されているリスナーの数を取得する
   * @param {string} [eventName] - 特定のイベント名（省略時は全リスナー数）
   * @returns {number} リスナー数
   */
  listenerCount(eventName) {
    if (eventName) {
      if (eventName === '*') {
        return this.wildcardListeners.length;
      }
      return this.listeners.has(eventName) ? this.listeners.get(eventName).length : 0;
    }
    
    let count = this.wildcardListeners.length;
    for (const listeners of this.listeners.values()) {
      count += listeners.length;
    }
    return count;
  }

  /**
   * 登録されているイベント名の一覧を取得する
   * @returns {Array<string>} イベント名の配列
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
}

export default EventSystem;
