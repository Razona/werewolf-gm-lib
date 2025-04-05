/**
 * EventSystem モックファイル
 */

// Jestのモック関数を作成
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockOnce = jest.fn();

// モック関数を持つクラス
class EventSystem {
  constructor() {
    this.emit = mockEmit;
    this.on = mockOn;
    this.off = mockOff;
    this.once = mockOnce;
  }
}

// テストで参照できるように、モック関数を静的プロパティとして追加
EventSystem.mockEmit = mockEmit;
EventSystem.mockOn = mockOn;
EventSystem.mockOff = mockOff;
EventSystem.mockOnce = mockOnce;

// モックの実装をjest.mock()で直接設定するための関数
const mockImplementation = jest.fn(() => {
  return {
    emit: mockEmit,
    on: mockOn,
    off: mockOff,
    once: mockOnce
  };
});

// mockImplementation関数を静的メソッドとして追加
EventSystem.mockImplementation = mockImplementation;

// ES6形式のexport
export { EventSystem };
