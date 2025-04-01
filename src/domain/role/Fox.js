/**
 * 人狼ゲームGM支援ライブラリの妖狐クラス
 * 第三陣営の役職で、占われると死亡するが人狼の襲撃には耐性がある
 */

import { ThirdParty } from './ThirdParty';
import { TEAMS } from '../../core/common/Constants';

/**
 * 妖狐クラス
 * - 村人判定の役職
 * - 占いで死亡する（呪殺）
 * - 人狼の襲撃に耐性がある
 */
class Fox extends ThirdParty {
  /**
   * コンストラクタ
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    super(game);
    this.name = "fox";            // 役職名
    this.displayName = "妖狐";    // 表示名
    this.team = TEAMS.FOX;        // 陣営（妖狐陣営）
    this.cursed = false;          // 呪殺フラグ
    
    // 役職のメタデータ
    this.metadata = {
      description: "第三陣営の妖狐。占われると死亡(呪殺)するが、人狼の襲撃には耐性がある。他の陣営が勝利条件を満たしていても生存していれば勝利する。",
      abilities: ["襲撃耐性", "呪殺弱点"],
      winCondition: "他の陣営の勝利条件達成時に生存していること"
    };
  }

  /**
   * 占い結果を返す
   * @returns {string} 占い結果 ('white'/'black')
   */
  getFortuneResult() {
    return 'white'; // 妖狐は村人判定（白）
  }

  /**
   * 霊媒結果を返す
   * @returns {string} 霊媒結果 ('white'/'black')
   */
  getMediumResult() {
    return 'white'; // 妖狐は村人判定（白）
  }

  /**
   * 能力が使用可能かどうかを判定（妖狐は能動的な能力を持たない）
   * @returns {boolean} 能力が使用可能かどうか
   */
  canUseAbility() {
    return false; // 能動的な能力はない
  }

  /**
   * 能力の対象となり得るプレイヤーリスト
   * @returns {Array<number>} 対象プレイヤーIDのリスト
   */
  getAbilityTargets() {
    return []; // 能動的な能力はないので対象なし
  }

  /**
   * 能力の対象になった時の処理
   * @param {Object} action - アクション情報
   * @param {number} source - 実行者ID
   * @returns {Object|null} 応答結果
   */
  onTargeted(action, source) {
    // 占いの対象になった場合（呪殺フラグを立てる）
    if (action.type === 'fortune') {
      this.cursed = true;
      return {
        handled: true,
        result: 'fortune_reaction'
      };
    }
    
    // 襲撃の対象になった場合（襲撃を無効化）
    if (action.type === 'attack') {
      return {
        success: false,
        canceled: true,
        reason: 'immune' // 耐性があるため無効
      };
    }
    
    return null; // その他のアクションは通常通り
  }

  /**
   * 死亡時の処理
   * @param {string} cause - 死因
   */
  onDeath(cause) {
    super.onDeath(cause); // 親クラスの処理を実行
    
    // 関連する背徳者に通知
    this.game.eventSystem.emit('fox.death', {
      foxId: this.playerId,
      cause
    });
  }

  /**
   * フェーズ終了時の処理
   * @param {string} phase - フェーズ名
   */
  onPhaseEnd(phase) {
    // 夜フェーズ終了時に呪殺判定
    if (phase === 'night' && this.cursed && this.isAlive) {
      // 呪殺処理
      this.isAlive = false;
      
      // 死亡イベント発火
      this.game.eventSystem.emit('player.death', {
        playerId: this.playerId,
        cause: 'curse',
        turn: this.game.phaseManager.getCurrentTurn()
      });
      
      // 呪殺フラグをリセット
      this.cursed = false;
    }
  }

  /**
   * 勝利条件を取得
   * @returns {string} 勝利条件の説明
   */
  getWinCondition() {
    return this.metadata.winCondition;
  }
}

export { Fox };