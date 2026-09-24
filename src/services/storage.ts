import type { ChatRoom, Message, UserSettings } from '../types/chat';
import { INITIAL_ROOMS, INITIAL_MESSAGES, INITIAL_SETTINGS } from './mockData';

const ROOMS_KEY = 'purechat_rooms_v1';
const MESSAGES_KEY = 'purechat_messages_v1';
const SETTINGS_KEY = 'purechat_settings_v1';

export const storageService = {
  getRooms(): ChatRoom[] {
    try {
      const data = localStorage.getItem(ROOMS_KEY);
      if (!data) {
        this.saveRooms(INITIAL_ROOMS);
        return INITIAL_ROOMS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ROOMS;
    }
  },

  saveRooms(rooms: ChatRoom[]): void {
    try {
      localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error('Failed to save rooms to storage', e);
    }
  },

  getMessages(): Record<string, Message[]> {
    try {
      const data = localStorage.getItem(MESSAGES_KEY);
      if (!data) {
        this.saveMessages(INITIAL_MESSAGES);
        return INITIAL_MESSAGES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_MESSAGES;
    }
  },

  saveMessages(messages: Record<string, Message[]>): void {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save messages to storage', e);
    }
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        this.saveSettings(INITIAL_SETTINGS);
        return INITIAL_SETTINGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to storage', e);
    }
  },

  clearAllData(): void {
    try {
      localStorage.removeItem(ROOMS_KEY);
      localStorage.removeItem(MESSAGES_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};
