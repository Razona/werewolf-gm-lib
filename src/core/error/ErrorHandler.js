/**
 * エラーハンドラー
 * エラーの処理と管理を担当するクラス
 */
const ErrorLevel = require('./ErrorLevel');
const { ErrorCatalog } = require('./ErrorCatalog');

class ErrorHandler {
  /**
   * @param {object} eventSystem - イベントシステム
   * @param {object} options - 設定オプション
   */
  constructor(eventSystem, options = {}) {
    this.eventSystem = eventSystem;
    this.policy = {
      throwOnLevel: options.throwOnLevel || ErrorLevel.ERROR,
      logLevel: options.logLevel || ErrorLevel.INFO,
      emitEvents: options.emitEvents !== false
    };
    this.errorHistory = [];
    this.unhandledErrors = [];
    this.errorCounts = new Map();
  }

  /**
   * エラーポリシーを設定する
   * @param {object} policy - エラーポリシー設定
   */
  setErrorPolicy(policy) {
    if (!policy) return;
    
    if (policy.throwOnLevel !== undefined) {
      this.policy.throwOnLevel = policy.throwOnLevel;
    }
    
    if (policy.logLevel !== undefined) {
      this.policy.logLevel = policy.logLevel;
    }
    
    if (policy.emitEvents !== undefined) {
      this.policy.emitEvents = policy.emitEvents;
    }
  }

  /**
   * エラーの重大度レベルを取得
   * @param {string|object} error - エラーまたはエラーコード
   * @returns {string} エラーレベル
   */
  getErrorLevel(error) {
    if (!error) return ErrorLevel.ERROR;
    
    if (typeof error === 'string') {
      // エラーコードからエラー情報を取得
      const errorInfo = this._findErrorByCode(error);
      return errorInfo ? errorInfo.level : ErrorLevel.ERROR;
    }
    
    if (error.level) {
      return error.level;
    }
    
    if (error.code) {
      const errorInfo = this._findErrorByCode(error.code);
      return errorInfo ? errorInfo.level : ErrorLevel.ERROR;
    }
    
    return ErrorLevel.ERROR;
  }

  /**
   * エラーを処理する
   * @param {string|object} error - エラーまたはエラーコード
   * @param {object} context - コンテキスト情報
   * @returns {object} 処理済みエラー情報
   */
  handleError(error, context = {}) {
    // エラー情報の構築
    const errorInfo = this._buildErrorInfo(error, context);
    
    // エラーをヒストリーに追加
    this.errorHistory.push({
      ...errorInfo,
      timestamp: new Date().toISOString()
    });

    // エラーカウントを更新
    if (!this.errorCounts.has(errorInfo.code)) {
      this.errorCounts.set(errorInfo.code, 1);
    } else {
      this.errorCounts.set(errorInfo.code, this.errorCounts.get(errorInfo.code) + 1);
    }
    
    // ログレベルに基づいてログ出力
    this._logError(errorInfo);
    
    // イベント発火設定がオンならイベントを発火
    if (this.policy.emitEvents) {
      this._emitErrorEvent(errorInfo);
    }
    
    // エラーレベルに基づいた処理
    if (this._shouldThrow(errorInfo.level)) {
      throw this._createErrorObject(errorInfo);
    } else {
      // 投げない場合は未処理エラーリストに追加
      this.unhandledErrors.push(errorInfo);
    }
    
    return errorInfo;
  }

  /**
   * エラーコードからエラーを登録する
   * @param {string} code - エラーコード
   * @param {object} context - コンテキスト情報
   * @returns {object} エラー情報
   */
  register(code, context = {}) {
    const errorInfo = this._buildErrorInfo(code, context);
    return errorInfo;
  }

  /**
   * エラーを作成する
   * @param {string} code - エラーコード
   * @param {string} message - エラーメッセージ
   * @param {object} context - コンテキスト情報
   * @returns {object} エラー情報
   */
  createError(code, message, context = {}) {
    const errorInfo = this._buildErrorInfo(code, context);
    if (message) {
      errorInfo.message = message;
    }
    return errorInfo;
  }

  /**
   * 警告を処理する
   * @param {string|object} warning - 警告またはコード
   * @param {object} context - コンテキスト情報
   * @returns {object} 処理済み警告情報
   */
  handleWarning(warning, context = {}) {
    const warningInfo = this._buildErrorInfo(warning, context);
    warningInfo.level = ErrorLevel.WARNING;
    
    // 警告をヒストリーに追加
    this.errorHistory.push({
      ...warningInfo,
      timestamp: new Date().toISOString()
    });
    
    // ログレベルに基づいてログ出力
    this._logError(warningInfo);
    
    // イベント発火
    if (this.policy.emitEvents) {
      this._emitErrorEvent(warningInfo, 'warning');
    }
    
    return warningInfo;
  }

