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
}); 