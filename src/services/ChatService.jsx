import api from "../api";

export default class ChatServices {
  static async getChats(page) {
    return api.get(`/api/chats/?page=${page}`);
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

  static async updateChat(id, data) {
    return api.patch(`/api/chats/${id}/`, data);
  }

  static async leaveChat(id, newCreatorId = null) {
    return api.post(`/api/chats/${id}/participants/leave/`, {
      new_creator_id: newCreatorId,
    });
  }

  static async deleteChat(id) {
    return api.delete(`/api/chats/${id}/`);
  }

  static async restoreChat(id) {
    return api.post(`/api/chats/${id}/restore/`);
  }

  static async getChatParticipants(id) {
    return api.get(`/api/chats/${id}/participants/`);
  }

  static async getAllChatParticipants(id) {
    const participants = [];
    let nextUrl = `/api/chats/${id}/participants/`;

    while (nextUrl) {
      const { data } = await api.get(nextUrl);
      participants.push(...(data.results || []));
      nextUrl = data.next;
    }

    return participants;
  }

  static async kickParticipant(chatId, participantId) {
    return api.delete(`/api/chats/${chatId}/participants/${participantId}/`);
  }

  static async globalSearch(query) {
    return api.get(`/api/search/global/?q=${query}`);
  }
}
