/**
 * @file src/core/error/ErrorHandler.js
 * @description エラー定義・検証・処理を行うエラーハンドラー
 */

import ErrorCatalog from './ErrorCatalog';

/**
 * ゲームエラークラス - カスタムエラー情報を含む
 */
export class GameError extends Error {
  /**
   * GameErrorコンストラクタ
   * @param {string} code - エラーコード
   * @param {string} message - エラーメッセージ
   * @param {Object} context - エラーコンテキスト情報
   * @param {string} details - 詳細情報
   */
  constructor(code, message, context = {}, details = '') {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.context = context;
    this.details = details;
    this.timestamp = Date.now();
    
    // スタックトレースをキャプチャ (V8エンジン)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GameError);
    }
  }
}

/**
 * エラー定義・検証・処理を行うエラーハンドラークラス
 */
export class ErrorHandler {
  /**
   * ErrorHandlerコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    /**
     * ゲームインスタンス
     * @type {Object}
     * @private
     */
    this.game = game;
    
    /**
     * エラー定義カタログ
     * @type {Object}
     * @private
     */
    this.errorCatalog = ErrorCatalog;
    
    /**
     * エラー処理ポリシー
     * @type {Object}
     * @private
     */
    this.errorPolicy = {
      logLevel: 'warning', // info, warning, error, fatal
      throwLevel: 'error', // info, warning, error, fatal
      emitAll: true
    };
    
