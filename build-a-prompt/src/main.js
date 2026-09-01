import './styles/fonts.generated.css';
import './styles/app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const blocked = () => Promise.reject(new Error('Network access is disabled in this local tool.'));
window.fetch = blocked;
window.XMLHttpRequest = class BlockedXMLHttpRequest {
  open() {
    throw new Error('Network access is disabled in this local tool.');
  }
};
window.WebSocket = class BlockedWebSocket {
  constructor() {
    throw new Error('Network access is disabled in this local tool.');
  }
};
window.EventSource = class BlockedEventSource {
  constructor() {
    throw new Error('Network access is disabled in this local tool.');
  }
};
if (navigator.sendBeacon) navigator.sendBeacon = () => false;

mount(App, { target: document.getElementById('app') });
