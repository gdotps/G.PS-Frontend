import { useState } from "react";
import {
  ViewState,
  User,
  Post,
  ChatRoom,
  Message,
  Comment,
  Notification,
} from "../types";
import {
  MOCK_POSTS,
  MOCK_CHATS,
  MOCK_NOTIFICATIONS,
  CURRENT_USER,
} from "../constants";

export const useAppLogic = () => {
  const [currentView, setCurrentView] = useState<ViewState>(
    ViewState.ONBOARDING,
  );
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [chats, setChats] = useState<ChatRoom[]>(MOCK_CHATS);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // 네비게이션 헬퍼
  const goToHome = () => setCurrentView(ViewState.HOME);
  const goToProfileSetup = () => setCurrentView(ViewState.PROFILE_SETUP);

  const goToPostDetail = (post: Post) => {
    setSelectedPost(post);
    setCurrentView(ViewState.POST_DETAIL);
  };
  const goToChatRoom = (chatId: string) => {
    setSelectedChatId(chatId);
    setCurrentView(ViewState.CHAT_ROOM);
  };
  const goToProfileEdit = () => setCurrentView(ViewState.PROFILE_EDIT);
  const goToProfile = () => setCurrentView(ViewState.PROFILE);

  // 액션
  const toggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  const handleJoin = () => {
    if (!selectedPost) return;
    if (selectedPost.applicants?.some((a) => a.id === currentUser.id)) {
      alert("이미 지원했습니다.");
      return;
    }
    const updatedPost = {
      ...selectedPost,
      applicants: [...(selectedPost.applicants || []), currentUser],
    };
    setPosts(posts.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
    setSelectedPost(updatedPost);
    alert("호스트에게 프로필이 전송되었습니다!");
  };

  const handleCancelJoin = () => {
    if (!selectedPost) return;
    if (window.confirm("정말로 참여를 취소하시겠습니까?")) {
      const updatedPost = {
        ...selectedPost,
        applicants:
          selectedPost.applicants?.filter((a) => a.id !== currentUser.id) ||
          [],
      };
      setPosts(posts.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
      setSelectedPost(updatedPost);
    }
  };

  const handleApprove = (postId: string, applicantId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    if (post.currentMembers >= post.maxMembers) {
      alert("정원이 꽉 찼습니다.");
      return;
    }
    const applicant = post.applicants?.find((u) => u.id === applicantId);
    if (!applicant) return;

    const updatedPost = {
      ...post,
      currentMembers: post.currentMembers + 1,
      applicants: post.applicants?.filter((u) => u.id !== applicantId),
    };
    setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(updatedPost);
    }
    alert(`${applicant.name}님의 참여를 승인했습니다!`);
  };

  const handleReject = (postId: string, applicantId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const applicant = post.applicants?.find((u) => u.id === applicantId);
    if (!applicant) return;

    if (window.confirm(`${applicant.name}님의 참여 신청을 거절하시겠습니까?`)) {
      const updatedPost = {
        ...post,
        applicants: post.applicants?.filter((u) => u.id !== applicantId),
      };
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(updatedPost);
      }
    }
  };

  const handleAddComment = (text: string) => {
    if (!selectedPost) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      text: text,
      timestamp: Date.now(),
    };
    const updatedPost = {
      ...selectedPost,
      comments: [...(selectedPost.comments || []), newComment],
    };
    setPosts(posts.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
    setSelectedPost(updatedPost);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChatId) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: text,
      timestamp: Date.now(),
    };
    const updatedChats = chats.map((chat) => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: text,
          lastMessageTime: "방금",
          unreadCount: 0,
        };
      }
      return chat;
    });
    setChats(updatedChats);
  };

  const handleLeaveChat = (chatId: string) => {
    const leftChats = chats.filter((c) => c.id !== chatId);
    setChats(leftChats);
    setCurrentView(ViewState.CHAT_LIST);
    setSelectedChatId(null);
  };

  const handleProfileSetupSubmit = (data: {
    nickname: string;
    avatarUrl: string;
    introduction: string;
  }) => {
    // 참고: 실제 앱에서는 사용자 프로필 업데이트 API 호출이 필요합니다.
    // 여기서는 프로토타입 시뮬레이션을 위해 로컬 상태만 업데이트합니다.
    // 전역 상태 관리(Context/Redux)가 있다면 액션을 디스패치해야 합니다.
    console.log(`프로필 설정 완료: ${data.nickname}`);

    // 프로필 정보 업데이트 (User 상태 업데이트)
    setCurrentUser((prev) => ({
      ...prev,
      name: data.nickname,
      avatarUrl: data.avatarUrl,
      introduction: data.introduction,
    }));
    setCurrentView(ViewState.HOME);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setCurrentView(ViewState.PROFILE);
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      // 실제 앱: 토큰 삭제, 유저 상태 초기화 등
      // 프로토타입: 온보딩으로 이동 및 초기화 시뮬레이션
      setCurrentView(ViewState.ONBOARDING);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) {
      // 탈퇴 로직 (API 호출 등)
      alert("회원 탈퇴가 완료되었습니다.");
      setCurrentView(ViewState.ONBOARDING);
      // 유저 상태 초기화
      setCurrentUser(CURRENT_USER);
    }
  };

  const createPost = (data: any) => {
    // 데모를 위해 서울 중심부 근처 랜덤 위치 생성
    const randomLat = 37.5665 + (Math.random() - 0.5) * 0.05;
    const randomLng = 126.978 + (Math.random() - 0.5) * 0.05;

    const newPost: Post = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      title: data.title,
      description: data.description,
      category: "OTHER",
      location: data.location,
      distance: "100m",
      lat: data.meetupType === "ONLINE" ? undefined : randomLat,
      lng: data.meetupType === "ONLINE" ? undefined : randomLng,
      maxMembers: 4,
      currentMembers: 1,
      time: data.time,
      tags: ["신규"],
      createdAt: Date.now(),
      comments: [],
      applicants: [],
      imageUrl:
        data.images && data.images.length > 0 ? data.images[0] : undefined,
      images: data.images,
    };
    setPosts([newPost, ...posts]);
    setCurrentView(ViewState.HOME);
  };

  return {
    currentView,
    setCurrentView,
    posts,
    chats,
    notifications,
    bookmarkedIds,
    selectedPost,
    selectedChatId,
    // 핸들러
    goToHome,
    goToPostDetail,
    goToChatRoom,
    toggleBookmark,
    handleJoin,
    handleCancelJoin,
    handleApprove,
    handleReject,
    handleAddComment,
    handleSendMessage,
    handleLeaveChat,
    createPost,
    // 프로필 설정
    goToProfileSetup,
    handleProfileSetupSubmit,
    // 프로필 관리
    currentUser,
    goToProfileEdit,
    goToProfile,
    handleProfileUpdate,
    handleLogout,
    handleDeleteAccount
  };
};
