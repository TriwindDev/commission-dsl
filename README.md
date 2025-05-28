# Commission DSL

A Domain Specific Language for authoring and evaluating sales commission rules using an indented tree structure.

## Installation

```bash
npm install
```

## Usage

The Commission DSL allows you to define rules for calculating sales commissions in a simple, indented tree format. Here's an example:

```typescript
import { CommissionDslParser } from './src/parser';
import { RuleEvaluator } from './src/evaluator';

// Create parser and evaluator instances
const parser = new CommissionDslParser();
const evaluator = new RuleEvaluator();

// Define a rule
const ruleText = `
Basic Sales Commission (1)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05
    Notes
        Standard 5% commission on all sales
`;

// Parse the rule
const rule = parser.parseRule(ruleText);

// Evaluate the rule with a context
const context = {
    sale_amount: 1000
};

// Option 1: Use the parser's evaluateRule method
const commission1 = parser.evaluateRule(rule, context);

// Option 2: Use the evaluator directly
const commission2 = evaluator.evaluateRule(rule, context);

console.log(commission1); // Output: 50
console.log(commission2); // Output: 50
```

## Architecture

The DSL is split into three main components:

1. **Parser** (`CommissionDslParser`): Handles parsing of rule text into structured data
   - Converts text into Rule objects
   - Validates rule structure
   - Provides error handling for parsing issues

2. **Validator** (`RuleValidator`): Ensures rules are valid and well-formed
   - Validates rule names, priorities, and structure
   - Checks field and operator validity
   - Ensures calculation expressions are valid
   - Provides detailed validation error messages

3. **Evaluator** (`RuleEvaluator`): Handles rule evaluation and calculation
   - Evaluates conditions against context
   - Substitutes variables in expressions
   - Performs calculations
   - Provides error handling for evaluation issues

## Rule Format

Rules are defined using an indented tree structure:

```
Rule Name (Priority)
    When
        condition1
        condition2
    Then
        calculation
    Notes
        Optional notes
```

### Components

1. **Rule Name**: A unique identifier for the rule
   - Must start with a letter
   - Can contain letters, numbers, spaces, and underscores
   - Maximum length: 100 characters

2. **Priority**: A number in parentheses indicating the rule's priority
   - Must be an integer between 1 and 100
   - Higher numbers indicate higher priority

3. **When**: Conditions that must be met for the rule to apply
   - At least one condition is required
   - Maximum of 10 conditions per rule
   - Each condition must use a valid field and operator

4. **Then**: The calculation to perform when conditions are met
   - Must be a valid mathematical expression
   - Can reference context variables
   - Must use valid operators and functions

5. **Notes**: Optional notes explaining the rule
   - Maximum length: 500 characters

### Valid Fields

The following fields are available for use in conditions:

- `sale_amount`: The total amount of the sale
- `product_type`: The type of product (e.g., 'premium', 'standard')
- `product_category`: The category of the product
- `region`: The sales region
- `monthly_sales`: Total sales for the month
- `is_new_customer`: Whether the customer is new
- `total_monthly_sales`: Total sales for the month
- `team_size`: Size of the sales team
- `team_monthly_sales`: Team's total sales for the month
- `team_attendance_rate`: Team's attendance rate
- `is_seasonal_promotion`: Whether there's a seasonal promotion
- `customer_loyalty_years`: Years of customer loyalty
- `payment_method`: Method of payment
- `primary_product_amount`: Amount of primary product
- `cross_sold_products`: Number of cross-sold products
- `cross_sold_amount`: Amount of cross-sold products
- `account_type`: Type of account
- `contract_value`: Value of the contract
- `contract_duration`: Duration of the contract
- `payment_received_within_days`: Days until payment received
- `referred_customer`: Whether customer was referred
- `referred_sale_amount`: Amount of referred sale
- `referral_source`: Source of referral
- `bundle_items`: Number of items in bundle
- `bundle_value`: Value of the bundle
- `bundle_discount`: Discount on the bundle
- `quarter`: Current quarter
- `quarterly_sales`: Sales for the quarter
- `quarterly_target_achievement`: Achievement of quarterly target
- `customer_tenure`: Customer's tenure
- `renewal_amount`: Amount of renewal
- `renewal_products`: Number of renewal products
- `is_emergency_order`: Whether it's an emergency order
- `delivery_time`: Time of delivery
- `order_value`: Value of the order
- `is_international_sale`: Whether it's an international sale
- `currency`: Currency of the sale
- `is_new_product_launch`: Whether it's a new product launch
- `launch_period_days`: Days since launch
- `launch_sales`: Sales during launch period
- `customer_satisfaction_score`: Customer satisfaction score
- `repeat_purchase`: Whether it's a repeat purchase

### Valid Operators

Conditions can use the following operators:
- `==` (equals)
- `!=` (not equals)
- `>` (greater than)
- `<` (less than)
- `>=` (greater than or equal)
- `<=` (less than or equal)
- `in` (value in array)

### Example Rules

```typescript
// Basic commission rule
Basic Sales Commission (1)
    When
        sale_amount > 0
    Then
        sale_amount * 0.05
    Notes
        Standard 5% commission on all sales

// Premium product bonus
Premium Product Bonus (2)
    When
        product_type = premium
        sale_amount >= 10000
    Then
        sale_amount * 0.02
    Notes
        Additional 2% for premium products

// Category-based bonus
Category Bonus (3)
    When
        product_category in [electronics, furniture]
        sale_amount >= 20000
    Then
        sale_amount * 0.03
    Notes
        Bonus for specific categories
```

## Error Handling

The DSL provides comprehensive error handling through three main error types:

### ValidationError

Thrown when a rule fails validation:

```typescript
try {
    const rule = parser.parseRule(invalidRule);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error('Validation error:', error.message);
        console.error('Details:', error.details);
    }
}
```

Common validation errors:
- Invalid rule name format
- Priority out of range (1-100)
- Invalid field name
- Invalid operator
- Invalid calculation expression
- Missing required sections
- Notes too long
- Too many conditions

### ParserError

Thrown when there are issues with parsing or evaluation:

```typescript
try {
    const commission = parser.evaluateRule(rule, context);
} catch (error) {
    if (error instanceof ParserError) {
        console.error('Parser error:', error.message);
        console.error('Details:', error.details);
    }
}
```

Common parser errors:
- Missing required context fields
- Invalid expression syntax
- Invalid array condition
- Unbalanced parentheses
- Invalid mathematical operations

## Features

- Clear, hierarchical structure
- Easy to read and write
- Support for complex conditions
- Priority-based rule evaluation
- Mathematical expressions in calculations
- TypeScript support
- Comprehensive validation
- Detailed error handling
- Comprehensive test coverage
- Modular architecture

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

## License

MIT 