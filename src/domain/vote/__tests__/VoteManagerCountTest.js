// src/domain/vote/__tests__/VoteManagerCountTest.js 修正案
import VoteManager from '../VoteManager.js';
import { createMocks } from './VoteManagerMocks';

describe('VoteManager C. 投票集計機能', () => {
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

  describe('countVotes', () => {
    test('should count votes correctly with precise vote counts', () => {
      // Arrange - 複数の投票
      voteManager.registerVote(1, 3); // Player1 -> Player3
      voteManager.registerVote(2, 3); // Player2 -> Player3

      // Act
      const result = voteManager.countVotes();

      // Assert
      expect(result).toEqual({
        type: 'execution',
        turn: 2,
        votes: expect.any(Array),
        counts: { '3': 2 }, // Player3が2票獲得
        maxVoted: [3],
        isTie: false,
        needsRunoff: false
      });

      // イベント発火確認
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith(
        'vote.count.after',
        {
          type: 'execution',
          turn: 2,
          votes: expect.any(Array),
          counts: { '3': 2 },
          maxVoted: [3],
          isTie: false,
          needsRunoff: false
        }
      );
    });

    test('should consider vote strength (mayor votes worth 2)', () => {
      // Arrange
      voteManager.registerVote(1, 2); // Player1 -> Player2 (1票)
      voteManager.registerVote(2, 3); // Player2 -> Player3 (1票)
      voteManager.registerVote(3, 2); // Player3(村長) -> Player2 (2票)

      // Act
      const result = voteManager.countVotes();

      // Assert
      expect(result.counts).toEqual({
        '2': 3, // Player2が3票獲得 (1票 + 村長2票)
        '3': 1  // Player3が1票獲得
      });
      expect(result.maxVoted).toEqual([2]);
      // maxCountはもう存在しない (VoteCounterの内部実装が変更された)
      // expect(result.maxCount).toBe(3);
      expect(result.isTie).toBe(false);
    });

    test('should detect tied votes correctly and set needsRunoff flag based on regulation', () => {
      // Arrange - 同数投票
      voteManager.registerVote(1, 2); // Player1 -> Player2
      voteManager.registerVote(2, 3); // Player2 -> Player3

      // Act
      const result = voteManager.countVotes();

      // Assert
      expect(result.counts).toEqual({
        '2': 1,
        '3': 1
      });
      expect(result.maxVoted).toEqual([2, 3]);
      expect(result.isTie).toBe(true);
      // runoff設定なので決選投票が必要
      expect(result.needsRunoff).toBe(true);
    });

    test('should respect executionRule in regulations for tie handling', () => {
      // Arrange
      voteManager.registerVote(1, 2);
      voteManager.registerVote(2, 3);
      // レギュレーション変更: 同数なら処刑なし
      mockGame.options.regulations.executionRule = 'no_execution';

      // Act
      const result = voteManager.countVotes();

      // Assert
      expect(result.isTie).toBe(true);
      // 処刑なし設定なので決選投票は不要
      expect(result.needsRunoff).toBe(false);
    });

    test('should handle no votes case gracefully', () => {
      // Act - 投票なしの状態で集計
      const result = voteManager.countVotes();

      // Assert
      expect(result).toEqual({
        type: 'execution',
        turn: 2,
        votes: [],
        counts: {},
        maxVoted: [],
        isTie: false,
        needsRunoff: false
      });
    });

    test('should handle extreme case: all votes to a single player', () => {
      // Arrange - 全員が同じプレイヤーに投票
      voteManager.registerVote(1, 3); // 通常プレイヤー -> 1票
      voteManager.registerVote(2, 3); // 通常プレイヤー -> 1票
      voteManager.registerVote(3, 3); // 村長 -> 2票

      // デバッグ出力
      console.log('\n--- 投票状況確認 (修正版) ---');
      const votes = voteManager.getCurrentVotes();
      votes.forEach(vote => {
        console.log(`Voter: ${vote.getVoter()}, Target: ${vote.getTarget()}, Type: ${vote.getType()}, Strength: ${vote.getStrength()}`);
        console.log('Vote JSON:', JSON.stringify(vote.toJSON(), null, 2));
      });
      console.log('------------------------\n');

      // Act
      const result = voteManager.countVotes();

      // 結果出力
      console.log('\n--- 集計結果 (修正版) ---');
      console.log('Counts:', result.counts);
      console.log('maxVoted:', result.maxVoted);
      console.log('isTie:', result.isTie);
      console.log('投票数:', votes.length);
      console.log('------------------------\n');

      // Assert
      // 村長の票は2票分として実装されているので、計4票になります
      expect(result.counts).toEqual({ '3': 4 }); // 計4票（通常票2 + 村長2票）
      expect(result.maxVoted).toEqual([3]);
      expect(result.isTie).toBe(false);
    });
  });
});