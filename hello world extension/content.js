 
let shortcuts = {};
chrome.storage.local.get("shortcuts", (result) => {
  shortcuts = result.shortcuts || {};
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.shortcuts) {
    shortcuts = changes.shortcuts.newValue || {};
  }
});

// Function to process special tags in snippet
function formatDate(date, format) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(num) {
      return num.toString().padStart(2, '0');
  }

  function getTimezone() {
      const offset = -date.getTimezoneOffset() / 60; // Offset in hours
      const sign = offset >= 0 ? '+' : '-';
      const absOffset = Math.abs(offset);
      return `GMT${sign}${pad(absOffset)}:00`; // e.g., GMT+00:00 or GMT-05:00
  }

  return format
      .replace("YYYY", date.getFullYear())
      .replace("MMMM", months[date.getMonth()])
      .replace("MM", pad(date.getMonth() + 1))
      .replace("Do", date.getDate() + (date.getDate() % 10 === 1 && date.getDate() !== 11 ? "st" : 
                                      date.getDate() % 10 === 2 && date.getDate() !== 12 ? "nd" : 
                                      date.getDate() % 10 === 3 && date.getDate() !== 13 ? "rd" : "th"))
      .replace("DD", pad(date.getDate()))
      .replace("D", date.getDate())
      .replace("dddd", days[date.getDay()])
      .replace("ddd", days[date.getDay()].substring(0, 3))
      .replace("HH", pad(date.getHours()))
      .replace("hh", pad(date.getHours() % 12 || 12))
      .replace("mm", pad(date.getMinutes()))
      .replace("ss", pad(date.getSeconds()))
      .replace("A", date.getHours() >= 12 ? "PM" : "AM")
      .replace("YYYY-MM-DD HH:mm:ss", `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`)
      .replace("MMMM Do, YYYY", `${months[date.getMonth()]} ${date.getDate()}${date.getDate() % 10 === 1 && date.getDate() !== 11 ? "st" : date.getDate() % 10 === 2 && date.getDate() !== 12 ? "nd" : date.getDate() % 10 === 3 && date.getDate() !== 13 ? "rd" : "th"}, ${date.getFullYear()}`)
      .replace("ddd, MMM D, YYYY HH:mm A", `${days[date.getDay()].substring(0, 3)}, ${months[date.getMonth()].substring(0, 3)} ${date.getDate()}, ${date.getFullYear()} ${pad(date.getHours() % 12 || 12)}:${pad(date.getMinutes())} ${date.getHours() >= 12 ? "PM" : "AM"}`)
      .replace("ISO", date.toISOString())
      .replace("Unix", Math.floor(date.getTime() / 1000).toString())
      .replace("D MMMM YYYY HH:mm", `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`)
      .replace("dddd, D MMMM YYYY", `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`)
      .replace("YYYY-MM-DDTHH:mm:ssZ", date.toISOString().replace('.000Z', 'Z'))
      .replace("MMMM D, YYYY h:mm A z", `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${pad(date.getHours() % 12 || 12)}:${pad(date.getMinutes())} ${date.getHours() >= 12 ? "PM" : "AM"} ${getTimezone()}`);
}

// Function to process special tags in snippet
function processSnippet(snippet) {
  let processedSnippet = snippet;
  
  // Handle {%time: FORMAT; shift=AMOUNT}
  processedSnippet = processedSnippet.replace(/{%time:\s*([^}]+)}/g, (match, format) => {
    const currentDate = new Date();
    return formatDate(currentDate, format.trim());
});
  processedSnippet = processedSnippet.replace(/{if:([^}]+)}(.*?)(?:{else}(.*?))?{endif}/gs, (match, condition, ifContent, elseContent) => {
    let evalCondition = condition.trim();
    
    try {
      const result = math.evaluate(evalCondition);
      console.log(result);
      return result ? ifContent : (elseContent || "");
    } catch (error) {
      console.log(error);
      return `[Error: ${error.message}]`;
    }
  });

  // Handle {repeat: number}...{endrepeat}
  processedSnippet = processedSnippet.replace(/{repeat:([^}]+)}(.*?){endrepeat}/gs, (match, repeatExpr, content) => {
    let evalRepeat = repeatExpr.trim();
    // for (const [varName, value] of Object.entries(variables)) {
    //   evalRepeat = evalRepeat.replace(new RegExp(varName, 'g'), value);
    // }
    try {
      const count = math.evaluate(evalRepeat);
      if (typeof count !== 'number' || isNaN(count)) {
        return "[Error: Invalid repeat count]";
      }
      const repeatCount = Math.floor(count); // Ensure integer
      return repeatCount >= 0 ? content.repeat(repeatCount) : "";
    } catch (error) {
      return `[Error: ${error.message}]`;
    }
  });

  // Handle math equations {=expression} (unchanged)
  
  // Replace {%copy} with clipboard content
  if (processedSnippet.includes("{%copy}")) {
    return navigator.clipboard.readText()
      .then(clipboardText => {
        return processedSnippet.replace("{%copy}", clipboardText || "");
      })
      .catch(() => {
        return processedSnippet.replace("{%copy}", "[Clipboard access denied]");
      });
  }

  return Promise.resolve(processedSnippet);
}

