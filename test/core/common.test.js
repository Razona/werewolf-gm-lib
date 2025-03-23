/**
 * @file test/core/common.test.js
 * @description Common モジュールの単体テスト
 */

import Common, {
  TEAM,
  PHASE,
  ACTION_TYPE,
  VOTE_TYPE,
  DEATH_CAUSE,
  generateId,
  shuffle,
  deepCopy,
  getTimestamp,
  createRandomGenerator,
  mergeObjects
} from '../../src/core/common';

describe('Common モジュール', () => {
  describe('定数', () => {
    test('TEAM が正しく定義されている', () => {
      expect(TEAM).toHaveProperty('VILLAGE');
      expect(TEAM).toHaveProperty('WEREWOLF');
      expect(TEAM).toHaveProperty('FOX');
      expect(TEAM).toHaveProperty('NEUTRAL');
    });

    test('PHASE が正しく定義されている', () => {
      expect(PHASE).toHaveProperty('PREPARATION');
      expect(PHASE).toHaveProperty('FIRST_NIGHT');
      expect(PHASE).toHaveProperty('NIGHT');
      expect(PHASE).toHaveProperty('DAY');
      expect(PHASE).toHaveProperty('VOTE');
      expect(PHASE).toHaveProperty('EXECUTION');
      expect(PHASE).toHaveProperty('GAME_END');
    });

    test('ACTION_TYPE が正しく定義されている', () => {
      expect(ACTION_TYPE).toHaveProperty('FORTUNE');
      expect(ACTION_TYPE).toHaveProperty('GUARD');
      expect(ACTION_TYPE).toHaveProperty('ATTACK');
      expect(ACTION_TYPE).toHaveProperty('MEDIUM');
    });

    test('VOTE_TYPE が正しく定義されている', () => {
      expect(VOTE_TYPE).toHaveProperty('EXECUTION');
      expect(VOTE_TYPE).toHaveProperty('RUNOFF');
      expect(VOTE_TYPE).toHaveProperty('CUSTOM');
    });

    test('DEATH_CAUSE が正しく定義されている', () => {
      expect(DEATH_CAUSE).toHaveProperty('EXECUTION');
      expect(DEATH_CAUSE).toHaveProperty('WEREWOLF');
      expect(DEATH_CAUSE).toHaveProperty('CURSE');
      expect(DEATH_CAUSE).toHaveProperty('FOLLOW');
      expect(DEATH_CAUSE).toHaveProperty('OTHER');
    });
  });

  describe('generateId()', () => {
    test('ユニークなIDを生成する', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toEqual(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(5);
    });
  });

  describe('shuffle()', () => {
    test('配列をシャッフルする', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle([...original]);
      
      // 要素数が変わっていないことを確認
      expect(shuffled.length).toBe(original.length);
      
      // すべての要素が含まれていることを確認
      original.forEach(item => {
        expect(shuffled).toContain(item);
      });
      
      // シャッフルされていることを確認（このテストは時々失敗する可能性あり）
      // 配列が短い場合、シャッフル後も同じ順序になる可能性があるため
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      const largeShuffled = shuffle([...largeArray]);
      expect(largeShuffled).not.toEqual(largeArray);
    });

    test('乱数生成関数を使ってシャッフルする', () => {
      const original = [1, 2, 3, 4, 5];
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.1);
      
      shuffle([...original], mockRandom);
      expect(mockRandom).toHaveBeenCalled();
    });
  });

  describe('deepCopy()', () => {
    test('プリミティブ値をコピーする', () => {
      expect(deepCopy(42)).toBe(42);
      expect(deepCopy('test')).toBe('test');
      expect(deepCopy(null)).toBe(null);
      expect(deepCopy(undefined)).toBe(undefined);
      expect(deepCopy(true)).toBe(true);
    });

    test('シンプルなオブジェクトをコピーする', () => {
      const original = { a: 1, b: 'test' };
      const copy = deepCopy(original);
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
    });

    test('ネストしたオブジェクトをコピーする', () => {
      const original = { 
        a: 1, 
        b: { 
          c: 'test', 
          d: [1, 2, { e: 3 }] 
        } 
      };
      const copy = deepCopy(original);
      
      expect(copy).toEqual(original);
      expect(copy.b).not.toBe(original.b);
      expect(copy.b.d).not.toBe(original.b.d);
    });

    test('配列をコピーする', () => {
      const original = [1, 2, [3, 4, { a: 5 }]];
      const copy = deepCopy(original);
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy[2]).not.toBe(original[2]);
    });
  });

  describe('getTimestamp()', () => {
    test('タイムスタンプを返す', () => {
      const timestamp = getTimestamp();
      expect(typeof timestamp).toBe('number');
      
      // 現在時刻との差が小さいことを確認
      const now = Date.now();
      expect(Math.abs(timestamp - now)).toBeLessThan(100);
    });
  });

  describe('createRandomGenerator()', () => {
    test('同じシードで同じ乱数列を生成する', () => {
      const random1 = createRandomGenerator(12345);
      const random2 = createRandomGenerator(12345);
      
      expect(random1()).toEqual(random2());
      expect(random1()).toEqual(random2());
      expect(random1()).toEqual(random2());
    });

    test('生成した乱数が0以上1未満', () => {
      const random = createRandomGenerator();
      
      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('mergeObjects()', () => {
    test('基本的なオブジェクトのマージ', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      
      const result = mergeObjects(target, source);
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('ネストされたオブジェクトの浅いマージ', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { c: 4, e: 5 }, f: 6 };
      
      const result = mergeObjects(target, source);
      expect(result).toEqual({ a: 1, b: { c: 4, e: 5 }, f: 6 });
    });

    test('ネストされたオブジェクトの深いマージ', () => {
      const target = { a: 1, b: { c: 2, d: 3 } };
      const source = { b: { c: 4, e: 5 }, f: 6 };
      
      const result = mergeObjects(target, source, true);
      expect(result).toEqual({ a: 1, b: { c: 4, d: 3, e: 5 }, f: 6 });
    });

    test('sourceがnullの場合はtargetを返す', () => {
      const target = { a: 1, b: 2 };
      
      const result = mergeObjects(target, null);
      expect(result).toEqual(target);
    });
  });
});
