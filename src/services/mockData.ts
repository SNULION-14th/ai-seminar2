import type { User, ChatRoom, Message, UserSettings } from '../types/chat';

export const CURRENT_USER: User = {
  id: 'user_me',
  nickname: '나 (건호)',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
  status: 'online',
  statusMessage: '미니멀 라이프 실천 중 🌱',
  isCurrentUser: true,
};

export const MOCK_USERS: User[] = [
  CURRENT_USER,
  {
    id: 'user_minsu',
    nickname: '민수',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',
    status: 'focus',
    statusMessage: '집중 근무 중 🌙 (긴급 시 핑)',
  },
  {
    id: 'user_jisun',
    nickname: '지선 (UI 디자이너)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    status: 'online',
    statusMessage: '디자인 시스템 v2 준비 완료 ✨',
  },
  {
    id: 'user_sujin',
    nickname: '수진',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face',
    status: 'offline',
    statusMessage: '잠시 오프라인입니다.',
  },
];

export const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: 'room_minsu',
    title: '민수',
    isGroup: false,
    participants: [CURRENT_USER, MOCK_USERS[1]],
    unreadCount: 0,
    isPinned: true,
    isArchived: false,
    ephemeralHours: 0,
  },
  {
    id: 'room_dev_team',
    title: '소규모 개발팀 (3)',
    isGroup: true,
    participants: [CURRENT_USER, MOCK_USERS[1], MOCK_USERS[2]],
    unreadCount: 2,
    isPinned: true,
    isArchived: false,
    ephemeralHours: 0,
  },
  {
    id: 'room_jisun',
    title: '지선 (UI 디자이너)',
    isGroup: false,
    participants: [CURRENT_USER, MOCK_USERS[2]],
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    ephemeralHours: 24, // 클린챗 (24시간 보관)
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  room_minsu: [
    {
      id: 'msg_1',
      roomId: 'room_minsu',
      senderId: 'user_minsu',
      type: 'text',
      content: '오늘 저녁 7시 강남역 어때?',
      reactions: [{ emoji: '👍', count: 1, users: ['user_me'] }],
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'msg_2',
      roomId: 'room_minsu',
      senderId: 'user_me',
      type: 'text',
      content: '좋아! 그때 봐. 미팅 끝내고 바로 갈게.',
      reactions: [{ emoji: '❤️', count: 1, users: ['user_minsu'] }],
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'msg_3',
      roomId: 'room_minsu',
      senderId: 'user_minsu',
      type: 'text',
      content: '나 지금 포커스 모드 켜뒀어. 급한 일 있으면 핑 보내줘!',
      reactions: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ],
  room_dev_team: [
    {
      id: 'msg_dev_1',
      roomId: 'room_dev_team',
      senderId: 'user_minsu',
      type: 'text',
      content: 'PR 리뷰 부탁드립니다! 메신저 라우터 패턴 적용했어요.',
      reactions: [{ emoji: '🔥', count: 2, users: ['user_me', 'user_jisun'] }],
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 'msg_dev_2',
      roomId: 'room_dev_team',
      senderId: 'user_jisun',
      type: 'text',
      content: '배포 완료했습니다! 성능 지표 300ms대로 아주 빠르네요 🚀',
      reactions: [{ emoji: '👏', count: 2, users: ['user_me', 'user_minsu'] }],
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
  ],
  room_jisun: [
    {
      id: 'msg_jisun_1',
      roomId: 'room_jisun',
      senderId: 'user_jisun',
      type: 'text',
      content: '이 대화방은 클린챗(24시간 휘발) 모드로 설정되어 있어요 🌿',
      reactions: [{ emoji: '✨', count: 1, users: ['user_me'] }],
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString(),
    },
    {
      id: 'msg_jisun_2',
      roomId: 'room_jisun',
      senderId: 'user_me',
      type: 'text',
      content: '용량 걱정 없이 깔끔하게 대화할 수 있어 좋네요!',
      reactions: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22.5).toISOString(),
    },
  ],
};

export const INITIAL_SETTINGS: UserSettings = {
  focusMode: false,
  gentleRead: true,
  defaultEphemeralHours: 0,
  darkMode: false,
  soundEnabled: true,
};
