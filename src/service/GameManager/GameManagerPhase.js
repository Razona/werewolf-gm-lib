// src/service/gameManager/GameManagerPhase.js

/**
 * GameManagerPhase - GameManagerのフェーズ管理機能を提供するMix-in
 *
 * フェーズ管理、フェーズ遷移、ターン進行など、ゲーム進行に関わる
 * 各種メソッドを実装します。
 */
export default function GameManagerPhaseMixin(GameManager) {
  /**
   * ゲームを開始し、初期フェーズに移行します
   * @returns {boolean} 開始が成功したらtrue
   * @throws {Error} ゲームが既に開始されている場合や条件が満たされていない場合
   */
  GameManager.prototype.start = function () {
    // ゲーム開始状態の検証
    if (this.state.isStarted) {
      throw this.errorHandler.createError('GAME_ALREADY_STARTED', 'ゲームは既に開始されています');
    }

    // プレイヤー数の検証
    const players = this.playerManager.getAllPlayers();
    if (players.length < 3) { // 最小プレイヤー数
      throw this.errorHandler.createError('INSUFFICIENT_PLAYERS', 'ゲームを開始するには最低3人のプレイヤーが必要です');
    }

    // 役職配布状態の検証
    if (!this.state.roles?.distributed && !this.roleManager.isRolesDistributed()) {
      throw this.errorHandler.createError('ROLES_NOT_DISTRIBUTED', '役職が配布されていません');
    }

    // トランザクション開始（将来的に実装）
    // this.beginStateTransaction();

    try {
      // ゲーム開始前イベント発火
      this.eventSystem.emit('game.starting', {
        playerCount: players.length
      });

      // ゲーム状態の更新
      this.state.isStarted = true;
      this.state.turn = 1;
      this.state.startTime = Date.now();

      // 初期フェーズへの移行
      const initialPhase = this.phaseManager.moveToInitialPhase({
        regulations: this.options.regulations
      });

      // 状態更新
      this.state.phase = initialPhase.id;

      // 初期フェーズの開始処理
      this.handlePhaseStart(initialPhase);

      // ゲーム開始後イベント発火
      this.eventSystem.emit('game.started', {
        playerCount: players.length,
        initialPhase: initialPhase.id,
        turn: this.state.turn,
        timestamp: Date.now()
      });

      // トランザクションコミット（将来的に実装）
      // this.commitStateTransaction();

      return true;
    } catch (error) {
      // トランザクションロールバック（将来的に実装）
      // this.rollbackStateTransaction();

      // エラー処理
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 現在のフェーズから次のフェーズへ移行します
   * @returns {Object} 移行後のフェーズ情報
   * @throws {Error} ゲームが開始されていない場合や条件が満たされていない場合
   */
  GameManager.prototype.nextPhase = function () {
    // ゲーム状態の検証
    if (!this.state.isStarted) {
      throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
    }

    if (this.state.isEnded) {
      throw this.errorHandler.createError('GAME_ALREADY_ENDED', 'ゲームは既に終了しています');
    }

    // トランザクション開始（将来的に実装）
    // this.beginStateTransaction();

    try {
      // 現在のフェーズを取得
      const currentPhase = this.phaseManager.getCurrentPhase();

      // フェーズ遷移前イベント発火
      this.eventSystem.emit('phase.transition.before', {
        fromPhase: currentPhase,
        turn: this.state.turn
      });

      // 現在のフェーズ終了処理
      if (currentPhase) {
        this.handlePhaseEnd(currentPhase);
      }

      // 次フェーズへの移行
      const nextPhase = this.phaseManager.moveToNextPhase();

      // 新しいターンかどうかチェック
      if (nextPhase.newTurn) {
        // ターン増加処理
        this.state.turn++;
        this.eventSystem.emit('turn.new', {
          turn: this.state.turn,
          previousTurn: this.state.turn - 1
        });
      }

      // 状態更新
      this.state.phase = nextPhase.id;

      // 特殊フェーズ遷移処理
      if (currentPhase && currentPhase.id === 'execution' && nextPhase.id === 'night') {
        this.handleExecutionToNightTransition(currentPhase, nextPhase);
      } else if (currentPhase && currentPhase.id === 'day' && nextPhase.id === 'night' && this.state.turn === 1) {
        this.handleDayToNightTransition(currentPhase, nextPhase);
      }

      // フェーズ遷移後イベント発火
      this.eventSystem.emit('phase.transition.after', {
        fromPhase: currentPhase,
        toPhase: nextPhase,
        turn: this.state.turn
      });

      // 新フェーズの開始処理
      this.handlePhaseStart(nextPhase);

      // 勝利条件チェック
      this.victoryManager.checkWinCondition();
      if (this.victoryManager.isGameEnd()) {
        // ゲーム終了フェーズへ移行
        this.moveToPhase('gameEnd');
        // ここでは元の nextPhase を返す
      }

      // トランザクションコミット（将来的に実装）
      // this.commitStateTransaction();

      return nextPhase;
    } catch (error) {
      // トランザクションロールバック（将来的に実装）
      // this.rollbackStateTransaction();

      // エラー処理
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 指定したフェーズに直接移行します
   * @param {string} phaseId 移行先のフェーズID
   * @returns {Object} 移行後のフェーズ情報
   * @throws {Error} ゲームが開始されていない場合や条件が満たされていない場合
   */
  GameManager.prototype.moveToPhase = function (phaseId) {
    // ゲーム状態の検証
    if (!this.state.isStarted) {
      throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
    }

    if (this.state.isEnded && phaseId !== 'gameEnd') {
      throw this.errorHandler.createError('GAME_ALREADY_ENDED', 'ゲームは既に終了しています');
    }

    // トランザクション開始（将来的に実装）
    // this.beginStateTransaction();

    try {
      // 現在のフェーズを取得
      const currentPhase = this.phaseManager.getCurrentPhase();

      // フェーズ遷移前イベント発火
      this.eventSystem.emit('phase.transition.before', {
        fromPhase: currentPhase,
        toPhaseId: phaseId,
        turn: this.state.turn
      });

      // 現在のフェーズ終了処理
      if (currentPhase) {
        this.handlePhaseEnd(currentPhase);
      }

      // 指定フェーズへの移行
      const newPhase = this.phaseManager.moveToPhase(phaseId, {
        regulations: this.options.regulations
      });

      // 状態更新
      this.state.phase = newPhase.id;

      // フェーズ遷移後イベント発火
      this.eventSystem.emit('phase.transition.after', {
        fromPhase: currentPhase,
        toPhase: newPhase,
        turn: this.state.turn
      });

      // 新フェーズの開始処理
      this.handlePhaseStart(newPhase);

      // トランザクションコミット（将来的に実装）
      // this.commitStateTransaction();

      return newPhase;
    } catch (error) {
      // トランザクションロールバック（将来的に実装）
      // this.rollbackStateTransaction();

      // エラー処理
      this.errorHandler.handleError(error);
      throw error;
    }
  };

  /**
   * 現在のフェーズ情報を取得します
   * @returns {Object} 現在のフェーズオブジェクト
   * @throws {Error} ゲームが開始されていない場合
   */
  GameManager.prototype.getCurrentPhase = function () {
    // ゲーム状態の検証
    if (!this.state.isStarted) {
      throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
    }

    // 現在のフェーズを取得
    return this.phaseManager.getCurrentPhase();
  };

  /**
   * 現在のターン数を取得します
   * @returns {number} 現在のターン数
   * @throws {Error} ゲームが開始されていない場合
   */
  GameManager.prototype.getCurrentTurn = function () {
    // ゲーム状態の検証
    if (!this.state.isStarted) {
      throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
    }

    return this.state.turn;
  };

  /**
   * 現在のフェーズが指定したIDと一致するか確認します
   * @param {string} phaseId 確認するフェーズID
   * @returns {boolean} 現在のフェーズが指定したIDと一致する場合true
   * @throws {Error} ゲームが開始されていない場合
   */
  GameManager.prototype.isPhase = function (phaseId) {
    const currentPhase = this.getCurrentPhase();
    return currentPhase && currentPhase.id === phaseId;
  };

  /**
   * 現在の昼/夜サイクルを取得します
   * @returns {string} "day"または"night"
   * @throws {Error} ゲームが開始されていない場合
   */
  GameManager.prototype.getDayNightCycle = function () {
    const currentPhase = this.getCurrentPhase();
    if (!currentPhase) {
      return null;
    }

    // フェーズIDに基づいて昼/夜を判定
    const nightPhases = ['night', 'firstNight'];
    const dayPhases = ['day', 'firstDay', 'vote', 'runoffVote', 'execution'];

    if (nightPhases.includes(currentPhase.id)) {
      return "night";
    } else if (dayPhases.includes(currentPhase.id)) {
      return "day";
    }

    // その他のフェーズ（準備、ゲーム終了など）
    return null;
  };

  /**
   * ターン数を手動で設定します（主にテスト用）
   * @param {number} turn 設定するターン数
   * @returns {boolean} 設定が成功した場合true
   * @throws {Error} ゲームが開始されていない場合や無効なターン数の場合
   */
  GameManager.prototype.setTurn = function (turn) {
    // ゲーム状態の検証
    if (!this.state.isStarted) {
      throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
    }

    // ターン数の検証
    if (typeof turn !== 'number' || turn < 1) {
      throw this.errorHandler.createError('INVALID_TURN', 'ターン数は1以上の整数である必要があります');
    }

    const previousTurn = this.state.turn;
    this.state.turn = turn;

    // イベント発火
    this.eventSystem.emit('turn.set', {
      turn: turn,
      previousTurn: previousTurn,
      phase: this.state.phase
    });

    return true;
  };

  /**
   * フェーズ開始時の処理を行います
   * @param {Object} phase 開始するフェーズ情報
   * @private
   */
  GameManager.prototype.handlePhaseStart = function (phase) {
    if (!phase) return;

    // フェーズIDによる分岐処理
    switch (phase.id) {
      case 'day':
        this.handleDayPhaseStart();
        break;
      case 'vote':
        this.handleVotePhaseStart();
        break;
      case 'night':
        this.handleNightPhaseStart();
        break;
      case 'gameEnd':
        this.handleGameEndPhaseStart();
        break;
      // その他のフェーズ...
    }

    // フェーズ開始イベントの発火
    this.eventSystem.emit(`phase.start.${phase.id}`, {
      phase: phase,
      turn: this.state.turn
    });
  };

  /**
   * フェーズ終了時の処理を行います
   * @param {Object} phase 終了するフェーズ情報
   * @private
   */
  GameManager.prototype.handlePhaseEnd = function (phase) {
    if (!phase) return;

    // フェーズIDによる分岐処理
    switch (phase.id) {
      case 'day':
        // 昼フェーズ終了時の処理
        break;
      case 'vote':
        // 投票フェーズ終了時の処理
        break;
      case 'night':
        // 夜フェーズ終了時の処理
        break;
      // その他のフェーズ...
    }

    // フェーズ終了イベントの発火
    this.eventSystem.emit(`phase.end.${phase.id}`, {
      phase: phase,
      turn: this.state.turn
    });
  };

  /**
   * 昼フェーズ開始時の処理を行います
   * @private
   */
  GameManager.prototype.handleDayPhaseStart = function () {
    // 初日処刑なしの場合の特殊処理
    if (this.state.turn === 1 &&
      this.options.regulations &&
      this.options.regulations.firstDayExecution === false) {

      // 初日処刑なしイベント発火
      this.eventSystem.emit('firstDay.noExecution', {
        turn: this.state.turn
      });

      // 投票をスキップして夜フェーズへ直接移行
      this.moveToPhase('night');
    }
  };

  /**
   * 投票フェーズ開始時の処理を行います
   * @private
   */
  GameManager.prototype.handleVotePhaseStart = function () {
    // 投票のリセット
    this.voteManager.resetVotes();

    // 投票開始イベント
    this.eventSystem.emit('vote.start', {
      turn: this.state.turn,
      voters: this.playerManager.getAlivePlayers().map(p => ({ id: p.id, name: p.name })),
      isRunoff: false
    });
  };

  /**
   * 夜フェーズ開始時の処理を行います
   * @private
   */
  GameManager.prototype.handleNightPhaseStart = function () {
    // アクションのリセット
    this.actionManager.resetActions();

    // 初日占いルールの適用
    if (this.state.turn === 1 &&
      this.options.regulations &&
      this.options.regulations.firstNightFortune) {

      this.applyFirstNightFortuneRule();
    }

    // 夜開始イベント
    this.eventSystem.emit('night.start', {
      turn: this.state.turn,
      isFirstNight: this.state.turn === 1
    });
  };

  /**
   * ゲーム終了フェーズ開始時の処理を行います
   * @private
   */
  GameManager.prototype.handleGameEndPhaseStart = function () {
    // 勝者情報の取得
    const winnerInfo = this.victoryManager.getWinner();

    if (winnerInfo) {
      // ゲーム終了状態への更新
      this.state.isEnded = true;
      this.state.winner = winnerInfo.team;
      this.state.winReason = winnerInfo.reason;
      this.state.winningPlayers = winnerInfo.winningPlayers;
      this.state.endTime = Date.now();

      // ゲーム終了イベントの発火
      this.eventSystem.emit('game.end', {
        winner: winnerInfo.team,
        reason: winnerInfo.reason,
        winningPlayers: winnerInfo.winningPlayers,
        turn: this.state.turn,
        duration: this.state.endTime - this.state.startTime
      });
    }
  };

  /**
   * 初日処刑なしルールの場合の昼→夜への直接遷移を処理します
   * @param {Object} dayPhase 昼フェーズ情報
   * @param {Object} nightPhase 夜フェーズ情報
   * @private
   */
  GameManager.prototype.handleDayToNightTransition = function (dayPhase, nightPhase) {
    // 昼→夜の特殊遷移（初日処刑なしの場合）
    // この場合、投票フェーズが飛ばされるので特別な処理が必要な場合はここに記述
  };

  /**
   * 処刑→夜遷移時の処理を行います（ターン進行含む）
   * @param {Object} executionPhase 処刑フェーズ情報
   * @param {Object} nightPhase 夜フェーズ情報
   * @private
   */
  GameManager.prototype.handleExecutionToNightTransition = function (executionPhase, nightPhase) {
    // 処刑→夜の遷移（通常ターン進行時）
    // すでに nextPhase() メソッドでターン進行は処理されているので、
    // ここでは必要なければ何もしない
  };

  /**
   * 初日占いルールを適用します
   * @private
   */
  GameManager.prototype.applyFirstNightFortuneRule = function () {
    // レギュレーションの取得
    const fortuneRule = this.options.regulations?.firstNightFortune || 'free';

    // ルールに応じた処理
    switch (fortuneRule) {
      case 'random_white':
        // 初日はランダムに選ばれた対象が「村人」判定になる設定
        this.eventSystem.emit('firstNight.fortune.randomWhite', {
          rule: 'random_white',
          turn: this.state.turn
        });
        break;
      case 'random':
        // 初日はランダムな対象が選ばれる設定
        this.eventSystem.emit('firstNight.fortune.random', {
          rule: 'random',
          turn: this.state.turn
        });
        break;
      case 'free':
      default:
        // 自由占い（特別な処理なし）
        break;
    }
  };

  /**
   * フェーズ遷移履歴を取得します
   * @param {number} limit 取得する最大件数（null=制限なし）
   * @returns {Array} フェーズ遷移履歴の配列
   */
  GameManager.prototype.getPhaseHistory = function (limit = null) {
    // フェーズ遷移履歴の実装は将来的に追加
    this._phaseTransitionHistory = this._phaseTransitionHistory || [];

    if (limit === null) {
      return [...this._phaseTransitionHistory];
    } else {
      return [...this._phaseTransitionHistory].slice(-limit);
    }
  };

  /**
   * ゲーム状態の一貫性を検証し、必要に応じて修復します
   * @returns {boolean} 状態が一貫している場合true
   * @private
   */
  GameManager.prototype.verifyGameState = function () {
    const issues = [];

    // 基本的な整合性チェック
    if (this.state.isStarted) {
      // ターン数が有効か
      if (this.state.turn < 1) {
        issues.push({
          type: 'invalid_turn',
          message: `Invalid turn number: ${this.state.turn}`
        });
        this.state.turn = 1;
      }

      // フェーズIDが設定されているか
      const currentPhase = this.phaseManager.getCurrentPhase();
      if (currentPhase && this.state.phase !== currentPhase.id) {
        issues.push({
          type: 'phase_mismatch',
          message: `Phase ID mismatch: state=${this.state.phase}, manager=${currentPhase.id}`
        });
        this.state.phase = currentPhase.id;
      }
    }

    // 問題があれば警告イベント発火
    if (issues.length > 0) {
      this.eventSystem.emit('state.inconsistency', {
        issues,
        fixed: true,
        timestamp: Date.now()
      });
    }

    return issues.length === 0;
  };
}