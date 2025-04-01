import Role from '../src/Role';  // 役職の基底クラス
import { jest } from '@jest/globals';

describe('Role クラスの基本テスト', () => {
  let role;

  beforeEach(() => {
    role = new Role('村人', 'Village');
  });

  test('インスタンスが正しく作成される', () => {
    expect(role.name).toBe('村人');
    expect(role.team).toBe('Village');
  });

  test('プレイヤーに役職を割り当てる', () => {
    const mockPlayer = { role: null };
    role.assignToPlayer(mockPlayer);
    expect(mockPlayer.role).toBe(role);
  });

  test('役職情報を取得できる', () => {
    expect(role.getRoleInfo()).toEqual({
      name: '村人',
      team: 'Village',
    });
  });

  test('勝利条件を取得できる (仮の実装)', () => {
    expect(role.getWinCondition()).toBe('ゲーム終了時に村人陣営が生存していること');
  });
});
