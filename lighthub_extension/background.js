chrome.action.onClicked.addListener(async (tab) => {
    // Only run on actual webpages and ignore internal chrome error/warning pages
    if (tab.url?.startsWith('http') && !tab.url.includes('chrome-error://')) {
        try {
            // 1. Try to "Ping" the content script
            chrome.tabs.sendMessage(tab.id, { action: "ping" }, (response) => {
                // If we get an error or no response, we need to inject
                if (chrome.runtime.lastError || !response) {
                    injectAndToggle(tab.id);
                } else {
                    // Script responded! Just toggle.
                    chrome.tabs.sendMessage(tab.id, { action: "toggle_lighthub_panel" });
                }
            });
        } catch (err) {
            console.warn("Lighthub: Injection prevented by browser security.");
        }
    }
});

async function injectAndToggle(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        });
        
        // Wait for DOM to settle, then open panel
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: "toggle_lighthub_panel" })
                .catch(() => { /* Silent catch for frame errors */ });
        }, 200);
    } catch (e) {
        console.error("Critical Injection Error:", e);
    }
}