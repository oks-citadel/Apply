/**
 * ApplyForUs AI - RBAC Policies System
 *
 * Resource-based and attribute-based access control policies.
 */

import { Permission } from './permissions';

/**
 * Resource types in the system
 */
export enum ResourceType {
  USER = 'user',
  PROFILE = 'profile',
  RESUME = 'resume',
  JOB = 'job',
  APPLICATION = 'application',
  COMPANY = 'company',
  DOCUMENT = 'document',
  INTERVIEW = 'interview',
  MESSAGE = 'message',
  ANALYTICS = 'analytics',
}

/**
 * Actions that can be performed on resources
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  SHARE = 'share',
  EXPORT = 'export',
}

/**
 * Policy effect
 */
export enum Effect {
  ALLOW = 'allow',
  DENY = 'deny',
}

/**
 * Condition operators for attribute-based access control
 */
export enum ConditionOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  IN = 'in',
  NOT_IN = 'nin',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  EXISTS = 'exists',
}

/**
 * Condition for attribute-based access control
 */
export interface PolicyCondition {
  attribute: string;
  operator: ConditionOperator;
  value: any;
}

/**
 * Access policy definition
 */
export interface Policy {
  id: string;
  name: string;
  description: string;
  effect: Effect;
  resources: ResourceType[];
  actions: Action[];
  conditions?: PolicyCondition[];
  priority: number; // Higher priority policies are evaluated first
}

/**
 * Context for policy evaluation
 */
export interface PolicyContext {
  userId: string;
  userRoles: string[];
  resourceType: ResourceType;
  resourceId?: string;
  action: Action;
  attributes: Record<string, any>; // Additional context attributes
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  allowed: boolean;
  matchedPolicies: Policy[];
  reason?: string;
}

/**
 * Resource ownership interface
 */
export interface ResourceOwnership {
  ownerId: string;
  organizationId?: string;
  teamId?: string;
  isPublic?: boolean;
  sharedWith?: string[];
}

/**
 * Policy Engine for evaluating access policies
 */
