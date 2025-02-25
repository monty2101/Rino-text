// document.addEventListener("DOMContentLoaded", () => {
//     const shortcutsList = document.getElementById("shortcuts-list");
//     const newShortcutInput = document.getElementById("newShortcut");
//     const newSnippetInput = document.getElementById("newSnippet");
//     const addShortcutButton = document.getElementById("addShortcut");
//     const openDashboardButton = document.getElementById("openDashboard"); // New button reference

//     // Load saved shortcuts from chrome.storage.local when the page loads
//     chrome.storage.local.get("shortcuts", (result) => {
//         const savedShortcuts = result.shortcuts || {};
//         console.log(savedShortcuts);
//         renderShortcuts(savedShortcuts);
//     });
//     chrome.storage.onChanged.addListener((changes) => {
//         const savedShortcuts = result.shortcuts || {};
//         console.log(savedShortcuts);
//         renderShortcuts(savedShortcuts);
//       });

//     // Function to update shortcuts in chrome.storage.local and re-render UI
//     function updateChromeStorageShortcuts(newShortcut, newSnippet) {
//         // Retrieve existing shortcuts from chrome.storage.local
//         chrome.storage.local.get("shortcuts", (result) => {
//             let shortcuts = result.shortcuts || {};

//             // Update the shortcut with the new snippet
//             shortcuts[newShortcut] = newSnippet;

//             // Save the updated shortcuts back to chrome.storage.local
//             chrome.storage.local.set({ shortcuts: shortcuts }, () => {
//                 // Re-render the UI with the updated shortcuts
//                 renderShortcuts(shortcuts);

//                 // Clear input fields
//                 newShortcutInput.value = "";
//                 newSnippetInput.value = "";
//             });
//         });
//     }

//     // Function to render shortcuts in the UI
//     function renderShortcuts(shortcuts) {
//         shortcutsList.innerHTML = "";  // Clear the existing list
//         console.log(shortcuts);
//         // Iterate through each shortcut and display it in the UI
//         Object.entries(shortcuts).forEach(([key, value]) => {
//             const item = document.createElement("div");
//             item.className = "shortcut-item";

//             // Create input for shortcut
//             const shortcutInput = document.createElement("input");
//             shortcutInput.type = "text";
//             shortcutInput.value = key;
//             shortcutInput.readOnly = true;

//             // Create input for snippet
//             const snippetInput = document.createElement("input");
//             snippetInput.type = "text";
//             snippetInput.value = value;

//             // Event listener for snippet input change
//             snippetInput.addEventListener("input", () => {
//                 updateChromeStorageShortcuts(key, snippetInput.value);
//             });

//             // Create delete button
//             const deleteButton = document.createElement("button");
//             deleteButton.className = "delete-btn";
//             deleteButton.innerText = "X";

//             // Event listener for delete button
//             deleteButton.addEventListener("click", () => {
//                 chrome.storage.local.get("shortcuts", (result) => {
//                     let shortcuts = result.shortcuts || {};
//                     delete shortcuts[key];  // Delete the shortcut
//                     chrome.storage.local.set({ shortcuts: shortcuts }, () => {
//                         renderShortcuts(shortcuts);  // Re-render after deletion
//                     });
//                 });
//             });

//             // Append inputs and delete button to shortcut item
//             item.appendChild(shortcutInput);
//             item.appendChild(snippetInput);
//             item.appendChild(deleteButton);

//             // Append shortcut item to the list
//             shortcutsList.appendChild(item);
//         });
//     }

//     // Event listener for adding a new shortcut
//     addShortcutButton.addEventListener("click", () => {
//         const newShortcut = newShortcutInput.value.trim();
//         const newSnippet = newSnippetInput.value.trim();

//         // Validate input
//         if (newShortcut && newSnippet) {
//             updateChromeStorageShortcuts(newShortcut, newSnippet);
//         }
//     });

