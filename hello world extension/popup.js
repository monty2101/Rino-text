document.addEventListener("DOMContentLoaded", function () {
    chrome.runtime.sendMessage({ action: "getStoredString" }, function (response) {
        let templateString = response.text || "Default text with {%data}.";
        let container = document.getElementById("dynamicInputs");
        
        // Store variables and their input elements
        let variables = {};
        let inputs = []; // For {%data} inputs
        let calcElements = []; // For {=equation} displays
        
        // Split the string by {%...} and {=...}
        const regex = /({%[^}]+}|{=[^}]+})/g;
        let parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(templateString)) !== null) {
            parts.push(templateString.slice(lastIndex, match.index));
            parts.push(match[0]);
            lastIndex = regex.lastIndex;
        }
        parts.push(templateString.slice(lastIndex));

        // Create inputs and calculation displays
        parts.forEach((part, i) => {
            if (part.match(/{%data}/)) {
                let input = document.createElement("input");
                input.type = "text";
                input.placeholder = "Enter value";
                inputs.push(input);
                container.appendChild(input);
            } 
            else if (part.match(/{%(\w+)\s*=\s*(\d+)}/)) {
                const [, varName, defaultValue] = part.match(/{%(\w+)\s*=\s*(\d+)}/);
                const numValue = parseFloat(defaultValue);
                variables[varName] = numValue;

                let input = document.createElement("input");
                input.type = "number";
                input.value = numValue;
                input.dataset.varName = varName;
                input.addEventListener("input", () => {
                    variables[varName] = parseFloat(input.value) || 0;
                    updateCalculations();
                });
                inputs.push(input);
                container.appendChild(input);
            } 
            else if (part.match(/{=([^}]+)}/)) {
                let span = document.createElement("span");
                span.className = "calc-result";
                span.dataset.expression = part.match(/{=([^}]+)}/)[1];
                calcElements.push(span);
                container.appendChild(span);
            } 
            else {
                container.appendChild(document.createTextNode(part));
            }
        });

        // Function to update calculations dynamically
        function updateCalculations() {
            calcElements.forEach(span => {
                let expression = span.dataset.expression;
                let evalExpression = expression;
                
                // Replace variable names with current values
                for (const [varName, value] of Object.entries(variables)) {
                    evalExpression = evalExpression.replace(new RegExp(varName, 'g'), value);
                }
                
                try {
                    const result = math.evaluate(evalExpression);
                    span.textContent = Number.isInteger(result) ? result : result.toFixed(2);
                } catch (error) {
                    span.textContent = `[Error: ${error.message}]`;
                }
            });
            
            // Return the final string for submission
            let finalString = "";
            let inputIndex = 0;
            let calcIndex = 0;

            parts.forEach(part => {
                if (part.match(/{%data}/)) {
                    finalString += inputs[inputIndex].value || "";
                    inputIndex++;
                } 
                else if (part.match(/{%(\w+)\s*=\s*(\d+)}/)) {
                    const varName = part.match(/{%(\w+)\s*=\s*(\d+)}/)[1];
                    finalString += variables[varName];
                    inputIndex++;
                } 
                else if (part.match(/{=([^}]+)}/)) {
                    finalString += calcElements[calcIndex].textContent;
                    calcIndex++;
                } 
                else {
                    finalString += part;
                }
            });
            
            return finalString;
        }

        // Initial calculation update
        updateCalculations();

        document.getElementById("insertBtn").addEventListener("click", function () {
            const finalString = updateCalculations();
            chrome.runtime.sendMessage({ action: "finalString", text: finalString });
            window.close();
        });
    });
});
// document.addEventListener("DOMContentLoaded", function () {
//     // Request stored string from background script
//     chrome.runtime.sendMessage({ action: "getStoredString" }, function (response) {
//         let templateString = response.text || "Default text with {%data}.";

//         let container = document.getElementById("dynamicInputs");
//         let parts = templateString.split(/{%data}/g);
//         let inputs = [];

