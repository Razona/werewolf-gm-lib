/**
 * GameManagerError.js - GameManagerのエラー管理機能を提供するMixinファイル
 * このモジュールはエラーの検出、分類、処理、報告を担当
 */

import ErrorLevel from '../../core/error/ErrorLevel';
import ErrorCatalog from '../../core/error/ErrorCatalog';

/**
 * GameManagerにエラー処理機能を追加するMixin
 * @param {Class} GameManager - GameManagerクラス
 */
function GameManagerErrorMixin(GameManager) {
  /**
   * エラー処理ポリシーを設定します
   * @param {Object} policy - エラー処理ポリシー設定
   * @param {string} policy.throwLevel - 例外をスローするエラーレベル
   * @param {string} policy.logLevel - ログに記録するエラーレベル
   * @param {boolean} policy.emitEvents - エラー発生時にイベントを発火するか
   * @returns {Object} 設定されたポリシー
   */
  GameManager.prototype.setErrorPolicy = function (policy) {
    if (!this.errorHandler) {
      throw new Error('ErrorHandlerが初期化されていません');
    }

    // エラーレベルの検証
    const validLevels = Object.values(ErrorLevel);
    if (policy.throwLevel && !validLevels.includes(policy.throwLevel)) {
      console.warn(`無効なthrowLevel: ${policy.throwLevel}、デフォルト値が使用されます`);
      policy.throwLevel = undefined;
    }

    if (policy.logLevel && !validLevels.includes(policy.logLevel)) {
      console.warn(`無効なlogLevel: ${policy.logLevel}、デフォルト値が使用されます`);
      policy.logLevel = undefined;
    }

    // ポリシーの設定
    this.errorHandler.policy = {
      ...this.errorHandler.policy,
      ...policy
    };

    return this.errorHandler.policy;
  };

  /**
   * 操作の妥当性を検証します
   * @param {string} operation - 検証する操作
   * @param {Object} context - 操作のコンテキスト情報
   * @returns {Object} 検証結果
   */
  GameManager.prototype.validateOperation = function (operation, context = {}) {
    // ゲーム状態に関する検証
    if (['addPlayer', 'removePlayer', 'setRoles', 'distributeRoles'].includes(operation)) {
      if (this.state.isStarted) {
        return {
          valid: false,
          code: 'GAME_ALREADY_STARTED',
          message: 'ゲームは既に開始されています'
        };
      }
    }

    if (['vote', 'registerAction', 'killPlayer', 'nextPhase', 'checkWinCondition'].includes(operation)) {
      if (!this.state.isStarted) {
        return {
          valid: false,
          code: 'GAME_NOT_STARTED',
          message: 'ゲームがまだ開始されていません'
        };
      }

      if (this.state.isEnded) {
        return {
          valid: false,
          code: 'GAME_ALREADY_ENDED',
          message: 'ゲームは既に終了しています'
        };
      }
    }

    // プレイヤー関連の検証
    if (context.playerId !== undefined) {
      if (this.playerManager && !this.playerManager.getPlayer(context.playerId)) {
        return {
          valid: false,
          code: 'PLAYER_NOT_FOUND',
          message: '指定されたプレイヤーが見つかりません'
        };
      }

      // 生存プレイヤーに関する検証
      if (['vote', 'registerAction'].includes(operation) &&
        this.playerManager && !this.playerManager.isPlayerAlive(context.playerId)) {
        return {
          valid: false,
          code: 'PLAYER_NOT_ALIVE',
          message: 'このプレイヤーは行動できません'
        };
      }
    }

    // フェーズに関する検証
    if (context.phase && this.phaseManager) {
      const currentPhase = this.phaseManager.getCurrentPhase();
      if (currentPhase && currentPhase.id !== context.phase) {
        return {
          valid: false,
          code: 'INVALID_PHASE',
          message: `現在のフェーズでは${operation}操作は許可されていません`
        };
      }
    }

    // その他の特定操作に対する検証
    switch (operation) {
      case 'vote':
        // 投票対象の検証
        if (context.targetId !== undefined) {
          if (this.playerManager && !this.playerManager.getPlayer(context.targetId)) {
            return {
              valid: false,
              code: 'INVALID_TARGET',
              message: '投票対象となるプレイヤーが見つかりません'
            };
          }

          if (this.playerManager && !this.playerManager.isPlayerAlive(context.targetId)) {
            return {
              valid: false,
              code: 'TARGET_NOT_ALIVE',
              message: '死亡したプレイヤーに投票することはできません'
            };
          }

          // 自己投票の禁止検証
          if (context.playerId === context.targetId &&
            this.options.regulations && !this.options.regulations.allowSelfVote) {
            return {
              valid: false,
              code: 'SELF_VOTE_FORBIDDEN',
              message: '自分自身への投票は許可されていません'
            };
          }
        }
        break;

      case 'registerAction':
        // アクション実行者の生存チェック
        if (context.playerId !== undefined && this.playerManager &&
          !this.playerManager.isPlayerAlive(context.playerId)) {
          return {
            valid: false,
            code: 'PLAYER_NOT_ALIVE',
            message: '死亡したプレイヤーはアクションを実行できません'
          };
        }
        // フェーズチェック (夜フェーズのみアクション可能とする場合)
        if (this.state.phase !== 'night') {
          return {
            valid: false,
            code: 'INVALID_PHASE',
            message: 'アクションは夜フェーズでのみ実行可能です'
          };
        }
        // アクション対象の検証
        if (context.targetId !== undefined && context.actionType) {
          if (this.playerManager && !this.playerManager.getPlayer(context.targetId)) {
            return {
              valid: false,
              code: 'INVALID_TARGET',
              message: 'アクション対象となるプレイヤーが見つかりません'
            };
          }

          // 役職アクションの制約（例: 連続ガードの禁止）
          if (context.actionType === 'guard' &&
            this.options.regulations && !this.options.regulations.allowConsecutiveGuard) {
            const lastGuardedPlayerId = this.getLastGuardedPlayerId(context.playerId);
            if (lastGuardedPlayerId === context.targetId) {
              return {
                valid: false,
                code: 'CONSECUTIVE_GUARD_FORBIDDEN',
                message: '同じプレイヤーを連続して護衛することはできません'
              };
            }
          }
        }
        break;
    }

    // すべての検証をパスした場合
    return { valid: true };
  };

  /**
   * エラーをハンドリングします
   * @param {Error|Object} error - 処理するエラー
   * @param {Object} context - 追加のコンテキスト情報
   * @returns {Error|Object} 処理されたエラー
   */
  GameManager.prototype.handleGameError = function (error, context = {}) {
    // エラーオブジェクトの標準化
    const standardError = this.standardizeError(error, context);

    // トランザクション中のエラーはロールバック
    if (this.transactionInProgress) {
      this.rollbackTransaction();
    }

    // エラー処理を委譲
    this.errorHandler.handleError(standardError);

    // エラー後の状態検証（ゲーム開始済みの場合のみ）
    if (this.state.isStarted && !this.state.isEnded) {
      try {
        this.verifyStateAfterError();
      } catch (verifyError) {
        // 検証中のエラーは致命的として処理
        const fatalError = this.standardizeError(verifyError, {
          originalError: standardError,
          isFatal: true
        });
        this.errorHandler.handleError(fatalError);
      }
    }

    return standardError;
  };

  /**
   * エラーを標準形式に変換します
   * @private
   * @param {Error|Object} error - 元のエラー
   * @param {Object} context - 追加のコンテキスト情報
   * @returns {Object} 標準化されたエラーオブジェクト
   */
  GameManager.prototype.standardizeError = function (error, context = {}) {
    // すでに標準形式の場合はそのまま返す
    if (error && error.code && error.level) {
      return {
        ...error,
        context: { ...error.context, ...context }
      };
    }

    // Errorオブジェクトの場合、コードとレベルを解析
    let code = 'UNKNOWN_ERROR';
    let message = error instanceof Error ? error.message : String(error);
    let level = context.isFatal ? ErrorLevel.FATAL : ErrorLevel.ERROR;

    // エラーカタログから情報を取得
    if (typeof error === 'string' && ErrorCatalog.getErrorByCode(error)) {
      const catalogError = ErrorCatalog.getErrorByCode(error);
      code = catalogError.code;
      message = catalogError.message;
      level = catalogError.level;
    }

    return {
      code,
      message,
      level,
      context: {
        ...context,
        originalError: error,
        gameState: this.getGameStateSummary(),
        timestamp: Date.now()
      }
    };
  };

  /**
   * ゲーム状態の要約を取得します（エラー診断用）
   * @private
   * @returns {Object} ゲーム状態の要約
   */
  GameManager.prototype.getGameStateSummary = function () {
    return {
      isStarted: this.state.isStarted,
      isEnded: this.state.isEnded,
      turn: this.state.turn,
      phase: this.phaseManager ? this.phaseManager.getCurrentPhase()?.id : null,
      playerCount: this.playerManager ? this.playerManager.getPlayerCount() : 0,
      alivePlayerCount: this.playerManager ? this.playerManager.getAlivePlayerCount() : 0
    };
  };

  /**
   * エラー発生後の状態整合性を検証します
   * @returns {void}
   */
  GameManager.prototype.verifyStateAfterError = function () {
    // ゲームが開始済みかつ終了していない場合のみ検証
    if (!this.state.isStarted || this.state.isEnded) {
      return;
    }

    // プレイヤー状態の整合性確認
    if (this.playerManager) {
      const alivePlayers = this.playerManager.getAlivePlayers();

      // 生存プレイヤーがいない場合はエラー
      if (alivePlayers.length === 0) {
        throw new Error('生存プレイヤーがいないためゲームを続行できません');
      }

      // 陣営バランスの確認
      if (this.roleManager) {
        // 人狼陣営全滅確認
        const aliveWerewolves = alivePlayers.filter(p =>
          this.roleManager.getPlayerTeam(p.id) === 'werewolf'
        );

        if (aliveWerewolves.length === 0) {
          // 人狼陣営全滅なら村人陣営勝利で終了
          this.forceEndGame({
            winner: 'village',
            reason: '人狼が全滅したため'
          });
          return;
        }

        // 村人陣営比率確認
        const aliveVillagers = alivePlayers.filter(p =>
          this.roleManager.getPlayerTeam(p.id) === 'village'
        );

        if (aliveVillagers.length <= aliveWerewolves.length) {
          // 人狼が村人以上なら人狼陣営勝利
          this.forceEndGame({
            winner: 'werewolf',
            reason: '人狼の数が村人以上になったため'
          });
          return;
        }
      }
    }

    // その他の状態整合性チェックを追加可能
  };

  /**
   * デバッグ用にゲームの診断情報を取得します
   * @returns {Object} 診断情報
   */
  GameManager.prototype.getDiagnostics = function () {
    // 基本的な状態情報
    const diagnostics = {
      state: { ...this.state },
      options: { ...this.options },
      gameTime: {
        startTime: this.state.startTime,
        currentTime: Date.now(),
        elapsedTime: this.state.startTime ? Date.now() - this.state.startTime : 0
      }
    };

    // プレイヤー情報
    if (this.playerManager) {
      diagnostics.players = {
        total: this.playerManager.getPlayerCount(),
        alive: this.playerManager.getAlivePlayerCount(),
        dead: this.playerManager.getPlayerCount() - this.playerManager.getAlivePlayerCount()
      };
    }

    // 役職情報（詳細は省略）
    if (this.roleManager) {
      diagnostics.roles = {
        distribution: true // 実際の分布は省略
      };
    }

    // フェーズ情報
    if (this.phaseManager) {
      const currentPhase = this.phaseManager.getCurrentPhase();
      diagnostics.phase = currentPhase ? {
        id: currentPhase.id,
        name: currentPhase.name,
        turn: this.state.turn
      } : null;
    }

    // システム情報
    diagnostics.system = {
      memoryUsage: process.memoryUsage ? process.memoryUsage() : { note: 'Not available in browser' },
      errorPolicy: this.errorHandler ? { ...this.errorHandler.policy } : null
    };

    return diagnostics;
  };

  /**
   * エラー詳細をログ出力します
   * @param {Error|Object} error - 出力するエラー
   * @returns {void}
   */
  GameManager.prototype.logErrorDetails = function (error) {
    // エラーオブジェクトの標準化
    const standardError = this.standardizeError(error);

    console.group(`[${standardError.level.toUpperCase()}] ${standardError.code}`);
    console.error(`メッセージ: ${standardError.message}`);

    if (standardError.context) {
      console.info('コンテキスト:', standardError.context);
    }

    if (error instanceof Error && error.stack) {
      console.debug('スタックトレース:', error.stack);
    }

    console.groupEnd();
  };

  /**
   * 操作を安全に実行します（エラーハンドリング付き）
   * @param {Function} operation - 実行する操作関数
   * @param {string} operationName - 操作名（エラーコンテキスト用）
   * @param {Object} context - 追加のコンテキスト情報
   * @returns {*} 操作の結果、エラー時はnull
   */
  GameManager.prototype.safeExecute = function (operation, operationName, context = {}) {
    try {
      // 操作の検証
      const validation = this.validateOperation(operationName, context);
      if (!validation.valid) {
        throw this.errorHandler.createError(
          validation.code,
          validation.message,
          { operation: operationName, ...context }
        );
      }

      // 操作の実行
      return operation();
    } catch (error) {
      // エラー処理
      this.handleGameError(error, { operation: operationName, ...context });
      return null;
    }
  };

  /**
   * ゲームを強制的に終了させます
   * @param {Object} endInfo - ゲーム終了情報
   * @param {string} endInfo.winner - 勝者チームID
   * @param {string} endInfo.reason - 終了理由
   * @param {Array} [endInfo.winningPlayers] - 勝利プレイヤーIDリスト
   * @returns {Object} 終了処理の結果
   * @throws {Error} ゲーム未開始、または終了処理中のエラー
   */
  GameManager.prototype.forceEndGame = function (endInfo = {}) {
    // ゲーム開始状態の検証
    if (!this.state.isStarted) {
      throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームがまだ開始されていません');
    }
    if (this.state.isEnded) {
      // すでに終了している場合は何もしないか、警告を出す
      console.warn('ゲームはすでに終了しています。');
      return { success: false, reason: 'already_ended' };
    }

    // トランザクション開始
    if (this.beginTransaction) {
      this.beginTransaction();
    }

    try {
      // 終了前イベント発火
      this.eventSystem.emit('game.forceEnd.before', { ...endInfo });

      // 状態更新
      this.state.isEnded = true;
      this.state.winner = endInfo.winner || 'unknown';
      this.state.winReason = endInfo.reason || '強制終了';
      this.state.winningPlayers = endInfo.winningPlayers || [];
      this.state.endTime = Date.now();

      // 終了後イベント発火
      this.eventSystem.emit('game.forceEnd.after', {
        winner: this.state.winner,
        reason: this.state.winReason
      });
      // 標準のゲーム終了イベントも発火
      this.eventSystem.emit('game.end', {
        winner: this.state.winner,
        reason: this.state.winReason,
        winningPlayers: this.state.winningPlayers
      });

      // トランザクションコミット
      if (this.commitTransaction) {
        this.commitTransaction();
      }

      return {
        success: true,
        winner: this.state.winner,
        reason: this.state.winReason
      };
    } catch (error) {
      // エラー時のロールバック
      if (this.rollbackTransaction) {
        this.rollbackTransaction();
      }
      // エラーをハンドルして再スロー
      this.handleGameError(error, { context: 'forceEndGame' });
      throw error; // エラーを再スローしてテストで検知可能にする
    }
  };

  /**
   * 現在のロガーを取得します
   * @returns {Object} ロガーインスタンス
   */
  GameManager.prototype.getLogger = function () {
    // デフォルトのコンソールロガー
    const defaultLogger = {
      debug: (message, context) => console.debug(message, context),
      info: (message, context) => console.info(message, context),
      warn: (message, context) => console.warn(message, context),
      error: (message, context) => console.error(message, context),
      fatal: (message, context) => console.error('[FATAL]', message, context)
    };

    return this.logger || defaultLogger;
  };

  /**
   * ロガーを設定します
   * @param {Object} logger - ロガーインスタンス
   * @returns {this} メソッドチェーン用
   */
  GameManager.prototype.setLogger = function (logger) {
    if (!logger || typeof logger !== 'object') {
      throw new Error('有効なロガーオブジェクトが必要です');
    }

    // 最低限必要なメソッドがあるか確認
    const requiredMethods = ['debug', 'info', 'warn', 'error', 'fatal'];
    for (const method of requiredMethods) {
      if (typeof logger[method] !== 'function') {
        throw new Error(`ロガーには${method}メソッドが必要です`);
      }
    }

    this.logger = logger;
    return this;
  };

  /**
   * エラー履歴を取得します
   * @param {Object} filter - フィルター条件
   * @param {number} limit - 最大件数
   * @returns {Array} エラー履歴
   */
  GameManager.prototype.getErrorHistory = function (filter = {}, limit = 10) {
    // エラー履歴機能が実装されていない場合は空配列を返す
    if (!this.errorHistory) {
      return [];
    }

    // エラー履歴のフィルタリングと制限
    let filteredHistory = [...this.errorHistory];

    // フィルタリング
    if (filter.level) {
      filteredHistory = filteredHistory.filter(e => e.level === filter.level);
    }
    if (filter.code) {
      filteredHistory = filteredHistory.filter(e => e.code === filter.code);
    }
    if (filter.since) {
      filteredHistory = filteredHistory.filter(e => e.timestamp >= filter.since);
    }

    // 最新順にソート
    filteredHistory.sort((a, b) => b.timestamp - a.timestamp);

    // 件数制限
    if (limit > 0) {
      filteredHistory = filteredHistory.slice(0, limit);
    }

    return filteredHistory;
  };

  /**
   * 特定のエラーをシミュレートします（テスト用）
   * @param {string} code - エラーコード
   * @param {Object} context - コンテキスト情報
   * @returns {Object} シミュレートされたエラー
   */
  GameManager.prototype.simulateError = function (code, context = {}) {
    // テストモードでないと使用不可
    if (!this.options.testMode) {
      throw new Error('simulateErrorはテストモードでのみ使用できます');
    }

    // エラーカタログからエラー情報を取得
    const errorInfo = ErrorCatalog.getErrorByCode(code);
    if (!errorInfo) {
      throw new Error(`未知のエラーコード: ${code}`);
    }

    // エラーオブジェクト作成
    const simulatedError = {
      code: errorInfo.code,
      message: errorInfo.message,
      level: errorInfo.level,
      context: {
        ...context,
        simulated: true,
        timestamp: Date.now()
      }
    };

    // エラー履歴に追加（実装されている場合）
    if (this.errorHistory) {
      this.errorHistory.push(simulatedError);
    }

    // シミュレートされたエラーを返す
    return simulatedError;
  };
}

export default GameManagerErrorMixin;
