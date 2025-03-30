// カスタムマッチャーの追加
expect.extend({
  toBeAlivePlayer(received) {
    const pass = received && received.isAlive === true;
    if (pass) {
      return {
        message: () => `expected ${received.name} not to be alive`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received ? received.name : 'player'} to be alive`,
        pass: false
      };
    }
  }
});

// グローバルタイムアウト設定
jest.setTimeout(10000); // 10秒