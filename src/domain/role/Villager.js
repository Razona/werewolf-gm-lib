/**
 * 人狼ゲームGM支援ライブラリの村人クラス
 */

import { Village } from './Village';
import { ROLES } from '../../core/common/Constants';

/**
 * 村人役職クラス
 * 村人陣営の基本役職で、特殊能力を持たない
 */
class Villager extends Village {
  /**
   * Villagerコンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.name = ROLES.VILLAGER;
    this.displayName = '村人';
    
    // メタデータの設定
    this.metadata = {
      description: "特殊な能力を持たない村の村人。",
      abilities: [],
      winCondition: this.getWinCondition()
    };
  }

  /**
   * 能力が使用可能かどうかを判定（村人は能力を持たない）
   * @param {number} night - 現在の夜数
   * @returns {boolean} 常にfalse
   */
  canUseAbility(night) {
    return false;
  }

  /**
   * 占い結果を返す
   * @returns {string} 占い結果 ('white')
   */
  getFortuneResult() {
    return 'white'; // 村人は白判定
  }

  /**
   * 霊媒結果を返す
   * @returns {string} 霊媒結果 ('white')
   */
  getMediumResult() {
    return 'white'; // 村人は白判定
  }
}

export { Villager };