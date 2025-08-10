/* This is the script for undocked devtools in Vivaldi */

/*eslint-disable no-undef*/

let _theWebview;
let _inspectingTabId;

// vivaldiInspectTabId is set on the contentWindow in the document loading
function init() {
  _theWebview = document.createElement("webview");
  _theWebview.name = "vivaldi-devtools-main";

  _theWebview.inspect_tab_id = _inspectingTabId = vivaldiInspectTabId;
  const webviewdiv = document.getElementById("webviewdiv");
  webviewdiv.appendChild(_theWebview);
  const webpagecontainer = document.getElementById("webview-container");
  webpagecontainer.style.visibility = "visible";
  attachWebViewListeners();
  attachDevtoolsListeners();

  chrome.tabs.get(_inspectingTabId, tab => {
    document.title = "Developer Tools - Vivaldi - " + tab.url;
  });
  _theWebview.focus();
}

function attachWebViewListeners() {
  _theWebview.addEventListener("newwindow", onNewWindow);
  _theWebview.addEventListener("close", onClose);
  _theWebview.addEventListener("dialog", onJavascriptDialog);
  chrome.tabs.onUpdated.addListener(onInspectedTabChanged);
}

function detachWebViewListeners() {
  _theWebview.removeEventListener("newwindow", onNewWindow);
  _theWebview.removeEventListener("close", onClose);
  _theWebview.removeEventListener("dialog", onJavascriptDialog);
  chrome.tabs.onUpdated.removeListener(onInspectedTabChanged);
}

function attachDevtoolsListeners() {
  vivaldi.devtoolsPrivate.onDockingStateChanged.addListener(
    onDockingStateChanged,
  );
  vivaldi.devtoolsPrivate.onClosed.addListener(onDevtoolsClosed);
  vivaldi.devtoolsPrivate.onActivateWindow.addListener(onActivateWindow);
}

function detachDevtoolsListeners() {
  vivaldi.devtoolsPrivate.onDockingStateChanged.removeListener(
    onDockingStateChanged,
  );
  vivaldi.devtoolsPrivate.onClosed.removeListener(onDevtoolsClosed);
  vivaldi.devtoolsPrivate.onActivateWindow.removeListener(onActivateWindow);
}

async function closeWindow() {
  detachWebViewListeners();
  detachDevtoolsListeners();
  const winId = await vivaldi.windowPrivate.getCurrentId();
  chrome.windows.remove(winId);
}

function onDevtoolsClosed(tabId) {
  if (tabId === _inspectingTabId) {
    closeWindow();
  }
}

function onActivateWindow(tabId) {
  if (tabId === _inspectingTabId) {
    window.focus();
    _theWebview.focus();
  }
}

function onDockingStateChanged(tabId, dockingState) {
  if (tabId === _inspectingTabId && dockingState !== "undocked") {
    closeWindow();
  }
}

async function onClose(event) {
  const winId = await vivaldi.windowPrivate.getCurrentId();
  chrome.windows.remove(winId);
}

function onNewWindow(event) {
  event.window.accept(vivaldiWindowId + ";1");
}

function onJavascriptDialog(event) {
  // This only opens as a confirmation dialog for deleting an override
  // directory. We currently don't have code for dialogs outside react, so just
  // ok it here instead.
  event.preventDefault();
  event.dialog.ok(event.defaultPromptText);
}

onInspectedTabChanged = (tabId, changeInfo, tab) => {
  if (tabId === _inspectingTabId && changeInfo.url) {
    document.title = "Developer Tools - Vivaldi - " + tab.url;
  }
};

window.onload = init;
