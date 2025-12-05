import api from "../http";

export default class MessageService {
  static async getMessages(id) {
    return api.get(`/api/chats/${id}/messages/`);
  }

  static async sendMessage(id, data) {
    return api.post(`/api/chats/${id}/messages/`, data);
  }
}