  /**
   * 情報通知を処理する
   * @param {string|object} info - 情報またはコード
   * @param {object} context - コンテキスト情報
   * @returns {object} 処理済み情報
   */
  handleInfo(info, context = {}) {
    const infoObject = this._buildErrorInfo(info, context);
    infoObject.level = ErrorLevel.INFO;
    
    // 情報をヒストリーに追加
    this.errorHistory.push({
      ...infoObject,
      timestamp: new Date().toISOString()
    });
    
    // ログレベルに基づいてログ出力
    this._logError(infoObject);
    
    // イベント発火
    if (this.policy.emitEvents) {
      this._emitErrorEvent(infoObject, 'info');
    }
    
    return infoObject;
  }

  /**
   * エラー履歴を取得する
   * @param {string} level - フィルタするエラーレベル（オプション）
   * @returns {Array} エラー履歴
   */
  getErrorHistory(level) {
    if (!level) return [...this.errorHistory];
    
    return this.errorHistory.filter(error => error.level === level);
  }

  /**
   * 最新のエラーを取得する
   * @returns {object|null} 最新のエラー情報、なければnull
   */
  getLastError() {
    if (this.errorHistory.length === 0) return null;
    return this.errorHistory[this.errorHistory.length - 1];
  }

  /**
   * エラー履歴をクリアする
   */
  clearErrorHistory() {
    this.errorHistory = [];
    if (this.eventSystem) {
      this.eventSystem.emit('error.history.clear');
    }
  }

  /**
   * 未処理エラーをクリアする
   */
  clearUnhandledErrors() {
    this.unhandledErrors = [];
    if (this.eventSystem) {
      this.eventSystem.emit('error.unhandled.clear');
    }
  }

  /**
   * エラーカウントをリセットする
   */
  resetErrorCounts() {
    this.errorCounts.clear();
    if (this.eventSystem) {
      this.eventSystem.emit('error.counts.reset');
    }
  }

  /**
   * エラーレベル別のエラーを取得する
   * @param {string} level - エラーレベル
   * @returns {Array} 指定レベルのエラー配列
   */
  getErrorsByLevel(level) {
    if (!level || typeof level !== 'string' || !Object.values(ErrorLevel).includes(level)) {
      return [];
    }
    return this.errorHistory.filter(error => error.level === level);
  }

  /**
   * エラーレポートを作成する
   * @param {boolean} detailed - 詳細なレポートを生成するかどうか
   * @returns {object} エラーレポート
   */
  createErrorReport(detailed = false) {
    const report = {
      totalErrors: this.errorHistory.length,
      unhandledErrors: this.unhandledErrors.length,
      timestamp: Date.now(),
      policy: this.policy,
      errorCounts: Object.fromEntries(this.errorCounts),
      lastError: this.getLastError()
    };

    if (detailed) {
      // レベル別カウント
      const levelCounts = {};
      Object.values(ErrorLevel).forEach(level => {
        levelCounts[level] = this.getErrorsByLevel(level).length;
      });

      report.levelCounts = levelCounts;
      report.history = this.errorHistory;
      report.unhandledErrors = this.unhandledErrors;
    }

    return report;
  }

  /**
   * エラー情報を構築する（内部メソッド）
   * @private
   * @param {string|object} error - エラーまたはエラーコード
   * @param {object} context - コンテキスト情報
   * @returns {object} 構築されたエラー情報
   */
  _buildErrorInfo(error, context = {}) {
    // エラーがすでにオブジェクトの場合
    if (error && typeof error === 'object') {
      return {
        code: error.code || 'E0601', // デフォルトは内部エラー
        message: error.message || '不明なエラー',
        details: error.details || '',
        level: error.level || ErrorLevel.ERROR,
        context: { ...context, ...error.context }
      };
    }
    
    // エラーがコードの場合
    if (typeof error === 'string') {
      const errorInfo = this._findErrorByCode(error);
      if (errorInfo) {
        return {
          ...errorInfo,
          context
        };
      }
      
      // 不明なコードの場合
      return {
        code: error,
        message: '不明なエラーコード',
        details: `エラーコード ${error} は定義されていません`,
        level: ErrorLevel.ERROR,
        context
      };
    }
    
    // デフォルトの内部エラー
    return {
      code: 'E0601',
      message: '不明なエラー',
      details: '詳細不明のエラーが発生しました',
      level: ErrorLevel.ERROR,
      context
    };
  }

