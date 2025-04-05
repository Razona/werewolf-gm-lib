/**
 * VoteHistory - 投票履歴を管理するクラス
 * 
 * 投票の履歴を記録し、参照するための機能を提供します。
 * 
 * @module domain/vote/VoteHistory
 */

/**
 * 投票履歴管理クラス
 */
export default class VoteHistory {
  /**
   * VoteHistoryのコンストラクタ
   */
  constructor() {
    this.history = {}; // ターンごとの投票履歴
    this.playerVotes = {}; // プレイヤーごとの投票履歴
    this.playerTargets = {}; // プレイヤーごとの被投票履歴
    this.voteLog = []; // 全投票の時系列履歴
  }

  /**
   * 投票を記録する
   *
   * @param {Object} vote - 投票オブジェクト
   */
  recordVote(vote) {
    const voteData = vote.toJSON ? vote.toJSON() : vote;
    const { turn, voterId, targetId, voteType } = voteData;
    
    // 全体履歴に追加
    this.voteLog.push(voteData);
    
    // ターンごとの履歴に追加
    if (!this.history[turn]) {
      this.history[turn] = {};
    }
    if (!this.history[turn][voteType]) {
      this.history[turn][voteType] = [];
    }
    this.history[turn][voteType].push(voteData);
    
    // プレイヤーごとの投票履歴に追加
    if (!this.playerVotes[voterId]) {
      this.playerVotes[voterId] = [];
    }
    this.playerVotes[voterId].push(voteData);
    
    // プレイヤーごとの被投票履歴に追加
    if (!this.playerTargets[targetId]) {
      this.playerTargets[targetId] = [];
    }
    this.playerTargets[targetId].push(voteData);
  }

  /**
   * ターンごとの投票履歴を取得する
   *
   * @param {number} turn - ターン番号
   * @param {string} type - 投票タイプ
   * @returns {Array} 投票履歴の配列
   */
  getVotesByTurn(turn, type = null) {
    if (!this.history[turn]) return [];
    
    if (type) {
      return this.history[turn][type] || [];
    } else {
      // 全タイプの投票を結合
      let allVotes = [];
      Object.values(this.history[turn] || {}).forEach(votes => {
        allVotes = allVotes.concat(votes);
      });
      return allVotes;
    }
  }

  /**
   * プレイヤーの投票履歴を取得する
   *
   * @param {number} playerId - プレイヤーID
   * @returns {Array} 投票履歴の配列
   */
  getPlayerVoteHistory(playerId) {
    return this.playerVotes[playerId] || [];
  }

  /**
   * プレイヤーへの投票履歴を取得する
   *
   * @param {number} playerId - プレイヤーID
   * @returns {Array} 被投票履歴の配列
   */
  getPlayerTargetHistory(playerId) {
    return this.playerTargets[playerId] || [];
  }

  /**
   * 投票履歴を取得する
   *
   * @param {number} turn - ターン番号（nullの場合は全ターン）
   * @param {string} type - 投票タイプ（nullの場合は全タイプ）
   * @returns {Array} 投票履歴の配列
   */
  getVoteHistory(turn = null, type = null) {
    // 条件でフィルタリング
    return this.voteLog.filter(vote => {
      // ターン指定がある場合
      if (turn !== null && vote.turn !== turn) {
        return false;
      }
      
      // タイプ指定がある場合
      if (type !== null && vote.voteType !== type) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * ターンの投票サマリーを生成する
   *
   * @param {number} turn - ターン番号
   * @returns {Object} 投票サマリー
   */
  generateVoteSummary(turn) {
    const summary = {
      turn,
      types: {},
      results: {}
    };
    
    // ターン内の投票履歴を取得
    const turnVotes = this.getVoteHistory(turn);
    if (turnVotes.length === 0) {
      return summary;
    }
    
    // 投票タイプごとに集計
    const votesByType = {};
    turnVotes.forEach(vote => {
      const type = vote.voteType;
      if (!votesByType[type]) {
        votesByType[type] = [];
      }
      
      // 最新の投票のみを考慮（同じ投票者の複数回の投票がある場合）
      const existingVoteIndex = votesByType[type].findIndex(v => v.voterId === vote.voterId);
      if (existingVoteIndex >= 0) {
        // 新しい投票で置き換え（タイムスタンプが新しい場合）
        if (vote.timestamp > votesByType[type][existingVoteIndex].timestamp) {
          votesByType[type][existingVoteIndex] = vote;
        }
      } else {
        // 新規投票の追加
        votesByType[type].push(vote);
      }
    });
    
    // タイプごとに集計
    Object.entries(votesByType).forEach(([type, votes]) => {
      // 投票数のカウント
      const counts = {};
      votes.forEach(vote => {
        const targetId = vote.targetId;
        counts[targetId] = (counts[targetId] || 0) + (vote.voteStrength || 1);
      });
      
      // 最大得票数と最大得票者を特定
      let maxCount = 0;
      let maxVoted = [];
      
      Object.entries(counts).forEach(([targetId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxVoted = [parseInt(targetId, 10)];
        } else if (count === maxCount) {
          maxVoted.push(parseInt(targetId, 10));
        }
      });
      
      // サマリー情報の設定
      summary.types[type] = {
        votes: votes.length,
        counts,
        maxCount,
        maxVoted,
        isTie: maxVoted.length > 1
      };
    });
    
    // 最終結果の追加（決選投票があればその結果、なければ通常投票の結果）
    if (summary.types.runoff) {
      summary.results = {
        executionTarget: summary.types.runoff.isTie ? null : summary.types.runoff.maxVoted[0],
        isTie: summary.types.runoff.isTie,
        counts: summary.types.runoff.counts
      };
    } else if (summary.types.execution) {
      summary.results = {
        executionTarget: summary.types.execution.isTie ? null : summary.types.execution.maxVoted[0],
        isTie: summary.types.execution.isTie,
        counts: summary.types.execution.counts
      };
    }
    
    return summary;
  }
}
