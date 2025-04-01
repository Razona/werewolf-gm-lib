import Village from '../src/Village';

describe('Village クラスのテスト', () => {
  let village;

  beforeEach(() => {
    village = new Village();
  });

  test('村人のインスタンスが正しく作成される', () => {
    expect(village.name).toBe('村人');
    expect(village.team).toBe('Village');
  });

  test('村人の能力が空であることを確認', () => {
    expect(village.ability()).toBeUndefined();
  });
});
