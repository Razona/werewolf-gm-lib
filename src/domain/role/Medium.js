/**
 * Medium (霊媒師) クラス
 * 処刑されたプレイヤーの陣営を知ることができる村人陣営の役職
 */

import { Village } from './Village';

/**
 * 霊媒師クラス
 * 処刑されたプレイヤーが人狼かどうかを知ることができる
 */
class Medium extends Village {
  /**
   * Mediumコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.name = 'medium';
    this.displayName = '霊媒師';
    
    // メタデータ上書き
    this.metadata = {
      description: '霊媒師は処刑されたプレイヤーの陣営を知ることができる役職です',
      abilities: ['夜のフェーズに処刑されたプレイヤーの霊媒結果を得る'],
      winCondition: '全ての人狼を追放することで勝利します'
    };
    
    this.mediumResults = []; // 霊媒結果の履歴
    this.playerId = null;    // プレイヤーID
    this.isAlive = true;     // 生存状態
  }

  /**
   * プレイヤーIDを設定する
   * @param {number} playerId - プレイヤーID
   */
  assignToPlayer(playerId) {
    this.playerId = playerId;
    this.isAlive = true;
  }

  /**
   * 能力が使用可能かどうかを判定
   * @param {number} night - 現在の夜数
   * @returns {boolean} 能力が使用可能かどうか
   */
  canUseAbility(night) {
    // 霊媒師が生存していて、前日に処刑が行われた場合のみ使用可能
    if (!this.isAlive) {
      return false;
    }
    
    // 前日に処刑されたプレイヤーがいるか確認
    const executedPlayer = this.game.getLastExecutedPlayer();
    return executedPlayer !== null;
  }

  /**
   * 能力の対象となり得るプレイヤーリストを取得
   * @returns {Array<number>} 対象プレイヤーIDのリスト
   */
  getAbilityTargets() {
    // 前日に処刑されたプレイヤーのIDリストを返す
    const executedPlayer = this.game.getLastExecutedPlayer();
    return executedPlayer ? [executedPlayer.id] : [];
  }

  /**
   * 霊媒を実行する
   * @returns {string|null} 霊媒結果 ('white'/'black')、処刑者がいない場合はnull
   */
  performMedium() {
    if (!this.isAlive) {
      return { success: false, reason: 'DEAD_PLAYER' };
    }
    
    // 前日に処刑されたプレイヤーを取得
    const executedPlayer = this.game.getLastExecutedPlayer();
    if (!executedPlayer) {
      return null;
    }
    
    const targetId = executedPlayer.id;
    
    // 対象の霊媒結果を取得
    const targetPlayer = this.game.getPlayer(targetId);
    if (!targetPlayer) {
      return { success: false, reason: 'PLAYER_NOT_FOUND' };
    }
    
    const result = targetPlayer.role.getMediumResult();
    
    // 結果を保存
    const currentTurn = this.game.phaseManager.getCurrentTurn();
    this.mediumResults.push({
      turn: currentTurn,
      targetId,
      targetName: targetPlayer.name,
      result
    });
    
    // 結果をプレイヤーに通知
    this.game.eventSystem.emit('role.action.result', {
      type: 'medium',
      actor: this.playerId,
      target: targetId,
      result,
      turn: currentTurn
    });
    
    return result;
  }

  /**
   * 夜の行動実行時処理
   * @param {number} targetId - 対象プレイヤーID
   * @param {number} night - 現在の夜数
   * @returns {string|null} アクション結果
   */
  onNightAction(targetId, night) {
    return this.performMedium();
  }

  /**
   * フェーズ開始時の処理
   * @param {string} phase - フェーズ名
   */
  onPhaseStart(phase) {
    // 夜フェーズ開始時に自動的に霊媒を実行
    if (phase === 'night') {
      const executedPlayer = this.game.getLastExecutedPlayer();
      
      // 処刑者がいる場合は自動的に霊媒実行
      if (executedPlayer) {
        this.performMedium();
      }
    }
  }

  /**
   * 死亡処理
   * @param {string} cause - 死因
   */
  onDeath(cause) {
    this.isAlive = false;
  }
  
  /**
   * 勝利条件を返す
   * @returns {string} 勝利条件の説明
   */
  getWinCondition() {
    return 'すべての人狼を追放することで村人陣営の勝利';
  }
}

export { Medium };