/**
 * バリデーター
 * 入力データの検証と検証エラー生成を担当するクラス
 */
const { ErrorCatalog } = require('./ErrorCatalog');

class Validator {
  /**
   * @param {object} errorHandler - エラーハンドラーのインスタンス
   */
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * 指定された条件が真でない場合エラーを発生させる
   * @param {boolean} condition - 検証条件
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @throws {Error} 条件が偽の場合、エラーハンドラーを通じてエラーを発生
   */
  assert(condition, error, context = {}) {
    if (!condition) {
      this.errorHandler.handleError(error, context);
    }
    return condition;
  }

  /**
   * 値が存在することを検証（null, undefined, 空文字列でないこと）
   * @param {*} value - 検証する値
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  exists(value, error = ErrorCatalog.VALIDATION.MISSING_REQUIRED_FIELD, context = {}) {
    const isValid = value !== null && value !== undefined && value !== '';
    return this.assert(isValid, error, context);
  }

  /**
   * 値が特定の型であることを検証
   * @param {*} value - 検証する値
   * @param {string} type - 期待する型
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  isType(value, type, error = ErrorCatalog.VALIDATION.INVALID_PARAMETER, context = {}) {
    let isValid = false;
    
    switch (type.toLowerCase()) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
      case 'object':
        isValid = value !== null && typeof value === 'object' && !Array.isArray(value);
        break;
      case 'function':
        isValid = typeof value === 'function';
        break;
      default:
        isValid = false;
    }
    
    return this.assert(isValid, error, {
      expectedType: type,
      actualType: Array.isArray(value) ? 'array' : typeof value,
      ...context
    });
  }

  /**
   * 値が指定された範囲内であることを検証
   * @param {number} value - 検証する値
   * @param {number} min - 最小値
   * @param {number} max - 最大値
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  inRange(value, min, max, error = ErrorCatalog.VALIDATION.INVALID_PARAMETER, context = {}) {
    const isValid = typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
    return this.assert(isValid, error, {
      min,
      max,
      value,
      ...context
    });
  }

  /**
   * 値が配列に含まれることを検証
   * @param {*} value - 検証する値
   * @param {Array} allowedValues - 許可される値の配列
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  isOneOf(value, allowedValues, error = ErrorCatalog.VALIDATION.INVALID_PARAMETER, context = {}) {
    const isValid = Array.isArray(allowedValues) && allowedValues.includes(value);
    return this.assert(isValid, error, {
      allowedValues,
      value,
      ...context
    });
  }

  /**
   * オブジェクトが必須プロパティを持つことを検証
   * @param {object} obj - 検証するオブジェクト
   * @param {string[]} requiredProps - 必須プロパティの配列
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  hasRequiredProperties(obj, requiredProps, error = ErrorCatalog.VALIDATION.MISSING_REQUIRED_FIELD, context = {}) {
    const isObject = this.isType(obj, 'object', error, context);
    if (!isObject) return false;
    
    const missingProps = [];
    for (const prop of requiredProps) {
      if (obj[prop] === undefined) {
        missingProps.push(prop);
      }
    }
    
    const isValid = missingProps.length === 0;
    return this.assert(isValid, error, {
      missingProperties: missingProps,
      ...context
    });
  }

  /**
   * プレイヤーの生存状態を検証
   * @param {object} player - プレイヤーオブジェクト
   * @param {boolean} shouldBeAlive - 期待する生存状態
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  playerAliveStatus(player, shouldBeAlive = true, error = ErrorCatalog.VALIDATION.DEAD_PLAYER_ACTION, context = {}) {
    // プレイヤーが存在するか検証
    const playerExists = this.exists(player, error, {
      message: 'プレイヤーが存在しません',
      ...context
    });
    
    if (!playerExists) return false;
    
    const isValid = player.isAlive === shouldBeAlive;
    return this.assert(isValid, error, {
      playerId: player.id,
      expectedStatus: shouldBeAlive ? 'alive' : 'dead',
      actualStatus: player.isAlive ? 'alive' : 'dead',
      ...context
    });
  }

  /**
   * 指定された条件を検証する
   * @param {boolean} condition - 検証条件
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  validateCondition(condition, error, context = {}) {
    return this.assert(condition, error, context);
  }

  /**
   * プレイヤーアクションの検証
   * @param {object} action - アクションオブジェクト
   * @param {object} player - プレイヤーオブジェクト
   * @param {object} gameState - ゲーム状態
   * @returns {boolean} 検証結果
   */
  validatePlayerAction(action, player, gameState) {
    // プレイヤーが存在するか確認
    const playerExists = this.exists(player, { 
      code: 'E0102', 
      message: 'プレイヤーが見つかりません', 
      details: '指定されたプレイヤーはゲームに参加していません' 
    }, { playerId: action.actor });
    
    if (!playerExists) return false;
    
    // プレイヤーが生存しているか確認
    return this.playerAliveStatus(player, true, { 
      code: 'E0103', 
      message: '死亡したプレイヤーは操作できません', 
      details: '死亡したプレイヤーはアクションを実行できません' 
    }, { playerId: action.actor, action });
  }

