import ErrorHandler from './ErrorHandler';
import ErrorCatalog from './ErrorCatalog';
import ErrorLevel from './ErrorLevel';
import Validator from './Validator';

/**
 * エラーシステムを作成
 * @param {Object} eventSystem - イベントシステム
 * @param {Object} [options={}] - エラーシステムのオプション
 * @returns {Object} エラーシステムコンポーネント
 */
function createErrorSystem(eventSystem, options = {}) {
  const errorHandler = new ErrorHandler(eventSystem, options);
  const validator = new Validator(errorHandler);
  
  return {
    errorHandler,
    validator
  };
}

export {
  ErrorHandler,
  ErrorCatalog,
  ErrorLevel,
  Validator,
  createErrorSystem
};

export default {
  ErrorHandler,
  ErrorCatalog,
  ErrorLevel,
  Validator,
  createErrorSystem
};
