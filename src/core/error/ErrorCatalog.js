/**
 * エラーカタログ
 * ゲーム内で発生する可能性のあるすべてのエラーを定義
 */
const ErrorLevel = require('./ErrorLevel');

const ErrorCatalog = {
  // プレイヤー関連エラー: E01xx
  PLAYER: {
    INVALID_PLAYER_ID: {
      code: 'E0101',
      level: ErrorLevel.ERROR,
      message: 'プレイヤーIDが無効です',
      details: 'システムに存在しないプレイヤーIDが指定されました'
    },
    PLAYER_NOT_FOUND: {
      code: 'E0102',
      level: ErrorLevel.ERROR,
      message: 'プレイヤーが見つかりません',
      details: '指定されたプレイヤーはゲームに参加していません'
    },
    DEAD_PLAYER_ACTION: {
      code: 'E0103',
      level: ErrorLevel.ERROR,
      message: '死亡したプレイヤーは操作できません',
      details: '死亡したプレイヤーはアクションや投票を行うことができません'
    },
    DUPLICATE_PLAYER: {
      code: 'E0104',
      level: ErrorLevel.ERROR,
      message: '同名のプレイヤーが既に存在します',
      details: '同じ名前のプレイヤーを追加することはできません'
    },
    PLAYER_ALREADY_EXISTS: {
      code: 'E0105',
      level: ErrorLevel.ERROR,
      message: 'プレイヤーが既に存在します',
      details: '同じIDのプレイヤーが既に登録されています'
    },
    MAX_PLAYERS_REACHED: {
      code: 'E0106',
      level: ErrorLevel.ERROR,
      message: '最大プレイヤー数に達しました',
      details: 'ゲームの設定で指定された最大プレイヤー数に達しました'
    }
  },

  // 役職関連エラー: E02xx
  ROLE: {
    INVALID_ROLE_ASSIGNMENT: {
      code: 'E0201',
      level: ErrorLevel.ERROR,
      message: '役職の割り当てに失敗しました',
      details: '役職の割り当てルールに違反しています'
    },
    ROLE_NOT_FOUND: {
      code: 'E0202',
      level: ErrorLevel.ERROR,
      message: '役職が見つかりません',
      details: '指定された役職は存在しないか、現在のゲームで使用されていません'
    },
    INVALID_ROLE_ACTION: {
      code: 'E0203',
      level: ErrorLevel.ERROR,
      message: 'この役職ではその行動はできません',
      details: '指定された行動はこの役職では実行できません'
    },
    ROLE_DEPENDENCY_ERROR: {
      code: 'E0204',
      level: ErrorLevel.ERROR,
      message: '役職の依存関係エラー',
      details: '一部の役職には他の特定の役職が必要です（例：背徳者には妖狐が必要）'
    },
    RESTRICTED_ABILITY: {
      code: 'E0205',
      level: ErrorLevel.ERROR,
      message: '制限された能力',
      details: 'この能力は現在の状況では使用できません'
    },
    INVALID_ROLE_CONFIGURATION: {
      code: 'E0206',
      level: ErrorLevel.ERROR,
      message: '無効な役職構成',
      details: '指定された役職構成は無効です'
    }
  },

  // アクション関連エラー: E03xx
  ACTION: {
    INVALID_ACTION_TARGET: {
      code: 'E0301',
      level: ErrorLevel.ERROR,
      message: '無効なアクション対象',
      details: '指定されたアクション対象は無効です'
    },
    ACTION_NOT_ALLOWED: {
      code: 'E0302',
      level: ErrorLevel.ERROR,
      message: '許可されていないアクション',
      details: '現在のフェーズやゲーム状態ではこのアクションは許可されていません'
    },
    DUPLICATE_ACTION: {
      code: 'E0303',
      level: ErrorLevel.ERROR,
      message: '重複したアクション',
      details: '同じプレイヤーによる同じタイプのアクションが既に登録されています'
    },
    ACTION_TARGET_SELF: {
      code: 'E0304',
      level: ErrorLevel.ERROR,
      message: '自分自身をターゲットにできません',
      details: 'このアクションでは自分自身をターゲットにすることはできません'
    },
    ACTION_PHASE_MISMATCH: {
      code: 'E0305',
      level: ErrorLevel.ERROR,
      message: 'フェーズとアクションの不一致',
      details: '現在のフェーズはこのアクションと一致していません'
    }
  },

  // 投票関連エラー: E04xx
  VOTE: {
    INVALID_VOTE_TARGET: {
      code: 'E0401',
      level: ErrorLevel.ERROR,
      message: '無効な投票対象',
      details: '指定された投票対象は無効です'
    },
    VOTE_NOT_ALLOWED: {
      code: 'E0402',
      level: ErrorLevel.ERROR,
      message: '投票が許可されていません',
      details: '現在のフェーズでは投票は許可されていません'
    },
    INVALID_VOTE_CHANGE: {
      code: 'E0403',
      level: ErrorLevel.ERROR,
      message: '投票の変更が無効です',
      details: '投票の変更が許可されていないか、前回の投票が見つかりません'
    },
    SELF_VOTE_NOT_ALLOWED: {
      code: 'E0404',
      level: ErrorLevel.ERROR,
      message: '自分自身への投票は許可されていません',
      details: '現在の設定では自分自身に投票することはできません'
    },
    DUPLICATE_VOTE: {
      code: 'E0405',
      level: ErrorLevel.ERROR,
      message: '重複した投票',
      details: '同じ対象に対してすでに投票しています'
    },
    VOTE_PHASE_MISMATCH: {
      code: 'E0406',
      level: ErrorLevel.ERROR,
      message: 'フェーズと投票の不一致',
      details: '現在のフェーズではこの種類の投票は行えません'
    },
    DUPLICATE_VOTE: {
      code: 'E0405',
      level: ErrorLevel.ERROR,
      message: '重複した投票',
      details: '同じ対象に対してすでに投票しています'
    },
    VOTE_PHASE_MISMATCH: {
      code: 'E0406',
      level: ErrorLevel.ERROR,
      message: 'フェーズと投票の不一致',
      details: '現在のフェーズではこの種類の投票は行えません'
    }
  },

  // フェーズ関連エラー: E05xx
  PHASE: {
    INVALID_PHASE_TRANSITION: {
      code: 'E0501',
      level: ErrorLevel.ERROR,
      message: '無効なフェーズ遷移',
      details: '現在のフェーズから指定されたフェーズへの遷移は許可されていません'
    },
    PHASE_ACTION_INCOMPLETE: {
      code: 'E0502',
      level: ErrorLevel.ERROR,
      message: 'フェーズアクションが不完全',
      details: '現在のフェーズでの必須アクションが完了していません'
    },
    INVALID_PHASE_OPERATION: {
      code: 'E0503',
      level: ErrorLevel.ERROR,
      message: '無効なフェーズ操作',
      details: '現在のフェーズではこの操作は許可されていません'
    },
    PHASE_NOT_FOUND: {
      code: 'E0504',
      level: ErrorLevel.ERROR,
      message: 'フェーズが見つかりません',
      details: '指定されたフェーズは存在しないか、現在のゲームでは利用できません'
    },
    INCOMPLETE_PHASE_ACTIONS: {
      code: 'E0505',
      level: ErrorLevel.ERROR,
      message: 'フェーズアクションが未完了',
      details: 'このフェーズでのすべての必須アクションが完了していません'
    },
    GAME_ALREADY_STARTED: {
      code: 'E0506',
      level: ErrorLevel.ERROR,
      message: 'ゲームはすでに開始されています',
      details: 'ゲームはすでに開始されているため、この操作は実行できません'
    },
    INCOMPLETE_PHASE_ACTIONS: {
      code: 'E0505',
      level: ErrorLevel.ERROR,
      message: 'フェーズアクションが未完了',
      details: 'このフェーズでのすべての必須アクションが完了していません'
    },
    GAME_ALREADY_STARTED: {
      code: 'E0506',
      level: ErrorLevel.ERROR,
      message: 'ゲームはすでに開始されています',
      details: 'ゲームはすでに開始されているため、この操作は実行できません'
    }
  },

  // システム関連エラー: E06xx
  SYSTEM: {
    INTERNAL_ERROR: {
      code: 'E0601',
      level: ErrorLevel.FATAL,
      message: 'システム内部エラーが発生しました',
      details: '予期しないシステムエラーが発生しました。開発者に報告してください'
    },
    INVALID_CONFIGURATION: {
      code: 'E0602',
      level: ErrorLevel.ERROR,
      message: '無効な設定',
      details: 'ゲーム設定に無効なパラメータが含まれています'
    },
    OPERATION_TIMEOUT: {
      code: 'E0603',
      level: ErrorLevel.ERROR,
      message: '操作がタイムアウトしました',
      details: '操作が完了する前にタイムアウトしました'
    },
    STATE_CORRUPTION: {
      code: 'E0604',
      level: ErrorLevel.FATAL,
      message: '状態の破損',
      details: 'ゲーム状態が破損しています。復元できない可能性があります'
    },
    NOT_IMPLEMENTED: {
      code: 'E0605',
      level: ErrorLevel.ERROR,
      message: '未実装の機能',
      details: 'この機能は現在実装されていません'
    },
    NOT_IMPLEMENTED: {
      code: 'E0605',
      level: ErrorLevel.ERROR,
      message: '未実装の機能',
      details: 'この機能は現在実装されていません'
    }
  },

  // 状態管理関連エラー: E07xx
  STATE: {
    SERIALIZATION_ERROR: {
      code: 'E0701',
      level: ErrorLevel.ERROR,
      message: 'シリアライズエラー',
      details: 'ゲーム状態のシリアライズに失敗しました'
    },
    DESERIALIZATION_ERROR: {
      code: 'E0702',
      level: ErrorLevel.ERROR,
      message: 'デシリアライズエラー',
      details: 'ゲーム状態のデシリアライズに失敗しました'
    },
    INVALID_STATE: {
      code: 'E0703',
      level: ErrorLevel.ERROR,
      message: '無効な状態',
      details: 'ゲーム状態が無効です'
    },
    STATE_VALIDATION_ERROR: {
      code: 'E0704',
      level: ErrorLevel.ERROR,
      message: '状態検証エラー',
      details: 'ゲーム状態の検証に失敗しました'
    }
  },

  // 拡張関連エラー: E08xx
  EXTENSION: {
    PLUGIN_LOAD_ERROR: {
      code: 'E0801',
      level: ErrorLevel.ERROR,
      message: 'プラグイン読み込みエラー',
      details: 'プラグインの読み込みに失敗しました'
    },
    PLUGIN_COMPATIBILITY_ERROR: {
      code: 'E0802',
      level: ErrorLevel.ERROR,
      message: 'プラグイン互換性エラー',
      details: 'プラグインはこのバージョンのシステムと互換性がありません'
    },
    CUSTOM_ROLE_ERROR: {
      code: 'E0803',
      level: ErrorLevel.ERROR,
      message: 'カスタム役職エラー',
      details: 'カスタム役職の登録または使用中にエラーが発生しました'
    },
    EXTENSION_CONFLICT: {
      code: 'E0804',
      level: ErrorLevel.ERROR,
      message: '拡張機能の競合',
      details: '複数の拡張機能間で競合が発生しています'
    }
  },

  // 検証関連エラー: E09xx
  VALIDATION: {
    INVALID_PARAMETER: {
      code: 'E0901',
      level: ErrorLevel.ERROR,
      message: '不正なパラメータが渡されました',
      details: '指定されたパラメータは型または範囲が無効です'
    },
    MISSING_REQUIRED_FIELD: {
      code: 'E0902',
      level: ErrorLevel.ERROR,
      message: '必須フィールドが不足しています',
      details: '必要な情報が提供されていません'
    },
    DEAD_PLAYER_ACTION: {
      code: 'E0903',
      level: ErrorLevel.ERROR,
      message: '死亡したプレイヤーは操作できません',
      details: '死亡したプレイヤーはアクションを実行できません'
    },
    TYPE_ERROR: {
      code: 'E0904',
      level: ErrorLevel.ERROR,
      message: '型エラー',
      details: '指定された値の型が正しくありません'
    }
  },

  // 警告：W01xx
  WARNING: {
    DEPRECATED_FEATURE: {
      code: 'W0101',
      level: ErrorLevel.WARNING,
      message: '非推奨の機能',
      details: 'この機能は将来のバージョンで削除される予定です'
    },
    SUBOPTIMAL_CONFIGURATION: {
      code: 'W0102',
      level: ErrorLevel.WARNING,
      message: '最適でない設定',
      details: '現在の設定は機能しますが、最適ではありません'
    },
    PERFORMANCE_WARNING: {
      code: 'W0103',
      level: ErrorLevel.WARNING,
      message: 'パフォーマンス警告',
      details: 'この操作はパフォーマンスに影響を与える可能性があります'
    },
    INCONSISTENT_STATE: {
      code: 'W0104',
      level: ErrorLevel.WARNING,
      message: '一貫性のない状態',
      details: 'ゲーム状態に一貫性のない箇所が検出されましたが、続行は可能です'
    }
  },

  // 情報提供：I01xx
  INFO: {
    GAME_STATE_CHANGE: {
      code: 'I0101',
      level: ErrorLevel.INFO,
      message: 'ゲーム状態変更',
      details: 'ゲームの状態が変更されました'
    },
    ACTION_PERFORMED: {
      code: 'I0102',
      level: ErrorLevel.INFO,
      message: 'アクション実行',
      details: 'アクションが正常に実行されました'
    },
    PHASE_CHANGE: {
      code: 'I0103',
      level: ErrorLevel.INFO,
      message: 'フェーズ変更',
      details: 'ゲームのフェーズが変更されました'
    },
    PLAYER_STATUS_CHANGE: {
      code: 'I0104',
      level: ErrorLevel.INFO,
      message: 'プレイヤー状態変更',
      details: 'プレイヤーの状態が変更されました'
    }
  }
};

/**
 * エラーコードからエラー情報を取得する
 * @param {string} code - エラーコード
 * @returns {object|null} エラー情報、見つからない場合はnull
 */
function getErrorByCode(code) {
  if (!code || typeof code !== 'string') return null;

  // 全カテゴリーを検索
  for (const category in ErrorCatalog) {
    for (const errorKey in ErrorCatalog[category]) {
      const error = ErrorCatalog[category][errorKey];
      if (error.code === code) {
        return error;
      }
    }
  }
  
  return null;
}

/**
 * 特定のレベルのエラーをすべて取得
 * @param {string} level - エラーレベル
 * @returns {Array} 指定されたレベルのエラー配列
 */
function getErrorsByLevel(level) {
  if (!level) return [];
  
  const result = [];
  
  // 全カテゴリーを検索
  for (const category in ErrorCatalog) {
    for (const errorKey in ErrorCatalog[category]) {
      const error = ErrorCatalog[category][errorKey];
      if (error.level === level) {
        result.push(error);
      }
    }
  }
  
  return result;
}

module.exports = {
  ErrorCatalog,
  getErrorByCode,
  getErrorsByLevel
};
