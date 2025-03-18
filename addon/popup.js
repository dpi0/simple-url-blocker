// popup.js
document.addEventListener("DOMContentLoaded", function() {
    const urlListTextarea = document.getElementById("urlList");
    const saveButton = document.getElementById("saveButton");
    const statusDiv = document.getElementById("status");

    // Load the current list of blocked URLs
    browser.runtime.sendMessage({ action: "getUrls" }).then((response) => {
        if (response && response.urls) {
            urlListTextarea.value = response.urls.join("\n");
        }
    });

    // Save the list when the button is clicked
    saveButton.addEventListener("click", function() {
        const urls = urlListTextarea.value
            .split("\n")
            .map((url) => url.trim())
            .filter((url) => url !== "");

        browser.runtime
            .sendMessage({
                action: "updateUrls",
                urls: urls,
            })
            .then((response) => {
                if (response && response.success) {
                    statusDiv.textContent = "URLs saved successfully!";
                    setTimeout(() => {
                        statusDiv.textContent = "";
                    }, 3000);
                }
            });
    });
});
