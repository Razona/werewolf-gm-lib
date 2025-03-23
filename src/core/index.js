/**
 * @file src/core/index.js
 * @description コアレイヤーのエントリーポイント
 * 共通モジュール、イベントシステム、エラーシステムをエクスポート
 */

// Common モジュール
import Common, {
  TEAM,
  PHASE,
  ACTION_TYPE,
  VOTE_TYPE,
  DEATH_CAUSE,
  generateId,
  shuffle,
  deepCopy,
  getTimestamp,
  createRandomGenerator,
  mergeObjects
} from './common';

// イベントシステム
import EventSystem from './event/EventSystem';

// エラーシステム
import ErrorCatalog from './error/ErrorCatalog';
import ErrorHandler, { GameError } from './error/ErrorHandler';

// コアレイヤーのバージョン
export const CORE_VERSION = '0.1.0';

// 定数のエクスポート
export {
  TEAM,
  PHASE,
  ACTION_TYPE,
  VOTE_TYPE,
  DEATH_CAUSE
};

// ユーティリティ関数のエクスポート
export {
  generateId,
  shuffle,
  deepCopy,
  getTimestamp,
  createRandomGenerator,
  mergeObjects
};

// クラスとオブジェクトのエクスポート
export {
  EventSystem,
  ErrorCatalog,
  ErrorHandler,
  GameError
};

// デフォルトエクスポート
export default {
  // バージョン情報
  version: CORE_VERSION,
  
  // 定数
  TEAM,
  PHASE,
  ACTION_TYPE,
  VOTE_TYPE,
  DEATH_CAUSE,
  
  // ユーティリティ
  Common,
  
  // クラス
  EventSystem,
  ErrorHandler,
  GameError,
  
  // オブジェクト
  ErrorCatalog
};