  /**
   * 役職アクションの検証
   * @param {object} action - アクションオブジェクト
   * @param {object} role - 役職オブジェクト
   * @param {object} gameState - ゲーム状態
   * @returns {boolean} 検証結果
   */
  validateRoleAction(action, role, gameState) {
    // 役職が存在するか確認
    const roleExists = this.exists(role, { 
      code: 'E0202', 
      message: '役職が見つかりません', 
      details: '指定された役職は存在しないか、現在のゲームで使用されていません' 
    }, { roleName: role.name });
    
    if (!roleExists) return false;
    
    // 役職が能力を使用できるか確認
    return this.assert(role.canUseAbility(), { 
      code: 'E0203', 
      message: 'この役職ではその行動はできません', 
      details: '指定された行動はこの役職では実行できません' 
    }, { roleName: role.name, action });
  }

  /**
   * ゲーム状態の検証
   * @param {object} action - アクションオブジェクト
   * @param {object} gameState - ゲーム状態
   * @returns {boolean} 検証結果
   */
  validateGameState(action, gameState) {
    // ゲームが開始されているか確認
    const gameStarted = this.assert(gameState.hasStarted, { 
      code: 'E0602', 
      message: 'ゲームが開始されていません', 
      details: 'ゲームは開始されていないため、このアクションを実行できません' 
    }, { action });
    
    if (!gameStarted) return false;
    
    // ゲームが終了していないか確認
    return this.assert(!gameState.hasEnded, { 
      code: 'E0503', 
      message: 'ゲームが終了しています', 
      details: 'ゲームはすでに終了しているため、このアクションを実行できません' 
    }, { action });
  }

  /**
   * 現在のフェーズでアクション可能か検証
   * @param {string} actionType - アクションタイプ
   * @param {string} currentPhase - 現在のフェーズ
   * @param {string[]} allowedPhases - 許可されたフェーズ配列
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  isActionAllowedInPhase(actionType, currentPhase, allowedPhases, error, context = {}) {
    const isValid = allowedPhases.includes(currentPhase);
    return this.assert(isValid, error, {
      actionType,
      currentPhase,
      allowedPhases,
      ...context
    });
  }

  /**
   * 値が一意であることを検証
   * @param {*} value - 検証する値
   * @param {Array} collection - 値を含む可能性のある配列
   * @param {Function} accessor - 配列要素から比較する値を取得するためのアクセサ関数
   * @param {string|object} error - エラーコードまたはエラーオブジェクト
   * @param {object} context - エラーコンテキスト
   * @returns {boolean} 検証結果
   */
  isUnique(value, collection, accessor = item => item, error, context = {}) {
    const matchingItems = collection.filter(item => accessor(item) === value);
    const isValid = matchingItems.length === 0;
    
    return this.assert(isValid, error, {
      value,
      matches: matchingItems,
      ...context
    });
  }
}

module.exports = Validator;
