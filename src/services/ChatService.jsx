import api from "../api";

export default class ChatServices {
  static async getChats(page) {
    return api.get(`/api/chats?page=${page}`);
  }

  static async openPrivateChat(userId) {
    return api.post("/api/chats/private/", { user_id: userId });
  }

  static async createChat(data) {
    return api.post("/api/chats/", data);
  }

  static async getChat(id) {
    return api.get(`/api/chats/${id}/`);
  }

  static async joinChat(id) {
    return api.post(`/api/chats/${id}/join-by-link/`);
  }

  static async getChatParticipants(id) {
    return api.get(`/api/chats/${id}/participants`);
  }

  static async globalSearch(query) {
    return api.get(`/api/search/global/?q=${query}`);
  }
}
