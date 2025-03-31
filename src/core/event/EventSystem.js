/**
 * EventSystem - Core event management module for the werewolf game GM support library
 *
 * This module provides the foundation for the event-driven architecture,
 * enabling communication between different modules through events.
 */

class EventSystem {
  /**
   * Creates a new EventSystem instance
   * @param {Object} options - Configuration options
   * @param {boolean} [options.enableNamespaces=true] - Enable hierarchical event namespaces
   * @param {boolean} [options.debugMode=false] - Enable debug mode with event history
   * @param {boolean} [options.enableWildcards=false] - Enable wildcard event matching
   * @param {number} [options.historyLimit=100] - Maximum number of events to keep in history
   * @param {boolean} [options.shareOnceListeners=false] - Whether once listeners should be shared across event names
   */
  constructor(options = {}) {
    // Default options
    this.options = {
      enableNamespaces: true,
      debugMode: false,
      enableWildcards: false, 
      historyLimit: 100,
      shareOnceListeners: false,
      ...options
    };

    // Map to store event listeners: { eventName => [{ callback, once, priority }] }
    this.listeners = new Map();

    // Map to track original callbacks to event names for shared once listeners
    this._sharedOnceCallbacks = new Map();

    // Event history for debugging (only active in debug mode)
    this.eventHistory = [];

    // Flag to track if we're currently emitting an event (to handle nested emissions)
    this._emitting = false;

    // Queue for listeners to be added/removed during emission
    this._pendingAdditions = [];
    this._pendingRemovals = [];
    
    // Current event being processed (for once listeners)
    this._currentEventName = null;
  }

