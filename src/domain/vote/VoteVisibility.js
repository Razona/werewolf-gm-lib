/**
 * VoteVisibility - 投票情報の可視性を制御するクラス
 * 
 * 投票情報の表示制御とアクセス権管理を行います。
 * 
 * @module domain/vote/VoteVisibility
 */

/**
 * 投票可視性管理クラス
 */
export default class VoteVisibility {
  /**
   * VoteVisibilityのコンストラクタ
   */
  constructor() {
    // デフォルトの可視性設定
    this._settings = {
      showVoterNames: true,     // 投票者名を表示
      showVoteCount: true,      // 得票数を表示
      showRealTimeVotes: false, // リアルタイムで投票状況を表示
      anonymousUntilEnd: false  // 投票完了まで詳細を隠す
    };
  }

  /**
   * 可視性設定を構成する
   *
   * @param {Object} options - 可視性設定オプション
   * @returns {Object} 更新された設定
   */
  configureSettings(options) {
    this._settings = {
      ...this._settings,
      ...options
    };

    return this._settings;
  }

  /**
   * 現在の可視性設定を取得する
   *
   * @returns {Object} 現在の設定
   */
  getSettings() {
    return { ...this._settings };
  }

  /**
   * 視点ベースの投票情報を取得する
   *
   * @param {Array} votes - 投票オブジェクトの配列
   * @param {number} viewerId - 閲覧者ID（nullはGM視点）
   * @param {boolean} isComplete - 投票が完了しているか
   * @returns {Array} フィルタリングされた投票情報
   */
  getVisibleVotes(votes, viewerId = null, isComplete = false) {
    // GMまたは投票情報公開の場合は全情報
    if (viewerId === null || this._settings.showRealTimeVotes) {
      const voteData = votes.map(v => v.toJSON ? v.toJSON() : v);

      // 匿名投票の場合は投票者情報を隠す
      if (this._settings.anonymousUntilEnd && !isComplete) {
        return voteData.map(vote => ({
          ...vote,
          voterId: null,
          voterName: null
        }));
      }

      return voteData;
    }

    // 自分自身の投票のみ表示
    const ownVote = votes.find(v => {
      const id = v.getVoter ? v.getVoter() : v.voterId;
      return id === viewerId;
    });

    if (ownVote) {
      return [ownVote.toJSON ? ownVote.toJSON() : ownVote];
    }

    return [];
  }

  /**
   * 視点ベースの得票数を取得する
   *
   * @param {Object} counts - 得票数オブジェクト
   * @param {number} viewerId - 閲覧者ID（nullはGM視点）
   * @returns {Object} フィルタリングされた得票数
   */
  getVisibleVoteCounts(counts, viewerId = null) {
    // 得票数を表示しない設定の場合
    if (!this._settings.showVoteCount && viewerId !== null) {
      return {};
    }

    return { ...counts };
  }

  /**
   * 現在の投票状況を視点に基づいてフィルタリング
   *
   * @param {Object} status - 投票状況オブジェクト
   * @param {Array} votes - 投票オブジェクトの配列
   * @param {number} viewerId - 閲覧者ID（nullはGM視点）
   * @returns {Object} フィルタリングされた投票状況
   */
  getVisibleVoteStatus(status, votes, viewerId = null) {
    const visibleStatus = { ...status };
    
    // GMの場合は完全な情報
    if (viewerId === null) {
      visibleStatus.votes = votes.map(v => v.toJSON ? v.toJSON() : v);
      return visibleStatus;
    }
    
    // プレイヤーには設定に基づいて情報を制限
    delete visibleStatus.votes;
    
    // 自分の投票は常に見える
    const ownVote = votes.find(v => {
      const id = v.getVoter ? v.getVoter() : v.voterId;
      return id === viewerId;
    });
    
    if (ownVote) {
      visibleStatus.ownVote = ownVote.toJSON ? ownVote.toJSON() : ownVote;
    }
    
    // 設定に基づいて他の情報を制限
    if (this._settings.showRealTimeVotes) {
      if (this._settings.anonymousUntilEnd && !status.complete) {
        // 匿名投票情報（得票数のみ）
        const counts = {};
        votes.forEach(vote => {
          const targetId = vote.getTarget ? vote.getTarget() : vote.targetId;
          const strength = vote.getStrength ? vote.getStrength() : (vote.voteStrength || 1);
          counts[targetId] = (counts[targetId] || 0) + strength;
        });
        
        visibleStatus.counts = counts;
      } else {
        // 通常の投票情報
        visibleStatus.votes = this.getVisibleVotes(votes, viewerId, status.complete);
      }
    }
    
    return visibleStatus;
  }
}
