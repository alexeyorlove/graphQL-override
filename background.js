// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.debugger.attach({ tabId: tab.id }, version,
        onAttach.bind(null, tab.id));
});

var version = "1.0";

function onAttach(tabId) {
    chrome.windows.create({ url: "headers.html?" + tabId, type: "normal", width: 800, height: 600 });
}