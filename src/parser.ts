import * as P from 'parsimmon';
import { Rule, Condition, Calculation, Context, LineType } from './types';
import { RuleValidator, ValidationError } from './validation';

export class ParserError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ParserError';
    }
}

export class IndentedTreeParser {
    private static readonly whitespace = P.regexp(/\s*/);
    private static readonly newline = P.string('\n');
    private static readonly indent = P.regexp(/^[ ]{4}/).map(() => 1);
    private static readonly priority = P.string('(').then(P.regexp(/\d+/).map(Number)).skip(P.string(')'));
    
    private static readonly identifier = P.regexp(/[a-zA-Z_][a-zA-Z0-9_]*/);
    private static readonly number = P.regexp(/-?(0|[1-9][0-9]*)([.][0-9]+)?/).map(Number);
    private static readonly string = P.regexp(/"([^"]*)"/, 1);
    private static readonly boolean = P.alt(P.string('true').result(true), P.string('false').result(false));
    
    private static readonly operator = P.alt(
        P.string('=='),
        P.string('!='),
        P.string('>='),
        P.string('<='),
        P.string('>'),
        P.string('<'),
        P.string('in')
    );

    private static readonly value = P.alt(
        this.number,
        this.string,
        this.boolean,
        this.identifier
    );

    private static readonly condition = P.seq(
        this.identifier.skip(this.whitespace),
        this.operator.skip(this.whitespace),
        this.value
    ).map(([field, operator, value]) => ({
        field,
        operator,
        value
    }));

    private static readonly calculation = P.regexp(/.*/).map(expr => ({
        expression: expr.trim()
    }));

    private static readonly note = P.regexp(/.*/).map(note => note.trim());

    private static readonly ruleHeader = P.seq(
        this.identifier.skip(this.whitespace),
        this.priority
    ).map(([name, priority]) => ({ name, priority }));

    private static readonly section = P.alt(
        P.string('When').result('when'),
        P.string('Then').result('then'),
        P.string('Notes').result('notes')
    );

    private static readonly line = P.seq(
        this.indent.many(),
        P.alt(
            this.ruleHeader.map(header => ({ type: 'rule' as LineType, ...header })),
            this.section.map(section => ({ type: section as LineType })),
            this.condition.map(condition => ({ type: 'condition' as LineType, ...condition })),
            this.calculation.map(calc => ({ type: 'calculation' as LineType, ...calc })),
            this.note.map(note => ({ type: 'note' as LineType, note }))
        )
    );

    private static readonly parser = this.line.sepBy(this.newline);
    private validator: RuleValidator;

    constructor() {
        this.validator = new RuleValidator();
    }

    public parseRule(ruleText: string): Rule {
        try {
            const lines = this.parser.parse(ruleText);
            if (!lines.status) {
                throw new ParserError(`Failed to parse rule: ${lines.expected.join(', ')}`);
            }

            let currentRule: Partial<Rule> = {};
            let currentSection: string | null = null;
            let conditions: Condition[] = [];
            let calculation: Calculation | null = null;
            let notes: string[] = [];

            for (const line of lines.value) {
                switch (line.type) {
                    case 'rule':
                        currentRule = {
                            name: line.name,
                            priority: line.priority,
                            conditions: []
                        };
                        break;
                    case 'when':
                        currentSection = 'when';
                        break;
                    case 'then':
                        currentSection = 'then';
                        break;
                    case 'notes':
                        currentSection = 'notes';
                        break;
                    case 'condition':
                        if (currentSection === 'when') {
                            conditions.push(line);
                        }
                        break;
                    case 'calculation':
                        if (currentSection === 'then') {
                            calculation = line;
                        }
                        break;
                    case 'note':
                        if (currentSection === 'notes') {
                            notes.push(line.note);
                        }
                        break;
                }
            }

            if (!currentRule.name || !currentRule.priority || !calculation) {
                throw new ParserError('Invalid rule structure: missing required sections');
            }

            const rule: Rule = {
                name: currentRule.name,
                priority: currentRule.priority,
                conditions,
                calculation,
                notes: notes.length > 0 ? notes.join('\n') : undefined
            };

            // Validate the parsed rule
            this.validator.validateRule(rule);

            return rule;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ParserError('Failed to parse rule', { originalError: error });
        }
    }

    public parseRules(rulesText: string): Rule[] {
        try {
            return rulesText
                .split('\n\n')
                .filter(block => block.trim())
                .map(block => this.parseRule(block));
        } catch (error) {
            if (error instanceof ValidationError || error instanceof ParserError) {
                throw error;
            }
            throw new ParserError('Failed to parse rules', { originalError: error });
        }
    }

    public evaluateRule(rule: Rule, context: Context): number {
        try {
            if (!this.evaluateConditions(rule.conditions, context)) {
                return 0;
            }

            const expression = this.substituteVariables(rule.calculation.expression, context);
            return this.evaluateExpression(expression);
        } catch (error) {
            throw new ParserError('Failed to evaluate rule', { 
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
            throw new ParserError(`Missing required field '${condition.field}' in context`);
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
                    return rightValue.includes(leftValue);
                }
                throw new ParserError(`Operator 'in' requires an array value`);
            default:
                throw new ParserError(`Invalid operator '${condition.operator}'`);
        }
    }

    private substituteVariables(expression: string, context: Context): string {
        return expression.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, match => {
            const value = context[match];
            if (value === undefined) {
                throw new ParserError(`Missing required variable '${match}' in context`);
            }
            return String(value);
        });
    }

    private evaluateExpression(expression: string): number {
        try {
            // In a real implementation, you'd want to use a proper expression evaluator
            // This is a simplified version that only handles basic arithmetic
            return Function(`return ${expression}`)();
        } catch (error) {
            throw new ParserError('Failed to evaluate expression', { 
                expression,
                originalError: error
            });
        }
    }
} 