function processString(s) {
  let shortcutCandidate = "";
  for (let i = s.length - 1; i >= 0; i--) {
    const char = s[i];
    shortcutCandidate = char + shortcutCandidate;
    if (char === "/" || char === "#") {
      break;
    }
  }
  return shortcutCandidate.charAt(0) === "/" || shortcutCandidate.charAt(0) === "#" ? shortcutCandidate : "";
}

function replaceInInput(snippet) {
  const el = document.activeElement;
  const start = el.selectionStart;
  const valueBeforeCaret = el.value.slice(0, start);
  const lastWord = processString(valueBeforeCaret);

  processSnippet(snippet).then(finalSnippet => {
    finalSnippet = finalSnippet.replace(/\{=([^}]+)\}/g, (match, equation) => {
      try {
        const result = math.evaluate(equation);
        return Number.isInteger(result) ? result.toString() : result.toFixed(2);
      } catch (error) {
        return `[Error: ${error.message}]`;
      }
    });

    if (lastWord) {
      const newValue = valueBeforeCaret.slice(0, -lastWord.length) + finalSnippet + el.value.slice(start);
      el.value = newValue;
      const newCursorPos = start - lastWord.length + finalSnippet.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }
  });
}

function replaceInContentEditable(snippet) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const textNode = range.startContainer;
  const offset = range.startOffset;
  const textBeforeCaret = textNode.textContent.slice(0, offset);
  const lastWord = processString(textBeforeCaret);

  processSnippet(snippet).then(finalSnippet => {
    finalSnippet = finalSnippet.replace(/\{=([^}]+)\}/g, (match, equation) => {
      try {
        const result = math.evaluate(equation);
        return Number.isInteger(result) ? result.toString() : result.toFixed(2);
      } catch (error) {
        return `[Error: ${error.message}]`;
      }
    });

    const newText = textBeforeCaret.slice(0, -lastWord.length) + finalSnippet + textNode.textContent.slice(offset);
    textNode.textContent = newText;

    const newOffset = textBeforeCaret.length - lastWord.length + finalSnippet.length;
    range.setStart(textNode, newOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "finalString" && message.text) {
    const tagName = document.activeElement.tagName.toLowerCase();
    if (tagName === "input" || tagName === "textarea") {
      replaceInInput(message.text);
    } else {
      replaceInContentEditable(message.text);
    }
  }
});

function checkAndReplaceShortcut(el) {
  const tagName = el.tagName.toLowerCase();
  let lastWord = "";

  if (tagName === "input" || tagName === "textarea") {
    const start = el.selectionStart;
    lastWord = processString(el.value.slice(0, start));
  } else {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const offset = range.startOffset;
    lastWord = processString(textNode.textContent.slice(0, offset));
  }

  if (shortcuts.hasOwnProperty(lastWord)) {
    console.log(lastWord);
    const snippet = shortcuts[lastWord];
    if (lastWord[0] === "#") {
      chrome.runtime.sendMessage({ action: "openPopup", text: snippet });
    } else {
      tagName === "input" || tagName === "textarea" ? replaceInInput(snippet) : replaceInContentEditable(snippet);
    }
  }
}

document.addEventListener("input", (event) => {
  checkAndReplaceShortcut(event.target);
});