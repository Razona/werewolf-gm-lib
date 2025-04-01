/**
 * Madman (狂人) クラス
 * 人狼陣営に所属する村人
 */

import { Werewolf } from './Werewolf';

/**
 * 狂人クラス
 * 人狼陣営に属するが、占い師や霊媒師からは村人と判定される役職
 */
class Madman extends Werewolf {
  /**
   * Madmanコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.name = 'madman';
    this.displayName = '狂人';
    
    // 狂人は特殊能力を持たない
    this.actions = [];
    
    // メタデータ上書き
    this.metadata = {
      description: '人狼陣営に属するが、占い結果は村人と判定される特殊な役職です',
      abilities: ['特殊能力なし'],
      winCondition: '人狼陣営の勝利条件に従います'
    };
  }

  /**
   * 占い結果を返す
   * @returns {string} 占い結果 ('white'/'black')
   */
  getFortuneResult() {
    return 'white'; // 狂人は占いで「村人」と判定される
  }

  /**
   * 霊媒結果を返す
   * @returns {string} 霊媒結果 ('white'/'black')
   */
  getMediumResult() {
    return 'white'; // 狂人は霊媒で「村人」と判定される
  }

  /**
   * 能力が使用可能かどうかを判定
   * @param {number} night - 現在の夜数
   * @returns {boolean} 能力が使用可能かどうか
   */
  canUseAbility(night) {
    // 狂人は特殊能力を持たない
    return false;
  }

  /**
   * 能力の対象となり得るプレイヤーリストを取得
   * @returns {Array<number>} 対象プレイヤーIDのリスト
   */
  getAbilityTargets() {
    // 狂人は特殊能力を持たないため、対象は空配列
    return [];
  }

  /**
   * 夜の行動実行時処理
   * @param {number} targetId - 対象プレイヤーID
   * @param {number} night - 現在の夜数
   * @returns {Object|null} アクション結果
   */
  onNightAction(targetId, night) {
    // 狂人は夜の行動を持たない
    return null;
  }

  /**
   * ゲーム開始時の処理
   */
  onGameStart() {
    // ゲーム開始時、誰が人狼かを知る
    const werewolves = this.getWerewolfPlayers();
    
    if (werewolves.length > 0) {
      // 狂人に人狼情報を通知
      this.game.eventSystem.emit('madman.know_werewolves', {
        playerId: this.playerId,
        werewolves: werewolves.map(p => ({
          id: p.id,
          name: p.name
        }))
      });
    }
  }

  /**
   * 人狼プレイヤーのリストを取得
   * @returns {Array<Object>} 人狼プレイヤーのリスト
   * @private
   */
  getWerewolfPlayers() {
    // ゲーム内の人狼プレイヤーを取得
    const allPlayers = this.game.getAllPlayers();
    return allPlayers.filter(player => 
      player.role && 
      player.role.name === 'werewolf' && 
      player.id !== this.playerId
    );
  }
}

export { Madman };