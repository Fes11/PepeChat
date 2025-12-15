import api from "../http";

export default class ChatServices {
  static async getChats() {
    return api.get("/api/chats/");
  }

  static async createChat(data) {
    return api.post("/api/chats/", data);
  }

  static async getChatParticipants(id) {
    return api.get(`/api/chats/${id}/participants`);
  }
}
