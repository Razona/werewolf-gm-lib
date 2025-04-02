/**
 * EventSystem モックファイル
 */

// Jestのモック関数を作成
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockOnce = jest.fn();

class EventSystem {
  constructor() {
    this.emit = mockEmit;
    this.on = mockOn;
    this.off = mockOff;
    this.once = mockOnce;
  }
}

// モック関数をエクスポート（テストから直接アクセスできるように）
EventSystem.mockEmit = mockEmit;
EventSystem.mockOn = mockOn;
EventSystem.mockOff = mockOff;
EventSystem.mockOnce = mockOnce;

export default EventSystem;
