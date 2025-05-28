import * as P from 'parsimmon';
import { Rule, Condition, Calculation, Context, LineType } from './types';
import { RuleValidator, ValidationError } from './validation';

export class ParserError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ParserError';
    }
}

type RuleLine = { type: 'rule'; name: string; priority: number };
type SectionLine = { type: 'when' | 'then' | 'notes' };
type ConditionLine = { type: 'condition' } & Condition;
type CalculationLine = { type: 'calculation' } & Calculation;
type NoteLine = { type: 'note'; note: string };
type ParsedLine = RuleLine | SectionLine | ConditionLine | CalculationLine | NoteLine;

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
    ).map(([field, operator, value]: [string, string, string | number | boolean]): Condition => ({
        field,
        operator,
        value
    }));

    private static readonly calculation = P.regexp(/.*/).map((expr: string): Calculation => ({
        expression: expr.trim()
    }));

    private static readonly note = P.regexp(/.*/).map((note: string) => note.trim());

    private static readonly ruleHeader = P.seq(
        this.identifier.skip(this.whitespace),
        this.priority
    ).map(([name, priority]: [string, number]): { name: string; priority: number } => ({ name, priority }));

    private static readonly section = P.alt(
        P.string('When').result('when'),
        P.string('Then').result('then'),
        P.string('Notes').result('notes')
    );

    private static readonly line = P.seq(
        this.indent.many(),
        P.alt(
            this.ruleHeader.map((header: { name: string; priority: number }): RuleLine => ({ type: 'rule', ...header })),
            this.section.map((section: string): SectionLine => ({ type: section as 'when' | 'then' | 'notes' })),
            this.condition.map((condition: Condition): ConditionLine => ({ type: 'condition', ...condition })),
            this.calculation.map((calc: Calculation): CalculationLine => ({ type: 'calculation', ...calc })),
            this.note.map((note: string): NoteLine => ({ type: 'note', note }))
        )
    );

    private static readonly parser = this.line.sepBy(this.newline);
    private validator: RuleValidator;

    constructor() {
        this.validator = new RuleValidator();
    }

    public parseRule(ruleText: string): Rule {
        try {
            const lines = IndentedTreeParser.parser.parse(ruleText);
            if (!lines.status) {
                throw new ParserError(`Failed to parse rule: ${lines.expected.join(', ')}`);
            }

            let currentRule: Partial<Rule> = {};
            let currentSection: string | null = null;
            let conditions: Condition[] = [];
            let calculation: Calculation | null = null;
            let notes: string[] = [];

            for (const [_, line] of lines.value) {
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
} 