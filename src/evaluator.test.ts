import { RuleEvaluator } from './evaluator';
import { Rule, Context } from './types';
import { ParserError } from './parser';

describe('RuleEvaluator', () => {
    const evaluator = new RuleEvaluator();

    describe('Basic Rule Evaluation', () => {
        const basicRule: Rule = {
            name: 'Basic Sales Commission',
            priority: 1,
            conditions: [{
                field: 'sale_amount',
                operator: '>',
                value: 0
            }],
            calculation: {
                expression: 'sale_amount * 0.05'
            }
        };

        it('should evaluate a basic rule correctly', () => {
            const context: Context = {
                sale_amount: 1000
            };
            const commission = evaluator.evaluateRule(basicRule, context);
            expect(commission).toBe(50); // 1000 * 0.05
        });

        it('should return 0 when conditions are not met', () => {
            const context: Context = {
                sale_amount: 0
            };
            const commission = evaluator.evaluateRule(basicRule, context);
            expect(commission).toBe(0);
        });

        it('should throw ParserError for missing context field', () => {
            const context: Context = {};
            expect(() => evaluator.evaluateRule(basicRule, context))
                .toThrow(ParserError);
        });
    });

    describe('Complex Conditions', () => {
        const complexRule: Rule = {
            name: 'Premium Product Bonus',
            priority: 2,
            conditions: [
                {
                    field: 'product_type',
                    operator: '==',
                    value: 'premium'
                },
                {
                    field: 'sale_amount',
                    operator: '>=',
                    value: 10000
                }
            ],
            calculation: {
                expression: 'sale_amount * 0.02'
            }
        };

        it('should evaluate complex conditions correctly', () => {
            const context: Context = {
                product_type: 'premium',
                sale_amount: 15000
            };
            const commission = evaluator.evaluateRule(complexRule, context);
            expect(commission).toBe(300); // 15000 * 0.02
        });

        it('should return 0 when any condition is not met', () => {
            const context: Context = {
                product_type: 'standard',
                sale_amount: 15000
            };
            const commission = evaluator.evaluateRule(complexRule, context);
            expect(commission).toBe(0);
        });
    });

    describe('Array Conditions', () => {
        const arrayRule: Rule = {
            name: 'Category Bonus',
            priority: 3,
            conditions: [
                {
                    field: 'product_category',
                    operator: 'in',
                    value: ['electronics', 'furniture']
                },
                {
                    field: 'sale_amount',
                    operator: '>=',
                    value: 20000
                }
            ],
            calculation: {
                expression: 'sale_amount * 0.03'
            }
        };

        it('should evaluate array conditions correctly', () => {
            const context: Context = {
                product_category: 'electronics',
                sale_amount: 25000
            };
            const commission = evaluator.evaluateRule(arrayRule, context);
            expect(commission).toBe(750); // 25000 * 0.03
        });

        it('should return 0 when value is not in array', () => {
            const context: Context = {
                product_category: 'clothing',
                sale_amount: 25000
            };
            const commission = evaluator.evaluateRule(arrayRule, context);
            expect(commission).toBe(0);
        });

        it('should throw ParserError for invalid array value', () => {
            const invalidRule: Rule = {
                ...arrayRule,
                conditions: [{
                    field: 'product_category',
                    operator: 'in',
                    value: 'not_an_array'
                }]
            };
            const context: Context = {
                product_category: 'electronics',
                sale_amount: 25000
            };
            expect(() => evaluator.evaluateRule(invalidRule, context))
                .toThrow(ParserError);
        });
    });

    describe('Expression Evaluation', () => {
        const expressionRule: Rule = {
            name: 'Complex Calculation',
            priority: 4,
            conditions: [{
                field: 'sale_amount',
                operator: '>',
                value: 0
            }],
            calculation: {
                expression: '(sale_amount * 0.05) + if(sale_amount > 10000, 100, 0)'
            }
        };

        it('should evaluate complex expressions correctly', () => {
            const context1: Context = {
                sale_amount: 5000
            };
            expect(evaluator.evaluateRule(expressionRule, context1))
                .toBe(250); // (5000 * 0.05) + 0

            const context2: Context = {
                sale_amount: 15000
            };
            expect(evaluator.evaluateRule(expressionRule, context2))
                .toBe(850); // (15000 * 0.05) + 100
        });

        it('should throw ParserError for invalid expressions', () => {
            const invalidRule: Rule = {
                ...expressionRule,
                calculation: {
                    expression: 'sale_amount * (1 + 1' // Unbalanced parentheses
                }
            };
            const context: Context = {
                sale_amount: 1000
            };
            expect(() => evaluator.evaluateRule(invalidRule, context))
                .toThrow(ParserError);
        });
    });

    describe('Variable Substitution', () => {
        const variableRule: Rule = {
            name: 'Variable Calculation',
            priority: 5,
            conditions: [{
                field: 'sale_amount',
                operator: '>',
                value: 0
            }],
            calculation: {
                expression: 'sale_amount * commission_rate'
            }
        };

        it('should substitute variables correctly', () => {
            const context: Context = {
                sale_amount: 1000,
                commission_rate: 0.07
            };
            const commission = evaluator.evaluateRule(variableRule, context);
            expect(commission).toBe(70); // 1000 * 0.07
        });

        it('should throw ParserError for missing variables', () => {
            const context: Context = {
                sale_amount: 1000
            };
            expect(() => evaluator.evaluateRule(variableRule, context))
                .toThrow(ParserError);
        });
    });

    describe('Math Functions', () => {
        const mathRule: Rule = {
            name: 'Math Functions',
            priority: 6,
            conditions: [{
                field: 'sale_amount',
                operator: '>',
                value: 0
            }],
            calculation: {
                expression: 'round(sale_amount * 0.05) + min(sale_amount, 1000)'
            }
        };

        it('should evaluate math functions correctly', () => {
            const context: Context = {
                sale_amount: 1234.56
            };
            const commission = evaluator.evaluateRule(mathRule, context);
            expect(commission).toBe(1061.73); // round(1234.56 * 0.05) + min(1234.56, 1000)
        });
    });

    describe('Logical Operations', () => {
        const logicalRule: Rule = {
            name: 'Logical Operations',
            priority: 7,
            conditions: [{
                field: 'sale_amount',
                operator: '>',
                value: 0
            }],
            calculation: {
                expression: 'if(and(sale_amount > 1000, sale_amount < 5000), sale_amount * 0.05, sale_amount * 0.03)'
            }
        };

        it('should evaluate logical operations correctly', () => {
            const context1: Context = {
                sale_amount: 2000
            };
            expect(evaluator.evaluateRule(logicalRule, context1))
                .toBe(100); // 2000 * 0.05

            const context2: Context = {
                sale_amount: 6000
            };
            expect(evaluator.evaluateRule(logicalRule, context2))
                .toBe(180); // 6000 * 0.03
        });
    });

    describe('Complex Calculations', () => {
        const complexRule: Rule = {
            name: 'Complex Calculations',
            priority: 8,
            conditions: [{
                field: 'sale_amount',
                operator: '>',
                value: 0
            }],
            calculation: {
                expression: 'sqrt(pow(sale_amount, 2) + pow(bonus, 2)) * commission_rate'
            }
        };

        it('should evaluate complex calculations correctly', () => {
            const context: Context = {
                sale_amount: 3000,
                bonus: 4000,
                commission_rate: 0.02
            };
            const commission = evaluator.evaluateRule(complexRule, context);
            expect(commission).toBe(100); // sqrt(3000^2 + 4000^2) * 0.02
        });
    });
}); 