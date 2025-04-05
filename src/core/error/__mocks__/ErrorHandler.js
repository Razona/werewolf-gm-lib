/**
 * ErrorHandler モックファイル
 */

// Jestのモック関数を作成
const mockCreateError = jest.fn((code, message) => new Error(`${code}: ${message}`));
const mockHandleError = jest.fn();

// モック関数を持つクラス
class ErrorHandler {
  constructor() {
    this.createError = mockCreateError;
    this.handleError = mockHandleError;
  }
}

// テストで参照できるように、モック関数を静的プロパティとして追加
ErrorHandler.mockCreateError = mockCreateError;
ErrorHandler.mockHandleError = mockHandleError;

// モックの実装をjest.mock()で直接設定するための関数
const mockImplementation = jest.fn(() => {
  return {
    createError: mockCreateError,
    handleError: mockHandleError
  };
});

// mockImplementation関数を静的メソッドとして追加
ErrorHandler.mockImplementation = mockImplementation;

// ES6形式のexport
export { ErrorHandler };
