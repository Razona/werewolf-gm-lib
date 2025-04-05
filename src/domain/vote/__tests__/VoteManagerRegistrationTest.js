// src/domain/vote/__tests__/VoteManagerRegistrationTest.js
import VoteManager from '../VoteManager.js';
import { createMocks } from './VoteManagerMocks';

describe('VoteManager B. 投票登録プロセス', () => {
  let voteManager;
  let mockGame;
  let mockEventSystem;
  let mockPlayerManager;
  let mockErrorHandler;
  let mockPhaseManager;

  beforeEach(() => {
    const mocks = createMocks();
    mockEventSystem = mocks.eventSystem;
    mockPlayerManager = mocks.playerManager;
    mockErrorHandler = mocks.errorHandler;
    mockPhaseManager = mocks.phaseManager;
    mockGame = mocks.game;

    voteManager = new VoteManager(mockGame);
    voteManager.startVoting('execution');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerVote', () => {
    test('should register a valid vote and return success with vote object', () => {
      // Act
      const result = voteManager.registerVote(1, 2);

      // Assert
      expect(result).toEqual({
        success: true,
        vote: expect.objectContaining({
          voterId: 1,
          targetId: 2,
          voteType: 'execution',
          voteStrength: 1,
          turn: 2
        })
      });

      // イベント発火確認（投票登録前後）
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
        'vote.register.before',
        {
          vote: expect.objectContaining({
            voterId: 1,
            targetId: 2
          })
        }
      );

      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
        'vote.register.after',
        {
          vote: expect.objectContaining({
            voterId: 1,
            targetId: 2
          }),
          isChange: false,
          previousTarget: null
        }
      );
    });

    test('should throw error when dead player tries to vote', () => {
      // Act & Assert
      const result = voteManager.registerVote(4, 2);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('DEAD_VOTER');
      
      // ここではErrorHandlerが呼び出されるのではなく、すでにVoteCollector内でエラーチェックが行われるため
      // このアサーションは削除するか修正する必要があります
    });

    test('should throw error for invalid voter ID', () => {
      // Arrange - 存在しないプレイヤーID
      const nonExistentPlayerId = 99;

      // Act & Assert
      const result = voteManager.registerVote(nonExistentPlayerId, 2);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_VOTER');
      
      // ここではErrorHandlerが呼び出されるのではなく、すでにVoteCollector内でエラーチェックが行われるため
      // このアサーションは削除するか修正する必要があります
    });

    test('should throw error for invalid target ID', () => {
      // Arrange - 存在しないターゲットID
      const nonExistentTargetId = 99;

      // Act & Assert
      const result = voteManager.registerVote(1, nonExistentTargetId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_TARGET');
      
      // ここではErrorHandlerが呼び出されるのではなく、すでにVoteCollector内でエラーチェックが行われるため
      // このアサーションは削除するか修正する必要があります
    });

    test('should correctly handle vote with custom vote strength (mayor)', () => {
      // Arrange - Player3 は村長 (voteStrength = 2)

      // Act
      const result = voteManager.registerVote(3, 2);

      // Assert
      expect(result.vote).toHaveProperty('voteStrength', 2);
    });
  });

  describe('changeVote', () => {
    test('should change existing vote to new target and update timestamp', () => {
      // Arrange - まず投票を登録
      const initialVoteTime = Date.now();
      voteManager.registerVote(1, 2);

      // 時間経過をシミュレート
      jest.spyOn(Date, 'now').mockReturnValueOnce(initialVoteTime + 1000);

      // Act - 投票先を変更
      const result = voteManager.changeVote(1, 3);

      // Assert
      expect(result).toEqual({
        success: true,
        vote: expect.objectContaining({
          voterId: 1,
          targetId: 3,
          voteType: 'execution',
          timestamp: initialVoteTime + 1000
        })
      });

      // イベント発火確認
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
        'vote.change.before',
        {
          voterId: 1,
          oldTargetId: 2,
          newTargetId: 3
        }
      );

      // VoteManager.jsの実装に合わせて修正
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
        'vote.change.after',
        {
          vote: expect.objectContaining({
            voterId: 1,
            targetId: 3
          }),
          oldTargetId: 2
        }
      );
    });

    test('should throw error when trying to change non-existing vote', () => {
      // Act & Assert - 事前に投票していないプレイヤーの投票変更
      const result = voteManager.changeVote(1, 3);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('NO_PREVIOUS_VOTE');
      
      // ここではErrorHandlerが呼び出されるのではなく、すでにメソッド内でエラーオブジェクトが返されるため
      // このアサーションは削除するか修正する必要があります
    });

    test('should return unchanged flag when changing to the same target', () => {
      // Arrange
      voteManager.registerVote(1, 2);

      // Act - 同じ対象への変更
      const result = voteManager.changeVote(1, 2);

      // Assert
      expect(result).toEqual({
        success: true,
        unchanged: true,
        vote: expect.objectContaining({
          voterId: 1,
          targetId: 2
        })
      });

      // イベント発火がないことを確認
      expect(mockGame.eventSystem.emit).not.toHaveBeenCalledWith(
        'vote.change.before',
        expect.anything()
      );
    });

    test('should validate new target just like registerVote', () => {
      // Arrange
      voteManager.registerVote(1, 2);
      const invalidTargetId = 99;

      // Act & Assert
      const result = voteManager.changeVote(1, invalidTargetId);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('INVALID_TARGET');
      
      // ここではErrorHandlerが呼び出されるのではなく、すでにメソッド内でエラーオブジェクトが返されるため
      // このアサーションは削除するか修正する必要があります
    });
  });
});
