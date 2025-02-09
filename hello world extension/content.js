/**
 * content.js
 *
 * Listens for input events on text fields and textareas,
 * detects if a shortcut (word starting with "/") is typed,
 * and replaces it with the corresponding snippet.
 */

// console.log("Content script loaded");

let shortcuts = {
  "/hello": "Hello, world!",
  "/g": "Goodbye, world!",
};

/**
 * Extracts the last "word" that starts with a slash from the provided string.
 *
 * @param {string} s - The string to process.
 * @returns {string} - The shortcut (e.g., "/v") if found; otherwise, an empty string.
 */
function processString(s) {
  let shortcutCandidate = "";
  
  // Traverse the string backward.
  for (let i = s.length - 1; i >= 0; i--) {
    const char = s[i];
    
    // Prepend the character since we're scanning backward.
    shortcutCandidate = char + shortcutCandidate;
    if (char === "/") {
      break;
    }
  }
  
  // Check that the candidate indeed starts with a slash.
  if (shortcutCandidate.charAt(0) === "/") {
    return shortcutCandidate;
  }
  return "";
}

/**
 * Checks the input field or textarea to see if the text immediately preceding
 * the caret matches any defined shortcut. If a match is found, it replaces the
 * shortcut with the corresponding snippet.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} el - The text field element.
 */

// function checkAndReplaceShortcut(el) {
//   // Ensure the element supports selectionStart and that el.value is a string.

   
//   const textBeforeCaret = el.textContent;
//   console.log("Text before caret:", textBeforeCaret);
  
//   const lastWord = processString(textBeforeCaret);
//   console.log("Detected shortcut candidate:", lastWord);

//   if (lastWord && shortcuts.hasOwnProperty(lastWord)) {
//     const snippet = shortcuts[lastWord];
//     const newValue =
//       textBeforeCaret.substring(0,textBeforeCaret.length -lastWord.length) + // text before the shortcut
//       snippet ;                     // text after the caret

//      el.innerHTML = newValue;
//      el.focus();

//     // Set cursor position to the end
//     el.setSelectionRange(el.innerHTML.length, el.innerHTML.length);
//   }
// }
function checkAndReplaceShortcut(el) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
  
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const offset = range.startOffset;
  
    // Get text before caret from the text node
    const textBeforeCaret = textNode.textContent.slice(0, offset);
    const lastWord = processString(textBeforeCaret);
    console.log("Detected shortcut candidate:", lastWord);
    console.log(shortcuts);
    if (lastWord && shortcuts.hasOwnProperty(lastWord)) {
      const snippet = shortcuts[lastWord];
      const newText = textBeforeCaret.slice(0, -lastWord.length) + snippet;
  
      // Create new text node with modified content
      const newTextNode = document.createTextNode(newText);
      
      // Insert the modified text
      textNode.parentNode.insertBefore(newTextNode, textNode);
      
      // Remove the original text node
      textNode.parentNode.removeChild(textNode);
  
      // Create new range after inserted text
      const newRange = document.createRange();
      newRange.setStart(newTextNode, newText.length);
      newRange.collapse(true);
  
      // Update selection
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

document.addEventListener("input", (event) => {
  const target = document.activeElement;
  console.log("Input event on:", target);
  
  //  shortcuts = JSON.parse(localStorage.getItem("shortcuts")) || {};
    checkAndReplaceShortcut(target);
  
});


