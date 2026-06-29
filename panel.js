let capturedRequests = [];
let capturedDomains = new Set();

// Elements
const tableBody = document.getElementById('requestsBody');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const domainFilterInput = document.getElementById('domainFilter');
const urlFilterInput = document.getElementById('urlFilter');
const xhrOnlyCheckbox = document.getElementById('xhrOnly');

// Helper to escape HTML to prevent XSS in our table
function escapeHtml(unsafe) {
  return (unsafe || '').toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Generate cURL from a HAR request object
function generateCurl(req) {
  const request = req.request;
  let curl = `curl '${request.url}' \\\n`;
  
  // Headers
  request.headers.forEach(h => {
    curl += `  -H '${h.name}: ${h.value.replace(/'/g, "'\\''")}' \\\n`;
  });

  // Method
  if (request.method !== 'GET') {
    curl += `  -X ${request.method} \\\n`;
  }

  // Body
  if (request.postData && request.postData.text) {
    const data = request.postData.text.replace(/'/g, "'\\''");
    curl += `  --data-raw '${data}' \\\n`;
  }

  // Remove trailing slash-newline
  return curl.replace(/ \\\n$/, '');
}

// Helper to get currently filtered requests
function getFilteredRequests() {
  const pathFilterText = urlFilterInput.value.toLowerCase();
  const domainFilterText = domainFilterInput.value;
  
  return capturedRequests.filter(req => {
    let urlObj;
    try {
      urlObj = new URL(req.request.url);
    } catch (e) {
      // Ignore invalid URLs
    }
    
    // Domain match
    if (domainFilterText && urlObj && urlObj.hostname !== domainFilterText) {
      return false;
    }
    
    // Path/Text match
    if (pathFilterText && !req.request.url.toLowerCase().includes(pathFilterText)) {
      return false;
    }
    
    return true;
  });
}

// Details Pane Elements
const detailsPane = document.getElementById('detailsPane');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const detailGeneral = document.getElementById('detailGeneral');
const detailReqHeaders = document.getElementById('detailReqHeaders');
const detailReqPayload = document.getElementById('detailReqPayload');
const detailResHeaders = document.getElementById('detailResHeaders');
const detailResBody = document.getElementById('detailResBody');

const copyCmdBtn = document.getElementById('copyCmdBtn');
const copyBashBtn = document.getElementById('copyBashBtn');
const copyJsonBtn = document.getElementById('copyJsonBtn');
let currentActiveRequest = null;

// Format headers for display
function formatHeaders(headersArray) {
  if (!headersArray || headersArray.length === 0) return 'No headers';
  return headersArray.map(h => `${h.name}: ${h.value}`).join('\n');
}

// Generate cURL for Windows CMD (double quotes)
function generateCmdCurl(req) {
  const request = req.request;
  let curl = `curl "${request.url}" ^\n`;
  
  request.headers.forEach(h => {
    curl += `  -H "${h.name}: ${h.value.replace(/"/g, '""')}" ^\n`;
  });

  if (request.method !== 'GET') {
    curl += `  -X ${request.method} ^\n`;
  }

  if (request.postData && request.postData.text) {
    const data = request.postData.text.replace(/"/g, '""');
    curl += `  --data-raw "${data}" ^\n`;
  }

  return curl.replace(/ \^\n$/, '');
}

// Copy helper function
function copyTextWithFeedback(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.innerText;
    btn.innerText = 'Copied!';
    setTimeout(() => { btn.innerText = originalText; }, 1500);
  });
}

// Copy Buttons Event Listeners
copyCmdBtn.addEventListener('click', () => {
  if (currentActiveRequest) {
    copyTextWithFeedback(copyCmdBtn, generateCmdCurl(currentActiveRequest));
  }
});

copyBashBtn.addEventListener('click', () => {
  if (currentActiveRequest) {
    copyTextWithFeedback(copyBashBtn, generateCurl(currentActiveRequest));
  }
});

copyJsonBtn.addEventListener('click', () => {
  if (currentActiveRequest) {
    copyTextWithFeedback(copyJsonBtn, JSON.stringify(currentActiveRequest, null, 2));
  }
});

// Show details pane
function showDetails(req) {
  currentActiveRequest = req;
  
  // General
  detailGeneral.innerHTML = `
    <strong>URL:</strong> ${escapeHtml(req.request.url)}<br><br>
    <strong>Method:</strong> ${req.request.method}<br>
    <strong>Status:</strong> ${req.response.status} ${req.response.statusText}
  `;
  
  // Request Headers
  detailReqHeaders.textContent = formatHeaders(req.request.headers);
  
  // Request Payload
  if (req.request.postData && req.request.postData.text) {
    try {
      const parsed = JSON.parse(req.request.postData.text);
      detailReqPayload.textContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      detailReqPayload.textContent = req.request.postData.text;
    }
  } else {
    detailReqPayload.textContent = 'No payload';
  }
  
  // Response Headers
  detailResHeaders.textContent = formatHeaders(req.response.headers);
  
  // Response Body
  if (req.response.bodyContent) {
    try {
      const parsed = JSON.parse(req.response.bodyContent);
      detailResBody.textContent = JSON.stringify(parsed, null, 2);
    } catch (e) {
      detailResBody.textContent = req.response.bodyContent;
    }
  } else {
    detailResBody.textContent = 'No response body or failed to capture.';
  }

  detailsPane.classList.remove('hidden');
}

// Close details pane
closeDetailsBtn.addEventListener('click', () => {
  detailsPane.classList.add('hidden');
});

// Tab Switching Logic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Remove active class from all buttons and tabs
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked button and target tab
    e.target.classList.add('active');
    const targetId = e.target.getAttribute('data-tab');
    document.getElementById(targetId).classList.add('active');
  });
});

