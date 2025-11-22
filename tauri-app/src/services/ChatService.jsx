import api from "../http";

export default class ChatServices {
  static async getChats() {
    return api.get("/api/chats/");
  }
}
