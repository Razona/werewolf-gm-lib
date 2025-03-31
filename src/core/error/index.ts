import { ErrorHandler } from './ErrorHandler';
import { ErrorCatalog, getErrorByCode, getErrorsByLevel } from './ErrorCatalog';
import { ErrorLevel } from './ErrorLevel';
import { Validator } from './Validator';

/**
 * エラーシステムを作成する
 * @param eventSystem - イベントシステム
 * @param options - オプション設定
 * @returns エラーシステムのインスタンス
 */
export function createErrorSystem(eventSystem: any, options: any = {}) {
  const errorHandler = new ErrorHandler(eventSystem, options.policy);
  const validator = new Validator(errorHandler);
  
  return {
    errorHandler,
    validator,
    ErrorCatalog,
    getErrorByCode,
    getErrorsByLevel
  };
}

export {
  ErrorHandler,
  ErrorCatalog,
  ErrorLevel,
  Validator,
  getErrorByCode,
  getErrorsByLevel
};
