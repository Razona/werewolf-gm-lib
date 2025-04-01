import ErrorLevel from './ErrorLevel';

/**
 * エラーカタログ - アプリケーション全体で使用するエラー定義
 */
const ErrorCatalog = {
  PLAYER: {
    INVALID_PLAYER_ID: {
      code: 'E0101',
      message: '無効なプレイヤーID',
      level: ErrorLevel.ERROR
    },
    NOT_ALIVE: {
      code: 'E0102',
      message: 'プレイヤーは生存していません',
      level: ErrorLevel.ERROR
    }
  },
  ROLE: {
    INVALID_ROLE: {
      code: 'E0201',
      message: '無効な役職',
      level: ErrorLevel.ERROR
    },
    ACTION_NOT_ALLOWED: {
      code: 'E0202',
      message: '役職アクションは許可されていません',
      level: ErrorLevel.ERROR
    }
  },
  GAME: {
    INVALID_PHASE: {
      code: 'E0301',
      message: '無効なゲームフェーズ',
      level: ErrorLevel.ERROR
    },
    ALREADY_STARTED: {
      code: 'E0302',
      message: 'ゲームは既に開始されています',
      level: ErrorLevel.ERROR
    },
    NOT_STARTED: {
      code: 'E0303',
      message: 'ゲームがまだ開始されていません',
      level: ErrorLevel.ERROR
    }
  },
  VALIDATION: {
    REQUIRED_VALUE_MISSING: {
      code: 'E0401',
      message: '必須の値が見つかりません',
      level: ErrorLevel.ERROR
    },
    INVALID_TYPE: {
      code: 'E0402',
      message: '無効な型です',
      level: ErrorLevel.ERROR
    }
  },
  ACTION: {
    INVALID_TARGET: {
      code: 'E0501',
      message: '無効なターゲットです',
      level: ErrorLevel.ERROR
    },
    OUT_OF_TURN: {
      code: 'E0502',
      message: 'このアクションは現在実行できません',
      level: ErrorLevel.ERROR
    }
  },
  VOTE: {
    ALREADY_VOTED: {
      code: 'E0601',
      message: '既に投票済みです',
      level: ErrorLevel.ERROR
    },
    INVALID_VOTE: {
      code: 'E0602',
      message: '無効な投票です',
      level: ErrorLevel.ERROR
    }
  },

  // エラーカタログの拡張や検索メソッド
  getErrorByCode(code) {
    for (const category in this) {
      if (typeof this[category] === 'object' && category !== 'getErrorByCode' && category !== 'getError') {
        for (const errorKey in this[category]) {
          if (this[category][errorKey].code === code) {
            return this[category][errorKey];
          }
        }
      }
    }
    return null;
  },

  // カテゴリとキーで直接エラーを取得
  getError(category, key) {
    if (this[category] && typeof this[category] === 'object') {
      return this[category][key] || null;
    }
    return null;
  }
};

export { ErrorCatalog };
export default ErrorCatalog;
