import { ErrorHandler } from './ErrorHandler';

export class Validator {
  private errorHandler: ErrorHandler | null;
  private customValidators: Map<string, (value: any, context?: any) => boolean>;

  constructor(errorHandler: ErrorHandler | null = null) {
    this.errorHandler = errorHandler;
    this.customValidators = new Map();
  }

  validateExists(value: any, errorOptions: any = {}): boolean {
    if (value === null || value === undefined) {
      if (this.errorHandler) {
        this.errorHandler.handle({
          code: 'VALIDATION_ERROR',
          message: errorOptions.message || 'Value must exist',
          context: errorOptions.context || {}
        });
        return false;
      }
      return false;
    }
    return true;
  }

  validateCondition(condition: boolean, errorOptions: any = {}): boolean {
    if (!condition) {
      if (this.errorHandler) {
        this.errorHandler.handle({
          code: 'CONDITION_ERROR',
          message: errorOptions.message || 'Condition not met',
          context: errorOptions.context || {}
        });
        return false;
      }
      return false;
    }
    return true;
  }

  validateType(value: any, expectedType: string, errorOptions: any = {}): boolean {
    const actualType = typeof value;
    const isValid = this.checkType(value, expectedType);

    if (!isValid) {
      if (this.errorHandler) {
        this.errorHandler.handle({
          code: 'TYPE_ERROR',
          message: errorOptions.message || `Expected ${expectedType}, got ${actualType}`,
          context: {
            expectedType,
            actualType,
            ...errorOptions.context
          }
        });
        return false;
      }
      return false;
    }
    return true;
  }

  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number' && !isNaN(value);
      case 'boolean': return typeof value === 'boolean';
      case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array': return Array.isArray(value);
      case 'function': return typeof value === 'function';
      case 'null': return value === null;
      case 'undefined': return value === undefined;
      case 'integer': return Number.isInteger(value);
      case 'positive': return typeof value === 'number' && value > 0;
      case 'nonnegative': return typeof value === 'number' && value >= 0;
      default: return false;
    }
  }

  registerCustomValidator(name: string, validatorFn: (value: any, context?: any) => boolean): void {
    this.customValidators.set(name, validatorFn);
  }

  executeCustomValidator(name: string, value: any, context: any = {}): boolean {
    const validator = this.customValidators.get(name);
    if (!validator) {
      throw new Error(`Custom validator ${name} not found`);
    }
    return validator(value, context);
  }
}
