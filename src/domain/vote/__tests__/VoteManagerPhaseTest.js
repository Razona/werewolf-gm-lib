// src/domain/vote/__tests__/VoteManagerPhaseTest.js
import VoteManager from '../VoteManager.js';
import { createMocks } from './VoteManagerMocks';

describe('VoteManager A. 投票フェーズ管理', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startVoting', () => {
    test('should initialize voting phase correctly with all required data', () => {
      // Act
      const result = voteManager.startVoting('execution');

      // Assert
      expect(result).toEqual(expect.objectContaining({
        type: 'execution',
        voters: 3,
        targets: 3
      }));

      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('vote.start', expect.objectContaining({
        type: 'execution',
        turn: 2,
        voters: [1, 2, 3],
        targets: [1, 2, 3]
      }));
    });

    test('should throw error with specific code when no alive players exist', () => {
      // Arrange
      mockPlayerManager.getAlivePlayers.mockReturnValueOnce([]);

      // Act & Assert
      expect(() => voteManager.startVoting('execution')).toThrow();
      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'VOTE',
        'NO_VOTERS',
        {
          message: '投票可能なプレイヤーがいません',
          turn: expect.any(Number)
        }
      );
    });

    test('should throw error when called during invalid phase (night phase)', () => {
      // Arrange
      mockPhaseManager.getCurrentPhase.mockReturnValueOnce('night');

      // Act & Assert
      expect(() => voteManager.startVoting('execution')).toThrow();
      expect(mockErrorHandler.createError).toHaveBeenCalledWith(
        'VOTE',
        'INVALID_PHASE',
        {
          message: expect.stringContaining('投票できません'),
          phase: 'night',
          requiredPhase: expect.any(Array)
        }
      );
    });

    test('should handle custom voter and target lists', () => {
      // Arrange
      const customVoters = [{ id: 1, name: 'Player1' }];
      const customTargets = [{ id: 2, name: 'Player2' }];

      // Act
      voteManager.startVoting('execution', customVoters, customTargets);

      // Assert
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('vote.start', expect.objectContaining({
        type: 'execution',
        turn: 2,
        voters: [1],
        targets: [2]
      }));
    });
  });

  test('should initialize runoff voting with limited candidate list', () => {
    // Arrange
    const candidates = [2, 3];

    // Act
    const result = voteManager.startRunoffVote(candidates);

    // Assert
    expect(result).toEqual({
      type: 'runoff',
      voters: 3,
      candidates: 2
    });

    // イベント発火確認
    expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('vote.runoff.start', {
      turn: 2,
      voters: [1, 2, 3],
      candidates: [2, 3]
    });
  });
});
