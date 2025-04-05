/**
 * VoteCollector - 投票の収集と検証を担当するクラス
 * 
 * 投票の登録、変更、検証などの基本的な投票操作を管理します。
 * 
 * @module domain/vote/VoteCollector
 */

import Vote from './Vote.js';
import { isValidPlayerId } from '../../core/common/utils.js';

/**
 * 投票収集クラス
 */
export default class VoteCollector {
  /**
   * VoteCollectorのコンストラクタ
   *
   * @param {Object} game - ゲームインスタンス
   */
  constructor(game) {
    this.game = game;
    this.eventSystem = game.eventSystem;
    this.errorHandler = game.errorHandler;
    
    // 内部状態の初期化
    this._currentVoteType = null;
    this._voters = [];
    this._targets = [];
    this._votes = new Map();
  }

  /**
   * 投票情報を初期化する
   *
   * @param {Array} voters - 投票者IDの配列
   * @param {Array} targets - 投票対象IDの配列
   * @param {string} voteType - 投票タイプ
   * @param {number} turn - ターン番号
   */
  initialize(voters, targets, voteType, turn) {
    this._currentVoteType = voteType;
    this._voters = [...voters];
    this._targets = [...targets];
    this._votes = new Map();
  }

  /**
   * 投票を登録する
   *
   * @param {Object} vote - 投票オブジェクト
   * @returns {Object} 登録結果（isChange: 変更かどうか, previousTarget: 前の投票対象）
   */
  addVote(vote) {
    // 投票の変更かどうかを確認
    const isChange = this._votes.has(vote.getVoter());
    const previousTarget = isChange ? this._votes.get(vote.getVoter()).getTarget() : null;

    // 投票を保存
    this._votes.set(vote.getVoter(), vote);

    return {
      isChange,
      previousTarget
    };
  }

  /**
   * 投票を更新する
   *
   * @param {Object} vote - 投票オブジェクト
   */
  updateVote(vote) {
    this._votes.set(vote.getVoter(), vote);
  }

  /**
   * 特定のプレイヤーが投票しているか確認する
   *
   * @param {number} voterId - 投票者ID
   * @returns {boolean} 投票済みならtrue
   */
  hasVoted(voterId) {
    return this._votes.has(voterId);
  }

  /**
   * 特定のプレイヤーの投票を取得する
   *
   * @param {number} voterId - 投票者ID
   * @returns {Object|null} 投票オブジェクト、未投票の場合はnull
   */
  getVote(voterId) {
    return this._votes.has(voterId) ? this._votes.get(voterId) : null;
  }

  /**
   * 投票対象が有効かどうか確認する
   *
   * @param {number} targetId - 対象ID
   * @returns {boolean} 有効な対象ならtrue
   */
  isValidTarget(targetId) {
    return this._targets.includes(targetId);
  }

  /**
   * 投票の妥当性を検証する
   *
   * @param {number} voterId - 投票者ID
   * @param {number} targetId - 投票対象ID
   * @param {Object} roleManager - 役職マネージャ（オプション）
   * @returns {Object} 検証結果
   */
  validateVote(voterId, targetId, roleManager = null) {
    // 投票者の検証
    const voter = this.game.playerManager.getPlayer(voterId);
    if (!voter) {
      return {
        valid: false,
        reason: 'INVALID_VOTER',
        message: '投票者が存在しません'
      };
    }

    if (!voter.isAlive) {
      return {
        valid: false,
        reason: 'DEAD_VOTER',
        message: '死亡したプレイヤーは投票できません'
      };
    }

    // 対象の検証
    const target = this.game.playerManager.getPlayer(targetId);
    if (!target) {
      return {
        valid: false,
        reason: 'INVALID_TARGET',
        message: '投票対象が存在しません'
      };
    }

    // 現在の投票タイプで対象が有効か
    if (!this.isValidTarget(targetId)) {
      return {
        valid: false,
        reason: 'INELIGIBLE_TARGET',
        message: 'この対象に投票することはできません'
      };
    }

    // 自分自身への投票制限（設定により異なる）
    if (voterId === targetId && !this.game.options?.regulations?.allowSelfVote) {
      return {
        valid: false,
        reason: 'SELF_VOTE_FORBIDDEN',
        message: '自分自身に投票することはできません'
      };
    }

    // 役職固有の制約チェック（roleManagerが提供されている場合）
    if (roleManager && voter.role) {
      const roleConstraint = roleManager.checkVoteConstraint(voter, targetId);
      if (roleConstraint && !roleConstraint.valid) {
        return roleConstraint;
      }
    }

    return { valid: true };
  }

  /**
   * 現在の投票リストを取得する
   *
   * @returns {Array} 投票オブジェクトの配列
   */
  getCurrentVotes() {
    return Array.from(this._votes.values());
  }
  
  /**
   * 投票が完了しているかチェックする
   *
   * @returns {boolean} 全員が投票済みならtrue
   */
  isVotingComplete() {
    return this._votes.size >= this._voters.length;
  }

  /**
   * 投票可能な残りのプレイヤーIDを取得する
   *
   * @returns {Array} 未投票のプレイヤーID配列
   */
  getRemainingVoters() {
    return this._voters.filter(id => !this._votes.has(id));
  }

  /**
   * 投票者の総数を取得する
   *
   * @returns {number} 投票者の総数
   */
  getTotalVoters() {
    return this._voters.length;
  }

  /**
   * 登録された投票の数を取得する
   *
   * @returns {number} 登録された投票の数
   */
  getSubmittedVotes() {
    return this._votes.size;
  }
  
  /**
   * 現在の投票タイプを取得する
   * 
   * @returns {string} 現在の投票タイプ
   */
  getCurrentVoteType() {
    return this._currentVoteType;
  }
  
  /**
   * 投票者リストを取得する
   * 
   * @returns {Array} 投票者IDの配列
   */
  getVoters() {
    return [...this._voters];
  }
  
  /**
   * 投票対象リストを取得する
   * 
   * @returns {Array} 投票対象IDの配列
   */
  getTargets() {
    return [...this._targets];
  }
}
