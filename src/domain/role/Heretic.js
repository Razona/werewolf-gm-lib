import { ThirdParty } from './ThirdParty';

class Heretic extends ThirdParty {
  constructor(game) {
    super(game);
    this.name = "heretic";
    this.displayName = "背徳者";
    this.metadata = {
      description: "妖狐の運命に連動する第三陣営の役職",
      abilities: ["妖狐と運命を共にする"],
      winCondition: "妖狐の生存状況に依存する"
    };
    this.foxPlayerId = null;
    
    // イベントハンドラーのバインド
    this.handleFoxDeath = this.handleFoxDeath.bind(this);
  }
  
  /**
   * ゲーム開始時の処理
   * イベントリスナーを登録
   */
  onGameStart() {
    // fox.deathイベントのリスナー登録
    this.game.eventSystem.on('fox.death', this.handleFoxDeath);
  }

  // 妖狐とのリンクを設定
  linkToFox(foxPlayerId) {
    this.foxPlayerId = foxPlayerId;
  }

  // 妖狐の死亡イベントハンドラ
  handleFoxDeath(event) {
    // 自分が生存していて、関連する妖狐が死亡した場合のみ反応
    if (this.isAlive && event.foxId === this.foxPlayerId) {
      // 自身を死亡状態にする
      this.isAlive = false;

      // テストの期待に合わせてイベントを発火
      this.game.eventSystem.emit('player.death', {
        playerId: this.playerId,
        cause: 'follow_fox',
        turn: this.game.phaseManager.getCurrentTurn()
      });
      
      // 死亡処理を呼び出す
      this.onDeath('fox_death');
    }
  }

  // 自身が死亡した際に妖狐との連動を解除
  onDeath(cause) {
    // 基本的な死亡処理を呼び出す
    super.onDeath(cause);
    
    // 妖狐との連動を解除
    this.foxPlayerId = null;
  }

  // 常に白判定
  getFortuneResult() {
    return 'white';
  }

  // 常に白判定
  getMediumResult() {
    return 'white';
  }

  // 能力なし
  canUseAbility() {
    return false;
  }

  // 能力対象なし
  getAbilityTargets() {
    return [];
  }

  // 夜行動なし
  onNightAction() {
    return null;
  }
}

export { Heretic };