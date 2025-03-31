import { ErrorLevel, ErrorLevelType } from './ErrorLevel';

export interface ErrorOptions {
  code: string;
  message: string;
  level?: string; // エラーレベルの値を文字列として扱う
  context?: Record<string, any>;
}

export class ErrorHandler {
  private errorLog: ErrorOptions[] = [];

  constructor() {}

  handle(error: ErrorOptions): void {
    const defaultError: ErrorOptions = {
      code: error.code,
      message: error.message,
      level: error.level || ErrorLevel.ERROR,
      context: error.context || {}
    };

    this.errorLog.push(defaultError);

    // コンソール出力のための簡単なロギング
    switch (defaultError.level) {
      case ErrorLevel.FATAL:
        console.error(`[FATAL] ${defaultError.code}: ${defaultError.message}`);
        break;
      case ErrorLevel.ERROR:
        console.error(`[ERROR] ${defaultError.code}: ${defaultError.message}`);
        break;
      case ErrorLevel.WARNING:
        console.warn(`[WARNING] ${defaultError.code}: ${defaultError.message}`);
        break;
      case ErrorLevel.INFO:
        console.log(`[INFO] ${defaultError.code}: ${defaultError.message}`);
        break;
    }
  }

  getErrors(): ErrorOptions[] {
    return [...this.errorLog];
  }

  clearErrors(): void {
    this.errorLog = [];
  }

  getErrorsByLevel(level: string): ErrorOptions[] {
    return this.errorLog.filter(error => error.level === level);
  }
}
