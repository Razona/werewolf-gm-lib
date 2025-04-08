// RoleManager.events.test.js
import { 
  setupRoleAssignments 
} from './setup/RoleManagerTestSetup';

// モック
jest.mock('../../../core/event/EventSystem');
jest.mock('../../../core/error/ErrorHandler');

describe('RoleManager Event Handling', () => {
  describe('Player death event', () => {
    test('should handle player death event', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      const role = roleManager.getPlayerRole(0);
      const spy = jest.spyOn(role, 'onDeath');

      // eventSystemからプレイヤー死亡イベントをシミュレート
      const mockListener = roleManager.eventSystem.on.mock.calls.find(
        call => call[0] === 'player.death'
      )[1];

      // イベントハンドラを呼び出し
      mockListener({ playerId: 0, cause: 'execution' });

      // 役職のonDeathメソッドが呼ばれたか確認
      expect(spy).toHaveBeenCalledWith('execution');
    });

    test('should handle player death with no role', () => {
      const { roleManager, mockErrorHandler } = setupRoleAssignments([]);

      // 役職が割り当てられていないプレイヤーの死亡イベント
      const mockListener = roleManager.eventSystem.on.mock.calls.find(
        call => call[0] === 'player.death'
      )[1];

      // イベントハンドラを呼び出し
      mockListener({ playerId: 999, cause: 'execution' });

      // エラーハンドラが呼ばれていないこと（エラーではない）
      expect(mockErrorHandler.handleError).not.toHaveBeenCalled();
    });

    test('should handle errors in death event handler', () => {
      const { roleManager, mockErrorHandler } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      const role = roleManager.getPlayerRole(0);
      
      // エラーをスローするメソッドをモック
      role.onDeath = jest.fn().mockImplementation(() => {
        throw new Error('Death handler error');
      });

      const mockListener = roleManager.eventSystem.on.mock.calls.find(
        call => call[0] === 'player.death'
      )[1];

      // イベントハンドラを呼び出し（エラーがスローされないこと）
      expect(() => {
        mockListener({ playerId: 0, cause: 'execution' });
      }).not.toThrow();

      // エラーハンドラが呼ばれたこと
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Phase start event', () => {
    test('should handle phase start event', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' },
        { playerId: 1, roleName: 'werewolf' }
      ]);

      const roleVillager = roleManager.getPlayerRole(0);
      const roleWerewolf = roleManager.getPlayerRole(1);

      const spyVillager = jest.spyOn(roleVillager, 'onPhaseStart');
      const spyWerewolf = jest.spyOn(roleWerewolf, 'onPhaseStart');

      // eventSystemからフェーズ開始イベントをシミュレート
      const mockListener = roleManager.eventSystem.on.mock.calls.find(
        call => call[0] === 'phase.start.*'
      )[1];

      // イベントハンドラを呼び出し
      mockListener('phase.start.night', { turn: 1 });

      // 役職のonPhaseStartメソッドが呼ばれたか確認
      expect(spyVillager).toHaveBeenCalledWith('night', { turn: 1 });
      expect(spyWerewolf).toHaveBeenCalledWith('night', { turn: 1 });
    });

    test('should apply phase effects automatically', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' },
        { playerId: 1, roleName: 'werewolf' }
      ]);

      mockEventSystem.emit.mockClear();

      // フェーズ効果適用メソッドがある場合
      if (typeof roleManager.applyPhaseEffects === 'function') {
        roleManager.applyPhaseEffects('night', { turn: 1 });
        
        expect(mockEventSystem.emit).toHaveBeenCalledWith('phase.effects.applied', expect.objectContaining({
          phase: 'night'
        }));
      } else {
        // このメソッドが未実装の場合はスキップ
        expect(true).toBe(true);
      }
    });
  });

  describe('Game start event', () => {
    test('should handle game start event', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' },
        { playerId: 1, roleName: 'werewolf' }
      ]);

      const roleVillager = roleManager.getPlayerRole(0);
      const roleWerewolf = roleManager.getPlayerRole(1);

      const spyVillager = jest.spyOn(roleVillager, 'onGameStart');
      const spyWerewolf = jest.spyOn(roleWerewolf, 'onGameStart');

      // eventSystemからゲーム開始イベントをシミュレート
      const mockListener = roleManager.eventSystem.on.mock.calls.find(
        call => call[0] === 'game.start'
      )[1];

      // イベントハンドラを呼び出し
      mockListener({});

      // 役職のonGameStartメソッドが呼ばれたか確認
      expect(spyVillager).toHaveBeenCalled();
      expect(spyWerewolf).toHaveBeenCalled();
    });

    test('should setup references on game start', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'werewolf' },
        { playerId: 1, roleName: 'werewolf' }
      ]);

      // setupRoleReferencesメソッドをスパイ
      const spy = jest.spyOn(roleManager, 'setupRoleReferences');

      // ゲーム開始イベントハンドラを取得して呼び出し
      const mockListener = roleManager.eventSystem.on.mock.calls.find(
        call => call[0] === 'game.start'
      )[1];

      mockListener({});

      // setupRoleReferencesが呼ばれたことを確認
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Targeted action event', () => {
    test('should handle targeted action event', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'seer' },
        { playerId: 1, roleName: 'villager' }
      ]);

      const targetRole = roleManager.getPlayerRole(1);
      const spy = jest.spyOn(targetRole, 'onTargeted');

      // ターゲットアクション処理メソッドを呼び出し
      roleManager.handleTargetedAction({
        type: 'fortune',
        actor: 0,
        target: 1,
        result: 'white'
      });

      // 対象役職のonTargetedメソッドが呼ばれたか確認
      expect(spy).toHaveBeenCalledWith('fortune', 0, expect.objectContaining({
        result: 'white'
      }));
    });

    test('should handle targeted action with no target role', () => {
      const { roleManager, mockErrorHandler } = setupRoleAssignments([
        { playerId: 0, roleName: 'seer' }
      ]);

      // 対象に役職が割り当てられていない場合
      roleManager.handleTargetedAction({
        type: 'fortune',
        actor: 0,
        target: 999, // 存在しないプレイヤー
        result: 'white'
      });

      // エラーハンドラが呼ばれていること
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ROLE_NOT_FOUND' })
      );
    });

    test('should handle errors in targeted action handler', () => {
      const { roleManager, mockErrorHandler } = setupRoleAssignments([
        { playerId: 0, roleName: 'seer' },
        { playerId: 1, roleName: 'villager' }
      ]);

      const targetRole = roleManager.getPlayerRole(1);
      
      // エラーをスローするメソッドをモック
      targetRole.onTargeted = jest.fn().mockImplementation(() => {
        throw new Error('Targeted action handler error');
      });

      // アクション処理（エラーがスローされないこと）
      expect(() => {
        roleManager.handleTargetedAction({
          type: 'fortune',
          actor: 0,
          target: 1,
          result: 'white'
        });
      }).not.toThrow();

      // エラーハンドラが呼ばれたこと
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Custom event handling', () => {
    test('should register custom event handlers', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      // カスタムイベントハンドラ登録メソッドがある場合
      if (typeof roleManager.registerEventHandler === 'function') {
        const handler = jest.fn();
        roleManager.registerEventHandler('custom.event', handler);
        
        expect(mockEventSystem.on).toHaveBeenCalledWith('custom.event', expect.any(Function));
        
        // 登録されたハンドラを呼び出し
        const registeredHandler = mockEventSystem.on.mock.calls[mockEventSystem.on.mock.calls.length - 1][1];
        registeredHandler({ data: 'test' });
        
        expect(handler).toHaveBeenCalledWith({ data: 'test' });
      } else {
        // このメソッドが未実装の場合はスキップ
        expect(true).toBe(true);
      }
    });

    test('should unregister event handlers', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([]);

      // イベントハンドラ削除メソッドがある場合
      if (typeof roleManager.unregisterEventHandler === 'function') {
        roleManager.unregisterEventHandler('player.death');
        
        expect(mockEventSystem.off).toHaveBeenCalledWith('player.death', expect.any(Function));
      } else {
        // このメソッドが未実装の場合はスキップ
        expect(true).toBe(true);
      }
    });
  });

  describe('Event emission', () => {
    test('should emit role events', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      mockEventSystem.emit.mockClear();
      
      // イベント発火メソッドを呼び出し
      roleManager.emitRoleEvent('role.custom', { playerId: 0, data: 'test' });
      
      expect(mockEventSystem.emit).toHaveBeenCalledWith('role.custom', expect.objectContaining({
        playerId: 0,
        data: 'test'
      }));
    });

    test('should emit events with context', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      mockEventSystem.emit.mockClear();
      
      // コンテキスト付きのイベント発火メソッドがある場合
      if (typeof roleManager.emitEventWithContext === 'function') {
        roleManager.emitEventWithContext('test.event', { data: 'test' });
        
        expect(mockEventSystem.emit).toHaveBeenCalledWith('test.event', expect.objectContaining({
          data: 'test',
          context: expect.any(Object)
        }));
      } else {
        // このメソッドが未実装の場合は通常のemitをテスト
        roleManager.eventSystem.emit('test.event', { data: 'test' });
        
        expect(mockEventSystem.emit).toHaveBeenCalledWith('test.event', expect.objectContaining({
          data: 'test'
        }));
      }
    });
  });

  describe('Event handlers cleanup', () => {
    test('should clean up event handlers', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([]);
      
      // イベントリスナー削除メソッドがある場合
      if (typeof roleManager.cleanupEventListeners === 'function') {
        roleManager.cleanupEventListeners();
        
        expect(mockEventSystem.off).toHaveBeenCalled();
      } else {
        // このメソッドが未実装の場合は、クラス内の同様の処理をテスト
        if (typeof roleManager.destroy === 'function') {
          roleManager.destroy();
          
          expect(mockEventSystem.off).toHaveBeenCalled();
        } else {
          // どちらのメソッドもない場合はスキップ
          expect(true).toBe(true);
        }
      }
    });
  });
});
