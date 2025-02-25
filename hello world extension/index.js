// Date formatting function
function formatDate(date, format) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function pad(num) {
        return num.toString().padStart(2, '0');
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
        .replace("dddd, D MMMM YYYY", `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`);
}

// Function to process and repeat text
function processRepeat(text) {
    return text.replace(/{repeat:\s*(\d+)\s*}(.+?){endrepeat}/g, (match, count, data) => {
        const repeatCount = parseInt(count, 10);
        if (isNaN(repeatCount) || repeatCount < 0) return match; // Invalid count, return original
        return Array(repeatCount).fill(data.trim()).join(' ');
    });
}

// Function to process if/else conditions
function processIfElse(text) {
    return text.replace(/{if:\s*([^}]+)}(.*?){else}(.*?){endif}/gs, (match, condition, trueData, falseData) => {
        try {
            // Evaluate the condition (simple JavaScript evaluation, be cautious with security)
            const result = eval(condition);
            return result ? trueData.trim() : falseData.trim();
        } catch (e) {
            console.error('Error evaluating condition:', e);
            return match; // Return original if evaluation fails
        }
    });
}

// Function to process all dynamic content (time, repeat, if/else)
function processDynamicContent(content) {
    let processed = content;

    // Process time formats
    processed = processed.replace(/{%time:\s*([^}]+)}/g, (match, format) => {
        const currentDate = new Date();
        return formatDate(currentDate, format.trim());
    });

    // Process repeat
    processed = processRepeat(processed);

    // Process if/else
    processed = processIfElse(processed);

    return processed;
}

// Load existing snippets from chrome.storage.local
// function loadSnippets() {
//     chrome.storage.local.get("shortcuts", (result) => {
//         const shortcuts = result.shortcuts || {};
//         const snippetList = document.getElementById('snippetList');
//         snippetList.innerHTML = '';
//         for (let key in shortcuts) {
//             const li = document.createElement('li');
//             let processedContent = processDynamicContent(shortcuts[key].content); // Process dynamic content
//             li.textContent = `${key} - ${shortcuts[key].label} (Preview: ${processedContent.substring(0, 20)}...)`;
//             li.onclick = () => loadSnippet(key);
//             snippetList.appendChild(li);
//         }
//     });
// }

// Load a specific snippet into the editor
function loadSnippet(key) {
    chrome.storage.local.get("shortcuts", (result) => {
        const snippet = result.shortcuts[key];
        if (snippet) {
            let processedContent = processDynamicContent(snippet.content); // Process dynamic content
            document.getElementById('snippetLabel').value = snippet.label;
            document.getElementById('snippetShortcut').value = key;
            document.getElementById('snippetContent').value = processedContent;
        }
    });
}

// Save a new or updated snippet
document.getElementById('saveSnippet').addEventListener('click', () => {
    const label = document.getElementById('snippetLabel').value;
    const shortcut = document.getElementById('snippetShortcut').value;
    const content = document.getElementById('snippetContent').value;

    if (shortcut && label && content) {
        chrome.storage.local.get("shortcuts", (result) => {
            let shortcuts = result.shortcuts || {};

            // Store the raw content (without processing) to allow dynamic evaluation later
            shortcuts[shortcut] =  content ;

            // Save the updated shortcuts back to chrome.storage.local
            chrome.storage.local.set({ shortcuts: shortcuts }, () => {
                loadSnippets();
                console.log('Snippet saved successfully');
            });
        });
    } else {
        alert('Please fill in all fields (Label, Shortcut, and Content)');
    }
});

// New snippet button
document.getElementById('newSnippet').addEventListener('click', () => {
    document.getElementById('snippetLabel').value = '';
    document.getElementById('snippetShortcut').value = '';
    document.getElementById('snippetContent').value = '';
});

// Date insertion
document.getElementById('insertDate').addEventListener('click', () => {
    const dateFormats = [
        '{%time: MM/DYYYY}',                    // e.g., 02/24/2025
        '{%time: YYYY-MM-DD}',                    // e.g., 2025-02-24
        '{%time: DD-MM-YYYY}',                    // e.g., 24-02-2025
        '{%time: YYYY-MM-DD HH:mm:ss}',          // e.g., 2025-02-24 14:30:45
        '{%time: MMMM Do, YYYY}',                // e.g., February 24th, 2025
        '{%time: ddd, MMM D, YYYY HH:mm A}',     // e.g., Mon, Feb 24, 2025 02:30 PM
        // New simple time formats
        '{%time: HH:mm}',                        // e.g., 14:30
        '{%time: hh:mm A}',                      // e.g., 02:30 PM
        '{%time: HH:mm:ss}',                     // e.g., 14:30:45
        // New date and time combinations
        '{%time: D MMMM YYYY HH:mm}',            // e.g., 24 February 2025 14:30
        '{%time: dddd, D MMMM YYYY}',            // e.g., Monday, 24 February 2025
    ];

    // Show a prompt or modal to select a format
    const formatOptions = dateFormats.map((fmt, index) => `${index + 1}. ${fmt.replace('{%time: ', '').replace('}', '')}`).join('\n');
    const format = prompt(`Select date/time format:\n${formatOptions}`, '1');
    
    const content = document.getElementById('snippetContent');
    const selectedIndex = parseInt(format) - 1;
    const selectedFormat = dateFormats[selectedIndex] || dateFormats[0];
    
    content.value += selectedFormat;
});

// Clipboard insertion
document.getElementById('insertClipboard').addEventListener('click', () => {
    navigator.clipboard.readText().then(text => {
        const content = document.getElementById('snippetContent');
        content.value += '{%copy}';
    }).catch(err => console.error('Failed to read clipboard:', err));
});

// Text field insertion
document.getElementById('insertText').addEventListener('click', () => {
    const content = document.getElementById('snippetContent');
    content.value += '{%data}';
});

// Formula insertion
document.getElementById('insertFormula').addEventListener('click', () => {
    const equation = prompt('Enter math equation (e.g., 2 + 3 * 4):', '');
    if (equation) {
        const content = document.getElementById('snippetContent');
        content.value += `{= ${equation}}`;
    }
});

// Repeat insertion
document.getElementById('insertRepeat').addEventListener('click', () => {
    const count = prompt('Enter the number of times to repeat:', '3');
    const data = prompt('Enter the text to repeat:', 'text');
    if (count && data) {
        const repeatCount = parseInt(count, 10);
        if (!isNaN(repeatCount) && repeatCount > 0) {
            const content = document.getElementById('snippetContent');
            content.value += `{repeat: ${repeatCount}}${data}{endrepeat}`;
        } else {
            alert('Please enter a valid positive number for repetition.');
        }
    }
});

// If/Else insertion
document.getElementById('insertIfElse').addEventListener('click', () => {
    const condition = prompt('Enter the condition (e.g., 100 < 10):', '100 < 10');
    const trueData = prompt('Enter text if condition is true:', 'hi');
    const falseData = prompt('Enter text if condition is false:', 'hi there');
    if (condition && trueData && falseData) {
        const content = document.getElementById('snippetContent');
        content.value += `{if: ${condition}}${trueData}{else}${falseData}{endif}`;
    }
});

// Initial load
loadSnippets();