//         for (let i = 0; i < parts.length; i++) {
//             container.appendChild(document.createTextNode(parts[i]));
//             if (i < parts.length - 1) {
//                 let input = document.createElement("input");
//                 input.type = "text";
//                 input.placeholder = "Enter value";
//                 inputs.push(input);
//                 container.appendChild(input);
//             }
//         }

//         document.getElementById("insertBtn").addEventListener("click", function () {
//             let finalString = "";
//             let inputIndex = 0;

//             for (let i = 0; i < parts.length; i++) {
//                 finalString += parts[i];
//                 if (i < parts.length - 1) {
//                     finalString += inputs[inputIndex].value || "{%data}";
//                     inputIndex++;
//                 }
//             }

//             // Send final string back to background script
//             chrome.runtime.sendMessage({ action: "finalString", text: finalString });

//             // Close the popup
//             window.close();
//         });
//     });
// });
// document.addEventListener("DOMContentLoaded", function () {
//     // Request stored string from background script
//     chrome.runtime.sendMessage({ action: "getStoredString" }, function (response) {
//         let templateString = response.text || "Default text with {%price=10} and {%name=John}.";

//         let container = document.getElementById("dynamicInputs");
//         let regex = /{%([^}=]+)(?:=([^}]*))?}/g;
//         let parts = [];
//         let match;
//         let lastIndex = 0;
//         let inputs = [];
//         let variables = {}; // Store input values

//         // Process template string and extract variables
//         while ((match = regex.exec(templateString)) !== null) {
//             parts.push(templateString.slice(lastIndex, match.index)); // Text before {%...}
//             lastIndex = regex.lastIndex; // Update last index

//             let varName = match[1].trim(); // Extract variable name
//             let defaultValue = match[2] ? match[2].trim() : ""; // Extract default value (if present)

//             // Create input field
//             let input = document.createElement("input");
//             input.type = "text";
//             input.placeholder = `Enter ${varName}`;
//             input.value = defaultValue; // Set default value if available
//             inputs.push({ varName, input });
//             container.appendChild(document.createTextNode(parts[parts.length - 1]));
//             container.appendChild(input);
//         }
        
//         parts.push(templateString.slice(lastIndex)); // Remaining text
//         container.appendChild(document.createTextNode(parts[parts.length - 1]));

//         document.getElementById("insertBtn").addEventListener("click", function () {
//             let finalString = "";
//             let inputIndex = 0;

//             for (let i = 0; i < parts.length; i++) {
//                 finalString += parts[i];
//                 if (i < parts.length - 1) {
//                     let { varName, input } = inputs[inputIndex];
//                     variables[varName] = input.value || ""; // Store input value
//                     finalString += input.value;
//                     inputIndex++;
//                 }
//             }
            
//             // Send final string and variables back to background script
//             chrome.runtime.sendMessage({ action: "finalString", text: finalString, variables });

//             // Close the popup
//             window.close();
//         });
//     });
// });
// document.addEventListener("DOMContentLoaded", function () {
//     chrome.runtime.sendMessage({ action: "getStoredString" }, function (response) {
//         let templateString = response.text || "Default text with {%price=10, defaultvalue=5} and {%name=John, defaultvalue=Alice}. Total: {=price + 5}";

//         let container = document.getElementById("dynamicInputs");
//         let regex = /{%([\w]+)(?:=([^,}]+))?(?:,\s*defaultvalue\s*=\s*([^}]+))?}|{=([^}]+)}/g;
//         let parts = [];
//         let match;
//         let lastIndex = 0;
//         let inputs = [];
//         let variables = {};

//         while ((match = regex.exec(templateString)) !== null) {
//             parts.push(templateString.slice(lastIndex, match.index));
//             lastIndex = regex.lastIndex;

//             if (match[1]) { // Input field
//                 let varName = match[1].trim();
//                 let defaultValue = match[3] ? match[3].trim() : (match[2] ? match[2].trim() : "");

//                 let input = document.createElement("input");
                
