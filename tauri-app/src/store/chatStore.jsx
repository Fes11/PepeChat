import { makeAutoObservable } from "mobx";

export default class ChatStore {
  selectedChat = null;
  isOpening = false;

  constructor() {
    makeAutoObservable(this);
  }

  openChat(data) {
    this.selectedChat = {
      type: "chat",
      data,
    };
  }

  openPrivateChat(data) {
    this.selectedChat = {
      type: "private",
      data,
    };
  }
}
