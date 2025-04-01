import { Village } from './Village';

class Mason extends Village {
  constructor(game) {
    super(game);
    this.name = "mason";
    this.displayName = "共有者";
    this.metadata = {
      description: "村人陣営に属する役職で、ゲーム開始時に他の共有者が誰か分かる",
      abilities: ["他の共有者を認識する", "ゲーム開始時に他の共有者が誰か分かる"],
      winCondition: "すべての人狼を追放することで村人陣営の勝利に貢献する"
    };
    this.playerId = null;
  }

  // 他の共有者を取得
  getPartners() {
    // プレイヤーIDが設定されていない場合は空配列を返す
    if (this.playerId === null) return [];

    // ゲームインスタンスから他の共有者を検索
    // getPlayersByRoleを使用して共有者一覧を取得
    const allMasons = this.game.getPlayersByRole('mason');
    
    // 自分以外の生存している共有者をフィルタリング
    return allMasons.filter(player => 
      player.id !== this.playerId && 
      player.isAlive
    );
  }

  // ゲーム開始時の処理
  onGameStart() {
    const partners = this.getPartners();
    
    // 他の共有者がいる場合、認識イベントを発火
    if (partners.length > 0) {
      this.game.eventSystem.emit('mason.recognize', {
        masonId: this.playerId,
        partners: partners.map(p => p.id)
      });
    }
  }

  // 夜行動（なし）
  canUseAbility() {
    return false;
  }

  // 能力対象（なし）
  getAbilityTargets() {
    return [];
  }

  // 夜行動メソッド（何も行わない）
  onNightAction() {
    return null;
  }

  // 死亡時の処理
  onDeath(cause) {
    // 親クラスのonDeathを呼び出して死亡処理
    super.onDeath(cause);
    
    const partners = this.getPartners();
    
    // 他の共有者がいる場合、死亡を通知
    if (partners.length > 0) {
      this.game.eventSystem.emit('mason.death', {
        masonId: this.playerId,
        cause: cause,
        partners: partners.map(p => p.id)
      });
    }
  }

  // 勝利条件を上書き
  getWinCondition() {
    return "すべての人狼を追放することで村人陣営の勝利に貢献します";
  }
}

export { Mason };