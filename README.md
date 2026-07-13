# API Capture Pro - Network Inspector

API Capture Pro is a lightweight, high-performance DevTools Extension designed for developers, testers, and API enthusiasts. It intercepts and logs network requests directly inside your Chrome or Edge Developer Tools, allowing you to easily filter, inspect request/response payloads, generate cURL commands for CMD or Bash, and export logs as JSON.

## Install

You can install **API Capture Pro** directly from the **Microsoft Edge Add-ons Store**:

👉 [**Get API Capture Pro on Microsoft Edge Add-ons**](https://microsoftedge.microsoft.com/addons/detail/api-capture-pro-network/fpfojfhahooemomlcncbgpdabigmlmie)


## Features

- 🔍 **Real-time Capture:** Intercepts Fetch/XHR and document requests dynamically as they happen.
- 🎯 **Advanced Filtering:** 
  - Filter by domain via a dynamic dropdown list.
  - Filter by URL path with instant search input.
  - Toggle between "Fetch/XHR only" or all resources.
- 📋 **Detailed Inspection Pane:**
  - **Headers:** View general request details, response headers, and request headers.
  - **Payload:** Inspect request bodies (auto-formatted as JSON if applicable).
  - **Response:** Inspect formatted response bodies.
- 🚀 **One-Click Copying:**
  - Copy request as a Windows CMD cURL command.
  - Copy request as a macOS/Linux Bash cURL command.
  - Copy raw request/response HAR data as JSON.
- 💾 **Export Logs:** Export captured session logs as a JSON file for sharing or later analysis.
- 🌓 **Theme-Aware:** Automatically adapts to Chrome DevTools dark and light theme settings.

---

## File Structure

```text
api-capture-extension/
├── manifest.json       # Extension manifest (Manifest V3)
├── devtools.html       # Entrypoint page for DevTools
├── devtools.js         # Script to register the custom DevTools panel
├── panel.html          # UI structure for the network inspector panel
├── panel.css           # Styling (includes light/dark theme variables)
└── panel.js            # Network interception, filtering, and copy logic
```

---

## Installation & Setup

To load this extension locally in your Google Chrome browser:

1. **Clone or Download** this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** by toggling the switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the folder containing this extension (`api-capture-extension`).

---

## How to Use

1. Press `F12` or right-click anywhere on a webpage and select **Inspect** to open Chrome DevTools.
2. Look for the **API Capture Pro** tab in the top panel menu and select it.
3. Reload the page or trigger actions on the webpage to start capturing network traffic.
4. Click on any request row to view its details (headers, payload, response) in the side pane.
5. Use the filters in the toolbar to narrow down the captured requests.
6. Click **Download JSON** to export your captured logs.
