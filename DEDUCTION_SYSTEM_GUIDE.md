# Advanced Deduction System Guide

## Overview

The new deduction system implements intelligent unit-based consumption for recipe ingredients when orders are processed. It handles complex scenarios where ingredients are consumed in partial units and manages stock levels accurately.

## Key Features

### 🎯 **Unit-Based Consumption**
- Calculates exact consumption based on recipe requirements
- Handles partial unit consumption intelligently
- Maintains accurate stock and quantity levels

### 🔄 **Smart Stock Management**
- Deducts full units when necessary
- Tracks remaining quantities in opened units
- Prevents negative stock levels

### 📊 **Comprehensive Logging**
- Detailed console logs for debugging
- Step-by-step calculation tracking
- Clear deduction summaries

## How It Works

### Example Scenario

**Ingredients:**
- Coca-Cola: stock=2, quantity=250ml per unit
- Fernet: stock=3, quantity=750ml per unit  
- Ice: stock=3, quantity=4000g per unit

**Recipe "Cocktails" requires:**
- Coca-Cola: 150ml per cocktail
- Fernet: 40ml per cocktail
- Ice: 3g per cocktail

**Order: 3 cocktails**

### Calculation Process

#### Coca-Cola Deduction:
```
Total consumption: 150ml × 3 = 450ml
Units needed: 450ml ÷ 250ml = 1.8 units
Full units to deduct: 1 unit
Remaining in last unit: 250ml - (450ml % 250ml) = 50ml

Result:
- Stock: 2 → 1 (1 full unit consumed)
- Quantity: 250ml → 50ml (remaining in opened unit)
```

#### Fernet Deduction:
```
Total consumption: 40ml × 3 = 120ml
Units needed: 120ml ÷ 750ml = 0.16 units
Full units to deduct: 0 units
Partial consumption: 120ml from current unit

Result:
- Stock: 3 → 3 (no full units consumed)
- Quantity: 750ml → 630ml (120ml consumed from current unit)
```

#### Ice Deduction:
```
Total consumption: 3g × 3 = 9g
Units needed: 9g ÷ 4000g = 0.00225 units
Full units to deduct: 0 units
Partial consumption: 9g from current unit

Result:
- Stock: 3 → 3 (no full units consumed)
- Quantity: 4000g → 3991g (9g consumed from current unit)
```

## System Architecture

### Core Functions

#### 1. `deductRecipeIngredients(productId, orderQuantity, barId)`
- **Purpose**: Handles recipe-based products with multiple ingredients
- **Process**: 
  - Fetches recipe ingredients
  - Calculates consumption for each ingredient
  - Updates ingredient stock and quantities
  - Updates recipe_ingredients deduct values

#### 2. `deductIndividualIngredient(productId, orderQuantity, consumedAmount)`
- **Purpose**: Handles individual ingredient products
- **Process**:
  - Calculates unit-based consumption
  - Updates ingredient stock and quantity
  - Handles partial unit scenarios

#### 3. Helper Functions
- `validateSufficientStock()`: Validates stock availability
- `logDeductionSummary()`: Provides detailed logging

### Database Updates

The system updates multiple tables:

1. **ingredients**: Stock and quantity levels
2. **recipe_ingredients**: Available deduct amounts
3. **products**: Associated product stock (if applicable)

## Error Handling

### Stock Validation
```javascript
if (availableStock < Math.ceil(unitsNeeded)) {
  throw new Error(`Insufficient stock for ${ingredientName}:
    Available: ${availableStock} units
    Required: ${Math.ceil(unitsNeeded)} units
    Total consumption needed: ${totalConsumption}${unit}
    
    Please restock ${ingredientName} before processing this order.`);
}
```

### Comprehensive Error Messages
- Clear indication of what ingredient is insufficient
- Exact amounts available vs required
- Actionable guidance for resolution

## Integration Points

### Order Processing Flow
1. **Recipe Products**: Try `deductRecipeIngredients()` first
2. **Individual Ingredients**: Fall back to `deductIndividualIngredient()`
3. **Regular Products**: Use inventory or direct product deduction

### API Endpoints
- **PUT /api/orders**: Main order processing endpoint
- Automatically triggers deduction when order status = "delivered"
- Handles payment processing and stock deduction in sequence

## Logging and Debugging

### Console Output Example
```
🔄 Starting deduction for product abc123, quantity: 3
📋 Found 3 ingredients for recipe

🧪 Processing ingredient: Coca-Cola
📊 Current state - Stock: 2, Quantity: 250ml
📝 Recipe requires - Quantity per unit: 150ml
🔢 Total consumption needed: 450ml (150ml × 3)
📦 Units calculation:
   - Quantity per unit: 250ml
   - Units needed: 1.800
   - Full units to deduct: 1
   - Remaining in last unit: 50ml
✅ Multi-unit consumption: 1 full units consumed, 50ml remaining in opened unit
🎯 Final values - New Stock: 1, New Quantity: 50ml

📊 DEDUCTION SUMMARY for Coca-Cola:
   🔢 Order Quantity: 3
   🥤 Total Consumption: 450ml
   📦 Stock: 2 → 1 (1 units consumed)
   🧪 Quantity: 250ml → 50ml (200ml consumed)
   ✅ Deduction completed successfully
```

## Benefits

### 🎯 **Accuracy**
- Precise unit-based calculations
- No rounding errors or approximations
- Maintains exact inventory levels

### 🔄 **Flexibility**
- Handles any unit type (ml, g, pieces, etc.)
- Works with any recipe complexity
- Supports partial unit consumption

### 📊 **Transparency**
- Detailed logging for audit trails
- Clear error messages for troubleshooting
- Step-by-step calculation visibility

### 🛡️ **Reliability**
- Comprehensive error handling
- Stock validation before processing
- Atomic operations to prevent data corruption

## Usage Examples

### Creating a Recipe Product
1. Create ingredients with proper units and quantities
2. Create recipe with ingredient requirements
3. Link recipe to product via recipe_ingredients table
4. Set product.has_recipe = true

### Processing Orders
1. Order gets created with order_items
2. Order status changes to "delivered"
3. System automatically processes deductions
4. Stock levels update in real-time

This system ensures accurate inventory management while providing clear visibility into all stock movements and calculations.
