import ErrorLevel from './ErrorLevel';

/**
 * エラー処理のためのクラス
 */
class ErrorHandler {
  constructor(eventSystem = null, options = {}) {
    this.eventSystem = eventSystem;
    this.policy = {
      throwOnLevel: options.throwOnLevel || ErrorLevel.FATAL,
      logLevel: options.logLevel || ErrorLevel.WARNING,
      emitEvents: options.emitEvents !== undefined ? options.emitEvents : true
    };
  }

  // エラーの深刻度に基づいてログを記録
  shouldLogError(level) {
    const logLevels = {
      [ErrorLevel.INFO]: 1,
      [ErrorLevel.WARNING]: 2,
      [ErrorLevel.ERROR]: 3,
      [ErrorLevel.FATAL]: 4
    };

    const currentLogLevel = logLevels[this.policy.logLevel] || 0;
    return logLevels[level] >= currentLogLevel;
  }

  // エラーを処理
  handleError(error) {
    // エラーオブジェクトの検証
    if (!error || !error.level || !error.code) {
      console.error('Invalid error object');
      return;
    }

    // ログレベルに基づいてログを記録
    if (this.shouldLogError(error.level)) {
      console.error(`[${error.level.toUpperCase()}] ${error.code}: ${error.message}`);
      if (error.context) {
        console.error('コンテキスト:', error.context);
      }
    }

    // イベントを発火（設定されている場合）
    if (this.policy.emitEvents && this.eventSystem) {
      this.eventSystem.emit('error.any', error);
      this.eventSystem.emit(`error.${error.level}`, error);
    }

    // エラーレベルに基づいて例外をスロー
    if (error.level === this.policy.throwOnLevel) {
      throw new Error(`[${error.level.toUpperCase()}] ${error.code}: ${error.message}`);
    }
  }

  // エラーをログに記録のみ
  logError(error) {
    if (this.shouldLogError(error.level)) {
      console.error(`[${error.level.toUpperCase()}] ${error.code}: ${error.message}`);
      if (error.context) {
        console.error('コンテキスト:', error.context);
      }
    }
  }

  // エラーの登録
  register(errorCode, context = {}, message) {
    // カスタムメッセージがない場合はエラーコードを使用
    const errorMessage = message || `エラー: ${errorCode}`;

    // エラーオブジェクトを作成
    const error = {
      code: errorCode,
      message: errorMessage,
      context: context,
      level: ErrorLevel.ERROR, // デフォルトレベル
      timestamp: Date.now()
    };

    return error;
  }
}

export { ErrorHandler };
export default ErrorHandler;
