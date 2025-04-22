/**
 * GameManagerRole.js
 * GameManagerのRole（役職）管理機能を提供するMix-in
 */

/**
 * GameManagerにRole管理機能を追加するMix-in
 * @param {Class} GameManager - 拡張するGameManagerクラス
 */
export function applyGameManagerRoleMixin(GameManager) {
  /**
   * 使用する役職リストを設定する
   * @param {Array<string>} roleList - 役職名の配列
   * @returns {boolean} 設定が成功した場合はtrue
   * @throws {Error} ゲーム開始後の変更や不正な役職リストの場合
   */
  GameManager.prototype.setRoles = function(roleList) {
    // ゲーム開始状態の検証
    if (this.isGameStarted()) {
      throw this.errorHandler.createError(
        'GAME_ALREADY_STARTED',
        'ゲーム開始後に役職リストを変更できません'
      );
    }

    // 入力の検証
    if (!Array.isArray(roleList) || roleList.length === 0) {
      throw this.errorHandler.createError(
        'INVALID_ROLE_LIST',
        '役職リストは空でない配列である必要があります'
      );
    }

    // 役職リスト設定前イベントの発火
    this.eventSystem.emit('role.list.set.before', {
      roleList
    });

    // 役職リストの検証
    const validation = this._validateRoleList(roleList);
    if (!validation.valid) {
      throw this.errorHandler.createError(
        validation.code || 'INVALID_ROLE_LIST',
        validation.reason,
        validation.details
      );
    }

    // RoleManagerに役職リスト設定を委譲
    try {
      const result = this.roleManager.setRoles(roleList);

      // 状態の更新
      this.updateState({
        roles: {
          list: roleList,
          distributed: false
        }
      });

      // 役職リスト設定後イベントの発火
      this.eventSystem.emit('role.list.set.after', {
        roleList,
        success: true
      });

      return result;
    } catch (error) {
      this.eventSystem.emit('role.list.set.after', {
        roleList,
        success: false,
        error
      });

      throw error;
    }
  };

  /**
   * 役職をプレイヤーに配布する
   * @param {Object} options - 配布オプション
   * @param {boolean} [options.shuffle=true] - 役職をシャッフルするかどうか
   * @param {Function} [options.customDistribution] - カスタム配布アルゴリズム
   * @param {number} [options.seed] - 乱数シード値（再現性確保用）
   * @returns {Object} プレイヤーIDと割り当てられた役職のマッピング
   * @throws {Error} ゲーム開始後の配布や不正な配布条件の場合
   */
  GameManager.prototype.distributeRoles = function(options = {}) {
    // デフォルトオプションの設定
    const defaultOptions = {
      shuffle: true
    };
    const distributionOptions = { ...defaultOptions, ...options };

    // ゲーム開始状態の検証
    if (this.isGameStarted()) {
      throw this.errorHandler.createError(
        'GAME_ALREADY_STARTED',
        'ゲーム開始後に役職を再配布できません'
      );
    }

    // 役職リストの存在確認
    if (!this.state.roles || !this.state.roles.list) {
      throw this.errorHandler.createError(
        'ROLE_LIST_NOT_SET',
        '役職リストが設定されていません'
      );
    }

    // プレイヤーの取得
    const players = this.playerManager.getAllPlayers();
    if (!players || players.length === 0) {
      throw this.errorHandler.createError(
        'INSUFFICIENT_PLAYERS',
        'プレイヤーが追加されていません'
      );
    }

    const roleList = this.state.roles.list;
    const playerIds = players.map(player => player.id);

    // プレイヤー数と役職数の比較
    if (playerIds.length !== roleList.length && !this.options.regulations.allowRoleMissing) {
      throw this.errorHandler.createError(
        'PLAYER_ROLE_COUNT_MISMATCH',
        'プレイヤー数と役職数が一致しません'
      );
    }

    // 役職配布前イベントの発火
    this.eventSystem.emit('role.distribution.before', {
      playerCount: playerIds.length,
      roleCount: roleList.length,
      options: distributionOptions
    });

    try {
      // シード値による乱数初期化（指定がある場合）
      let randomInstance = this.random;
      if (distributionOptions.seed !== undefined) {
        if (this.options.createRandom) {
          randomInstance = this.options.createRandom(distributionOptions.seed);
        } else {
          // シード値が指定されたが対応機能がない場合は警告
          console.warn('乱数シード指定がサポートされていません');
        }
      }

      // 役職配布オプションの構築
      const roleDistributionOptions = {
        shuffle: distributionOptions.shuffle,
        random: randomInstance,
        customDistribution: distributionOptions.customDistribution
      };

      // RoleManagerに役職配布処理を委譲
      const distribution = this.roleManager.distributeRoles(
        playerIds,
        roleList,
        roleDistributionOptions
      );

      // 各プレイヤーへの役職割り当て処理
      const assignments = [];
      for (const [playerIdStr, roleName] of Object.entries(distribution)) {
        const playerId = parseInt(playerIdStr, 10);
        const result = this.assignRole(playerId, roleName);
        assignments.push({
          playerId,
          roleName,
          success: result.success
        });
      }

      // 役職間の相互参照を設定
      this._setupRoleReferences();

      // 状態の更新
      this.updateState({
        roles: {
          ...this.state.roles,
          distributed: true,
          distribution
        }
      });

      // 役職配布後イベントの発火
      this.eventSystem.emit('role.distribution.after', {
        distribution,
        playerCount: playerIds.length,
        roleCount: roleList.length,
        success: true,
        roleMissing: playerIds.length !== roleList.length
      });

      return distribution;
    } catch (error) {
      this.eventSystem.emit('role.distribution.after', {
        error,
        success: false
      });

      throw error;
    }
  };

  /**
   * 特定の役職を特定のプレイヤーに割り当てる
   * @param {number} playerId - プレイヤーID
   * @param {string} roleName - 役職名
   * @returns {Object} 割り当て結果
   * @throws {Error} プレイヤーまたは役職が存在しない場合、またはゲーム開始後の割り当ての場合
   */
  GameManager.prototype.assignRole = function(playerId, roleName) {
    // ゲーム開始状態の検証
    if (this.isGameStarted()) {
      throw this.errorHandler.createError(
        'GAME_ALREADY_STARTED',
        'ゲーム開始後に役職を変更できません'
      );
    }

    // プレイヤー存在確認
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      throw this.errorHandler.createError(
        'PLAYER_NOT_FOUND',
        `プレイヤーが見つかりません: ${playerId}`
      );
    }

    // 現在の役職を取得（再割り当ての場合）
    let previousRole = null;
    try {
      const currentRoleInfo = this.getRoleInfo(playerId);
      if (currentRoleInfo && currentRoleInfo.name !== 'unassigned') {
        previousRole = currentRoleInfo.name;
      }
    } catch (err) {
      // エラーは無視（役職未割り当ての場合など）
    }

    // 役職割り当て前イベントの発火
    this.eventSystem.emit('role.assigned.before', {
      playerId,
      roleName,
      previous: previousRole
    });

    try {
      // RoleManagerに役職割り当てを委譲
      const result = this.roleManager.assignRole(playerId, roleName);

      // 役職割り当て後イベントの発火
      this.eventSystem.emit('role.assigned.after', {
        playerId,
        roleName,
        player,
        success: true,
        previous: previousRole
      });

      return {
        success: true,
        playerId,
        roleName,
        previous: previousRole
      };
    } catch (error) {
      this.eventSystem.emit('role.assigned.after', {
        playerId,
        roleName,
        success: false,
        error,
        previous: previousRole
      });

      throw error;
    }
  };

  /**
   * プレイヤーの役職情報を取得する
   * @param {number} playerId - プレイヤーID
   * @param {number} [viewerId=null] - 情報を見るプレイヤーID（デフォルト: GM視点）
   * @returns {Object} 役職情報オブジェクト（視点に基づきフィルタリング済み）
   * @throws {Error} プレイヤーが存在しない場合
   */
  GameManager.prototype.getRoleInfo = function(playerId, viewerId = null) {
    // プレイヤー存在確認
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      throw this.errorHandler.createError(
        'PLAYER_NOT_FOUND',
        `プレイヤーが見つかりません: ${playerId}`
      );
    }

    // GM視点（制限なし）の場合は完全な情報を返す
    if (viewerId === null) {
      const roleInfo = this.roleManager.getRoleInfo(playerId);

      // role.info.accessイベントの発火
      this.eventSystem.emit('role.info.access', {
        targetId: playerId,
        viewerId: null,
        level: 'full'
      });

      return roleInfo;
    }

    // 視点に基づいてフィルタリングされた情報を返す
    return this.getVisibleRoleInfo(playerId, viewerId);
  };

  /**
   * プレイヤーの役職名を取得する
   * @param {number} playerId - プレイヤーID
   * @returns {string} 役職名
   * @throws {Error} プレイヤーが存在しない場合
   */
  GameManager.prototype.getRoleName = function(playerId) {
    try {
      const roleInfo = this.getRoleInfo(playerId);
      return roleInfo ? roleInfo.name : null;
    } catch (error) {
      return null;
    }
  };

  /**
   * プレイヤーの所属陣営を取得する
   * @param {number} playerId - プレイヤーID
   * @returns {string} 陣営名（'village', 'werewolf', 'fox'など）
   * @throws {Error} プレイヤーが存在しない場合
   */
  GameManager.prototype.getPlayerTeam = function(playerId) {
    try {
      const roleInfo = this.getRoleInfo(playerId);
      return roleInfo ? roleInfo.team : null;
    } catch (error) {
      return null;
    }
  };

  /**
   * 表示用の役職名を取得する
   * @param {number} playerId - プレイヤーID
   * @param {number} [viewerId=null] - 視点となるプレイヤーID（デフォルト: GM視点）
   * @returns {string} 表示用役職名
   * @throws {Error} プレイヤーが存在しない場合
   */
  GameManager.prototype.getDisplayRoleName = function(playerId, viewerId = null) {
    try {
      const roleInfo = this.getRoleInfo(playerId, viewerId);
      return roleInfo ? (roleInfo.displayName || roleInfo.name) : '不明';
    } catch (error) {
      return '不明';
    }
  };

  /**
   * 視点に基づいてフィルタリングされた役職情報を取得する
   * @param {number} playerId - 情報を取得するプレイヤーID
   * @param {number} viewerId - 視点となるプレイヤーID
   * @returns {Object} フィルタリングされた役職情報
   * @private
   */
  GameManager.prototype.getVisibleRoleInfo = function(playerId, viewerId) {
    const visibilityLevel = this._isRoleInfoVisible(playerId, viewerId);
    const fullRoleInfo = this.roleManager.getRoleInfo(playerId);

    // role.info.accessイベントの発火
    this.eventSystem.emit('role.info.access', {
      targetId: playerId,
      viewerId,
      level: visibilityLevel
    });

    // 可視性レベルに応じた情報のフィルタリング
    switch (visibilityLevel) {
      case 'full': // 完全情報（自分自身、GM視点など）
        return fullRoleInfo;

      case 'team': // チーム情報（同じ陣営の場合など）
        return {
          name: fullRoleInfo.name,
          displayName: fullRoleInfo.displayName,
          team: fullRoleInfo.team,
          isTeamMate: true
        };

      case 'special': // 特殊関係（人狼同士、共有者同士、妖狐と背徳者など）
        if (fullRoleInfo.name === 'werewolf') {
          return {
            name: fullRoleInfo.name,
            displayName: fullRoleInfo.displayName,
            isWerewolf: true
          };
        } else if (fullRoleInfo.name === 'mason') {
          return {
            name: fullRoleInfo.name,
            displayName: fullRoleInfo.displayName,
            isMason: true
          };
        } else if (fullRoleInfo.name === 'fox') {
          return {
            name: fullRoleInfo.name,
            displayName: fullRoleInfo.displayName,
            isFox: true
          };
        } else if (fullRoleInfo.name === 'heretic') {
          return {
            name: fullRoleInfo.name,
            displayName: fullRoleInfo.displayName,
            isHeretic: true
          };
        }
        return {
          name: fullRoleInfo.name,
          displayName: fullRoleInfo.displayName
        };

      case 'revealed': // 公開情報（死亡時の役職公開など）
        return {
          name: fullRoleInfo.name,
          displayName: fullRoleInfo.displayName,
          team: fullRoleInfo.team,
          revealed: true
        };

      case 'limited': // 制限情報（標準）
      default:
        return {
          name: 'unknown',
          displayName: '不明'
        };
    }
  };

  /**
   * 特定の役職を持つプレイヤーを取得する
   * @param {string} roleName - 役職名
   * @param {boolean} [aliveOnly=false] - 生存者のみ取得するフラグ
   * @returns {Array<number>} 該当するプレイヤーIDの配列
   */
  GameManager.prototype.getPlayersByRole = function(roleName, aliveOnly = false) {
    const players = this.roleManager.getPlayersByRole(roleName);
    
    if (aliveOnly && players.length > 0) {
      return players.filter(playerId => this.playerManager.isPlayerAlive(playerId));
    }
    
    return players;
  };

  /**
   * 特定の陣営に属するプレイヤーを取得する
   * @param {string} team - 陣営名
   * @param {boolean} [aliveOnly=false] - 生存者のみ取得するフラグ
   * @returns {Array<number>} 該当するプレイヤーIDの配列
   */
  GameManager.prototype.getPlayersByTeam = function(team, aliveOnly = false) {
    const players = this.roleManager.getPlayersByTeam(team);
    
    if (aliveOnly && players.length > 0) {
      return players.filter(playerId => this.playerManager.isPlayerAlive(playerId));
    }
    
    return players;
  };

  /**
   * すべてのプレイヤーに役職が割り当てられているかを確認する
   * @returns {boolean} すべてのプレイヤーに役職が割り当てられていればtrue
   */
  GameManager.prototype.areAllRolesAssigned = function() {
    const players = this.playerManager.getAllPlayers();
    if (!players || players.length === 0) {
      return false;
    }

    for (const player of players) {
      try {
        const roleInfo = this.getRoleInfo(player.id);
        if (!roleInfo || roleInfo.name === 'unassigned' || roleInfo.name === 'unknown') {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
    
    return true;
  };

  /**
   * 占い結果を取得する
   * @param {number} targetId - 占い対象のプレイヤーID
   * @returns {string} 占い結果（'white', 'black'など）
   * @throws {Error} プレイヤーが存在しない場合
   */
  GameManager.prototype.getFortuneResult = function(targetId) {
    // プレイヤー存在確認
    const target = this.playerManager.getPlayer(targetId);
    if (!target) {
      throw this.errorHandler.createError(
        'PLAYER_NOT_FOUND',
        `プレイヤーが見つかりません: ${targetId}`
      );
    }

    // レギュレーションによる結果修正（初日ランダム白など）
    const currentTurn = this.getCurrentTurn();
    const firstNightFortuneRule = this.options.regulations?.firstNightFortune || 'free';
    
    if (currentTurn === 1 && firstNightFortuneRule !== 'free') {
      if (firstNightFortuneRule === 'random_white') {
        return 'white';
      } else if (firstNightFortuneRule === 'random') {
        // ランダム占いの場合、実際の役職に基づく結果を返す
      }
    }

    // RoleManagerから占い結果取得
    return this.roleManager.getFortuneResult(targetId);
  };

  /**
   * 霊媒結果を取得する
   * @param {number} targetId - 霊媒対象のプレイヤーID
   * @returns {string} 霊媒結果（'white', 'black'など）
   * @throws {Error} プレイヤーが存在しない、または生存している場合
   */
  GameManager.prototype.getMediumResult = function(targetId) {
    // プレイヤー存在確認
    const target = this.playerManager.getPlayer(targetId);
    if (!target) {
      throw this.errorHandler.createError(
        'PLAYER_NOT_FOUND',
        `プレイヤーが見つかりません: ${targetId}`
      );
    }

    // 死亡確認
    if (this.playerManager.isPlayerAlive(targetId)) {
      throw this.errorHandler.createError(
        'PLAYER_ALIVE',
        '生存しているプレイヤーに対して霊媒はできません'
      );
    }

    // RoleManagerから霊媒結果取得
    return this.roleManager.getMediumResult(targetId);
  };

  /**
   * プレイヤーが特定の能力を使用できるかどうかを確認する
   * @param {number} playerId - プレイヤーID
   * @param {string} ability - 能力識別子
   * @param {Object} context - 使用コンテキスト（夜番号など）
   * @returns {Object} 使用可否情報
   * @throws {Error} プレイヤーが存在しない場合
   */
  GameManager.prototype.canUseAbility = function(playerId, ability, context = {}) {
    // プレイヤー存在確認
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return {
        allowed: false,
        reason: `プレイヤーが見つかりません: ${playerId}`
      };
    }

    // 生存確認
    if (!this.playerManager.isPlayerAlive(playerId)) {
      return {
        allowed: false,
        reason: '死亡しているプレイヤーは能力を使用できません'
      };
    }

    // フェーズ確認
    const currentPhase = this.getCurrentPhase();
    if (ability === 'fortune' || ability === 'guard' || ability === 'attack') {
      if (!currentPhase || currentPhase.id !== 'night') {
        return {
          allowed: false,
          reason: '夜フェーズ以外では能力を使用できません'
        };
      }
    }

    // 特殊ルールの適用（連続ガード禁止など）
    if (ability === 'guard' && context.target !== undefined) {
      const targetId = context.target;
      if (!this.options.regulations.allowConsecutiveGuard) {
        // 前回の護衛対象を取得
        const lastGuardedId = this.roleManager.getLastGuardedTarget(playerId);
        if (lastGuardedId !== null && lastGuardedId === targetId) {
          return {
            allowed: false,
            reason: '連続して同じプレイヤーを護衛することはできません'
          };
        }
      }
    }

    // RoleManagerに能力使用可否確認を委譲
    const result = this.roleManager.canUseAbility(playerId, ability, context);
    
    return result;
  };

  /**
   * カスタム役職を登録する
   * @param {string} roleName - 役職名
   * @param {Function} roleClass - 役職クラス
   * @returns {boolean} 登録成功時にtrue
   * @throws {Error} ゲーム開始後の登録や無効な役職クラスの場合
   */
  GameManager.prototype.registerRole = function(roleName, roleClass) {
    // ゲーム開始状態の検証
    if (this.isGameStarted()) {
      throw this.errorHandler.createError(
        'GAME_ALREADY_STARTED',
        'ゲーム開始後に役職を登録できません'
      );
    }

    // カスタム役職登録前イベントの発火
    this.eventSystem.emit('role.custom.register.before', {
      roleName,
      roleClass
    });

    try {
      // RoleManagerに役職登録を委譲
      const result = this.roleManager.registerRole(roleName, roleClass);

      // カスタム役職登録後イベントの発火
      this.eventSystem.emit('role.custom.register.after', {
        roleName,
        success: true
      });

      return result;
    } catch (error) {
      this.eventSystem.emit('role.custom.register.after', {
        roleName,
        success: false,
        error
      });

      throw error;
    }
  };

  /**
   * 役職リストの妥当性を検証する
   * @param {Array<string>} roleList - 検証する役職リスト
   * @returns {Object} 検証結果と問題点
   * @private
   */
  GameManager.prototype._validateRoleList = function(roleList) {
    // RoleManagerに検証を委譲
    return this.roleManager.validateRoleList(roleList);
  };

  /**
   * 役職間の相互参照を設定する
   * @private
   */
  GameManager.prototype._setupRoleReferences = function() {
    // 役職の相互参照設定前イベント発火
    this.eventSystem.emit('role.reference.setup.before', {});

    // RoleManagerに相互参照設定を委譲
    const references = this.roleManager.setupRoleReferences();

    // 役職の相互参照設定後イベント発火
    this.eventSystem.emit('role.reference.setup.after', {
      references
    });

    return references;
  };

  /**
   * あるプレイヤーの役職情報が別のプレイヤーから見えるかどうかを判定する
   * @param {number} fromPlayerId - 情報元プレイヤーID
   * @param {number} toPlayerId - 視点となるプレイヤーID
   * @returns {string} 可視性レベル ('full', 'team', 'special', 'revealed', 'limited')
   * @private
   */
  GameManager.prototype._isRoleInfoVisible = function(fromPlayerId, toPlayerId) {
    // 同一プレイヤーのチェック（自分の役職は常に見える）
    if (fromPlayerId === toPlayerId) {
      return 'full';
    }

    // プレイヤーの存在と役職の確認
    const fromPlayer = this.playerManager.getPlayer(fromPlayerId);
    const toPlayer = this.playerManager.getPlayer(toPlayerId);

    if (!fromPlayer || !toPlayer) {
      return 'limited';
    }

    try {
      // 死亡プレイヤーの場合、レギュレーションに基づいて情報公開
      if (!this.playerManager.isPlayerAlive(fromPlayerId) && 
          this.options.regulations.revealRoleOnDeath) {
        return 'revealed';
      }

      // 役職に基づく可視性判定
      const fromRole = this.roleManager.getRoleInfo(fromPlayerId);
      const toRole = this.roleManager.getRoleInfo(toPlayerId);

      if (!fromRole || !toRole) {
        return 'limited';
      }

      // 同じ陣営の場合
      if (fromRole.team === toRole.team) {
        // 人狼同士
        if (fromRole.name === 'werewolf' && toRole.name === 'werewolf') {
          return 'special';
        }
        // 共有者同士
        if (fromRole.name === 'mason' && toRole.name === 'mason') {
          return 'special';
        }
      }

      // 妖狐と背徳者の関係
      if (fromRole.name === 'fox' && toRole.name === 'heretic') {
        // 妖狐は背徳者からは見える
        return 'special';
      }
      if (fromRole.name === 'heretic' && toRole.name === 'fox') {
        // 背徳者は妖狐から見えるかはレギュレーション依存
        if (this.options.regulations.foxCanSeeHeretic) {
          return 'special';
        }
      }

      // 特別な関係性がない場合は制限情報
      return 'limited';
    } catch (error) {
      return 'limited';
    }
  };
}

export default applyGameManagerRoleMixin;