    /**
     * 組み込みバリデーションルール
     * @type {Object}
     * @private
     */
    this.validationRules = this.initializeValidationRules();
  }
  
  /**
   * 組み込みバリデーションルールを初期化する
   * @returns {Object} バリデーションルール
   * @private
   */
  initializeValidationRules() {
    return {
      isAlive: (data) => {
        const player = this.game?.getPlayer(data.playerId);
        return player && player.isAlive;
      },
      
      isValidTarget: (data) => {
        const target = this.game?.getPlayer(data.targetId);
        return target && target.isAlive;
      },
      
      isCorrectPhase: (data) => {
        return this.game?.phaseManager?.getCurrentPhase()?.id === data.phase;
      },
      
      isGameStarted: () => {
        return this.game?.gameStarted === true;
      },
      
      isGameNotEnded: () => {
        return this.game?.gameEnded !== true;
      },
      
      isValidRole: (data) => {
        return this.game?.roleManager?.isValidRole(data.role);
      },
      
      isPositiveNumber: (data, field) => {
        const value = data[field];
        return typeof value === 'number' && value > 0;
      },
      
      isValidString: (data, field) => {
        const value = data[field];
        return typeof value === 'string' && value.trim().length > 0;
      }
    };
  }
  
  /**
   * エラーを処理する
   * @param {string} errorCode - エラーコード (ErrorCatalogのキー)
   * @param {Object} context - エラーコンテキスト情報
   * @returns {Object} エラー結果オブジェクト
   */
  handleError(errorCode, context = {}) {
    // エラー情報の取得
    const errorInfo = this.errorCatalog[errorCode];
    if (!errorInfo) {
      // 未定義のエラーコード
      console.error(`Undefined error code: ${errorCode}`);
      return { success: false, reason: 'UNKNOWN_ERROR' };
    }
    
    // エラーオブジェクトの構築
    const error = {
      code: errorInfo.code,
      message: errorInfo.message,
      details: errorInfo.details,
      context,
      timestamp: Date.now()
    };
    
    // エラーレベルに応じた処理
    const level = errorInfo.level || 'error';
    
    // ログ出力
    if (this.shouldLog(level)) {
      console.error(`Error ${error.code}: ${error.message}`, error);
    }
    
    // イベント発火
    if (this.shouldEmit(level)) {
      this.game?.eventSystem?.emit('error', error);
    }
    
    // 例外をスロー
    if (this.shouldThrow(level)) {
      const errorObj = new GameError(
        error.code,
        error.message,
        error.context,
        error.details
      );
      throw errorObj;
    }
    
    // エラー情報を返す
    return {
      success: false,
      reason: errorCode,
      error
    };
  }
  
  /**
   * エラー処理ポリシーを設定する
   * @param {Object} policy - エラー処理ポリシー
   * @returns {Object} 設定されたポリシー
   */
  setErrorPolicy(policy) {
    this.errorPolicy = {
      ...this.errorPolicy,
      ...policy
    };
    return this.errorPolicy;
  }
  
  /**
   * オペレーションを検証する
   * @param {Object} operation - 検証するオペレーション
   * @param {Object} validations - 検証ルールとエラーコードのマップ
   * @returns {Object} 検証結果 (success: true/false)
   */
  validateOperation(operation, validations) {
    for (const [validationKey, errorCode] of Object.entries(validations)) {
      // validationKeyが関数の場合は直接実行
      if (typeof validationKey === 'function') {
        const isValid = validationKey(operation);
        if (!isValid) {
          return this.handleError(errorCode, operation);
        }
        continue;
      }
      
      // validationKeyが "method:param" 形式の場合
      if (validationKey.includes(':')) {
        const [method, param] = validationKey.split(':');
        const isValid = this.runValidation(method, operation, param);
        if (!isValid) {
          return this.handleError(errorCode, operation);
        }
        continue;
      }
      
      // 通常のバリデーションメソッド
      const isValid = this.runValidation(validationKey, operation);
      if (!isValid) {
        return this.handleError(errorCode, operation);
      }
    }
    
    return { success: true };
  }
  
  /**
   * 指定されたレベルでログ出力するかどうか
   * @param {string} level - エラーレベル
   * @returns {boolean} ログ出力するかどうか
   * @private
   */
  shouldLog(level) {
    const levels = { info: 0, warning: 1, error: 2, fatal: 3 };
    const minLevel = levels[this.errorPolicy.logLevel] || 0;
    return levels[level] >= minLevel;
  }
  
  /**
   * 指定されたレベルでイベント発火するかどうか
   * @param {string} level - エラーレベル
   * @returns {boolean} イベント発火するかどうか
   * @private
   */
  shouldEmit(level) {
    return this.errorPolicy.emitAll || level === 'error' || level === 'fatal';
  }
  
  /**
   * 指定されたレベルで例外をスローするかどうか
   * @param {string} level - エラーレベル
   * @returns {boolean} 例外をスローするかどうか
   * @private
   */
  shouldThrow(level) {
    const levels = { info: 0, warning: 1, error: 2, fatal: 3 };
    const minLevel = levels[this.errorPolicy.throwLevel] || 2;
    return levels[level] >= minLevel;
  }
  
  /**
   * バリデーションルールを実行する
   * @param {string} validationKey - バリデーションキー
   * @param {Object} data - 検証データ
   * @param {string} [param] - 追加パラメータ
   * @returns {boolean} 検証結果
   * @private
   */
  runValidation(validationKey, data, param) {
    const validation = this.validationRules[validationKey];
    if (!validation) {
      console.warn(`Undefined validation rule: ${validationKey}`);
      return true; // 未定義のルールはパスする
    }
    
    try {
      return validation(data, param);
    } catch (error) {
      console.error(`Error running validation ${validationKey}:`, error);
      return false;
    }
  }
  
  /**
   * カスタムバリデーションルールを登録する
   * @param {string} ruleName - ルール名
   * @param {function} validationFn - バリデーション関数
   * @returns {boolean} 登録成功かどうか
   */
  registerValidationRule(ruleName, validationFn) {
    if (typeof validationFn !== 'function') {
      console.error('Validation rule must be a function');
      return false;
    }
    
    if (this.validationRules[ruleName]) {
      console.warn(`Overriding existing validation rule: ${ruleName}`);
    }
    
    this.validationRules[ruleName] = validationFn;
    return true;
  }
  
  /**
   * カスタムエラー定義を登録する
   * @param {string} errorCode - エラーコード
   * @param {Object} errorDef - エラー定義
   * @returns {boolean} 登録成功かどうか
   */
  registerErrorDefinition(errorCode, errorDef) {
    if (!errorCode || typeof errorCode !== 'string') {
      console.error('Error code must be a non-empty string');
      return false;
    }
    
    if (!errorDef || typeof errorDef !== 'object') {
      console.error('Error definition must be an object');
      return false;
    }
    
    const requiredProps = ['message', 'level'];
    for (const prop of requiredProps) {
      if (!errorDef[prop]) {
        console.error(`Error definition missing required property: ${prop}`);
        return false;
      }
    }
    
    this.errorCatalog[errorCode] = {
      code: errorDef.code || `E${Object.keys(this.errorCatalog).length + 1}`,
      message: errorDef.message,
      details: errorDef.details || '',
      level: errorDef.level
    };
    
    return true;
  }
}

export default ErrorHandler;
