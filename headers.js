// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let tabId = parseInt(window.location.search.substring(1));
let debugee = { tabId: tabId };

window.addEventListener("load", function () {
   chrome.debugger.sendCommand(debugee, "Network.enable");
   chrome.debugger.sendCommand(debugee, "Fetch.enable", { patterns: [{ urlPattern: '*' }] });
   chrome.debugger.onEvent.addListener(onEvent);
});

window.addEventListener("unload", function () {
   chrome.debugger.detach(debugee);
});

var requests = {};

function onEvent(debuggeeId, message, params) {
   if (tabId != debuggeeId.tabId)
      return;

   if (message == "Network.requestWillBeSent") {
      let operationName = params.request?.postData?.split(',')[0].split(':')[1].slice(1, -1);
      if (operationName) {
         appendRequest(params.requestId, operationName)
      }
   }
   if (message == 'Network.responseReceived') {
      chrome.debugger.sendCommand(debugee, 'Network.getResponseBody', { requestId: params.requestId }, data => {
         if (params.request) {
         }
         let operationName = params.request?.postData?.split(',')[0].split(':')[1].slice(1, -1)
         // console.log('%c operationName', 'background: #ffb28b; color: #000; padding: 5px', operationName)
         // console.log('%c response', 'background: #1faee9; color: #000; padding: 5px', data)
         if (data?.body && params?.requestId) {
            appendResponse(params.requestId, data.body)
         }
      })
   }
   if (message === "Fetch.requestPaused") {
      let continueParams = {
         requestId: params.requestId,
      };

      if (isGraphql(params.request.url)) {
         console.log(1111);
         let operationName = params.request?.postData?.split(',')[0].split(':')[1].slice(1, -1)
         let isQueryOverrideEnable = document.getElementById(operationName)?.checked;

         if (isQueryOverrideEnable) {
            console.log(3333);
            let queryResponse = document.getElementById(operationName).closest('.query-item').querySelector('.response-data').innerText;
            continueParams.responseCode = 200;
            // TODO в btoa есть баги при работе с латиницей
            continueParams.body = btoa(unescape(encodeURIComponent(queryResponse)));
            continueParams.binaryResponseHeaders = btoa('Content-Type: application/json');
            chrome.debugger.sendCommand(debugee, 'Fetch.fulfillRequest', continueParams);
            console.log('OVERRIDED - ', operationName);
         }
         else {
            console.log(4444, continueParams, params);
            chrome.debugger.sendCommand(debugee, 'Fetch.continueRequest', continueParams);
         }
      }
      else {
         console.log(222);
         chrome.debugger.sendCommand(debugee, 'Fetch.continueRequest', continueParams);
      }
   }

   let continueParams = {
      requestId: params.requestId,
   };
   chrome.debugger.sendCommand(debugee, 'Fetch.continueRequest', continueParams);
}

const isGraphql = (url) => {
   return url?.indexOf('services/graphql') >= 0
}



const appendRequest = (requestId, operationName) => {
   let isRequestAdded = document.getElementById(operationName);

   if (!isRequestAdded) {
      let queriesContainer = document.getElementById('queries-container');
      let requestDiv = document.createElement('div');
      requestDiv.id = requestId;
      requestDiv.className = 'query-item';

      let requestCheckbox = document.createElement('input');
      requestCheckbox.type = 'checkbox'
      requestCheckbox.id = operationName
      requestCheckbox.name = operationName

      let requestLabel = document.createElement('label');
      requestLabel.htmlFor = operationName
      requestLabel.innerHTML = operationName;

      let queryNameDiv = document.createElement('div');
      queryNameDiv.className = 'query-name';

      queryNameDiv.appendChild(requestCheckbox);
      queryNameDiv.appendChild(requestLabel);

      requestDiv.appendChild(queryNameDiv);
      queriesContainer.appendChild(requestDiv);
   }
}

const appendResponse = (requestId, response) => {
   // TODO нужно привязаться к operationName вместо requestId, чтобы повторные запросы обновлялись в существующем блоке
   let requestDiv = document.getElementById(requestId);

   if (requestDiv) {
      // let responseTextarea = document.createElement('textarea');
      // responseTextarea.className = 'query-response';
      // responseTextarea.innerHTML = response;

      // requestDiv.prepend(responseTextarea);

      let responseDiv = document.createElement('div');
      responseDiv.className = 'query-response';
      responseDiv.contentEditable = 'true';

      let responsePre = document.createElement('pre');
      let data = JSON.parse(response);
      responsePre.innerHTML = JSON.stringify(data, null, 4);
      responsePre.className = 'response-data';

      responseDiv.prepend(responsePre);
      requestDiv.prepend(responseDiv);
   }
}