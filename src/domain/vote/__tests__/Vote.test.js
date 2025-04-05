
// src/domain/vote/__tests__/Vote.test.js

// フェイクタイマーを設定
jest.useFakeTimers();

// モックのErrorHandlerを作成
const mockErrorHandler = {
  createError: (category, code, details) => {
    // エラーコードはそのまま指定された値を使用
    const errorCode = code;
    const message = details.message || 'エラーが発生しました';
    
    // エラーオブジェクトを作成
    const error = new Error(message);
    error.code = errorCode;
    error.details = details;
    
    return error;
  }
};

// isValidPlayerIdのモック
jest.mock('../../../core/common/utils', () => ({
  isValidPlayerId: (id) => typeof id === 'number' && id >= 0 && Number.isInteger(id)
}));

import Vote from '../Vote';

describe('Vote class basic functionality', () => {

  test('should instantiate with required parameters', () => {
    // 最小限の必須パラメータでVoteインスタンスを作成
    const vote = new Vote({
      voterId: 1,
      targetId: 2,
      voteType: 'execution'
    }, mockErrorHandler);

    // プロパティのゲッターをテスト
    expect(vote.getVoter()).toBe(1);
    expect(vote.getTarget()).toBe(2);
    expect(vote.getType()).toBe('execution');
    expect(vote.getStrength()).toBe(1); // デフォルト値

    // 全パラメータで作成
    const voteWithAllParams = new Vote({
      voterId: 3,
      targetId: 4,
      voteType: 'runoff',
      voteStrength: 2,
      turn: 3,
      timestamp: 1621234567890
    }, mockErrorHandler);

    expect(voteWithAllParams.getVoter()).toBe(3);
    expect(voteWithAllParams.getTarget()).toBe(4);
    expect(voteWithAllParams.getType()).toBe('runoff');
    expect(voteWithAllParams.getStrength()).toBe(2);

    // toJSONの確認
    const jsonData = voteWithAllParams.toJSON();
    expect(jsonData).toEqual({
      voterId: 3,
      targetId: 4,
      voteType: 'runoff',
      voteStrength: 2,
      turn: 3,
      timestamp: 1621234567890
    });
  });

  test('should throw error when instantiated with invalid parameters', () => {
    // voterId不足
    expect(() => {
      new Vote({
        targetId: 2,
        voteType: 'execution'
      }, mockErrorHandler);
    }).toThrowError(expect.objectContaining({
      code: 'E5001'
    }));
    
    // targetId不足
    expect(() => {
      new Vote({
        voterId: 1,
        voteType: 'execution'
      }, mockErrorHandler);
    }).toThrowError(expect.objectContaining({
      code: 'E5002'
    }));
    
    // voteType不足
    expect(() => {
      new Vote({
        voterId: 1,
        targetId: 2
      }, mockErrorHandler);
    }).toThrowError(expect.objectContaining({
      code: 'E5003'
    }));
    
    // 無効な型のパラメータ
    expect(() => {
      new Vote({
        voterId: 'invalid', // 文字列は不正
        targetId: 2,
        voteType: 'execution'
      }, mockErrorHandler);
    }).toThrowError(expect.objectContaining({
      code: 'E5004'
    }));
    
    expect(() => {
      new Vote({
        voterId: 1,
        targetId: 'invalid', // 文字列は不正
        voteType: 'execution'
      }, mockErrorHandler);
    }).toThrowError(expect.objectContaining({
      code: 'E5004'
    }));
  });

  test('should provide getter methods for properties', () => {
    const vote = new Vote({
      voterId: 1,
      targetId: 2,
      voteType: 'execution',
      voteStrength: 3
    }, mockErrorHandler);

    // ゲッターメソッドをテスト
    expect(vote.getVoter()).toBe(1);
    expect(vote.getTarget()).toBe(2);
    expect(vote.getType()).toBe('execution');
    expect(vote.getStrength()).toBe(3);

    // 直接プロパティアクセスは不可能
    expect(vote.voterId).toBeUndefined();
    expect(vote.targetId).toBeUndefined();
    expect(vote.voteType).toBeUndefined();
    expect(vote.voteStrength).toBeUndefined();
  });

  test('should allow updating target', () => {
    const vote = new Vote({
      voterId: 1,
      targetId: 2,
      voteType: 'execution'
    }, mockErrorHandler);
    
    // 初期値の確認
    expect(vote.getTarget()).toBe(2);
    
    // ターゲットを更新
    const oldTimestamp = vote.toJSON().timestamp;
    
    // 少し待ってからターゲットを更新
    jest.advanceTimersByTime(1000);
    vote.updateTarget(3, mockErrorHandler);
    
    // 更新後の値を確認
    expect(vote.getTarget()).toBe(3);
    
    // タイムスタンプが更新されていることを確認
    const newTimestamp = vote.toJSON().timestamp;
    expect(newTimestamp).not.toBe(oldTimestamp);
    
    // 不正な値でエラーになることを確認
    expect(() => {
      vote.updateTarget('invalid', mockErrorHandler);
    }).toThrowError(expect.objectContaining({
      code: 'E5004'
    }));
  });

  test('should convert to JSON correctly', () => {
    const timestamp = Date.now();
    const vote = new Vote({
      voterId: 1,
      targetId: 2,
      voteType: 'execution',
      voteStrength: 1,
      turn: 2,
      timestamp
    }, mockErrorHandler);

    const jsonData = vote.toJSON();

    // JSON形式で全プロパティが含まれていることを確認
    expect(jsonData).toEqual({
      voterId: 1,
      targetId: 2,
      voteType: 'execution',
      voteStrength: 1,
      turn: 2,
      timestamp
    });

    // JSONとして文字列化できることを確認
    const jsonString = JSON.stringify(vote);
    const parsedData = JSON.parse(jsonString);

    expect(parsedData).toEqual({
      voterId: 1,
      targetId: 2,
      voteType: 'execution',
      voteStrength: 1,
      turn: 2,
      timestamp
    });
  });
});
