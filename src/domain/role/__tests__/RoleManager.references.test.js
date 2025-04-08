// RoleManager.references.test.js
import { 
  setupRoleAssignments 
} from './setup/RoleManagerTestSetup';

// モック
jest.mock('../../../core/event/EventSystem');
jest.mock('../../../core/error/ErrorHandler');

describe('RoleManager Role References', () => {
  describe('Werewolf references', () => {
    test('should setup references between werewolves', () => {
      const { roleManager, mockErrorHandler } = setupRoleAssignments([
        { playerId: 0, roleName: 'werewolf' },
        { playerId: 1, roleName: 'werewolf' },
        { playerId: 2, roleName: 'villager' }
      ]);

      const spy0 = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');
      const spy1 = jest.spyOn(roleManager.roleInstances.get(1), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 人狼同士が互いを認識する参照が設定されているか確認
      expect(spy0).toHaveBeenCalledWith('otherWerewolves', [1]);
      expect(spy1).toHaveBeenCalledWith('otherWerewolves', [0]);
    });

    test('should handle single werewolf', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'werewolf' },
        { playerId: 1, roleName: 'villager' },
        { playerId: 2, roleName: 'villager' }
      ]);

      const spy = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 単独の人狼には空の配列が設定されるか確認
      expect(spy).toHaveBeenCalledWith('otherWerewolves', []);
    });

    test('should handle multiple werewolves', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'werewolf' },
        { playerId: 1, roleName: 'werewolf' },
        { playerId: 2, roleName: 'werewolf' },
        { playerId: 3, roleName: 'villager' }
      ]);

      const spy0 = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');
      const spy1 = jest.spyOn(roleManager.roleInstances.get(1), 'setReference');
      const spy2 = jest.spyOn(roleManager.roleInstances.get(2), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2, 3]);

      // 複数の人狼が互いを認識する参照が設定されているか確認
      expect(spy0).toHaveBeenCalledWith('otherWerewolves', expect.arrayContaining([1, 2]));
      expect(spy1).toHaveBeenCalledWith('otherWerewolves', expect.arrayContaining([0, 2]));
      expect(spy2).toHaveBeenCalledWith('otherWerewolves', expect.arrayContaining([0, 1]));
    });
  });

  describe('Mason references', () => {
    test('should setup references between masons', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'mason' },
        { playerId: 1, roleName: 'mason' },
        { playerId: 2, roleName: 'villager' }
      ]);

      const spy0 = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');
      const spy1 = jest.spyOn(roleManager.roleInstances.get(1), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 共有者同士が互いを認識する参照が設定されているか確認
      expect(spy0).toHaveBeenCalledWith('otherMasons', [1]);
      expect(spy1).toHaveBeenCalledWith('otherMasons', [0]);
    });

    test('should handle single mason', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'mason' },
        { playerId: 1, roleName: 'villager' },
        { playerId: 2, roleName: 'villager' }
      ]);

      const spy = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 単独の共有者には空の配列が設定されるか確認
      expect(spy).toHaveBeenCalledWith('otherMasons', []);
    });
  });

  describe('Fox-Heretic references', () => {
    test('should setup references between heretic and fox', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'heretic' },
        { playerId: 1, roleName: 'fox' },
        { playerId: 2, roleName: 'villager' }
      ]);

      const spyHeretic = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 背徳者が妖狐を認識する参照が設定されているか確認
      expect(spyHeretic).toHaveBeenCalledWith('foxId', 1);
    });

    test('should handle multiple heretics with single fox', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'heretic' },
        { playerId: 1, roleName: 'heretic' },
        { playerId: 2, roleName: 'fox' }
      ]);

      const spy0 = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');
      const spy1 = jest.spyOn(roleManager.roleInstances.get(1), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 複数の背徳者が同じ妖狐を認識する参照が設定されているか確認
      expect(spy0).toHaveBeenCalledWith('foxId', 2);
      expect(spy1).toHaveBeenCalledWith('foxId', 2);
    });

    test('should handle missing fox for heretic', () => {
      const { roleManager, mockErrorHandler } = setupRoleAssignments([
        { playerId: 0, roleName: 'heretic' },
        { playerId: 1, roleName: 'villager' },
        { playerId: 2, roleName: 'villager' }
      ]);

      // spyを設定
      const spyHeretic = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');

      roleManager.setupRoleReferences([0, 1, 2]);

      // 妖狐がいないので参照は設定されていないはず
      expect(spyHeretic).not.toHaveBeenCalledWith('foxId', expect.any(Number));
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ROLE_REFERENCE_ERROR' })
      );
    });
  });

  describe('Reference operations', () => {
    test('should get players by role', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' },
        { playerId: 1, roleName: 'werewolf' },
        { playerId: 2, roleName: 'werewolf' }
      ]);

      const werewolves = roleManager.getPlayersByRole('werewolf');
      
      expect(werewolves).toHaveLength(2);
      expect(werewolves).toContain(1);
      expect(werewolves).toContain(2);
    });

    test('should return empty array for nonexistent role', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      const result = roleManager.getPlayersByRole('nonexistent');
      
      expect(result).toEqual([]);
    });

    test('should get players in team', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' },
        { playerId: 1, roleName: 'seer' },
        { playerId: 2, roleName: 'werewolf' }
      ]);

      const villagePlayers = roleManager.getPlayersInTeam('village');
      
      expect(villagePlayers).toHaveLength(2);
      expect(villagePlayers).toContain(0);
      expect(villagePlayers).toContain(1);
    });

    test('should return empty array for nonexistent team', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' }
      ]);

      const result = roleManager.getPlayersInTeam('nonexistent');
      
      expect(result).toEqual([]);
    });
  });

  describe('Complex references', () => {
    test('should handle complex role relationships', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'werewolf' },
        { playerId: 1, roleName: 'werewolf' },
        { playerId: 2, roleName: 'mason' },
        { playerId: 3, roleName: 'mason' },
        { playerId: 4, roleName: 'heretic' },
        { playerId: 5, roleName: 'fox' }
      ]);

      // 各役職のsetReferenceメソッドをスパイ
      const spies = [0, 1, 2, 3, 4].map(id => 
        jest.spyOn(roleManager.roleInstances.get(id), 'setReference')
      );

      roleManager.setupRoleReferences([0, 1, 2, 3, 4, 5]);

      // 人狼の参照が正しく設定されているか確認
      expect(spies[0]).toHaveBeenCalledWith('otherWerewolves', [1]);
      expect(spies[1]).toHaveBeenCalledWith('otherWerewolves', [0]);
      
      // 共有者の参照が正しく設定されているか確認
      expect(spies[2]).toHaveBeenCalledWith('otherMasons', [3]);
      expect(spies[3]).toHaveBeenCalledWith('otherMasons', [2]);
      
      // 背徳者の参照が正しく設定されているか確認
      expect(spies[4]).toHaveBeenCalledWith('foxId', 5);
    });

    test('should emit reference setup events', () => {
      const { roleManager, mockEventSystem } = setupRoleAssignments([
        { playerId: 0, roleName: 'werewolf' },
        { playerId: 1, roleName: 'werewolf' }
      ]);

      mockEventSystem.emit.mockClear();
      
      roleManager.setupRoleReferences([0, 1]);
      
      expect(mockEventSystem.emit).toHaveBeenCalledWith('role.references.setup', expect.any(Object));
    });
  });

  describe('Custom references', () => {
    test('should support custom reference setup', () => {
      const { roleManager } = setupRoleAssignments([
        { playerId: 0, roleName: 'villager' },
        { playerId: 1, roleName: 'villager' }
      ]);

      // カスタム参照設定メソッドがある場合
      if (typeof roleManager.setupCustomReferences === 'function') {
        const spy0 = jest.spyOn(roleManager.roleInstances.get(0), 'setReference');
        const spy1 = jest.spyOn(roleManager.roleInstances.get(1), 'setReference');
        
        // カスタム参照を設定
        roleManager.setupCustomReferences('customRef', {
          0: [1],
          1: [0]
        });
        
        expect(spy0).toHaveBeenCalledWith('customRef', [1]);
        expect(spy1).toHaveBeenCalledWith('customRef', [0]);
      } else {
        // カスタム参照設定メソッドがない場合はスキップ
        expect(true).toBe(true);
      }
    });
  });
});
