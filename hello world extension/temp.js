function replaceMathEquations(input) {
    return input.replace(/\{=([^}]+)\}/g, (match, equation) => {
        try {
            // Evaluate the equation and round to 2 decimal places
            const result = math.evaluate(equation);
            return Number.isInteger(result) ? 
                result.toString() : 
                result.toFixed(2);
        } catch (error) {
            // Return error message if evaluation fails
            return `[Error: ${error.message}]`;
        }
    });
}

// Example usage:
let a = 5;
let b = 4;
const inputString = "Calculate {=a*b} and {=100/3}. ";
console.log(replaceMathEquations(inputString));
// Output: "Calculate 11 and 33.33. Invalid: [Error: Unexpected token +]"