// Render the table
function renderTable() {
  const filtered = getFilteredRequests();

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr class="empty-row"><td colspan="4">No requests matching filters.</td></tr>`;
    return;
  }

  tableBody.innerHTML = '';
  
  filtered.forEach((req, index) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    
    // Status color
    let statusClass = 'status-ok';
    if (req.response.status >= 400 && req.response.status < 500) statusClass = 'status-warn';
    if (req.response.status >= 500) statusClass = 'status-error';

    tr.innerHTML = `
      <td><span class="method-tag method-${req.request.method}">${req.request.method}</span></td>
      <td title="${escapeHtml(req.request.url)}">${escapeHtml(req.request.url)}</td>
      <td class="${statusClass}">${req.response.status}</td>
      <td>
        <button class="btn btn-primary btn-sm copy-btn" data-index="${index}">Copy cURL</button>
      </td>
    `;
    
    // Click on row to show details (except when clicking the copy button)
    tr.addEventListener('click', (e) => {
      if (!e.target.classList.contains('copy-btn')) {
        showDetails(req);
      }
    });

    tableBody.appendChild(tr);
  });

  // Attach copy listeners
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.getAttribute('data-index');
      const req = filtered[idx];
      const curl = generateCurl(req);
      
      navigator.clipboard.writeText(curl).then(() => {
        const originalText = e.target.innerText;
        e.target.innerText = 'Copied!';
        setTimeout(() => { e.target.innerText = originalText; }, 1500);
      });
    });
  });
}

// Extract domain and add to dropdown if new
function processDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname && !capturedDomains.has(hostname)) {
      capturedDomains.add(hostname);
      const option = document.createElement('option');
      option.value = hostname;
      option.textContent = hostname;
      domainFilterInput.appendChild(option);
    }
  } catch(e) {}
}

// Listen to DevTools network requests
chrome.devtools.network.onRequestFinished.addListener(
  function(request) {
    // Filter out non-XHR/Fetch if checkbox is checked
    if (xhrOnlyCheckbox.checked) {
      const type = request._resourceType || '';
      if (type !== 'xhr' && type !== 'fetch' && type !== 'document') {
        const mime = (request.response && request.response.content && request.response.content.mimeType) || '';
        if (!mime.includes('application/json') && !mime.includes('text/xml')) {
          return;
        }
      }
    }

    // Get response body because it's not automatically in the HAR request object
    request.getContent((content, encoding) => {
      // Create a rich object to store
      const reqData = {
        request: request.request,
        response: {
          ...request.response,
          bodyContent: content,
          encoding: encoding
        },
        time: request.time,
        startedDateTime: request.startedDateTime
      };
      
      capturedRequests.push(reqData);
      processDomain(request.request.url);
      renderTable();
    });
  }
);

// Event Listeners
clearBtn.addEventListener('click', () => {
  capturedRequests = [];
  capturedDomains.clear();
  domainFilterInput.innerHTML = '<option value="">All Domains</option>';
  renderTable();
});

domainFilterInput.addEventListener('change', renderTable);
urlFilterInput.addEventListener('input', renderTable);
xhrOnlyCheckbox.addEventListener('change', renderTable);

exportBtn.addEventListener('click', () => {
  const filtered = getFilteredRequests();
  if (filtered.length === 0) {
    alert("No requests to export (or all are filtered out).");
    return;
  }
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `api_capture_${new Date().getTime()}.json`);
  dlAnchorElem.click();
});
