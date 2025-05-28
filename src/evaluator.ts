import { Rule, Condition, Context } from './types';
import * as math from 'mathjs';

export class EvaluatorError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'EvaluatorError';
    }
}

export class RuleEvaluator {
    private readonly mathScope: Record<string, any>;

    constructor() {
        // Initialize math scope with common functions and constants
        this.mathScope = {
            // Add common mathematical functions
            abs: Math.abs,
            ceil: Math.ceil,
            floor: Math.floor,
            round: Math.round,
            min: Math.min,
            max: Math.max,
            pow: Math.pow,
            sqrt: Math.sqrt,
            // Add logical operators
            and: (a: number, b: number) => a && b,
            or: (a: number, b: number) => a || b,
            not: (a: number) => !a,
            // Add comparison functions
            eq: (a: number, b: number) => a === b,
            neq: (a: number, b: number) => a !== b,
            gt: (a: number, b: number) => a > b,
            lt: (a: number, b: number) => a < b,
            gte: (a: number, b: number) => a >= b,
            lte: (a: number, b: number) => a <= b,
            // Add conditional function
            if: (condition: boolean, trueValue: number, falseValue: number) => 
                condition ? trueValue : falseValue
        };
    }

    public evaluateRule(rule: Rule, context: Context): number {
        try {
            if (!this.evaluateConditions(rule.conditions, context)) {
                return 0;
            }

            const expression = this.substituteVariables(rule.calculation.expression, context);
            return this.evaluateExpression(expression);
        } catch (error) {
            throw new EvaluatorError('Failed to evaluate rule', { 
                rule,
                context,
                originalError: error
            });
        }
    }

    private evaluateConditions(conditions: Condition[], context: Context): boolean {
        return conditions.every(condition => this.evaluateCondition(condition, context));
    }

    private evaluateCondition(condition: Condition, context: Context): boolean {
        const leftValue = context[condition.field];
        if (leftValue === undefined) {
            throw new EvaluatorError(`Missing required field '${condition.field}' in context`);
        }

        const rightValue = typeof condition.value === 'string' && context[condition.value] !== undefined
            ? context[condition.value]
            : condition.value;

        switch (condition.operator) {
            case '==':
                return leftValue === rightValue;
            case '!=':
                return leftValue !== rightValue;
            case '>':
                return leftValue > rightValue;
            case '<':
                return leftValue < rightValue;
            case '>=':
                return leftValue >= rightValue;
            case '<=':
                return leftValue <= rightValue;
            case 'in':
                if (Array.isArray(rightValue)) {
                    return rightValue.includes(leftValue as string | number | boolean);
                }
                throw new EvaluatorError(`Operator 'in' requires an array value`);
            default:
                throw new EvaluatorError(`Invalid operator '${condition.operator}'`);
        }
    }

    private substituteVariables(expression: string, context: Context): string {
        // Create a scope with context variables
        const scope = { ...this.mathScope, ...context };
        
        // Replace variable references with their values
        return expression.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, match => {
            const value = context[match];
            if (value === undefined) {
                throw new EvaluatorError(`Missing required variable '${match}' in context`);
            }
            return String(value);
        });
    }

    private evaluateExpression(expression: string): number {
        try {
            // Use mathjs to evaluate the expression
            const result = math.evaluate(expression, this.mathScope);
            
            // Ensure the result is a number
            if (typeof result !== 'number' || !Number.isFinite(result)) {
                throw new Error('Expression must evaluate to a finite number');
            }
            
            return result;
        } catch (error) {
            throw new EvaluatorError('Failed to evaluate expression', { 
                expression,
                originalError: error
            });
        }
    }
} 