import { VERSION, createGame } from '../src/index';

describe('Library initialization', () => {
  test('VERSION should be defined', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });

  test('createGame should return an object', () => {
    const game = createGame();
    expect(game).toBeDefined();
    expect(typeof game).toBe('object');
  });
});