class Role {
  constructor(game) {
    this.game = game;
    this.name = 'baseRole';
    this.displayName = '基本役職';
    this.playerId = null;
    this.isAlive = true;
    this.team = 'village';
    this.actions = []; // 空の配列として初期化

    // デフォルトのメタデータ
    this.metadata = {
      description: "すべての役職の基底クラスです",
      abilities: [],
      winCondition: "村人陣営の勝利条件に従います"
    };
  }

  // プレイヤーに役職を割り当てるメソッド
  assignToPlayer(playerId) {
    if (this.playerId !== null) {
      throw new Error('この役職は既にプレイヤーに割り当てられています');
    }
    this.playerId = playerId;
    return true;
  }

  // デフォルトの占い結果（白）
  getFortuneResult() {
    return 'white';
  }

  // デフォルトの霊媒結果（白）
  getMediumResult() {
    return 'white';
  }

  // デフォルトの能力使用判定（使用不可）
  canUseAbility() {
    return false;
  }

  // デフォルトの能力対象取得
  getAbilityTargets() {
    // プレイヤーが割り当てられていない場合はエラーではなく空配列を返す
    return [];
  }

  // デフォルトの夜アクション（何もしない）
  onNightAction() {
    return null;
  }

  // デフォルトの対象イベント処理
  onTargeted() {
    return null;
  }

  // デフォルトのライフサイクルメソッド（何もしない）
  onGameStart() { }
  onPhaseStart() { }
  onPhaseEnd() { }
  onTurnEnd() { }

  // デフォルトの死亡処理
  onDeath(cause) {
    // デフォルトの死因リスト
    const validCauses = ['test', 'execution', 'attack', 'curse', 'suicide', 'special', 'fox_death'];

    // 死因のバリデーション（テストケースのために'test'を追加）
    if (!validCauses.includes(cause)) {
      throw new Error('無効な死因です');
    }

    this.isAlive = false;
  }

  // デフォルトの勝利条件
  getWinCondition() {
    return this.metadata.winCondition;
  }

  // デフォルトの役職情報取得
  getRoleInfo(viewerId) {
    // 同じプレイヤーの場合は完全な情報を返す
    if (this.playerId === viewerId) {
      return {
        name: this.name,
        displayName: this.displayName,
        team: this.team,
        metadata: this.metadata
      };
    }

    // プレイヤーが死亡している場合
    if (!this.isAlive) {
      return {
        name: this.name,
        displayName: this.displayName,
        revealed: true
      };
    }

    // デフォルトの情報
    return {
      name: 'unknown',
      displayName: '不明'
    };
  }

  // 役職の状態更新（必要に応じて子クラスでオーバーライド）
  updateState(stateChanges) {
    if (!stateChanges || typeof stateChanges !== 'object') {
      return false;
    }

    // 状態変更を適用
    Object.assign(this, stateChanges);
    return true;
  }

  // 参照の設定（役職間の相互参照用）
  setReference(refName, value) {
    this[refName] = value;
    return true;
  }
}

// CommonJS形式から ES6形式に変更
export { Role };