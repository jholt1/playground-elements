'use strict';

const MESSAGE_TYPES = {
  ENTRYPOINT_REQUEST: "ENTRYPOINT_REQUEST",
  ENTRYPOINT_RESPONSE: "ENTRYPOINT_RESPONSE",
  ESTABLISH_HANDSHAKE: "ESTABLISH_HANDSHAKE",
  HANDSHAKE_RECEIVED: "HANDSHAKE_RECEIVED",
  PROJECT_CONTENT: "PROJECT_CONTENT",
  RESPONSES_READY: "RESPONSES_READY"
}

const recieveMessageChannelHandshake = () => {
  return new Promise((res) => {
    const onMessage = (e) => {
      const data = e.data;
      if (data.type === MESSAGE_TYPES.ESTABLISH_HANDSHAKE) {
        const ports = e.ports;
        if (ports && ports[0]) {
          const port = ports[0];
          port.start();
          const handshakeReceivedMessage = {
            type: MESSAGE_TYPES.HANDSHAKE_RECEIVED,
          }
          port.postMessage(handshakeReceivedMessage);
          self.removeEventListener('message', onMessage);
          res(port);
        }
      }
    };

    self.addEventListener('message', onMessage);
  });
}

console.log('SW script running...');
/**@type {Map<string, Response>} */
const fileResponseMap = new Map();

self.addEventListener('fetch', (e) => {
  if (!e.request || !e.request.url) {
    return;
  }
  const url = new URL(e.request.url);
  console.log(e.request.url);

  if (url.origin === location.origin
      && url.pathname.startsWith('/modules/')
      && fileResponseMap.has(url.pathname)) {
    e.respondWith(fileResponseMap.get(url.pathname));
  }
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});
/**
 * @param {MessagePort} networkPort
 */
const onNetworkContentMessage = (networkPort) => {
  /**
   * @param {MessageEvent}
   */
  return async (e) => {
    /** @type {import('./lib/types.js').ProjectContent} */
    const data = e.data;
    if (data.type === MESSAGE_TYPES.PROJECT_CONTENT) {
      console.log('network content received!', data);
      const projectRecord = data.message;
      /** @type {ResponseInit} */
      const genericInit = {
        headers: { 'Content-Type': 'application/javascript'}
      };

      console.log('populating response map...');
      const entrypointResponse = new Response(
          projectRecord.entrypoint.content,
          genericInit);
      fileResponseMap.set(
          `/modules/${projectRecord.entrypoint.name}.js`,
          entrypointResponse);

      for (const fileRecords of projectRecord.files) {
        fileResponseMap.set(
            `${fileRecords.name}.js`,
            new Response(fileRecords.content, genericInit));
      }

      console.log('response map populated!', fileResponseMap);

      /** @type {import('./lib/types.js').ResponsesReady} */
      const responsesReady = {
        type: MESSAGE_TYPES.RESPONSES_READY
      }

      networkPort.postMessage(responsesReady);
    }
  }
}

const main = async () => {
  console.log('establishing message channel with network layer...');
  const networkPort = await recieveMessageChannelHandshake();

  if (!networkPort) {
    console.error('NETWORK PORT COULD NOT BE ESTABLISHED')
  }
  console.log('message channel with network layer established!');

  networkPort.addEventListener('message', onNetworkContentMessage(networkPort));
  networkPort.postMessage('PORT_TO_SW_RECEIVED');
}

main();