export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();

  constructor() {
    this.registerDefaultPolicies();
  }

  /**
   * Register a policy
   */
  registerPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Remove a policy
   */
  removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }

  /**
   * Evaluate if an action is allowed based on policies
   */
  evaluate(context: PolicyContext): PolicyEvaluationResult {
    const matchedPolicies: Policy[] = [];
    let finalEffect: Effect = Effect.DENY; // Default deny

    // Get applicable policies sorted by priority
    const applicablePolicies = Array.from(this.policies.values())
      .filter(
        (policy) =>
          policy.resources.includes(context.resourceType) &&
          policy.actions.includes(context.action)
      )
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    // Evaluate policies
    for (const policy of applicablePolicies) {
      if (this.evaluateConditions(policy.conditions || [], context)) {
        matchedPolicies.push(policy);

        // Deny takes precedence over allow
        if (policy.effect === Effect.DENY) {
          return {
            allowed: false,
            matchedPolicies,
            reason: `Access denied by policy: ${policy.name}`,
          };
        }

        if (policy.effect === Effect.ALLOW) {
          finalEffect = Effect.ALLOW;
        }
      }
    }

    return {
      allowed: finalEffect === Effect.ALLOW,
      matchedPolicies,
      reason:
        finalEffect === Effect.ALLOW
          ? 'Access granted'
          : 'No matching allow policy found',
    };
  }

  /**
   * Evaluate policy conditions
   */
  private evaluateConditions(
    conditions: PolicyCondition[],
    context: PolicyContext
  ): boolean {
    if (conditions.length === 0) {
      return true; // No conditions means always match
    }

    return conditions.every((condition) =>
      this.evaluateCondition(condition, context)
    );
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: PolicyCondition,
    context: PolicyContext
  ): boolean {
    const attributeValue = this.getAttributeValue(condition.attribute, context);

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return attributeValue === condition.value;

      case ConditionOperator.NOT_EQUALS:
        return attributeValue !== condition.value;

      case ConditionOperator.IN:
        return Array.isArray(condition.value) && condition.value.includes(attributeValue);

      case ConditionOperator.NOT_IN:
        return Array.isArray(condition.value) && !condition.value.includes(attributeValue);

      case ConditionOperator.GREATER_THAN:
        return attributeValue > condition.value;

      case ConditionOperator.LESS_THAN:
        return attributeValue < condition.value;

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return attributeValue >= condition.value;

      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return attributeValue <= condition.value;

      case ConditionOperator.CONTAINS:
        return (
          typeof attributeValue === 'string' &&
          attributeValue.includes(condition.value)
        );

      case ConditionOperator.STARTS_WITH:
        return (
          typeof attributeValue === 'string' &&
          attributeValue.startsWith(condition.value)
        );

      case ConditionOperator.ENDS_WITH:
        return (
          typeof attributeValue === 'string' &&
          attributeValue.endsWith(condition.value)
        );

      case ConditionOperator.EXISTS:
        return attributeValue !== undefined && attributeValue !== null;

      default:
        return false;
    }
  }

  /**
   * Get attribute value from context
   */
  private getAttributeValue(attribute: string, context: PolicyContext): any {
    // Support nested attributes using dot notation
    const parts = attribute.split('.');
    let value: any = { ...context, ...context.attributes };

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Register default policies
   */
  private registerDefaultPolicies(): void {
    // Owner access policy
    this.registerPolicy({
      id: 'owner-full-access',
      name: 'Owner Full Access',
      description: 'Resource owners have full access to their resources',
      effect: Effect.ALLOW,
      resources: [
        ResourceType.RESUME,
        ResourceType.APPLICATION,
        ResourceType.PROFILE,
        ResourceType.DOCUMENT,
      ],
      actions: [Action.READ, Action.UPDATE, Action.DELETE, Action.EXPORT],
      conditions: [
        {
          attribute: 'attributes.resourceOwnerId',
          operator: ConditionOperator.EQUALS,
          value: '${userId}', // Special placeholder
        },
      ],
      priority: 100,
    });

    // Public resource read access
    this.registerPolicy({
      id: 'public-read-access',
      name: 'Public Resource Read Access',
      description: 'Anyone can read public resources',
      effect: Effect.ALLOW,
      resources: [ResourceType.JOB, ResourceType.COMPANY],
      actions: [Action.READ],
      conditions: [
        {
          attribute: 'attributes.isPublic',
          operator: ConditionOperator.EQUALS,
          value: true,
        },
      ],
      priority: 50,
    });

    // Shared resource access
    this.registerPolicy({
      id: 'shared-resource-access',
      name: 'Shared Resource Access',
      description: 'Users can access resources shared with them',
      effect: Effect.ALLOW,
      resources: [
        ResourceType.DOCUMENT,
        ResourceType.RESUME,
        ResourceType.APPLICATION,
      ],
      actions: [Action.READ],
      conditions: [
        {
          attribute: 'userId',
          operator: ConditionOperator.IN,
          value: '${attributes.sharedWith}', // Special placeholder
        },
      ],
      priority: 75,
    });

    // Organization member access
    this.registerPolicy({
      id: 'organization-member-access',
      name: 'Organization Member Access',
      description: 'Organization members can access organization resources',
      effect: Effect.ALLOW,
      resources: [
        ResourceType.JOB,
        ResourceType.APPLICATION,
        ResourceType.COMPANY,
        ResourceType.ANALYTICS,
      ],
      actions: [Action.READ, Action.UPDATE],
      conditions: [
        {
          attribute: 'attributes.organizationId',
          operator: ConditionOperator.EQUALS,
          value: '${attributes.userOrganizationId}',
        },
      ],
      priority: 80,
    });

    // Prevent self-deletion
    this.registerPolicy({
      id: 'prevent-self-deletion',
      name: 'Prevent Self Deletion',
      description: 'Users cannot delete their own accounts',
      effect: Effect.DENY,
      resources: [ResourceType.USER],
      actions: [Action.DELETE],
      conditions: [
        {
          attribute: 'userId',
          operator: ConditionOperator.EQUALS,
          value: '${attributes.resourceId}',
        },
      ],
      priority: 200, // High priority to ensure it's evaluated first
    });
  }

  /**
   * Resolve special placeholders in condition values
   */
  resolveConditionValue(value: any, context: PolicyContext): any {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const path = value.slice(2, -1);
      return this.getAttributeValue(path, context);
    }
    return value;
  }

  /**
   * Check resource ownership
   */
  checkOwnership(userId: string, ownership: ResourceOwnership): boolean {
    return ownership.ownerId === userId;
  }

  /**
   * Check if user has access to shared resource
   */
  checkSharedAccess(userId: string, ownership: ResourceOwnership): boolean {
    return ownership.sharedWith?.includes(userId) || false;
  }

  /**
   * Check if resource is public
   */
  checkPublicAccess(ownership: ResourceOwnership): boolean {
    return ownership.isPublic || false;
  }

  /**
   * Check organization membership
   */
  checkOrganizationAccess(
    userOrgId: string | undefined,
    ownership: ResourceOwnership
  ): boolean {
    return !!userOrgId && userOrgId === ownership.organizationId;
  }

  /**
   * Get all registered policies
   */
  getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }
}

// Export singleton instance
export const policyEngine = new PolicyEngine();
