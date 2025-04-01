import ErrorCatalog from './ErrorCatalog';
import ErrorLevel from './ErrorLevel';

/**
 * バリデーションのためのクラス
 */
class Validator {
  constructor(errorHandler = null) {
    this.errorHandler = errorHandler;
    this.customValidators = new Map();
  }

  // 値の存在チェック
  validateExists(value, options = {}) {
    const message = options.message || '値が存在しません';
    const context = options.context || {};

    if (value === null || value === undefined) {
      if (this.errorHandler) {
        this.errorHandler.handleError({
          code: 'E0101',
          message,
          level: ErrorLevel.ERROR,
          context
        });
        return false;
      } else {
        this.throwValidationError({
          code: 'E0101',
          message,
          level: ErrorLevel.ERROR,
          context
        });
      }
    }
    return true;
  }

  // 条件チェック
  validateCondition(condition, options = {}) {
    const message = options.message || '条件を満たしていません';
    const context = options.context || {};

    if (!condition) {
      if (this.errorHandler) {
        this.errorHandler.handleError({
          code: 'E0901',
          message,
          level: ErrorLevel.ERROR,
          context
        });
        return false;
      } else {
        this.throwValidationError({
          code: 'E0901',
          message,
          level: ErrorLevel.ERROR,
          context
        });
      }
    }
    return true;
  }

  // 型チェック
  validateType(value, expectedType, options = {}) {
    const message = options.message || `型が一致しません: 期待する型は${expectedType}`;
    const context = options.context || {};
    let actualType = typeof value;
    let isValid = false;

    switch (expectedType) {
      case 'array':
        isValid = Array.isArray(value);
        break;
      case 'integer':
        isValid = Number.isInteger(value);
        break;
      case 'positive':
        isValid = typeof value === 'number' && value > 0 && !isNaN(value);
        break;
      case 'nonnegative':
        isValid = typeof value === 'number' && value >= 0 && !isNaN(value);
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'null':
        isValid = value === null;
        break;
      case 'undefined':
        isValid = value === undefined;
        break;
      default:
        isValid = actualType === expectedType;
    }

    if (!isValid) {
      const fullContext = { 
        ...context,
        value, 
        expectedType, 
        actualType 
      };

      if (this.errorHandler) {
        this.errorHandler.handleError({
          code: 'E0904',
          message: `${message}、実際の型は${actualType}`,
          level: ErrorLevel.ERROR,
          context: fullContext
        });
        return false;
      } else {
        this.throwValidationError({
          code: 'E0904',
          message: `${message}、実際の型は${actualType}`,
          level: ErrorLevel.ERROR,
          context: fullContext
        });
      }
    }
    return true;
  }

  // カスタムバリデータの登録
  registerCustomValidator(name, validatorFn) {
    this.customValidators.set(name, validatorFn);
    return true;
  }

  // カスタムバリデータの実行
  executeCustomValidator(name, value, context = {}) {
    const validator = this.customValidators.get(name);
    if (!validator) {
      throw new Error(`Custom validator ${name} not found`);
    }

    const isValid = validator(value, context);
    if (!isValid) {
      if (this.errorHandler) {
        this.errorHandler.handleError({
          code: 'E0905',
          message: `カスタムバリデーター ${name} に失敗しました`,
          level: ErrorLevel.ERROR,
          context
        });
        return false;
      } else {
        this.throwValidationError({
          code: 'E0905',
          message: `カスタムバリデーター ${name} に失敗しました`,
          level: ErrorLevel.ERROR,
          context
        });
      }
    }
    return true;
  }

  // プレイヤーアクションのバリデーション
  validatePlayerAction(action, player) {
    // プレイヤーが存在するかチェック
    this.validateExists(player, { message: 'プレイヤーが存在しません' });
    
    // プレイヤーが生存しているかチェック
    this.validateCondition(player.isAlive, { message: 'プレイヤーは生存している必要があります' });
    
    return true;
  }

  // 役職アクションのバリデーション
  validateRoleAction(action, role) {
    this.validateExists(role, { message: '役職が存在しません' });
    return true;
  }

  // エラーハンドリング
  throwValidationError(errorObj) {
    // コンソールにエラーを出力
    console.error(`[ERROR] ${errorObj.code}: ${errorObj.message}`);
    console.error('コンテキスト:', errorObj.context);
    
    // エラーをスロー
    throw new Error(errorObj.message);
  }
}

export { Validator };
export default Validator;
