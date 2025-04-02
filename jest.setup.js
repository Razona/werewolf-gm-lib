// jest.setup.js
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
        message: () => `expected ${received.name} to be alive`,
        pass: false
      };
    }
  }
});