  /**
   * Register an event listener
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when the event is emitted
   * @param {number} [priority=0] - Priority of the listener (higher executes first)
   * @return {EventSystem} - Returns this instance for chaining
   * @throws {Error} If eventName is not a string or callback is not a function
   */
  on(eventName, callback, priority = 0) {
    // Validate arguments
    if (typeof eventName !== 'string' || eventName.trim() === '') {
      throw new Error('Event name must be a non-empty string');
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    // If we're currently emitting, queue the addition
    if (this._emitting) {
      this._pendingAdditions.push({ eventName, callback, priority, once: false });
      return this;
    }

    // Get or create the listeners array for this event
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const listeners = this.listeners.get(eventName);

    // Check for duplicate listener
    const existingIndex = listeners.findIndex(listener => listener.callback === callback);
    if (existingIndex !== -1) {
      // Update the existing listener's priority
      listeners[existingIndex].priority = priority;
    } else {
      // Add the new listener
      listeners.push({ callback, once: false, priority });

      // Sort listeners by priority (highest first)
      listeners.sort((a, b) => b.priority - a.priority);
    }

    return this;
  }

  /**
   * Register a one-time event listener that will be removed after execution
   * @param {string} eventName - Name of the event to listen for
   * @param {Function} callback - Function to call when the event is emitted
   * @param {number} [priority=0] - Priority of the listener (higher executes first)
   * @return {EventSystem} - Returns this instance for chaining
   * @throws {Error} If eventName is not a string or callback is not a function
   */
  once(eventName, callback, priority = 0) {
    // Validate arguments
    if (typeof eventName !== 'string' || eventName.trim() === '') {
      throw new Error('Event name must be a non-empty string');
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    // Handle shared once listeners (common between events)
    if (this.options.shareOnceListeners) {
      // Track which events this callback is registered for
      if (!this._sharedOnceCallbacks.has(callback)) {
        this._sharedOnceCallbacks.set(callback, new Set([eventName]));
      } else {
        this._sharedOnceCallbacks.get(callback).add(eventName);
      }
    }

    // Create wrapped callback function
    const wrappedCallback = (...args) => {
      // First remove the listener to prevent recursion
      this.off(eventName, wrappedCallback);
      
      // If using shared once listeners, remove all instances of this callback
      if (this.options.shareOnceListeners && this._sharedOnceCallbacks.has(callback)) {
        const events = this._sharedOnceCallbacks.get(callback);
        for (const event of events) {
          if (event !== eventName) { // Already removed from current event
            this.off(event, wrappedCallback);
          }
        }
        // Clear tracking
        this._sharedOnceCallbacks.delete(callback);
      }
      
      // Now call the original callback
      return callback.apply(this, args);
    };
    
    // Store a reference to the original callback
    wrappedCallback._originalCallback = callback;

    // If we're currently emitting, queue the addition
    if (this._emitting) {
      this._pendingAdditions.push({ eventName, callback: wrappedCallback, priority, once: true });
      return this;
    }

    // Get or create the listeners array for this event
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const listeners = this.listeners.get(eventName);

    // Add the once listener with the wrapped callback
    listeners.push({ callback: wrappedCallback, once: true, priority });

    // Sort listeners by priority (highest first)
    listeners.sort((a, b) => b.priority - a.priority);

    return this;
  }

  /**
   * Remove an event listener
   * @param {string} eventName - Name of the event to remove listener from
   * @param {Function} [callback] - Specific callback to remove (if omitted, all listeners for the event are removed)
   * @return {EventSystem} - Returns this instance for chaining
   */
  off(eventName, callback = null) {
    // If we're currently emitting, queue the removal
    if (this._emitting) {
      this._pendingRemovals.push({ eventName, callback });
      return this;
    }

    // If eventName doesn't exist, nothing to do
    if (!this.listeners.has(eventName)) {
      return this;
    }

    // If callback is null, remove all listeners for this event
    if (callback === null) {
      // Handle shared once listeners
      if (this.options.shareOnceListeners) {
        const listeners = this.listeners.get(eventName);
        for (const listener of listeners) {
          if (listener.once && listener.callback._originalCallback) {
            const originalCallback = listener.callback._originalCallback;
            if (this._sharedOnceCallbacks.has(originalCallback)) {
              const events = this._sharedOnceCallbacks.get(originalCallback);
              events.delete(eventName);
              if (events.size === 0) {
                this._sharedOnceCallbacks.delete(originalCallback);
              }
            }
          }
        }
      }
      
      this.listeners.delete(eventName);
      return this;
    }

    // Otherwise, only remove the specific callback
    const listeners = this.listeners.get(eventName);
    
    // Check if we're looking for a wrapped callback (once listener)
    let originalCallback = null;
    const isWrappedCallback = callback._originalCallback !== undefined;
    if (isWrappedCallback) {
      originalCallback = callback._originalCallback;
    }
    
    // Filter out the callback or its wrapper
    const filteredListeners = listeners.filter(listener => {
      // Direct match
      if (listener.callback === callback) {
        return false;
      }
      
      // Match based on original callback for once listeners
      if (isWrappedCallback && listener.once && 
          listener.callback._originalCallback === originalCallback) {
        return false;
      }
      
      // If the callback is an original one, check wrapped callbacks
      if (listener.once && listener.callback._originalCallback === callback) {
        return false;
      }
      
      return true;
    });

    if (filteredListeners.length === 0) {
      // If no listeners remain, remove the event entirely
      this.listeners.delete(eventName);
    } else {
      // Otherwise, update the listeners array
      this.listeners.set(eventName, filteredListeners);
    }
    
    // Update shared once callback tracking if appropriate
    if (this.options.shareOnceListeners) {
      // Find the original callback
      const target = originalCallback || callback;
      
      if (this._sharedOnceCallbacks.has(target)) {
        const events = this._sharedOnceCallbacks.get(target);
        events.delete(eventName);
        if (events.size === 0) {
          this._sharedOnceCallbacks.delete(target);
        }
      }
    }

    return this;
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} eventName - Name of the event to emit
   * @param {*} [data] - Data to pass to the listeners
   * @return {boolean} - True if the event had listeners, false otherwise
   */
  emit(eventName, data) {
    // Mark that we're emitting an event
    const wasEmitting = this._emitting;
    this._emitting = true;
    
    // Save previous event name
    const previousEventName = this._currentEventName;
    this._currentEventName = eventName;

    // Track whether any listeners were called
    let listenersCalled = false;
    
    // Track callbacks that need to be removed from all events (shareOnceListeners mode)
    const sharedCallbacksToRemove = new Set();

    try {
      // Add to history if debug mode is enabled
      if (this.options.debugMode) {
        this._addToHistory(eventName, data);
      }

      // Get all event names to emit based on the options
      const eventNamesToEmit = this._getEventNamesForEmission(eventName);
      
      // Track listeners to remove after all are executed
      const listenersToRemove = [];

      // Emit to each matched event name
      for (const name of eventNamesToEmit) {
        if (!this.listeners.has(name)) continue;
        
        // Clone the listeners array to avoid issues if modified during iteration
        const listeners = [...this.listeners.get(name)];

        // Call each listener
        for (const listener of listeners) {
          const { callback, once } = listener;
          
          // If using shared once listeners and this callback is marked for removal, skip it
          if (this.options.shareOnceListeners && once && 
              callback._originalCallback && 
              sharedCallbacksToRemove.has(callback._originalCallback)) {
            listenersToRemove.push({ name, callback });
            continue;
          }

          try {
            // Call the listener with the event data
            callback(data);
            listenersCalled = true;

            // If it's a once listener, mark for removal
            if (once) {
              listenersToRemove.push({ name, callback });
              
              // If shared once listeners is enabled, track the original callback
              if (this.options.shareOnceListeners && callback._originalCallback) {
                sharedCallbacksToRemove.add(callback._originalCallback);
              }
            }
          } catch (error) {
            // Log the error but continue with other listeners
            console.error(`Error in event listener for '${name}':`, error);
          }
        }
      }

      // Remove all marked listeners
      for (const { name, callback } of listenersToRemove) {
        if (this.listeners.has(name)) {
          const listeners = this.listeners.get(name);
          const updatedListeners = listeners.filter(l => l.callback !== callback);
          
          if (updatedListeners.length === 0) {
            this.listeners.delete(name);
          } else {
            this.listeners.set(name, updatedListeners);
          }
        }
      }
      
      // If using shared once listeners, remove all instances of callbacks that were executed
      if (this.options.shareOnceListeners && sharedCallbacksToRemove.size > 0) {
        for (const originalCallback of sharedCallbacksToRemove) {
          if (this._sharedOnceCallbacks.has(originalCallback)) {
            const events = this._sharedOnceCallbacks.get(originalCallback);
            for (const eventName of events) {
              if (this.listeners.has(eventName)) {
                const listeners = this.listeners.get(eventName);
                const updated = listeners.filter(listener => 
                  !(listener.once && 
                    listener.callback._originalCallback === originalCallback));
                
                if (updated.length === 0) {
                  this.listeners.delete(eventName);
                } else {
                  this.listeners.set(eventName, updated);
                }
              }
            }
            // Clean up tracking
            this._sharedOnceCallbacks.delete(originalCallback);
          }
        }
      }

      // Process pending additions and removals (if we're not in a nested emit)
      if (!wasEmitting) {
        this._processPendingOperations();
      }

      return listenersCalled;
    } finally {
      // Restore the previous event name
      this._currentEventName = previousEventName;
      
      // Only reset the emitting flag if we're the outermost emit call
      if (!wasEmitting) {
        this._emitting = false;
      }
    }
  }

  /**
   * Check if an event has any listeners
   * @param {string} eventName - Name of the event to check
   * @return {boolean} - True if the event has listeners, false otherwise
   */
  hasListeners(eventName) {
    // Direct match
    if (this.listeners.has(eventName) && this.listeners.get(eventName).length > 0) {
      return true;
    }

    // If wildcards are enabled, check for wildcard matches
    if (this.options.enableWildcards) {
      // 最適化: 最大チェック数を制限
      let checked = 0;
      const maxToCheck = 100;
      
      for (const [name, listeners] of this.listeners.entries()) {
        if (++checked > maxToCheck) break;
        
        if (listeners.length > 0 && name.includes('*') && this._matchesWildcard(name, eventName)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the number of listeners for an event
   * @param {string} eventName - Name of the event to check
   * @return {number} - Number of listeners for the event
   */
  listenerCount(eventName) {
    let count = 0;

    // Direct match
    if (this.listeners.has(eventName)) {
      count += this.listeners.get(eventName).length;
    }

    // If wildcards are enabled, check for wildcard matches
    if (this.options.enableWildcards) {
      // 最適化: 最大チェック数を制限
      let checked = 0;
      const maxToCheck = 100;
      
      for (const [name, listeners] of this.listeners.entries()) {
        if (++checked > maxToCheck) break;
        
        if (name !== eventName && name.includes('*') && this._matchesWildcard(name, eventName)) {
          count += listeners.length;
        }
      }
    }

    return count;
  }

  /**
   * Get all registered event names
   * @return {string[]} - Array of registered event names
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get the recent event history (only available in debug mode)
   * @param {number} [limit=10] - Maximum number of events to return
   * @return {Array} - Array of recent events or empty array if debug mode is disabled
   */
  getEventHistory(limit = 10) {
    if (!this.options.debugMode) {
      return [];
    }

    const actualLimit = Math.min(limit, this.eventHistory.length);
    return this.eventHistory.slice(-actualLimit);
  }

  /**
   * Clear all event listeners
   * @return {EventSystem} - Returns this instance for chaining
   */
  removeAllListeners() {
    this.listeners.clear();
    this._sharedOnceCallbacks.clear();
    return this;
  }

  /**
   * Process pending listener additions and removals
   * @private
   */
  _processPendingOperations() {
    // 最適化: 大量のペンディング操作がある場合のガード
    const maxOperations = 1000;
    
    // Process removals first to avoid issues with additions that would be immediately removed
    const removalsToProcess = Math.min(this._pendingRemovals.length, maxOperations);
    for (let i = 0; i < removalsToProcess; i++) {
      const { eventName, callback } = this._pendingRemovals[i];
      this.off(eventName, callback);
    }
    
    // 処理した分だけ配列から削除
    if (removalsToProcess === this._pendingRemovals.length) {
      this._pendingRemovals = [];
    } else {
      this._pendingRemovals = this._pendingRemovals.slice(removalsToProcess);
    }

    // Then process additions
    const additionsToProcess = Math.min(this._pendingAdditions.length, maxOperations);
    for (let i = 0; i < additionsToProcess; i++) {
      const { eventName, callback, priority, once } = this._pendingAdditions[i];
      if (once) {
        this.once(eventName, callback, priority);
      } else {
        this.on(eventName, callback, priority);
      }
    }
    
    // 処理した分だけ配列から削除
    if (additionsToProcess === this._pendingAdditions.length) {
      this._pendingAdditions = [];
    } else {
      this._pendingAdditions = this._pendingAdditions.slice(additionsToProcess);
    }
  }

  /**
   * Add an event to the history
   * @param {string} eventName - Name of the emitted event
   * @param {*} data - Data passed with the event
   * @private
   */
  _addToHistory(eventName, data) {
    // Add to history with timestamp
    this.eventHistory.push({
      eventName,
      data,
      timestamp: new Date()
    });

    // Trim history if it exceeds the limit
    if (this.eventHistory.length > this.options.historyLimit) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get all event names to emit based on the original event and options
   * @param {string} eventName - The original event name
   * @return {string[]} - Array of event names to emit
   * @private
   */
  _getEventNamesForEmission(eventName) {
    const eventNames = [eventName];

    // Add namespace parent events if enabled
    if (this.options.enableNamespaces && eventName.includes('.')) {
      const parts = eventName.split('.');
      // 最適化: 一度に全部を計算せず徐々に親名前空間を構築
      let parentName = '';
      for (let i = 0; i < parts.length - 1; i++) {
        parentName = parentName ? `${parentName}.${parts[i]}` : parts[i];
        eventNames.push(parentName);
      }
    }

    // 最適化: ワイルドカードが有効な場合は、必要なリスナーのみマッチングする
    if (this.options.enableWildcards) {
      // 最適化: リスナーの数が多すぎる場合は制限する
      const maxListenersToCheck = 100;
      let checkedCount = 0;
      
      for (const name of this.listeners.keys()) {
        // ワイルドカード文字を含む場合のみチェック
        if (!name.includes('*')) continue;
        
        // 処理済みのイベント名はスキップ
        if (eventNames.includes(name)) continue;
        
        // 最大制限に達したら停止
        if (++checkedCount > maxListenersToCheck) {
          break;
        }
        
        // ワイルドカードパターンの簡易チェック
        if (this._matchesWildcard(name, eventName)) {
          eventNames.push(name);
        }
      }
    }

    return eventNames;
  }

  /**
   * Check if a wildcard pattern matches an event name
   * @param {string} pattern - The wildcard pattern to check
   * @param {string} eventName - The event name to match against
   * @return {boolean} - True if the pattern matches the event name
   * @private
   */
  _matchesWildcard(pattern, eventName) {
    // パターンや名前が異常に長い場合はマッチングを諦める（安全対策）
    if (pattern.length > 1000 || eventName.length > 1000) {
      return false;
    }

    // 単純なチェック
    if (pattern === eventName) {
      return true;
    }

    // 単純なワイルドカードチェック
    if (pattern === '*') {
      return !eventName.includes('.');
    }

    if (pattern === '**') {
      return true;
    }

    // 複数階層のワイルドカード (**) の処理
    if (pattern.includes('**')) {
      const parts = pattern.split('**');
      
      // 最適化: 最大2つのパートのみをサポート
      if (parts.length > 2) {
        return false;
      }

      // パターンが 'game.**' のような形式の場合
      if (parts.length === 2 && parts[1] === '') {
        return eventName.startsWith(parts[0]);
      }

      // パターンが '**.end' のような形式の場合
      if (parts.length === 2 && parts[0] === '') {
        return eventName.endsWith(parts[1]);
      }

      // パターンが 'start.**.end' のような形式の場合
      if (parts.length === 2) {
        return eventName.startsWith(parts[0]) && eventName.endsWith(parts[1]);
      }
    }

    // 単一階層のワイルドカード (*) の処理
    if (pattern.includes('*') && !pattern.includes('**')) {
      // 正規表現を使わない最適化された方法
      const patternParts = pattern.split('.');
      const eventParts = eventName.split('.');
      
      if (patternParts.length !== eventParts.length) {
        return false;
      }
      
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i] === '*') {
          continue; // ワイルドカードは何にもマッチする
        }
        if (patternParts[i] !== eventParts[i]) {
          return false;
        }
      }
      return true;
    }

    return false;
  }
}

module.exports = EventSystem;