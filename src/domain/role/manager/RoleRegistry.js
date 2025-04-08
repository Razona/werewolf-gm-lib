export class RoleRegistry {
  constructor(roleManager) {
    this.roleManager = roleManager;
    this.roles = new Map();
    this.roleClasses = new Map();
  }

  registerRole(roleData) {
    if (!roleData || !roleData.name) {
      return false;
    }

    if (this.roles.has(roleData.name)) {
      return false;
    }

    this.roles.set(roleData.name, {
      ...roleData,
      metadata: roleData.metadata || {}
    });

    // ロールクラスが提供されている場合は保存
    if (roleData.roleClass) {
      this.roleClasses.set(roleData.name, roleData.roleClass);
    }

    this.roleManager.eventSystem.emit('role.registered', {
      role: this.roles.get(roleData.name)
    });

    return true;
  }

  unregisterRole(roleName) {
    if (!this.roles.has(roleName)) {
      return false;
    }

    const roleData = this.roles.get(roleName);
    this.roles.delete(roleName);
    this.roleClasses.delete(roleName);

    this.roleManager.eventSystem.emit('role.unregistered', {
      role: roleData
    });

    return true;
  }

  getRoleData(roleName) {
    return this.roles.get(roleName) || null;
  }

  getRoleClass(roleName) {
    return this.roleClasses.get(roleName) || null;
  }

  hasRole(roleName) {
    return this.roles.has(roleName);
  }

  getAllRoles() {
    return Array.from(this.roles.values());
  }

  clearRoles() {
    const roles = this.getAllRoles();
    this.roles.clear();
    this.roleClasses.clear();

    roles.forEach(role => {
      this.roleManager.eventSystem.emit('role.unregistered', {
        role
      });
    });

    return true;
  }
}