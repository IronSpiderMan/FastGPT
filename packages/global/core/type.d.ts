import type { Agent } from 'http';

declare global {
  var httpsAgent: Agent;
  interface Window {
    AsrSDK: any;
    RTCInteraction: any;
  }
}
