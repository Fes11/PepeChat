const normalizeId = (id) => String(id);

const getOtherUserId = (chat) => {
  const otherUser = chat?.other_user;
  return typeof otherUser === "object" ? otherUser?.id : otherUser;
};

const getActivityTimestamp = (chat) => {
  const value = chat?.last_message?.created_at ?? chat?.created_at;
  const timestamp = value ? new Date(value).getTime() : Number.NEGATIVE_INFINITY;
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export const getChatIdentityKey = (chat) => {
  if (chat?.id == null) return null;

  const otherUserId = getOtherUserId(chat);
  if (!chat.is_group && otherUserId != null) {
    return `private:${normalizeId(otherUserId)}`;
  }

  return `chat:${normalizeId(chat.id)}`;
};

export const deduplicateChats = (chats = []) => {
  const uniqueChats = new Map();

  chats.forEach((chat) => {
    const identityKey = getChatIdentityKey(chat);
    if (!identityKey) return;

    const existing = uniqueChats.get(identityKey);
    if (!existing) {
      uniqueChats.set(identityKey, chat);
      return;
    }

    if (normalizeId(existing.id) === normalizeId(chat.id)) {
      uniqueChats.set(identityKey, { ...existing, ...chat });
      return;
    }

    const preferred = getActivityTimestamp(chat) > getActivityTimestamp(existing)
      ? chat
      : existing;
    uniqueChats.set(identityKey, {
      ...preferred,
      unread_count: Math.max(
        Number(existing.unread_count) || 0,
        Number(chat.unread_count) || 0,
      ),
    });
  });

  return Array.from(uniqueChats.values());
};
