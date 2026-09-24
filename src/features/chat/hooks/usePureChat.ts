import { useCallback, useEffect, useState } from 'react';
import { CURRENT_USER, INITIAL_MESSAGES, INITIAL_ROOMS, INITIAL_SETTINGS, MOCK_USERS } from '../../../services/mockData';
import { storageService } from '../../../services/storage';
import type { ChatRoom, Message, MessageReaction, UserSettings } from '../../../types/chat';

type MessageMap = Record<string, Message[]>;

interface ChatSnapshot {
  rooms: ChatRoom[];
  messages: MessageMap;
  settings: UserSettings;
}

const getLastMessage = (messages: Message[]): Message | undefined =>
  messages.length > 0 ? messages[messages.length - 1] : undefined;

const removeExpiredMessages = (messages: MessageMap): MessageMap =>
  Object.fromEntries(
    Object.entries(messages).map(([roomId, roomMessages]) => [
      roomId,
      roomMessages.filter((message) => !message.expiresAt || Date.parse(message.expiresAt) > Date.now()),
    ]),
  );

const withRoomPreviews = (rooms: ChatRoom[], messages: MessageMap): ChatRoom[] =>
  rooms.map((room) => ({
    ...room,
    participants: room.participants.map((participant) => ({ ...participant })),
    lastMessage: getLastMessage(messages[room.id] ?? []),
  }));

const createInitialSnapshot = (): ChatSnapshot => {
  const messages = removeExpiredMessages(storageService.getMessages());
  return {
    rooms: withRoomPreviews(storageService.getRooms(), messages),
    messages,
    settings: storageService.getSettings(),
  };
};

const createDemoSnapshot = (): ChatSnapshot => {
  const messages = removeExpiredMessages(structuredClone(INITIAL_MESSAGES));
  return {
    rooms: withRoomPreviews(structuredClone(INITIAL_ROOMS), messages),
    messages,
    settings: structuredClone(INITIAL_SETTINGS),
  };
};

const createId = (prefix: string): string => {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  return prefix + '_' + randomPart;
};

export const usePureChat = () => {
  const [snapshot, setSnapshot] = useState<ChatSnapshot>(createInitialSnapshot);

  useEffect(() => {
    storageService.saveRooms(snapshot.rooms);
  }, [snapshot.rooms]);

  useEffect(() => {
    storageService.saveMessages(snapshot.messages);
  }, [snapshot.messages]);

  useEffect(() => {
    storageService.saveSettings(snapshot.settings);
  }, [snapshot.settings]);

  const selectRoom = useCallback((roomId: string) => {
    setSnapshot((current) => ({
      ...current,
      rooms: current.rooms.map((room) =>
        room.id === roomId ? { ...room, unreadCount: 0 } : room,
      ),
    }));
  }, []);

  const sendMessage = useCallback((roomId: string, content: string, isSilent: boolean) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    setSnapshot((current) => {
      const room = current.rooms.find((candidate) => candidate.id === roomId);
      if (!room) return current;

      const expiresAt = room.ephemeralHours
        ? new Date(Date.now() + room.ephemeralHours * 60 * 60 * 1000).toISOString()
        : undefined;
      const message: Message = {
        id: createId('message'),
        roomId,
        senderId: CURRENT_USER.id,
        type: 'text',
        content: trimmedContent,
        reactions: [],
        createdAt: new Date().toISOString(),
        isSilent,
        expiresAt,
      };
      const roomMessages = [...(current.messages[roomId] ?? []), message];

      return {
        ...current,
        messages: { ...current.messages, [roomId]: roomMessages },
        rooms: current.rooms.map((candidate) =>
          candidate.id === roomId
            ? { ...candidate, lastMessage: message, unreadCount: 0 }
            : candidate,
        ),
      };
    });
  }, []);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setSnapshot((current) => {
      let updatedMessage: Message | undefined;
      const messages = Object.fromEntries(
        Object.entries(current.messages).map(([roomId, roomMessages]) => [
          roomId,
          roomMessages.map((message) => {
            if (message.id !== messageId) return message;

            const reaction = message.reactions.find((item) => item.emoji === emoji);
            const hasReacted = reaction?.users.includes(CURRENT_USER.id) ?? false;
            const nextReaction: MessageReaction = {
              emoji,
              count: hasReacted ? (reaction?.count ?? 1) - 1 : (reaction?.count ?? 0) + 1,
              users: hasReacted
                ? (reaction?.users ?? []).filter((userId) => userId !== CURRENT_USER.id)
                : [...(reaction?.users ?? []), CURRENT_USER.id],
            };
            const reactions = reaction
              ? message.reactions
                  .map((item) => (item.emoji === emoji ? nextReaction : item))
                  .filter((item) => item.count > 0)
              : [...message.reactions, nextReaction];

            updatedMessage = { ...message, reactions };
            return updatedMessage;
          }),
        ]),
      ) as MessageMap;

      if (!updatedMessage) return current;

      return {
        ...current,
        messages,
        rooms: current.rooms.map((room) =>
          room.lastMessage?.id === messageId
            ? { ...room, lastMessage: updatedMessage }
            : room,
        ),
      };
    });
  }, []);

  const createRoom = useCallback((userId: string): string => {
    const user = MOCK_USERS.find((candidate) => candidate.id === userId);
    if (!user || user.isCurrentUser) return '';

    const existingRoom = snapshot.rooms.find(
      (room) => !room.isGroup && room.participants.some((participant) => participant.id === userId),
    );
    if (existingRoom) return existingRoom.id;

    const roomId = createId('room');
    const room: ChatRoom = {
      id: roomId,
      title: user.nickname,
      isGroup: false,
      participants: [CURRENT_USER, user],
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      ephemeralHours: snapshot.settings.defaultEphemeralHours,
    };

    setSnapshot((current) => ({
      ...current,
      rooms: [room, ...current.rooms],
      messages: { ...current.messages, [roomId]: [] },
    }));
    return roomId;
  }, [snapshot.rooms, snapshot.settings.defaultEphemeralHours]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSnapshot((current) => ({
      ...current,
      settings: { ...current.settings, ...updates },
    }));
  }, []);

  const resetDemo = useCallback(() => {
    storageService.clearAllData();
    setSnapshot(createDemoSnapshot());
  }, []);

  return {
    rooms: snapshot.rooms,
    messages: snapshot.messages,
    settings: snapshot.settings,
    users: MOCK_USERS,
    selectRoom,
    sendMessage,
    toggleReaction,
    createRoom,
    updateSettings,
    resetDemo,
  };
};