//                 input.placeholder = `Enter ${varName}`;
//                 input.value = defaultValue;
//                 input.id = varName;
//                 input.className = varName;
//                 inputs.push({ varName, input });
//                 container.appendChild(document.createTextNode(parts[parts.length - 1]));
//                 container.appendChild(input);

//                 variables[varName] = defaultValue;
//             } else if (match[4]) { // Equation
//                 let equation = match[4].trim();
//                 let span = document.createElement("span");
//                 span.textContent = `{=${equation}}`;
//                 span.dataset.equation = equation;
//                 container.appendChild(document.createTextNode(parts[parts.length - 1]));
//                 container.appendChild(span);
//             }
//         }
        
//         parts.push(templateString.slice(lastIndex));
//         container.appendChild(document.createTextNode(parts[parts.length - 1]));

//         // Update equations when inputs change
//         inputs.forEach(({ input }) => {
//             input.addEventListener("input", updateEquations);
//         });

//         function updateEquations() {
//             inputs.forEach(({ varName, input }) => {
//                 variables[varName] = parseFloat(input.value) || 0;
//             });

//             container.querySelectorAll("span[data-equation]").forEach(span => {
//                 let equation = span.dataset.equation;
//                 try {
//                     let result = new Function(...Object.keys(variables), `return ${equation}`)(...Object.values(variables));
//                     span.textContent = result;
//                 } catch (error) {
//                     span.textContent = "Error";
//                 }
//             });
//         }

//         updateEquations(); // Initial update

//         document.getElementById("insertBtn").addEventListener("click", function () {
//             let finalString = templateString.replace(regex, (match, varName, _, __, equation) => {
//                 if (varName) {
//                     return variables[varName] || "";
//                 } else if (equation) {
//                     try {
//                         return new Function(...Object.keys(variables), `return ${equation}`)(...Object.values(variables));
//                     } catch (error) {
//                         return "Error";
//                     }
//                 }
//             });

//             chrome.runtime.sendMessage({ action: "finalString", text: finalString, variables });
//             window.close();
//         });
//     });
// });
// document.addEventListener("DOMContentLoaded", function () {
//     // Request the stored snippet (template string) from the background script.
//     chrome.runtime.sendMessage({ action: "getStoredString" }, function (response) {
//     // Example default snippet if none is stored:
//     // – {%} creates a generic text input.
//     // – {%name = a} creates a numeric input with id and class "name" (no default, so empty means 0).
//     // – {%price = a,defaultvalue = 5} creates a numeric input with default value 5.
//     // – {=price + 5} creates a span that displays the result of the math expression.
//     let templateString = response.text ||
//     "Default text with {%price = a,defaultvalue = 5} and {%name = a,defaultvalue = Alice}. Total: {=price + 5} and a generic {%} input.";
// let container = document.getElementById("dynamicInputs");

// // Our regex matches two kinds of tokens:
// //  -  {% ...} tokens – where the first capture (group 1) will be the variable identifier;
// //      if this is empty then it’s a generic text input.
// //    Optionally, an "=" value (group 2) and a defaultvalue (group 3) may be provided.
// //  -  {= ...} tokens – where group 4 captures the math expression.
// let tokenRegex = /{%\s*([\w]*)\s*(?:=\s*([^,}]+))?(?:,\s*defaultvalue\s*=\s*([^}]+))?\s*}|{=\s*([^}]+)\s*}/g;

// // 'parts' will hold the pieces (plain text, input elements, or equation spans)
// let parts = [];
// let lastIndex = 0;
// // Stores all numeric input elements by variable name for use in equation evaluation.
// let numericInputs = {};

// // Iterate through the templateString and create DOM elements as needed.
// let match;
// while ((match = tokenRegex.exec(templateString)) !== null) {
//   // Append any plain text that comes before the currently matched token.
//   if (match.index > lastIndex) {
//     const textSegment = templateString.slice(lastIndex, match.index);
//     container.appendChild(document.createTextNode(textSegment));
//     parts.push(textSegment);
//   }
//   lastIndex = tokenRegex.lastIndex;

