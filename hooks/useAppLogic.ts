import { useCallback, useState } from "react";
import {
  CURRENT_USER,
  MOCK_CHATS,
  MOCK_NOTIFICATIONS,
  MOCK_POSTS,
} from "../constants";
import {
  cleanUpUrl,
  logout,
  parseCallbackError,
  parseCallbackParams,
  refreshAccessToken,
} from "../services/authService";
import { fetchMyProfile, updateMyProfile } from "../services/userService";
import {
  ChatRoom,
  Comment,
  Message,
  Notification,
  Post,
  User,
  ViewState,
} from "../types";

export const useAppLogic = () => {
  const [currentView, setCurrentView] = useState<ViewState>(
    ViewState.ONBOARDING,
  );
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [chats, setChats] = useState<ChatRoom[]>(MOCK_CHATS);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  // 네비게이션 헬퍼
  const goToHome = () => setCurrentView(ViewState.HOME);
  const goToProfileSetup = () => setCurrentView(ViewState.PROFILE_SETUP);

  const goToPostDetail = (post: Post) => {
    setSelectedPost(post);
    setCurrentView(ViewState.POST_DETAIL);
  };
  const goToChatRoom = (chatId: number) => {
    setSelectedChatId(chatId);
    setCurrentView(ViewState.CHAT_ROOM);
  };
  const goToProfileEdit = () => setCurrentView(ViewState.PROFILE_EDIT);
  const goToProfile = () => setCurrentView(ViewState.PROFILE);
  const goToMyApplications = () => setCurrentView(ViewState.MY_APPLICATIONS);

  // 액션
  const toggleBookmark = (postId: number) => {
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
          selectedPost.applicants?.filter((a) => a.id !== currentUser.id) || [],
      };
      setPosts(posts.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
      setSelectedPost(updatedPost);
    }
  };

  const handleApprove = (postId: number, applicantId: number) => {
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
    alert(`${applicant.nickname}님의 참여를 승인했습니다!`);
  };

  const handleReject = (postId: number, applicantId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const applicant = post.applicants?.find((u) => u.id === applicantId);
    if (!applicant) return;

    if (window.confirm(`${applicant.nickname}님의 참여 신청을 거절하시겠습니까?`)) {
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
      id: Date.now(), // comment Id 나중에 다시 number로 매치해야함
      authorId: currentUser.id,
      authorName: currentUser.nickname,
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
      id: Date.now(), // string에서 이걸로 변경됨
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

  const handleLeaveChat = (chatId: number) => {
    const leftChats = chats.filter((c) => c.id !== chatId);
    setChats(leftChats);
    setCurrentView(ViewState.CHAT_LIST);
    setSelectedChatId(null);
  };

  const handleProfileSetupSubmit = async (data: {
    nickname: string;
    avatarUrl: string;
    introduction: string;
  }) => {
    const result = await updateMyProfile({
      nickname: data.nickname,
      introduction: data.introduction || undefined,
    });

    if (!result.success) {
      alert("프로필 등록에 실패했습니다.");
      return;
    }

    setCurrentUser((prev) => ({
      ...prev,
      nickname: result.data.nickname,
      avatarUrl: data.avatarUrl, // 이미지는 별도 API이므로 로컬 값 유지
      introduction: result.data.introduction || "",
    }));
    setCurrentView(ViewState.HOME);
  };

  const handleProfileUpdate = async (updatedUser: User) => {
    const result = await updateMyProfile({
      nickname: updatedUser.nickname,
      introduction: updatedUser.introduction || undefined,
    });

    if (!result.success) {
      alert("프로필 수정에 실패했습니다.");
      return;
    }

    // API 응답으로 상태 반영 (nickname, introduction은 서버 응답 기준)
    setCurrentUser((prev) => ({
      ...prev,
      nickname: result.data.nickname,
      introduction: result.data.introduction || "",
      avatarUrl: updatedUser.avatarUrl, // 이미지는 별도 API이므로 로컬 값 유지
    }));
    setCurrentView(ViewState.PROFILE);
  };

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await logout(); // 서버 RefreshToken 삭제 + 쿠키 만료 처리
      setCurrentUser(CURRENT_USER);
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

  const toggleNotification = () => {
    setCurrentUser((prev) => ({
      ...prev,
      notificationEnabled: !prev.notificationEnabled,
    }));
  };

  const createPost = (data: any) => {
    // 데모를 위해 서울 중심부 근처 랜덤 위치 생성
    const randomLat = 37.5665 + (Math.random() - 0.5) * 0.05;
    const randomLng = 126.978 + (Math.random() - 0.5) * 0.05;

    const newPost: Post = {
      id: Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.nickname,
      authorAvatar: currentUser.avatarUrl,
      title: data.title,
      description: data.description,
      category: data.category,
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

  // 사용자 정보 응답으로 상태 업데이트하는 헬퍼
  const applyUserData = (userData: {
    id: number;
    nickname: string;
    profileUrl: string | null;
    introduction: string | null;
    notificationEnabled: boolean;
  }) => {
    setCurrentUser({
      id: userData.id,
      nickname: userData.nickname,
      avatarUrl: userData.profileUrl || "/default_profile.png",
      isSanggyeongJwi: true,
      hometown: "지역 미설정",
      introduction: userData.introduction || "",
      notificationEnabled: userData.notificationEnabled,
    });
    if (currentView === ViewState.ONBOARDING) {
      setCurrentView(ViewState.HOME);
    }
  };

  // OAuth2 콜백 처리 및 로그인 상태 확인
  const checkLoginStatus = useCallback(async () => {
    // 1. OAuth2 콜백 에러 처리
    const callbackError = parseCallbackError();
    if (callbackError) {
      console.error("소셜 로그인 실패:", callbackError);
      alert(`로그인에 실패했습니다: ${callbackError}`);
      cleanUpUrl();
      return;
    }

    // 2. OAuth2 콜백 성공 처리 (URL에 userId, isNewUser 파라미터가 있는 경우)
    // parseCallbackParams 내부에서 URL의 refreshToken도 함께 저장됨
    const loginData = parseCallbackParams();
    if (loginData) {
      cleanUpUrl();

      setCurrentUser((prev) => ({
        ...prev,
        id: loginData.userId,
      }));

      // 신규 유저: 프로필 설정으로 이동
      if (loginData.isNewUser) {
        setCurrentView(ViewState.PROFILE_SETUP);
        return;
      }

      // 기존 유저: 홈으로 이동
      setCurrentView(ViewState.HOME);
      return;
    }

    // 3. 쿠키 기반 로그인 상태 확인 (GET /api/v1/users/me, accessToken HttpOnly 쿠키 자동 전송)
    try {
      const profileResult = await fetchMyProfile();

      if (profileResult.status === "success") {
        applyUserData(profileResult.data);
        return;
      }

      // 4. 401: accessToken 만료 → refreshToken으로 재발급 시도
      if (profileResult.status === "unauthorized") {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          console.log("RefreshToken 만료 또는 없음 → 재로그인 필요");
          return;
        }

        // 재발급 성공 → GET /api/v1/users/me 재시도
        const retryResult = await fetchMyProfile();
        if (retryResult.status === "success") {
          applyUserData(retryResult.data);
        } else {
          console.log("토큰 재발급 후에도 인증 실패");
        }
        return;
      }

      console.log("프로필 조회 실패 (status:", profileResult.status, ")");
    } catch (error) {
      console.error("Failed to check login status:", error);
    }
  }, [currentView]);

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
    goToMyApplications,
    handleProfileUpdate,
    handleLogout,
    handleDeleteAccount,
    toggleNotification,
    checkLoginStatus,
  };
};
