// RoleManager.registration.test.js
import { createRoleManager, MockVillager } from './setup/RoleManagerTestSetup';
import Role from '../Role';

// モック
jest.mock('../../../core/event/EventSystem');
jest.mock('../../../core/error/ErrorHandler');

describe('RoleManager Role Registration', () => {
  let roleManager, mockErrorHandler;

  beforeEach(() => {
    const setup = createRoleManager();
    roleManager = setup.roleManager;
    mockErrorHandler = setup.mockErrorHandler;
  });

  test('should register a role class', () => {
    const result = roleManager.registerRole('villager', MockVillager);
    expect(result).toBe(true);
    expect(roleManager.hasRole('villager')).toBe(true);
  });

  test('should not register the same role twice', () => {
    roleManager.registerRole('villager', MockVillager);
    const result = roleManager.registerRole('villager', MockVillager);
    expect(result).toBe(false);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ROLE_ALREADY_REGISTERED' })
    );
  });

  test('should not register invalid role class', () => {
    class InvalidRole { }
    const result = roleManager.registerRole('invalid', InvalidRole);
    expect(result).toBe(false);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_ROLE_CLASS' })
    );
  });

  test('should unregister a role', () => {
    roleManager.registerRole('villager', MockVillager);
    const result = roleManager.unregisterRole('villager');
    expect(result).toBe(true);
    expect(roleManager.hasRole('villager')).toBe(false);
  });

  test('should return false when unregistering non-existent role', () => {
    const result = roleManager.unregisterRole('nonexistent');
    expect(result).toBe(false);
  });

  test('should get registered role class', () => {
    roleManager.registerRole('villager', MockVillager);
    const roleClass = roleManager.getRoleClass('villager');
    expect(roleClass).toBe(MockVillager);
  });

  test('should return null for unregistered role class', () => {
    const roleClass = roleManager.getRoleClass('nonexistent');
    expect(roleClass).toBeNull();
  });

  test('should get all registered role names', () => {
    roleManager.registerRole('role1', MockVillager);
    roleManager.registerRole('role2', MockVillager);
    roleManager.registerRole('role3', MockVillager);
    
    const roleNames = roleManager.getRegisteredRoles();
    expect(roleNames).toContain('role1');
    expect(roleNames).toContain('role2');
    expect(roleNames).toContain('role3');
    expect(roleNames).toHaveLength(3);
  });

  test('should clear all registered roles', () => {
    roleManager.registerRole('role1', MockVillager);
    roleManager.registerRole('role2', MockVillager);
    
    roleManager.clearRoles();
    
    expect(roleManager.getRegisteredRoles()).toHaveLength(0);
    expect(roleManager.hasRole('role1')).toBe(false);
    expect(roleManager.hasRole('role2')).toBe(false);
  });

  test('should register multiple roles at once', () => {
    const roles = {
      'role1': MockVillager,
      'role2': MockVillager
    };
    
    const result = roleManager.registerRoles(roles);
    expect(result).toBe(true);
    expect(roleManager.hasRole('role1')).toBe(true);
    expect(roleManager.hasRole('role2')).toBe(true);
  });

  test('should emit event when role is registered', () => {
    const { roleManager, mockEventSystem } = createRoleManager();
    
    roleManager.registerRole('villager', MockVillager);
    
    expect(mockEventSystem.emit).toHaveBeenCalledWith('role.registered', expect.objectContaining({
      roleName: 'villager'
    }));
  });

  test('should emit event when role is unregistered', () => {
    const { roleManager, mockEventSystem } = createRoleManager();
    
    roleManager.registerRole('villager', MockVillager);
    mockEventSystem.emit.mockClear();
    
    roleManager.unregisterRole('villager');
    
    expect(mockEventSystem.emit).toHaveBeenCalledWith('role.unregistered', expect.objectContaining({
      roleName: 'villager'
    }));
  });
});
