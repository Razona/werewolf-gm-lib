/**
 * @file test/core/event/EventSystem.test.js
 * @description EventSystem の単体テスト
 */

import { EventSystem } from '../../../src/core/event/EventSystem';

describe('EventSystem', () => {
  let eventSystem;
  
  beforeEach(() => {
    eventSystem = new EventSystem();
  });
  
  describe('基本的なイベント処理', () => {
    test('イベントを登録して発火する', () => {
      const mockCallback = jest.fn();
      eventSystem.on('test', mockCallback);
      
      eventSystem.emit('test', { value: 123 });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ value: 123 });
    });
    
    test('同じイベントに複数のリスナーを登録する', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventSystem.on('test', mockCallback1);
      eventSystem.on('test', mockCallback2);
      
      eventSystem.emit('test', { value: 123 });
      
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
    
    test('登録されていないイベントを発火しても例外は発生しない', () => {
      expect(() => {
        eventSystem.emit('nonexistent', { value: 123 });
      }).not.toThrow();
    });
  });
  
  describe('once()', () => {
    test('once()で登録したイベントは1回だけ実行される', () => {
      const mockCallback = jest.fn();
      eventSystem.once('test', mockCallback);
      
      eventSystem.emit('test', { value: 1 });
      eventSystem.emit('test', { value: 2 });
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ value: 1 });
    });
  });
  
  describe('off()', () => {
    test('特定のリスナーを削除する', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventSystem.on('test', mockCallback1);
      eventSystem.on('test', mockCallback2);
      
      eventSystem.off('test', mockCallback1);
      eventSystem.emit('test', { value: 123 });
      
      expect(mockCallback1).not.toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });
    
    test('イベント名に関連するすべてのリスナーを削除する', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventSystem.on('test', mockCallback1);
      eventSystem.on('test', mockCallback2);
      
      eventSystem.off('test');
      eventSystem.emit('test', { value: 123 });
      
      expect(mockCallback1).not.toHaveBeenCalled();
      expect(mockCallback2).not.toHaveBeenCalled();
    });
    
    test('存在しないイベントからリスナーを削除しても例外は発生しない', () => {
      const mockCallback = jest.fn();
      
      expect(() => {
        eventSystem.off('nonexistent', mockCallback);
      }).not.toThrow();
    });
  });
  
  describe('onAny() と ワイルドカードリスナー', () => {
    test('onAny()はすべてのイベントに反応する', () => {
      const mockCallback = jest.fn();
      eventSystem.onAny(mockCallback);
      
      eventSystem.emit('event1', { value: 1 });
      eventSystem.emit('event2', { value: 2 });
      
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, 'event1', { value: 1 });
      expect(mockCallback).toHaveBeenNthCalledWith(2, 'event2', { value: 2 });
    });
    
    test('ワイルドカードリスナーを削除する', () => {
      const mockCallback = jest.fn();
      eventSystem.on('*', mockCallback);
      
      eventSystem.off('*', mockCallback);
      eventSystem.emit('event', { value: 123 });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
    
    test('すべてのワイルドカードリスナーを削除する', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      eventSystem.on('*', mockCallback1);
      eventSystem.on('*', mockCallback2);
      
      eventSystem.off('*');
      eventSystem.emit('event', { value: 123 });
      
      expect(mockCallback1).not.toHaveBeenCalled();
      expect(mockCallback2).not.toHaveBeenCalled();
    });
  });
  
  describe('履歴機能', () => {
    test('イベント履歴を記録する', () => {
      eventSystem.emit('event1', { value: 1 });
      eventSystem.emit('event2', { value: 2 });
      
      const history = eventSystem.getHistory();
      
      expect(history.length).toBe(2);
      expect(history[0].event).toBe('event1');
      expect(history[0].data).toEqual({ value: 1 });
      expect(history[1].event).toBe('event2');
      expect(history[1].data).toEqual({ value: 2 });
    });
    
    test('特定のイベント履歴のみを取得する', () => {
      eventSystem.emit('event1', { value: 1 });
      eventSystem.emit('event2', { value: 2 });
      eventSystem.emit('event1', { value: 3 });
      
      const history = eventSystem.getHistory('event1');
      
      expect(history.length).toBe(2);
      expect(history[0].data).toEqual({ value: 1 });
      expect(history[1].data).toEqual({ value: 3 });
    });
    
    test('履歴サイズを制限する', () => {
      const limitedEventSystem = new EventSystem({ maxHistorySize: 2 });
      
      limitedEventSystem.emit('event1', { value: 1 });
      limitedEventSystem.emit('event2', { value: 2 });
      limitedEventSystem.emit('event3', { value: 3 });
      
      const history = limitedEventSystem.getHistory();
      
      expect(history.length).toBe(2);
      expect(history[0].event).toBe('event2');
      expect(history[1].event).toBe('event3');
    });
    
    test('履歴をクリアする', () => {
      eventSystem.emit('event1', { value: 1 });
      eventSystem.emit('event2', { value: 2 });
      
      eventSystem.clearHistory();
      const history = eventSystem.getHistory();
      
      expect(history.length).toBe(0);
    });
  });
  
  describe('リスナー管理機能', () => {
    test('リスナー数を取得する', () => {
      const callback1 = () => {};
      const callback2 = () => {};
      const callback3 = () => {};
      
      eventSystem.on('event1', callback1);
      eventSystem.on('event1', callback2);
      eventSystem.on('event2', callback3);
      
      expect(eventSystem.listenerCount('event1')).toBe(2);
      expect(eventSystem.listenerCount('event2')).toBe(1);
      expect(eventSystem.listenerCount('nonexistent')).toBe(0);
      expect(eventSystem.listenerCount()).toBe(3);
    });
    
    test('ワイルドカードリスナー数を取得する', () => {
      const callback1 = () => {};
      const callback2 = () => {};
      
      eventSystem.on('*', callback1);
      eventSystem.on('*', callback2);
      
      expect(eventSystem.listenerCount('*')).toBe(2);
      expect(eventSystem.listenerCount()).toBe(2);
    });
    
    test('登録されているイベント名を取得する', () => {
      eventSystem.on('event1', () => {});
      eventSystem.on('event2', () => {});
      eventSystem.on('event3', () => {});
      
      const eventNames = eventSystem.eventNames();
      
      expect(eventNames).toHaveLength(3);
      expect(eventNames).toContain('event1');
      expect(eventNames).toContain('event2');
      expect(eventNames).toContain('event3');
    });
  });
  
  describe('エラー処理', () => {
    test('リスナー内でエラーが発生しても他のリスナーは実行される', () => {
      console.error = jest.fn(); // エラーログをモック化
      
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('リスナー内でエラー');
      });
      
      const successCallback = jest.fn();
      
      eventSystem.on('test', errorCallback);
      eventSystem.on('test', successCallback);
      
      eventSystem.emit('test', { value: 123 });
      
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(successCallback).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalled();
    });
    
    test('コールバックが関数でない場合はエラーを投げる', () => {
      expect(() => {
        eventSystem.on('test', 'not a function');
      }).toThrow();
      
      expect(() => {
        eventSystem.once('test', 123);
      }).toThrow();
    });
  });
});
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, 'event1', { value: 1 });
      expect(mockCallback).toHaveBeenNthCalledWith(2, 'event2', { value: 2 });
    });
    
    test('on("*")はすべてのイベントに反応する', () => {
      const mockCallback = jest.fn();
      eventSystem.on('*', mockCallback);
      
      eventSystem.emit('event1', { value: 1 });
      eventSystem.emit('event2', { value: 2 });
      