//     // Event listener for opening the dashboard in a new tab
//     openDashboardButton.addEventListener("click", () => {
//         chrome.tabs.create({
//             url: chrome.runtime.getURL('index.html')
//         });
//     });
// });
document.addEventListener("DOMContentLoaded", () => {
    const shortcutsList = document.getElementById("shortcuts-list");
    const newShortcutInput = document.getElementById("newShortcut");
    const newSnippetInput = document.getElementById("newSnippet");
    const addShortcutButton = document.getElementById("addShortcut");
    const openDashboardButton = document.getElementById("openDashboard"); // New button reference

    // Load saved shortcuts from chrome.storage.local when the page loads
    function loadShortcuts() {
        chrome.storage.local.get("shortcuts", (result) => {
            const savedShortcuts = result.shortcuts || {};
            console.log("Loaded shortcuts:", savedShortcuts);
            renderShortcuts(savedShortcuts);
        });
    }

    // Listen for changes in chrome.storage.local to update the UI in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "local" && changes.shortcuts) {
            const newShortcuts = changes.shortcuts.newValue || {};
            console.log("Storage changed, new shortcuts:", newShortcuts);
            renderShortcuts(newShortcuts);
        }
    });

    // Function to update shortcuts in chrome.storage.local and re-render UI
    function updateChromeStorageShortcuts(newShortcut, newSnippet) {
        // Retrieve existing shortcuts from chrome.storage.local
        chrome.storage.local.get("shortcuts", (result) => {
            let shortcuts = result.shortcuts || {};

            // Update the shortcut with the new snippet
            shortcuts[newShortcut] = newSnippet;

            // Save the updated shortcuts back to chrome.storage.local
            chrome.storage.local.set({ shortcuts: shortcuts }, () => {
                console.log("Shortcut updated:", { newShortcut, newSnippet });
                // Re-render the UI with the updated shortcuts
                renderShortcuts(shortcuts);

                // Clear input fields
                newShortcutInput.value = "";
                newSnippetInput.value = "";
            });
        });
    }

    // Function to render shortcuts in the UI
    function renderShortcuts(shortcuts) {
        shortcutsList.innerHTML = "";  // Clear the existing list
        console.log("Rendering shortcuts:", shortcuts);
        // Iterate through each shortcut and display it in the UI
        Object.entries(shortcuts).forEach(([key, value]) => {
            const item = document.createElement("div");
            item.className = "shortcut-item";

            // Create input for shortcut
            const shortcutInput = document.createElement("input");
            shortcutInput.type = "text";
            shortcutInput.value = key;
            shortcutInput.readOnly = true;

            // Create input for snippet
            const snippetInput = document.createElement("input");
            snippetInput.type = "text";
            snippetInput.value = value;

            // Event listener for snippet input change
            snippetInput.addEventListener("input", () => {
                updateChromeStorageShortcuts(key, snippetInput.value);
            });

            // Create delete button
            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.innerText = "X";

            // Event listener for delete button
            deleteButton.addEventListener("click", () => {
                chrome.storage.local.get("shortcuts", (result) => {
                    let shortcuts = result.shortcuts || {};
                    delete shortcuts[key];  // Delete the shortcut
                    chrome.storage.local.set({ shortcuts: shortcuts }, () => {
                        console.log("Shortcut deleted:", key);
                        renderShortcuts(shortcuts);  // Re-render after deletion
                    });
                });
            });

            // Append inputs and delete button to shortcut item
            item.appendChild(shortcutInput);
            item.appendChild(snippetInput);
            item.appendChild(deleteButton);

            // Append shortcut item to the list
            shortcutsList.appendChild(item);
        });
    }

    // Event listener for adding a new shortcut
    addShortcutButton.addEventListener("click", () => {
        const newShortcut = newShortcutInput.value.trim();
        const newSnippet = newSnippetInput.value.trim();

        // Validate input
        if (newShortcut && newSnippet) {
            if (newShortcut in (chrome.storage.local.get("shortcuts") || {})) {
                alert("Shortcut already exists! Please use a different shortcut.");
            } else {
                updateChromeStorageShortcuts(newShortcut, newSnippet);
            }
        } else {
            alert("Please enter both a shortcut and a snippet.");
        }
    });

    // Event listener for opening the dashboard in a new tab
    openDashboardButton.addEventListener("click", () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('index.html')
        });
    });

    // Initial load of shortcuts
    loadShortcuts();
});