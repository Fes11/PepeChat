import { makeAutoObservable } from "mobx";

export default class ChatActivityStore {
  presenceByUserId = {};
  voiceParticipantsByChatId = {};

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setPresence(userId, presence) {
    this.presenceByUserId[userId] = presence;
  }

  getUserPresence(user) {
    if (!user) return user;
    const presence = this.presenceByUserId[user.id];
    return presence ? { ...user, ...presence } : user;
  }

  setVoiceParticipants(chatId, participants = []) {
    if (chatId == null) return;
    this.voiceParticipantsByChatId[chatId] = participants;
  }

  getVoiceParticipants(chatId) {
    return this.voiceParticipantsByChatId[chatId] || [];
  }

  clearVoiceParticipants(chatId) {
    if (chatId == null) return;
    delete this.voiceParticipantsByChatId[chatId];
  }

  reset() {
    this.presenceByUserId = {};
    this.voiceParticipantsByChatId = {};
  }
}
