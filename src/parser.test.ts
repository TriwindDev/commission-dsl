import { IndentedTreeParser } from './parser';
import { Context } from './types';
import { ValidationError } from './validation';
import { ParserError } from './parser';

describe('IndentedTreeParser', () => {
    const parser = new IndentedTreeParser();

    const sampleRule = `
Basic Sales Commission (1)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05
    Notes
        Standard 5% commission on all sales
`;

    const sampleRules = `
Basic Sales Commission (1)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05
    Notes
        Standard 5% commission on all sales

Premium Product Bonus (2)
    When
        product_type = premium
        sale_amount >= 10000
    Then
        sale_amount * 0.02
    Notes
        Additional 2% for premium products
`;

    describe('Rule Parsing', () => {
        it('should parse a single rule', () => {
            const rule = parser.parseRule(sampleRule);
            expect(rule.name).toBe('Basic Sales Commission');
            expect(rule.priority).toBe(1);
            expect(rule.conditions).toHaveLength(1);
            expect(rule.calculation.expression).toBe('sale_amount * 0.05');
            expect(rule.notes).toBe('Standard 5% commission on all sales');
        });

        it('should parse multiple rules', () => {
            const rules = parser.parseRules(sampleRules);
            expect(rules).toHaveLength(2);
            expect(rules[0].name).toBe('Basic Sales Commission');
            expect(rules[1].name).toBe('Premium Product Bonus');
        });

        it('should throw ValidationError for invalid rule name', () => {
            const invalidRule = `
123Invalid Rule (1)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05
`;
            expect(() => parser.parseRule(invalidRule)).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid priority', () => {
            const invalidRule = `
Basic Sales Commission (101)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05
`;
            expect(() => parser.parseRule(invalidRule)).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid field', () => {
            const invalidRule = `
Basic Sales Commission (1)
    When
        invalid_field > 0
    Then
        sale_amount * 0.05
`;
            expect(() => parser.parseRule(invalidRule)).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid operator', () => {
            const invalidRule = `
Basic Sales Commission (1)
    When
        sale_amount => 0
    Then
        sale_amount * 0.05
`;
            expect(() => parser.parseRule(invalidRule)).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid calculation expression', () => {
            const invalidRule = `
Basic Sales Commission (1)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05 + @invalid
`;
            expect(() => parser.parseRule(invalidRule)).toThrow(ValidationError);
        });

        it('should throw ParserError for missing required sections', () => {
            const invalidRule = `
Basic Sales Commission (1)
    When
        sale_amount > 0
`;
            expect(() => parser.parseRule(invalidRule)).toThrow(ParserError);
        });
    });

    describe('Rule Evaluation', () => {
        it('should evaluate a rule correctly', () => {
            const rule = parser.parseRule(sampleRule);
            const context: Context = {
                sale_amount: 1000
            };
            const commission = parser.evaluateRule(rule, context);
            expect(commission).toBe(50); // 1000 * 0.05
        });

        it('should handle complex conditions', () => {
            const rule = parser.parseRule(`
Premium Product Bonus (2)
    When
        product_type = premium
        sale_amount >= 10000
    Then
        sale_amount * 0.02
    Notes
        Additional 2% for premium products
`);

            const context1: Context = {
                product_type: 'premium',
                sale_amount: 15000
            };
            expect(parser.evaluateRule(rule, context1)).toBe(300); // 15000 * 0.02

            const context2: Context = {
                product_type: 'standard',
                sale_amount: 15000
            };
            expect(parser.evaluateRule(rule, context2)).toBe(0); // Condition not met
        });

        it('should handle array conditions', () => {
            const rule = parser.parseRule(`
Category Bonus (3)
    When
        product_category in [electronics, furniture]
        sale_amount >= 20000
    Then
        sale_amount * 0.03
    Notes
        Bonus for specific categories
`);

            const context1: Context = {
                product_category: 'electronics',
                sale_amount: 25000
            };
            expect(parser.evaluateRule(rule, context1)).toBe(750); // 25000 * 0.03

            const context2: Context = {
                product_category: 'clothing',
                sale_amount: 25000
            };
            expect(parser.evaluateRule(rule, context2)).toBe(0); // Category not in list
        });

        it('should throw ParserError for missing context field', () => {
            const rule = parser.parseRule(sampleRule);
            const context: Context = {};
            expect(() => parser.evaluateRule(rule, context)).toThrow(ParserError);
        });

        it('should throw ParserError for invalid expression', () => {
            const rule = parser.parseRule(`
Invalid Expression (1)
    When
        sale_amount > 0
    Then
        sale_amount * (1 + 1
`);
            const context: Context = {
                sale_amount: 1000
            };
            expect(() => parser.evaluateRule(rule, context)).toThrow(ParserError);
        });

        it('should throw ParserError for invalid array condition', () => {
            const rule = parser.parseRule(`
Invalid Array (1)
    When
        product_category in invalid_value
        sale_amount > 0
    Then
        sale_amount * 0.05
`);
            const context: Context = {
                product_category: 'electronics',
                sale_amount: 1000
            };
            expect(() => parser.evaluateRule(rule, context)).toThrow(ParserError);
        });
    });
}); 