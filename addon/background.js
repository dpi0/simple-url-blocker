// background.js
let blockedUrls = [];

// Load blocked URLs from storage
browser.storage.local.get("blockedUrls").then((result) => {
    if (result.blockedUrls) {
        blockedUrls = result.blockedUrls;
    }
});

// Create context menu items
browser.contextMenus.create({
    id: "block-current-url",
    title: "Block this URL",
    contexts: ["page"],
});

browser.contextMenus.create({
    id: "block-current-domain",
    title: "Block entire site",
    contexts: ["page"],
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "block-current-url") {
        // Add exact URL to block list
        addUrlToBlockList(tab.url);
    } else if (info.menuItemId === "block-current-domain") {
        // Add wildcard URL to block list
        const url = new URL(tab.url);
        const domainUrl = `${url.protocol}//${url.hostname}/*`;
        addUrlToBlockList(domainUrl);
    }
});

// Function to add a URL to the block list
function addUrlToBlockList(url) {
    if (!blockedUrls.includes(url)) {
        blockedUrls.push(url);
        updateBlockedUrls(blockedUrls);

        // Show notification
        browser.tabs.create({
            url: "popup.html",
        });
    }
}

// Listen for web requests and block matching URLs
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        const url = details.url;

        // Check for exact matches
        if (blockedUrls.includes(url)) {
            return { redirectUrl: browser.runtime.getURL("blocked.html") };
        }

        // Check for wildcard matches (URLs ending with *)
        for (const blockedUrl of blockedUrls) {
            if (blockedUrl.endsWith("*")) {
                const prefix = blockedUrl.slice(0, -1); // Remove the * character
                if (url.startsWith(prefix)) {
                    return { redirectUrl: browser.runtime.getURL("blocked.html") };
                }
            }
        }

        return { cancel: false };
    },
    { urls: ["<all_urls>"] },
    ["blocking"],
);

// Function to update the blocked URLs list
function updateBlockedUrls(newList) {
    blockedUrls = newList;
    browser.storage.local.set({ blockedUrls: newList });
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getUrls") {
        sendResponse({ urls: blockedUrls });
    } else if (message.action === "updateUrls") {
        updateBlockedUrls(message.urls);
        sendResponse({ success: true });
    }
    return true;
});
