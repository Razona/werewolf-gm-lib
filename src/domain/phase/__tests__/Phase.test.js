/**
 * Phase クラスのテスト
 * 
 * 人狼ゲームのフェーズを表現する Phase クラスのテスト
 */

import Phase from '../Phase';

// モック
jest.mock('../../../core/event/EventSystem');

describe('Phase クラス', () => {
  // テスト前に実行する共通処理
  beforeEach(() => {
    // Date.now のモック化
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);
    
    // EventSystem のモック化は jest.mock でインポート時に行う
  });

  // テスト後に実行する共通処理
  afterEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('インスタンス生成', () => {
    test('必須パラメータのみで正常に生成できる', () => {
      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        allowedActions: ['fortune', 'guard', 'attack']
      });

      expect(phase).toBeInstanceOf(Phase);
      expect(phase.id).toBe('night');
      expect(phase.displayName).toBe('夜フェーズ');
      expect(phase.allowedActions).toEqual(['fortune', 'guard', 'attack']);
    });

    test('全パラメータを指定して正常に生成できる', () => {
      const visibilityPolicy = {
        showDeadPlayers: true,
        showRoles: false,
        showVotes: false
      };
      const metadata = { custom: 'data' };

      const phase = new Phase({
        id: 'night',
        displayName: '夜フェーズ',
        description: '役職能力を使用します',
        allowedActions: ['fortune', 'guard', 'attack'],
        requiredActions: ['fortune'],
        timeLimit: 60,
        visibilityPolicy,
        metadata
      });

      expect(phase).toBeInstanceOf(Phase);
      expect(phase.id).toBe('night');
      expect(phase.displayName).toBe('夜フェーズ');
      expect(phase.description).toBe('役職能力を使用します');
      expect(phase.allowedActions).toEqual(['fortune', 'guard', 'attack']);
      expect(phase.requiredActions).toEqual(['fortune']);
      expect(phase.timeLimit).toBe(60);
      expect(phase.visibilityPolicy).toEqual(visibilityPolicy);
      expect(phase.metadata).toEqual(metadata);
    });

    test('IDがない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          displayName: '夜フェーズ',
          allowedActions: ['fortune', 'guard', 'attack']
        });
      }).toThrow('フェーズIDは必須です');
    });

    test('displayNameがない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          id: 'night',
          allowedActions: ['fortune', 'guard', 'attack']
        });
      }).toThrow('フェーズ表示名は必須です');
    });

    test('allowedActionsがない場合はエラーになる', () => {
      expect(() => {
        new Phase({
          id: 'night',
          displayName: '夜フェーズ'
        });
      }).toThrow('許可アクションリストは必須です');
    });
  });
