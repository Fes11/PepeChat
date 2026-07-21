import { makeAutoObservable } from "mobx";

export default class ConnectionStore {
  apiAvailable = null;
  websocketConnected = false;
  websocketExpected = false;
  browserOnline = navigator.onLine;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  get status() {
    if (!this.browserOnline || this.apiAvailable === false) return "offline";
    if (this.apiAvailable === true
      && (!this.websocketExpected || this.websocketConnected)) return "connected";
    return "reconnecting";
  }

  handleOnline() { this.browserOnline = true; }
  handleOffline() { this.browserOnline = false; this.apiAvailable = false; }
  setApiAvailable(value) { this.apiAvailable = value; }
  setWebsocketConnected(value) { this.websocketConnected = value; }
  setWebsocketExpected(value) { this.websocketExpected = value; }
}
