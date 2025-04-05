// src/domain/vote/Vote.js

/**
 * 投票基本クラス
 *
 * 投票の基本プロパティとメソッドを定義します。
 * このクラスはイミュータブルなプロパティを持ち、投票対象の更新のみを許可します。
 */

import { isValidPlayerId } from '../../core/common/utils.js';

/**
 * Vote クラス - 投票の基本単位
 */
export default class Vote {
  /**
   * 投票インスタンスを作成
   *
   * @param {Object} options - 投票設定オブジェクト
   * @param {number} options.voterId - 投票者ID（必須）
   * @param {number} options.targetId - 投票対象ID（必須）
   * @param {string} options.voteType - 投票タイプ（必須、例: 'execution', 'runoff', 'special'）
   * @param {number} [options.voteStrength=1] - 投票の重み（デフォルト: 1）
   * @param {number} [options.turn] - ターン番号（オプション）
   * @param {number} [options.timestamp] - タイムスタンプ（デフォルト: 現在時刻）
   * @param {Object} errorHandler - エラー処理用オブジェクト
   */
  constructor(options, errorHandler) {
    // 入力値の検証
    this.validateInputs(options, errorHandler);

    // プライベート変数
    const _voterId = options.voterId;
    const _targetId = options.targetId;
    const _voteType = options.voteType;
    // 明示的に数値として変換して確実に数値型を保持する
    const _voteStrength = Number(options.voteStrength || 1);
    const _turn = options.turn || 1;
    let _timestamp = options.timestamp || Date.now();

    // デバッグ用ログ
    console.log(`Vote created: voterId=${_voterId}, targetId=${_targetId}, strength=${_voteStrength}`);

    // ゲッターの定義（クロージャを利用したプライベート変数へのアクセス）
    this.getVoter = () => _voterId;
    this.getTarget = () => _targetId;
    this.getType = () => _voteType;
    this.getStrength = () => _voteStrength; // 数値を確実に返す

    /**
     * 投票先を更新する
     *
     * @param {number} newTargetId - 新しい投票対象ID
     * @param {Object} errorHandler - エラー処理用オブジェクト
     */
    this.updateTarget = (newTargetId, errorHandler) => {
      // 新しい投票先の検証
      if (!isValidPlayerId(newTargetId)) {
        throw errorHandler.createError('VOTE', 'E5004', {
          parameter: 'targetId',
          value: newTargetId,
          message: `不正なプレイヤーID: ${newTargetId}`
        });
      }

      // タイムスタンプを更新
      _timestamp = Date.now();

      // このオブジェクトのgetTargetメソッドを更新
      this.getTarget = () => newTargetId;
    };

    /**
     * JSONシリアライズ用にオブジェクトを返す
     *
     * @returns {Object} 全プロパティを含むオブジェクト
     */
    this.toJSON = () => ({
      voterId: _voterId,
      targetId: this.getTarget(), // 更新される可能性があるため、ゲッター経由でアクセス
      voteType: _voteType,
      voteStrength: _voteStrength,
      turn: _turn,
      timestamp: _timestamp
    });
  }

  /**
   * 入力値の検証
   *
   * @param {Object} options - 検証する入力オブジェクト
   * @param {Object} errorHandler - エラー処理用オブジェクト
   * @throws {Error} 検証エラー
   * @private
   */
  validateInputs(options, errorHandler) {
    // voterId検証
    if (options.voterId === undefined || options.voterId === null) {
      throw errorHandler.createError('VOTE', 'E5001', {
        message: '投票者IDが指定されていません'
      });
    }

    // targetId検証
    if (options.targetId === undefined || options.targetId === null) {
      throw errorHandler.createError('VOTE', 'E5002', {
        message: '投票対象IDが指定されていません'
      });
    }

    // voteType検証
    if (!options.voteType) {
      throw errorHandler.createError('VOTE', 'E5003', {
        message: '投票タイプが指定されていません'
      });
    }

    // 型チェック
    if (!isValidPlayerId(options.voterId)) {
      throw errorHandler.createError('VOTE', 'E5004', {
        parameter: 'voterId',
        value: options.voterId,
        message: `不正なプレイヤーID: ${options.voterId}`
      });
    }

    if (!isValidPlayerId(options.targetId)) {
      throw errorHandler.createError('VOTE', 'E5004', {
        parameter: 'targetId',
        value: options.targetId,
        message: `不正なプレイヤーID: ${options.targetId}`
      });
    }

    if (typeof options.voteType !== 'string') {
      throw errorHandler.createError('VOTE', 'E5004', {
        parameter: 'voteType',
        value: options.voteType,
        message: `不正な投票タイプ: ${options.voteType}`
      });
    }

    // オプションの型チェック
    if (options.voteStrength !== undefined &&
      (typeof options.voteStrength !== 'number' || options.voteStrength <= 0)) {
      throw errorHandler.createError('VOTE', 'E5004', {
        parameter: 'voteStrength',
        value: options.voteStrength,
        message: `不正な投票重み: ${options.voteStrength}`
      });
    }

    if (options.turn !== undefined &&
      !isValidPlayerId(options.turn)) {
      throw errorHandler.createError('VOTE', 'E5004', {
        parameter: 'turn',
        value: options.turn,
        message: `不正なターン番号: ${options.turn}`
      });
    }

    if (options.timestamp !== undefined &&
      typeof options.timestamp !== 'number') {
      throw errorHandler.createError('VOTE', 'E5004', {
        parameter: 'timestamp',
        value: options.timestamp,
        message: `不正なタイムスタンプ: ${options.timestamp}`
      });
    }
  }
}