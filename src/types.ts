export interface Condition {
    field: string;
    operator: string;
    value: string | number | boolean;
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
    [key: string]: string | number | boolean;
}

export type IndentLevel = number;
export type LineType = 'rule' | 'when' | 'then' | 'notes' | 'condition' | 'calculation' | 'note'; 