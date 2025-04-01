import Seer from '../src/Seer';

describe('Seer クラスのテスト', () => {
  let seer;
  let mockPlayer1, mockPlayer2;

  beforeEach(() => {
    seer = new Seer();
    mockPlayer1 = { role: { team: 'Village' } };
    mockPlayer2 = { role: { team: 'Werewolf' } };
  });

  test('占い師のインスタンスが正しく作成される', () => {
    expect(seer.name).toBe('占い師');
    expect(seer.team).toBe('Village');
  });

  test('占い師が村人を占う', () => {
    expect(seer.divine(mockPlayer1)).toBe('村人陣営');
  });

  test('占い師が人狼を占う', () => {
    expect(seer.divine(mockPlayer2)).toBe('人狼陣営');
  });
});
