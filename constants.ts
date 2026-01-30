import { Post, ChatRoom, User, Notification } from './types';

export const DEFAULT_AVATAR = "/default_profile.png";

export const CURRENT_USER: User = {
  id: 'me',
  name: '상경한꿈돌이',
  avatarUrl: "", // 초기에는 이미지 없음
  isSanggyeongJwi: true,
  hometown: '부산',
  notificationEnabled: true,
};

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    authorId: 'user1',
    authorName: '한강러닝크루',
    authorAvatar: 'https://picsum.photos/seed/user1/100/100',
    title: '오늘 밤 한강 5km 뛰실 분? 🏃‍♂️',
    description: '퇴근하고 여의도 공원에서 가볍게 뛰고 스트레스 날리실 분 구해요! 초보자 환영, 페이스는 천천히 맞춥니다.',
    category: 'EXERCISE',
    location: '여의도 공원',
    distance: '400m',
    lat: 37.5283,
    lng: 126.9294,
    maxMembers: 4,
    currentMembers: 2,
    time: '오늘 밤 8:00',
    tags: ['러닝', '초보환영', '운동'],
    imageUrl: 'https://picsum.photos/seed/run/600/300',
    createdAt: Date.now(),
    comments: [
      {
        id: 'c1',
        authorId: 'user5',
        authorName: '달려라하니',
        authorAvatar: 'https://picsum.photos/seed/user5/50/50',
        text: '짐 보관할 곳 있나요?',
        timestamp: Date.now() - 100000
      }
    ],
    applicants: []
  },
  {
    id: '2',
    authorId: 'user2',
    authorName: '카페코딩',
    authorAvatar: 'https://picsum.photos/seed/user2/100/100',
    title: '홍대 카페에서 모각코 하실 분 ☕️',
    description: '집에 혼자 있으니 집중이 안 돼서 나왔어요. 각자 할 일 하면서 가볍게 커피 마실 분 계신가요?',
    category: 'STUDY',
    location: '홍대 카페테리아',
    distance: '1.2km',
    lat: 37.5563,
    lng: 126.9224,
    maxMembers: 3,
    currentMembers: 1,
    time: '지금 당장',
    tags: ['개발자', '모각코', '커피'],
    createdAt: Date.now() - 3600000,
    comments: [],
    applicants: []
  },
  {
    id: '3',
    authorId: 'user3',
    authorName: '떡볶이매니아',
    authorAvatar: 'https://picsum.photos/seed/user3/100/100',
    title: '급구: 신당동 떡볶이 파티원 (2/4)',
    description: '여기 즉석떡볶이 4인 세트가 진리인데 혼자서는 절대 못 먹어요 ㅠㅠ 같이 드실 분 급구합니다!',
    category: 'FOOD',
    location: '신당동 떡볶이 타운',
    distance: '2.5km',
    lat: 37.5645,
    lng: 127.0125,
    maxMembers: 4,
    currentMembers: 2,
    time: '오늘 저녁 7:00',
    tags: ['맛집탐방', '저녁', '떡볶이'],
    imageUrl: 'https://picsum.photos/seed/food/600/300',
    createdAt: Date.now() - 7200000,
    comments: [
      {
        id: 'c2',
        authorId: 'user6',
        authorName: '매운거좋아',
        authorAvatar: 'https://picsum.photos/seed/user6/50/50',
        text: '맵기 조절 가능한가요?',
        timestamp: Date.now() - 50000
      },
      {
        id: 'c3',
        authorId: 'user3',
        authorName: '떡볶이매니아',
        authorAvatar: 'https://picsum.photos/seed/user3/100/100',
        text: '네 가능해요! 순한맛으로 시킬 예정입니다.',
        timestamp: Date.now() - 40000
      }
    ],
    applicants: []
  },
  {
    id: '4',
    authorId: 'user4',
    authorName: '놀이터대장',
    authorAvatar: 'https://picsum.photos/seed/user4/100/100',
    title: '어린이대공원에서 경찰과 도둑 하실 분? 🕵️',
    description: '갑자기 어릴 때 하던 경찰과 도둑이 너무 하고 싶어서 올려봅니다 ㅋㅋ 동심으로 돌아가서 신나게 뛰어봐요!',
    category: 'HOBBY',
    location: '어린이대공원',
    distance: '800m',
    lat: 37.5482,
    lng: 127.0815,
    maxMembers: 10,
    currentMembers: 6,
    time: '토요일 오후 2:00',
    tags: ['추억', '액티비티', '놀이'],
    createdAt: Date.now() - 10000,
    comments: [],
    applicants: []
  }
];

export const MOCK_CHATS: ChatRoom[] = [
  {
    id: 'room1',
    postId: '1',
    title: '오늘 밤 한강 5km 뛰실 분? 🏃‍♂️',
    lastMessage: '3번 출구 앞에서 뵙겠습니다!',
    lastMessageTime: '오전 10:30',
    unreadCount: 2,
    participants: ['me', 'user1'],
    messages: [
      { id: 'm1', senderId: 'user1', text: '안녕하세요! 오늘 나오시나요?', timestamp: Date.now() - 86400000 },
      { id: 'm2', senderId: 'me', text: '네 참석합니다!', timestamp: Date.now() - 86000000 },
      { id: 'm3', senderId: 'user1', text: '3번 출구 앞에서 뵙겠습니다!', timestamp: Date.now() - 3600000 }
    ]
  },
  {
    id: 'room2',
    postId: '3',
    title: '급구: 신당동 떡볶이 파티원',
    lastMessage: '저 지금 5분 내로 도착해요~',
    lastMessageTime: '어제',
    unreadCount: 0,
    participants: ['me', 'user3'],
    messages: [
      { id: 'm1', senderId: 'user3', text: '혹시 어디쯤이세요?', timestamp: Date.now() - 100000 },
      { id: 'm2', senderId: 'me', text: '저 지금 5분 내로 도착해요~', timestamp: Date.now() - 50000 }
    ]
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'COMMENT',
    message: "'달려라하니'님이 댓글을 남겼습니다: 짐 보관할 곳 있나요?",
    timestamp: Date.now() - 100000,
    isRead: false,
    relatedId: '1'
  },
  {
    id: 'n2',
    type: 'JOIN',
    message: "'매운거좋아'님이 '신당동 떡볶이' 모임에 참여했습니다.",
    timestamp: Date.now() - 5000000,
    isRead: true,
    relatedId: '3'
  },
  {
    id: 'n3',
    type: 'SYSTEM',
    message: "G.PS에 오신 것을 환영합니다! 프로필을 완성해보세요.",
    timestamp: Date.now() - 86400000,
    isRead: true
  }
];