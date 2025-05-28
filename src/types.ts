export type LineType = 'rule' | 'when' | 'then' | 'notes' | 'condition' | 'calculation' | 'note';

export type Operator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in';

export interface Condition {
    field: string;
    operator: Operator;
    value: string | number | boolean | (string | number | boolean)[];
}

export interface Calculation {
    expression: string;
}

export interface Rule {
    name: string;
    priority: number;
    conditions: Condition[];
    calculation: Calculation;
    notes?: string;
}

export interface Context {
    [key: string]: string | number | boolean | (string | number | boolean)[];
}

export type IndentLevel = number; 