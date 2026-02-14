chrome.action.onClicked.addListener((tab) => {
    if (tab.url?.startsWith('http')) {
        chrome.tabs.sendMessage(tab.id, { action: "toggle_lighthub_panel" })
        .catch(() => console.log("Refresh page to activate LightHub."));
    }
});