  /**
   * エラーコードからエラー情報を検索（内部メソッド）
   * @private
   * @param {string} code - エラーコード
   * @returns {object|null} エラー情報、見つからない場合はnull
   */
  _findErrorByCode(code) {
    // 全カテゴリーを検索
    for (const category in ErrorCatalog) {
      for (const errorKey in ErrorCatalog[category]) {
        const error = ErrorCatalog[category][errorKey];
        if (error.code === code) {
          return { ...error };
        }
      }
    }
    
    return null;
  }

  /**
   * エラーをログ出力する（内部メソッド）
   * @private
   * @param {object} errorInfo - エラー情報
   */
  _logError(errorInfo) {
    const levelMap = {
      [ErrorLevel.INFO]: 'info',
      [ErrorLevel.WARNING]: 'warn',
      [ErrorLevel.ERROR]: 'error',
      [ErrorLevel.FATAL]: 'error'
    };
    
    // ポリシーで設定されたレベル以上のエラーのみログ出力
    if (this._shouldLog(errorInfo.level)) {
      const method = levelMap[errorInfo.level] || 'error';
      console[method](`[${errorInfo.code}] ${errorInfo.message}`, 
        { details: errorInfo.details, context: errorInfo.context });
    }
  }

  /**
   * エラーイベントを発火する（内部メソッド）
   * @private
   * @param {object} errorInfo - エラー情報
   * @param {string} type - イベントタイプ（'error', 'warning', 'info'）
   */
  _emitErrorEvent(errorInfo, type = 'error') {
    if (!this.eventSystem) return;
    
    // メインのエラーイベント
    this.eventSystem.emit(`error`, {
      ...errorInfo,
      timestamp: new Date().toISOString()
    });
    
    // レベル別イベント
    this.eventSystem.emit(`error.${errorInfo.level}`, {
      ...errorInfo,
      timestamp: new Date().toISOString()
    });
    
    // コード別イベント
    this.eventSystem.emit(`error.code.${errorInfo.code}`, {
      ...errorInfo,
      timestamp: new Date().toISOString()
    });
    
    // コンテキスト情報に基づくイベント
    if (errorInfo.context) {
      // プレイヤーIDがある場合
      if (errorInfo.context.playerId) {
        this.eventSystem.emit(`error.player.${errorInfo.context.playerId}`, {
          ...errorInfo,
          timestamp: new Date().toISOString()
        });
      }
      
      // フェーズ情報がある場合
      if (errorInfo.context.phase) {
        this.eventSystem.emit(`error.phase.${errorInfo.context.phase}`, {
          ...errorInfo,
          timestamp: new Date().toISOString()
        });
      }
      
      // アクションタイプがある場合
      if (errorInfo.context.actionType) {
        this.eventSystem.emit(`error.action.${errorInfo.context.actionType}`, {
          ...errorInfo,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 例外をスローすべきかを判断する（内部メソッド）
   * @private
   * @param {string} level - エラーレベル
   * @returns {boolean} スローすべきかどうか
   */
  _shouldThrow(level) {
    const levels = [ErrorLevel.INFO, ErrorLevel.WARNING, ErrorLevel.ERROR, ErrorLevel.FATAL];
    const levelIndex = levels.indexOf(level);
    const thresholdIndex = levels.indexOf(this.policy.throwOnLevel);
    
    return levelIndex >= thresholdIndex;
  }

  /**
   * ログ出力すべきかを判断する（内部メソッド）
   * @private
   * @param {string} level - エラーレベル
   * @returns {boolean} ログ出力すべきかどうか
   */
  _shouldLog(level) {
    const levels = [ErrorLevel.INFO, ErrorLevel.WARNING, ErrorLevel.ERROR, ErrorLevel.FATAL];
    const levelIndex = levels.indexOf(level);
    const thresholdIndex = levels.indexOf(this.policy.logLevel);
    
    return levelIndex >= thresholdIndex;
  }

  /**
   * エラーオブジェクトを作成する（内部メソッド）
   * @private
   * @param {object} errorInfo - エラー情報
   * @returns {Error} エラーオブジェクト
   */
  _createErrorObject(errorInfo) {
    const error = new Error(`[${errorInfo.code}] ${errorInfo.message}`);
    error.code = errorInfo.code;
    error.details = errorInfo.details;
    error.context = errorInfo.context;
    error.level = errorInfo.level;
    return error;
  }
}

module.exports = ErrorHandler;
