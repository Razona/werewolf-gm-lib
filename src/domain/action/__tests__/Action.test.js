/**
 * Action クラスのテスト
 */

import { Action } from '../Action.js';

// モックゲームオブジェクト
const createMockGame = () => ({
  eventSystem: {
    emit: jest.fn()
  },
  playerManager: {
    getPlayer: jest.fn().mockImplementation((id) => ({
      id,
      name: `Player ${id}`,
      isAlive: true,
      role: { name: id === 5 ? 'fox' : 'villager' }
    }))
  },
  roleManager: {
    getRole: jest.fn().mockImplementation((roleName) => {
      if (roleName === 'fox') {
        return {
          name: 'fox',
          fortuneResult: 'white',
          isImmuneToDeath: { attack: true },
          isVulnerableTo: { fortune: true }
        };
      }
      return { name: roleName, fortuneResult: 'white' };
    }),
    canUseAction: jest.fn().mockReturnValue(true)
  },
  regulations: {},
  lastGuardedTarget: null,
  errorHandler: {
    createError: jest.fn((code, message) => new Error(message))
  }
});

describe('Action クラス', () => {
  
  // コンストラクタと基本プロパティのテスト
  describe('コンストラクタと基本プロパティ', () => {
    
    test('正しいパラメータでインスタンス化できる', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2,
        night: 3,
        priority: 100
      });
      
      expect(action.type).toBe('fortune');
      expect(action.actor).toBe(1);
      expect(action.target).toBe(2);
      expect(action.night).toBe(3);
      expect(action.priority).toBe(100);
      expect(action.executed).toBe(false);
      expect(action.cancelled).toBe(false);
      expect(action.result).toBeNull();
    });
    
    test('必須パラメータが欠けている場合はエラーがスローされる', () => {
      expect(() => new Action({})).toThrow('アクション種別(type)は必須です');
      expect(() => new Action({ type: 'fortune' })).toThrow('実行者ID(actor)は必須です');
      expect(() => new Action({ type: 'fortune', actor: 1 })).toThrow('対象ID(target)は必須です');
    });
    
    test('実行者IDと対象IDは数値であることが必要', () => {
      expect(() => new Action({ type: 'fortune', actor: '1', target: 2 })).toThrow('実行者ID(actor)は数値である必要があります');
      expect(() => new Action({ type: 'fortune', actor: 1, target: '2' })).toThrow('対象ID(target)は数値である必要があります');
    });
    
    test('未知のアクション種別はエラーになる', () => {
      expect(() => new Action({ type: 'unknown', actor: 1, target: 2 })).toThrow('未知のアクション種別です');
    });
    
    test('night や priority が省略された場合はデフォルト値が使用される', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      expect(action.night).toBe(1);
      // priority はデフォルト値としてアクション種別から取得される
      expect(action.priority).toBe(100); // fortune の優先度
    });
    
    test('アクションIDが生成される', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      expect(action.id).toBeDefined();
      expect(action.id).toMatch(/^action-/);
    });
  });
  
  // isExecutable メソッドのテスト
  describe('isExecutable メソッド', () => {
    test('初期状態では実行可能', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      expect(action.isExecutable()).toBe(true);
    });
    
    test('実行済みの場合は実行不可', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.executed = true;
      expect(action.isExecutable()).toBe(false);
    });
    
    test('キャンセル済みの場合は実行不可', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.cancelled = true;
      expect(action.isExecutable()).toBe(false);
    });
  });
  
  // setGame メソッドのテスト
  describe('setGame メソッド', () => {
    test('ゲームオブジェクトをセットできる', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const mockGame = createMockGame();
      action.setGame(mockGame);
      
      expect(action.game).toBe(mockGame);
    });
    
    test('メソッドチェーンが可能', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const mockGame = createMockGame();
      const result = action.setGame(mockGame);
      
      expect(result).toBe(action);
    });
  });
  
  // execute メソッドのテスト
  describe('execute メソッド', () => {
    test('実行済みアクションの再実行はエラー', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.executed = true;
      
      expect(() => action.execute()).toThrow('already executed');
    });
    
    test('キャンセル済みアクションの実行はエラー', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.cancelled = true;
      
      expect(() => action.execute()).toThrow('cancelled');
    });
    
    test('ゲームオブジェクトが設定されていない場合はエラー', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      expect(() => action.execute()).toThrow('ゲームオブジェクトが設定されていません');
    });
    
    test('オプションでゲームオブジェクトを渡せる', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const mockGame = createMockGame();
      
      // checkRolePermission と checkRegulations が呼ばれないようにモック
      action.checkRolePermission = jest.fn();
      action.checkRegulations = jest.fn();
      action.generateResult = jest.fn().mockReturnValue({ success: true });
      action.emitExecuteEvent = jest.fn();
      
      const result = action.execute({ game: mockGame });
      
      expect(action.game).toBe(mockGame);
      expect(result).toEqual({ success: true });
      expect(action.executed).toBe(true);
      expect(action.emitExecuteEvent).toHaveBeenCalled();
    });
    
    test('カスタム結果を直接指定できる', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const mockGame = createMockGame();
      action.setGame(mockGame);
      
      action.emitExecuteEvent = jest.fn();
      
      const customResult = { success: true, custom: true };
      const result = action.execute({ customResult });
      
      expect(result).toBe(customResult);
      expect(action.result).toBe(customResult);
      expect(action.executed).toBe(true);
      expect(action.emitExecuteEvent).toHaveBeenCalled();
    });
    
    test('execute が適切なメソッドを呼び出す', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const mockGame = createMockGame();
      action.setGame(mockGame);
      
      // 各メソッドをモック
      action.checkRolePermission = jest.fn();
      action.checkRegulations = jest.fn();
      action.generateResult = jest.fn().mockReturnValue({ success: true });
      action.emitExecuteEvent = jest.fn();
      
      const result = action.execute();
      
      expect(action.checkRolePermission).toHaveBeenCalled();
      expect(action.checkRegulations).toHaveBeenCalled();
      expect(action.generateResult).toHaveBeenCalled();
      expect(action.emitExecuteEvent).toHaveBeenCalled();
      
      expect(result).toEqual({ success: true });
      expect(action.executed).toBe(true);
      expect(action.result).toEqual({ success: true });
    });
  });
  
  // cancel メソッドのテスト
  describe('cancel メソッド', () => {
    test('アクションをキャンセルできる', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const mockGame = createMockGame();
      action.setGame(mockGame);
      
      const result = action.cancel();
      
      expect(action.cancelled).toBe(true);
      expect(result).toEqual({ success: true, cancelled: true });
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('action.cancel', expect.any(Object));
    });
    
    test('実行済みアクションのキャンセルはエラー', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.executed = true;
      
      expect(() => action.cancel()).toThrow('既に実行されたアクションはキャンセルできません');
    });
    
    test('キャンセル済みアクションの再キャンセルはエラー', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.cancelled = true;
      
      expect(() => action.cancel()).toThrow('既にキャンセルされています');
    });
  });
  
  // getResult メソッドのテスト
  describe('getResult メソッド', () => {
    test('未実行のアクションはnullを返す', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      expect(action.getResult()).toBeNull();
    });
    
    test('実行済みアクションは結果を返す', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.result = { success: true };
      
      expect(action.getResult()).toEqual({ success: true });
    });
  });
  
  // getActionTypeInfo メソッドのテスト
  describe('getActionTypeInfo メソッド', () => {
    test('占いアクションの情報を取得できる', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      const info = action.getActionTypeInfo();
      
      expect(info).toEqual({
        name: 'fortune',
        displayName: '占い',
        priority: 100,
        phase: 'night'
      });
    });
    
    test('護衛アクションの情報を取得できる', () => {
      const action = new Action({
        type: 'guard',
        actor: 1,
        target: 2
      });
      
      const info = action.getActionTypeInfo();
      
      expect(info).toEqual({
        name: 'guard',
        displayName: '護衛',
        priority: 80,
        phase: 'night'
      });
    });
    
    test('襲撃アクションの情報を取得できる', () => {
      const action = new Action({
        type: 'attack',
        actor: 1,
        target: 2
      });
      
      const info = action.getActionTypeInfo();
      
      expect(info).toEqual({
        name: 'attack',
        displayName: '襲撃',
        priority: 60,
        phase: 'night'
      });
    });
  });
  
  // emitExecuteEvent メソッドのテスト
  describe('emitExecuteEvent メソッド', () => {
    test('実行イベントを発火する', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2,
        night: 3
      });
      
      const mockGame = createMockGame();
      action.setGame(mockGame);
      
      action.result = { success: true };
      action.emitExecuteEvent();
      
      // 基本イベントが発火されたか
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('action.execute', {
        id: action.id,
        type: 'fortune',
        actor: 1,
        target: 2,
        night: 3,
        result: { success: true }
      });
      
      // アクション固有イベントも発火されたか
      expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('action.execute.fortune', {
        id: action.id,
        actor: 1,
        target: 2,
        night: 3,
        result: { success: true }
      });
    });
    
    test('ゲームオブジェクトがない場合は何も起きない', () => {
      const action = new Action({
        type: 'fortune',
        actor: 1,
        target: 2
      });
      
      action.result = { success: true };
      
      // エラーが発生しないこと
      expect(() => action.emitExecuteEvent()).not.toThrow();
    });
  });
  
  // アクション結果生成メソッドのテスト
  describe('アクション結果生成', () => {
    // generateFortuneResult メソッドのテスト
    describe('generateFortuneResult メソッド', () => {
      test('対象が存在しない場合はエラー', () => {
        const action = new Action({
          type: 'fortune',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateFortuneResult(
          { id: 1 },
          null
        );
        
        expect(result).toEqual({
          success: false,
          reason: 'TARGET_NOT_FOUND'
        });
      });
      
      test('対象が死亡している場合はエラー', () => {
        const action = new Action({
          type: 'fortune',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateFortuneResult(
          { id: 1 },
          { id: 2, isAlive: false }
        );
        
        expect(result).toEqual({
          success: false,
          reason: 'TARGET_DEAD'
        });
      });
      
      test('初日ランダム白ルールが適用される', () => {
        const action = new Action({
          type: 'fortune',
          actor: 1,
          target: 2,
          night: 1
        });
        
        const mockGame = createMockGame();
        mockGame.regulations.firstNightFortune = 'random_white';
        action.setGame(mockGame);
        
        // メソッドをスパイ
        action.emitFoxCursedEventIfNeeded = jest.fn();
        
        const result = action.generateFortuneResult(
          { id: 1 },
          { id: 2, isAlive: true, name: 'Player 2' }
        );
        
        expect(result).toEqual({
          success: true,
          result: 'white',
          targetId: 2,
          targetName: 'Player 2'
        });
        
        // 妖狐呪殺イベントチェックが呼ばれたか
        expect(action.emitFoxCursedEventIfNeeded).toHaveBeenCalled();
      });
      
      test('通常の占い結果が取得できる', () => {
        const action = new Action({
          type: 'fortune',
          actor: 1,
          target: 2,
          night: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        // メソッドをスパイ
        action.emitFoxCursedEventIfNeeded = jest.fn();
        
        const result = action.generateFortuneResult(
          { id: 1 },
          { id: 2, isAlive: true, name: 'Player 2', role: { name: 'villager' } }
        );
        
        expect(result).toEqual({
          success: true,
          result: 'white',
          targetId: 2,
          targetName: 'Player 2'
        });
        
        // 妖狐呪殺イベントチェックが呼ばれたか
        expect(action.emitFoxCursedEventIfNeeded).toHaveBeenCalled();
      });
    });
    
    // generateGuardResult メソッドのテスト
    describe('generateGuardResult メソッド', () => {
      test('対象が存在しない場合はエラー', () => {
        const action = new Action({
          type: 'guard',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateGuardResult(
          { id: 1 },
          null
        );
        
        expect(result).toEqual({
          success: false,
          reason: 'TARGET_NOT_FOUND'
        });
      });
      
      test('対象が死亡している場合はエラー', () => {
        const action = new Action({
          type: 'guard',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateGuardResult(
          { id: 1 },
          { id: 2, isAlive: false }
        );
        
        expect(result).toEqual({
          success: false,
          reason: 'TARGET_DEAD'
        });
      });
      
      test('護衛成功時は対象を護衛状態にする', () => {
        const action = new Action({
          type: 'guard',
          actor: 1,
          target: 2,
          night: 3
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateGuardResult(
          { id: 1 },
          { id: 2, isAlive: true, name: 'Player 2' }
        );
        
        expect(result).toEqual({
          success: true,
          guarded: true,
          targetId: 2,
          targetName: 'Player 2'
        });
        
        // 護衛イベントが発火されたか
        expect(mockGame.eventSystem.emit).toHaveBeenCalledWith('player.guarded', {
          guardianId: 1,
          targetId: 2,
          night: 3
        });
        
        // 最後の護衛対象が記録されたか
        expect(mockGame.lastGuardedTarget).toBe(2);
      });
    });
    
    // generateAttackResult メソッドのテスト
    describe('generateAttackResult メソッド', () => {
      test('対象が存在しない場合はエラー', () => {
        const action = new Action({
          type: 'attack',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateAttackResult(
          { id: 1 },
          null
        );
        
        expect(result).toEqual({
          success: false,
          reason: 'TARGET_NOT_FOUND'
        });
      });
      
      test('対象が既に死亡している場合は失敗', () => {
        const action = new Action({
          type: 'attack',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateAttackResult(
          { id: 1 },
          { id: 2, isAlive: false, name: 'Player 2' }
        );
        
        expect(result).toEqual({
          success: true,
          killed: false,
          reason: 'ALREADY_DEAD',
          targetId: 2,
          targetName: 'Player 2'
        });
      });
      
      test('護衛されている対象は襲撃失敗', () => {
        const action = new Action({
          type: 'attack',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateAttackResult(
          { id: 1 },
          { id: 2, isAlive: true, name: 'Player 2', isGuarded: true }
        );
        
        expect(result).toEqual({
          success: true,
          killed: false,
          reason: 'GUARDED',
          targetId: 2,
          targetName: 'Player 2'
        });
      });
      
      test('襲撃耐性を持つ役職は襲撃失敗', () => {
        const action = new Action({
          type: 'attack',
          actor: 1,
          target: 5 // fox（襲撃耐性あり）
        });
        
        const mockGame = createMockGame();
        action.setGame(mockGame);
        
        const result = action.generateAttackResult(
          { id: 1 },
          { id: 5, isAlive: true, name: 'Player 5', role: { name: 'fox' } }
        );
        
        expect(result).toEqual({
          success: true,
          killed: false,
          reason: 'RESISTANT',
          targetId: 5,
          targetName: 'Player 5'
        });
      });
      
      test('通常の襲撃成功時は対象を死亡させる', () => {
        const action = new Action({
          type: 'attack',
          actor: 1,
          target: 2
        });
        
        const mockGame = createMockGame();
        mockGame.playerManager.killPlayer = jest.fn();
        action.setGame(mockGame);
        
        const result = action.generateAttackResult(
          { id: 1 },
          { id: 2, isAlive: true, name: 'Player 2', role: { name: 'villager' } }
        );
        
        expect(result).toEqual({
          success: true,
          killed: true,
          targetId: 2,
          targetName: 'Player 2'
        });
        
        // プレイヤー死亡メソッドが呼ばれたか
        expect(mockGame.playerManager.killPlayer).toHaveBeenCalledWith(2, 'attack');
      });
    });
  });
});