//   // Check if this is an equation token {= ...}
//   if (match) {
//     let equation = match.trim();
//     let eqSpan = document.createElement("span");
//     // Store the equation string so we can recalc when input changes.
//     eqSpan.dataset.equation = equation;
//     // Initially set the text to the evaluation result.
//     try {
//       eqSpan.textContent = evaluateEquation(equation, numericInputs);
//     } catch (error) {
//       eqSpan.textContent = "Error";
//     }
//     container.appendChild(eqSpan);
//     parts.push(eqSpan);
//   } else {
//     // It is a {% ...} token.
//     // Group 1 holds the variable name (if provided). If blank, we create a generic input.
//     let varName = (match || "").trim();
//     // Group 2 (if provided) is some placeholder text (which may be unused).
//     let placeholderText = match ? match.trim() : "";
//     // Group 3 (if provided) is the default value.
//     let defaultValue = match ? match.trim() : "";

//     if (varName === "") {
//       // Generic input (type="text") that can hold anything.
//       let input = document.createElement("input");
//       input.type = "text";
//       input.placeholder = "Enter value";
//       container.appendChild(input);
//       parts.push(input);
//     } else {
//       // Numeric input. Use type="number" and set id/class to the variable name.
//       let input = document.createElement("input");
//       input.type = "number";
//       input.id = varName;
//       input.className = varName;
//       // If a placeholder text (the part after "=") is provided, use it; otherwise use a default prompt.
//       input.placeholder = placeholderText || `Enter ${varName}`;
//       // Set the default value if provided. (If empty, leave blank; evaluation will treat blank as 0.)
//       input.value = defaultValue;
//       container.appendChild(input);
//       parts.push(input);
//       numericInputs[varName] = input;
//     }
//   }
// }
// // Append any remaining text after the last token.
// if (lastIndex < templateString.length) {
//   let textSegment = templateString.slice(lastIndex);
//   container.appendChild(document.createTextNode(textSegment));
//   parts.push(textSegment);
// }

// // Helper function: evaluate an equation (as a string) using the current numeric input values.
// function evaluateEquation(equation, inputsMap) {
//   let varNames = Object.keys(inputsMap);
//   // For each numeric input, parse its value as a float; blanks are treated as 0.
//   let varValues = varNames.map(name => parseFloat(inputsMap[name].value) || 0);
//   // Create a new function dynamically that returns the evaluation of the equation.
//   return new Function(...varNames, `return ${equation}`)(...varValues);
// }

// // Whenever any numeric input value changes, update all equation spans.
// function updateEquations() {
//   container.querySelectorAll("span[data-equation]").forEach(eqSpan => {
//     let eq = eqSpan.dataset.equation;
//     try {
//       let result = evaluateEquation(eq, numericInputs);
//       eqSpan.textContent = result;
//     } catch (e) {
//       eqSpan.textContent = "Error";
//     }
//   });
// }

// // Attach an "input" event listener on every numeric input.
// Object.values(numericInputs).forEach(input => {
//   input.addEventListener("input", updateEquations);
// });
// // Do an initial update of equations.
// updateEquations();

// // When the insert button is clicked, reassemble the final string using the parts array.
// document.getElementById("insertBtn").addEventListener("click", function () {
//   let finalString = "";
//   parts.forEach(piece => {
//     // If piece is a simple string, use it.
//     if (typeof piece === "string") {
//       finalString += piece;
//     }
//     // If piece is an input element, append its value.
//     else if (piece.tagName === "INPUT") {
//       finalString += piece.value;
//     }
//     // For equation spans, append the (visible) textContent.
//     else if (piece.tagName === "SPAN") {
//       finalString += piece.textContent;
//     }
//   });

//   // Build a variables object from numeric inputs (treat empty values as 0).
//   let variables = {};
//   Object.keys(numericInputs).forEach(varName => {
//     variables[varName] = parseFloat(numericInputs[varName].value) || 0;
//   });

//   // Send the final string and variables object back to the background script.
//   chrome.runtime.sendMessage({ action: "finalString", text: finalString, variables: variables });

//   // Close the popup.
//   window.close();
// });
//     });
// });
