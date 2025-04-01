import Werewolf from '../src/Werewolf';

describe('Werewolf クラスのテスト', () => {
  let werewolf;
  let mockPlayer;

  beforeEach(() => {
    werewolf = new Werewolf();
    mockPlayer = { isAlive: true };
  });

  test('人狼のインスタンスが正しく作成される', () => {
    expect(werewolf.name).toBe('人狼');
    expect(werewolf.team).toBe('Werewolf');
  });

  test('人狼がプレイヤーを襲撃できる', () => {
    werewolf.attack(mockPlayer);
    expect(mockPlayer.isAlive).toBe(false);
  });
});
