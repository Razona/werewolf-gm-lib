/**
 * GameManagerPlayer.js
 * プレイヤー管理機能を提供するGameManagerのMixinモジュール
 */

/**
 * GameManagerにプレイヤー管理機能を追加するMixin
 * @param {Class} GameManager - 拡張するGameManagerクラス
 */
export default function GameManagerPlayerMixin(GameManager) {
  /**
   * プレイヤーを追加する
   * @param {string} name - プレイヤー名
   * @returns {number} プレイヤーID
   * @throws {Error} ゲーム開始後や無効な名前の場合
   */
  GameManager.prototype.addPlayer = function(name) {
    // ゲーム状態の検証（ゲーム開始前のみ許可）
    this._checkGameState('notStarted');
    
    // 名前の検証
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw this.errorHandler.createError('INVALID_PLAYER_NAME', 'プレイヤー名は空でない文字列である必要があります');
    }
    
    // PlayerManagerにプレイヤー追加を委譲
    const playerId = this.playerManager.addPlayer(name);
    
    // イベント発火
    this.eventSystem.emit('player.add', {
      playerId,
      name,
      timestamp: Date.now()
    });
    
    return playerId;
  };
  
  /**
   * プレイヤーを削除する
   * @param {number} id - 削除するプレイヤーのID
   * @returns {boolean} 削除成功時にtrue
   * @throws {Error} ゲーム開始後や存在しないプレイヤーの場合
   */
  GameManager.prototype.removePlayer = function(id) {
    // ゲーム状態の検証（ゲーム開始前のみ許可）
    this._checkGameState('notStarted');
    
    // プレイヤーIDの検証
    this._validatePlayerId(id);
    
    // PlayerManagerにプレイヤー削除を委譲
    const result = this.playerManager.removePlayer(id);
    
    // イベント発火
    this.eventSystem.emit('player.remove', {
      playerId: id,
      timestamp: Date.now()
    });
    
    return result;
  };
  
  /**
   * プレイヤー情報を取得する
   * @param {number} id - プレイヤーID
   * @returns {Object} プレイヤーオブジェクト
   * @throws {Error} 存在しないプレイヤーの場合
   */
  GameManager.prototype.getPlayer = function(id) {
    const player = this.playerManager.getPlayer(id);
    
    if (!player) {
      throw this.errorHandler.createError('PLAYER_NOT_FOUND', `ID ${id} のプレイヤーは存在しません`);
    }
    
    return player;
  };
  
  /**
   * 名前からプレイヤーを検索する
   * @param {string} name - プレイヤー名
   * @returns {Object|null} プレイヤーオブジェクト（存在しない場合はnull）
   */
  GameManager.prototype.getPlayerByName = function(name) {
    return this.playerManager.getPlayerByName(name);
  };
  
  /**
   * すべてのプレイヤーリストを取得する
   * @returns {Array} プレイヤーオブジェクトの配列
   */
  GameManager.prototype.getAllPlayers = function() {
    // キャッシュ機能は現時点では実装せず、直接委譲する
    return this.playerManager.getAllPlayers();
  };
  
  /**
   * 生存プレイヤーリストを取得する
   * @returns {Array} 生存プレイヤーオブジェクトの配列
   */
  GameManager.prototype.getAlivePlayers = function() {
    return this.playerManager.getAlivePlayers();
  };
  
  /**
   * 総プレイヤー数を取得する
   * @returns {number} プレイヤー数
   */
  GameManager.prototype.getPlayerCount = function() {
    return this.playerManager.getPlayerCount();
  };
  
  /**
   * 生存プレイヤー数を取得する
   * @returns {number} 生存プレイヤー数
   */
  GameManager.prototype.getAlivePlayerCount = function() {
    return this.playerManager.getAlivePlayerCount();
  };
  
  /**
   * プレイヤーの生存状態を確認する
   * @param {number} id - プレイヤーID
   * @returns {boolean} 生存していればtrue
   * @throws {Error} 存在しないプレイヤーの場合
   */
  GameManager.prototype.isPlayerAlive = function(id) {
    try {
      return this.playerManager.isPlayerAlive(id);
    } catch (error) {
      throw this.errorHandler.createError('PLAYER_NOT_FOUND', `ID ${id} のプレイヤーは存在しません`);
    }
  };
  
  /**
   * プレイヤーを死亡させる
   * @param {number} id - プレイヤーID
   * @param {string} cause - 死因（'execution', 'attack', 'poison'など）
   * @param {Object} options - 追加オプション（公開情報設定など）
   * @returns {Object} 処理結果オブジェクト
   * @throws {Error} ゲーム未開始、終了済み、または存在しないプレイヤーの場合
   */
  GameManager.prototype.killPlayer = function(id, cause, options = {}) {
    // ゲーム状態の検証（ゲーム開始後かつ終了前のみ許可）
    this._checkGameState('started');
    this._checkGameState('notEnded');
    
    // プレイヤーIDの検証
    this._validatePlayerId(id);
    
    // プレイヤーの生存確認
    if (!this.playerManager.isPlayerAlive(id)) {
      throw this.errorHandler.createError('PLAYER_ALREADY_DEAD', `ID ${id} のプレイヤーはすでに死亡しています`);
    }
    
    // 死亡処理をトランザクションとして実行
    try {
      // トランザクション開始
      this.beginTransaction();
      
      // 死亡前イベント発火
      this.eventSystem.emit('player.death.before', {
        playerId: id,
        cause,
        turn: this.state.turn,
        timestamp: Date.now()
      });
      
      // 死亡処理をPlayerManagerに委譲
      const result = this.playerManager.killPlayer(id, cause, options);
      
      // プレイヤー情報の取得
      const player = this.playerManager.getPlayer(id);
      
      // 死亡後イベント発火
      this.eventSystem.emit('player.death.after', {
        playerId: id,
        player,
        cause,
        turn: this.state.turn,
        timestamp: Date.now()
      });
      
      // トランザクションコミット
      this.commitTransaction();
      
      return result;
    } catch (error) {
      // エラー発生時はロールバック
      this.rollbackTransaction();
      throw error;
    }
  };
  
  /**
   * プレイヤーに状態効果を設定する
   * @param {number} id - プレイヤーID
   * @param {string} effect - 効果タイプ（'guarded', 'poisoned'など）
   * @param {any} value - 効果の値
   * @param {number|string} duration - 効果の持続期間（ターン数またはフェーズ指定）
   * @returns {boolean} 設定成功時にtrue
   * @throws {Error} ゲーム未開始、終了済み、または存在しないプレイヤーの場合
   */
  GameManager.prototype.setPlayerStatusEffect = function(id, effect, value, duration) {
    // ゲーム状態の検証（ゲーム開始後かつ終了前のみ許可）
    this._checkGameState('started');
    this._checkGameState('notEnded');
    
    // プレイヤーIDの検証
    this._validatePlayerId(id);
    
    try {
      // 状態効果設定をPlayerManagerに委譲
      const result = this.playerManager.setPlayerStatusEffect(id, effect, value, duration);
      
      // イベント発火
      this.eventSystem.emit('player.statusEffect.add', {
        playerId: id,
        effect,
        value,
        duration,
        turn: this.state.turn,
        phase: this.getCurrentPhase ? this.getCurrentPhase().id : null,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      // エラーを適切に変換
      if (error.message.includes('効果タイプ')) {
        throw this.errorHandler.createError('INVALID_STATUS_EFFECT', `無効な状態効果タイプです: ${effect}`);
      }
      throw error;
    }
  };
  
  /**
   * プレイヤーが特定の状態効果を持っているか確認する
   * @param {number} id - プレイヤーID
   * @param {string} effect - 効果タイプ
   * @returns {boolean} 状態効果があればtrue
   * @throws {Error} 存在しないプレイヤーの場合
   */
  GameManager.prototype.hasPlayerStatusEffect = function(id, effect) {
    // プレイヤーIDの検証
    this._validatePlayerId(id);
    
    return this.playerManager.hasPlayerStatusEffect(id, effect);
  };
  
  /**
   * プレイヤーの状態効果をクリアする
   * @param {number} id - プレイヤーID
   * @param {string} effect - クリアする効果タイプ（省略時は全効果）
   * @returns {boolean} クリア成功時にtrue
   * @throws {Error} 存在しないプレイヤーの場合
   */
  GameManager.prototype.clearPlayerStatusEffects = function(id, effect) {
    // プレイヤーIDの検証
    this._validatePlayerId(id);
    
    const result = this.playerManager.clearPlayerStatusEffects(id, effect);
    
    // イベント発火
    this.eventSystem.emit('player.statusEffect.remove', {
      playerId: id,
      effect: effect || 'all',
      turn: this.state.turn,
      phase: this.getCurrentPhase ? this.getCurrentPhase().id : null,
      timestamp: Date.now()
    });
    
    return result;
  };
  
  /**
   * 指定したプレイヤーの、閲覧者から見える情報を取得する
   * @param {number} id - 対象プレイヤーID
   * @param {number|null} viewerId - 閲覧者のプレイヤーID（nullの場合はGM視点）
   * @returns {Object} 閲覧可能な情報を含むプレイヤーオブジェクト
   * @throws {Error} 存在しないプレイヤーの場合
   */
  GameManager.prototype.getVisiblePlayerInfo = function(id, viewerId) {
    // プレイヤーIDの検証
    const player = this.getPlayer(id);
    
    // GM視点（完全な情報）
    if (viewerId === null) {
      return player;
    }
    
    // 情報フィルタリング
    return this._filterPlayerInfo(player, viewerId);
  };
  
  /**
   * プレイヤー情報を閲覧者に応じてフィルタリングする
   * @private
   * @param {Object} player - フィルタリングするプレイヤーデータ
   * @param {number} viewerId - 閲覧者のプレイヤーID
   * @returns {Object} フィルタリングされたプレイヤーデータ
   */
  GameManager.prototype._filterPlayerInfo = function(player, viewerId) {
    // 公開情報を含む基本オブジェクト
    const filtered = {
      id: player.id,
      name: player.name,
      isAlive: player.isAlive
    };
    
    // 自分自身の場合は完全情報
    if (player.id === viewerId) {
      return { ...player };
    }
    
    // 死亡プレイヤーの場合、レギュレーションに応じて情報公開
    if (!player.isAlive && this.options.regulations.revealRoleOnDeath) {
      filtered.role = player.role;
      filtered.team = player.team;
    }
    
    // 同じ陣営のプレイヤーの場合、役職情報公開
    if (this.isSameTeam && this.isSameTeam(player.id, viewerId)) {
      filtered.role = player.role;
      filtered.team = player.team;
    }
    
    // その他の情報がある場合、適宜追加
    
    return filtered;
  };
  
  /**
   * プレイヤーIDの存在と有効性を確認する
   * @private
   * @param {number} id - 確認するプレイヤーID
   * @throws {Error} 存在しないプレイヤーの場合
   */
  GameManager.prototype._validatePlayerId = function(id) {
    const player = this.playerManager.getPlayer(id);
    if (!player) {
      throw this.errorHandler.createError('PLAYER_NOT_FOUND', `ID ${id} のプレイヤーは存在しません`);
    }
  };
  
  /**
   * ゲーム状態を確認する
   * @private
   * @param {string} requiredState - 要求される状態 ('notStarted', 'started', 'notEnded')
   * @throws {Error} 条件を満たさない場合
   */
  GameManager.prototype._checkGameState = function(requiredState) {
    switch (requiredState) {
      case 'notStarted':
        if (this.state.isStarted) {
          throw this.errorHandler.createError('GAME_ALREADY_STARTED', 'ゲーム開始後にプレイヤーを追加/削除できません');
        }
        break;
      case 'started':
        if (!this.state.isStarted) {
          throw this.errorHandler.createError('GAME_NOT_STARTED', 'ゲームが開始されていません');
        }
        break;
      case 'notEnded':
        if (this.state.isEnded) {
          throw this.errorHandler.createError('GAME_ALREADY_ENDED', 'ゲームは既に終了しています');
        }
        break;
      default:
        throw new Error(`不明なゲーム状態要求: ${requiredState}`);
    }
  };
  
  /**
   * 複数プレイヤーの状態効果を一度にクリアする
   * @param {string} effect - クリアする効果タイプ
   * @returns {boolean} すべてのクリアが成功した場合にtrue
   */
  GameManager.prototype.clearAllPlayersStatusEffects = function(effect) {
    const players = this.getAlivePlayers();
    let success = true;
    
    players.forEach(player => {
      try {
        const result = this.clearPlayerStatusEffects(player.id, effect);
        success = success && result;
      } catch (error) {
        success = false;
      }
    });
    
    return success;
  };
}
