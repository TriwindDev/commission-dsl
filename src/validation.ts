import { Rule, Condition, Calculation } from './types';

export class ValidationError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class RuleValidator {
    private static readonly validOperators = ['==', '!=', '>', '<', '>=', '<=', 'in'];
    private static readonly validFields = [
        'sale_amount',
        'product_type',
        'product_category',
        'region',
        'monthly_sales',
        'is_new_customer',
        'total_monthly_sales',
        'team_size',
        'team_monthly_sales',
        'team_attendance_rate',
        'is_seasonal_promotion',
        'customer_loyalty_years',
        'payment_method',
        'primary_product_amount',
        'cross_sold_products',
        'cross_sold_amount',
        'account_type',
        'contract_value',
        'contract_duration',
        'payment_received_within_days',
        'referred_customer',
        'referred_sale_amount',
        'referral_source',
        'bundle_items',
        'bundle_value',
        'bundle_discount',
        'quarter',
        'quarterly_sales',
        'quarterly_target_achievement',
        'customer_tenure',
        'renewal_amount',
        'renewal_products',
        'is_emergency_order',
        'delivery_time',
        'order_value',
        'is_international_sale',
        'currency',
        'is_new_product_launch',
        'launch_period_days',
        'launch_sales',
        'customer_satisfaction_score',
        'repeat_purchase'
    ];

    public validateRule(rule: Rule): void {
        this.validateRuleName(rule.name);
        this.validatePriority(rule.priority);
        this.validateConditions(rule.conditions);
        this.validateCalculation(rule.calculation);
        this.validateNotes(rule.notes);
    }

    private validateRuleName(name: string): void {
        if (!name || typeof name !== 'string') {
            throw new ValidationError('Rule name is required and must be a string');
        }
        if (name.length > 100) {
            throw new ValidationError('Rule name must be less than 100 characters');
        }
        if (!/^[a-zA-Z][a-zA-Z0-9_ ]*$/.test(name)) {
            throw new ValidationError('Rule name must start with a letter and contain only letters, numbers, spaces, and underscores');
        }
    }

    private validatePriority(priority: number): void {
        if (typeof priority !== 'number' || !Number.isInteger(priority)) {
            throw new ValidationError('Priority must be an integer');
        }
        if (priority < 1 || priority > 100) {
            throw new ValidationError('Priority must be between 1 and 100');
        }
    }

    private validateConditions(conditions: Condition[]): void {
        if (!Array.isArray(conditions)) {
            throw new ValidationError('Conditions must be an array');
        }
        if (conditions.length === 0) {
            throw new ValidationError('At least one condition is required');
        }
        if (conditions.length > 10) {
            throw new ValidationError('Maximum of 10 conditions allowed per rule');
        }

        conditions.forEach((condition, index) => {
            this.validateCondition(condition, index);
        });
    }

    private validateCondition(condition: Condition, index: number): void {
        if (!this.validFields.includes(condition.field)) {
            throw new ValidationError(
                `Invalid field '${condition.field}' in condition ${index + 1}`,
                { validFields: this.validFields }
            );
        }

        if (!this.validOperators.includes(condition.operator)) {
            throw new ValidationError(
                `Invalid operator '${condition.operator}' in condition ${index + 1}`,
                { validOperators: this.validOperators }
            );
        }

        this.validateConditionValue(condition, index);
    }

    private validateConditionValue(condition: Condition, index: number): void {
        if (condition.operator === 'in') {
            if (!Array.isArray(condition.value)) {
                throw new ValidationError(
                    `Operator 'in' requires an array value in condition ${index + 1}`
                );
            }
            if (condition.value.length === 0) {
                throw new ValidationError(
                    `Array value cannot be empty in condition ${index + 1}`
                );
            }
            if (condition.value.length > 10) {
                throw new ValidationError(
                    `Array value cannot have more than 10 items in condition ${index + 1}`
                );
            }
        } else {
            if (typeof condition.value === 'undefined' || condition.value === null) {
                throw new ValidationError(
                    `Value is required in condition ${index + 1}`
                );
            }
        }
    }

    private validateCalculation(calculation: Calculation): void {
        if (!calculation || typeof calculation.expression !== 'string') {
            throw new ValidationError('Calculation expression is required and must be a string');
        }

        // Basic expression validation
        const expression = calculation.expression.trim();
        if (!expression) {
            throw new ValidationError('Calculation expression cannot be empty');
        }

        // Check for basic arithmetic operations
        if (!/^[a-zA-Z0-9_+\-*/(). ]+$/.test(expression)) {
            throw new ValidationError(
                'Calculation expression contains invalid characters',
                { expression }
            );
        }

        // Check for balanced parentheses
        let parentheses = 0;
        for (const char of expression) {
            if (char === '(') parentheses++;
            if (char === ')') parentheses--;
            if (parentheses < 0) {
                throw new ValidationError(
                    'Unbalanced parentheses in calculation expression',
                    { expression }
                );
            }
        }
        if (parentheses !== 0) {
            throw new ValidationError(
                'Unbalanced parentheses in calculation expression',
                { expression }
            );
        }
    }

    private validateNotes(notes?: string): void {
        if (notes !== undefined && typeof notes !== 'string') {
            throw new ValidationError('Notes must be a string if provided');
        }
        if (notes && notes.length > 500) {
            throw new ValidationError('Notes must be less than 500 characters');
        }
    }
} 