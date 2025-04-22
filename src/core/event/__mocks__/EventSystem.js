/**
 * EventSystem モック
 */

// EventSystem クラスのモック
const EventSystem = jest.fn().mockImplementation((options = {}) => {
  return {
    options,
    listeners: new Map(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    emit: jest.fn().mockReturnValue(true),
    hasListeners: jest.fn().mockReturnValue(true),
    listenerCount: jest.fn().mockReturnValue(0),
    eventNames: jest.fn().mockReturnValue([]),
    getEventHistory: jest.fn().mockReturnValue([]),
    removeAllListeners: jest.fn().mockReturnThis()
  };
});

module.exports = { EventSystem };
