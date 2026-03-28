import { useCallback, useEffect, useRef, useState } from "react";
import {
  CURRENT_USER,
  MOCK_CHATS,
  MOCK_NOTIFICATIONS,
  MOCK_POSTS,
} from "../constants";
import {
  cleanUpUrl,
  parseCallbackError,
  parseCallbackParams,
} from "../services/authService";
import {
  fetchCurrentUser,
  logoutUser,
  updateNotificationSetting,
  updateUserProfile,
  withdrawUser,
} from "../services/userService";
import {
  createPost as apiCreatePost,
  updatePost as apiUpdatePost,
  PostRequest,
} from "../services/postService";
import {
  ChatRoom,
  Comment,
  Message,
  Notification,
  Post,
  UpdateProfileRequest,
  User,
  ViewState,
} from "../types";

export const useAppLogic = () => {
  const [currentView, setCurrentView] = useState<ViewState>(
    ViewState.ONBOARDING,
  );
  const loginCheckDoneRef = useRef(false);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [chats, setChats] = useState<ChatRoom[]>(MOCK_CHATS);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [showRejoinConfirm, setShowRejoinConfirm] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // 토큰 갱신 실패 시 apiClient가 발생시키는 이벤트 처리
  useEffect(() => {
    const handleAuthLogout = () => {
      setCurrentUser(CURRENT_USER);
      setCurrentView(ViewState.ONBOARDING);
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  // 네비게이션 헬퍼
  const goToHome = () => setCurrentView(ViewState.HOME);
  const goToProfileSetup = () => setCurrentView(ViewState.PROFILE_SETUP);

  const goToPostDetail = (post: Post) => {
    setSelectedPost(post);
    setCurrentView(ViewState.POST_DETAIL);
  };

  const goToEditPost = (post: Post) => {
    setSelectedPost(post);
    setCurrentView(ViewState.EDIT_POST);
  };

  const goToChatRoom = (chatId: number) => {
    setSelectedChatId(chatId);
    setCurrentView(ViewState.CHAT_ROOM);
  };
  const refreshCurrentUser = async () => {
    setIsProfileLoading(true);
    try {
      const userData = await fetchCurrentUser();
      if (userData !== null) {
        setCurrentUser(userData);
      }
    } catch {
      // fetchCurrentUser already swallows errors internally;
      // this catch handles any unexpected rejections without surfacing them to the UI.
    } finally {
      setIsProfileLoading(false);
    }
  };

  const goToProfileEdit = () => {
    setCurrentView(ViewState.PROFILE_EDIT);
    refreshCurrentUser();
  };

  const goToProfile = () => {
    setCurrentView(ViewState.PROFILE);
    refreshCurrentUser();
  };

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
    if (selectedPost.applicants?.some((a) => a.userId === currentUser.userId)) {
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
          selectedPost.applicants?.filter(
            (a) => a.userId !== currentUser.userId,
          ) || [],
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
    const applicant = post.applicants?.find((u) => u.userId === applicantId);
    if (!applicant) return;

    const updatedPost = {
      ...post,
      currentMembers: post.currentMembers + 1,
      applicants: post.applicants?.filter((u) => u.userId !== applicantId),
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
    const applicant = post.applicants?.find((u) => u.userId === applicantId);
    if (!applicant) return;

    if (
      window.confirm(`${applicant.nickname}님의 참여 신청을 거절하시겠습니까?`)
    ) {
      const updatedPost = {
        ...post,
        applicants: post.applicants?.filter((u) => u.userId !== applicantId),
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
      authorId: currentUser.userId,
      authorName: currentUser.nickname,
      authorAvatar: currentUser.profileUrl,
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
      senderId: currentUser.userId,
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

  // 신규 유저 프로필 설정 완료
  // PATCH /api/v1/users/me 로 닉네임/소개 저장 후 홈으로 이동
  const handleProfileSetupSubmit = async (data: {
    nickname: string;
    avatarUrl: string;
    introduction: string;
  }) => {
    try {
      const savedUser = await updateUserProfile({
        nickname: data.nickname,
        introduction: data.introduction,
      });
      setCurrentUser(savedUser);
      setCurrentView(ViewState.HOME);
    } catch {
      alert("프로필 설정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 프로필 수정 저장 (ProfileEdit 컴포넌트에서 호출)
  // 변경된 필드만 서버에 전송하고, 변경이 없으면 API 호출 없이 화면 전환
  const handleProfileUpdate = async (updatedUser: User) => {
    const changes: UpdateProfileRequest = {};
    if (updatedUser.nickname !== currentUser.nickname) {
      changes.nickname = updatedUser.nickname;
    }
    if ((updatedUser.introduction ?? "") !== (currentUser.introduction ?? "")) {
      changes.introduction = updatedUser.introduction ?? "";
    }

    if (Object.keys(changes).length === 0) {
      setCurrentView(ViewState.PROFILE);
      return;
    }

    try {
      const savedUser = await updateUserProfile(changes);
      setCurrentUser(savedUser);
      setCurrentView(ViewState.PROFILE);
    } catch {
      alert("프로필 저장에 실패했습니다.");
    }
  };

  // 로그아웃: 백엔드에서 쿠키 무효화 후 클라이언트 상태 초기화
  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      try {
        await logoutUser();
      } catch {
        // 서버 오류가 발생해도 클라이언트 상태는 초기화
      }
      setCurrentUser(CURRENT_USER);
      setCurrentView(ViewState.ONBOARDING);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("정말로 탈퇴하시겠습니까?\n탈퇴 후 30일간 데이터가 보관되며, 이후 완전히 삭제됩니다.")) return;
    try {
      await withdrawUser();
    } catch {
      alert("회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setCurrentUser(CURRENT_USER);
    setCurrentView(ViewState.ONBOARDING);
  };

  const handleRejoinConfirm = async () => {
    setShowRejoinConfirm(false);
    const userData = await fetchCurrentUser();
    if (userData) {
      setCurrentUser(userData);
    }
    setCurrentView(ViewState.HOME);
  };

  const handleRejoinCancel = () => {
    setShowRejoinConfirm(false);
    setCurrentView(ViewState.ONBOARDING);
  };

  const toggleNotification = async () => {
    const previousValue = currentUser.notificationEnabled;
    const nextValue = !previousValue;

    // 낙관적 업데이트: 즉시 UI 상태 변경
    setCurrentUser((prev) => ({ ...prev, notificationEnabled: nextValue }));

    try {
      const result = await updateNotificationSetting(nextValue);
      // 서버 응답으로 상태 확정
      setCurrentUser((prev) => ({
        ...prev,
        notificationEnabled: result.notificationEnabled,
      }));
    } catch {
      // 실패 시 롤백
      setCurrentUser((prev) => ({
        ...prev,
        notificationEnabled: previousValue,
      }));
      alert("알림 설정 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const createPost = async (data: any) => {
    // assemble backend request payload (accept either `meetingType` or `meetupType` from UI)
    const meetingType = data.meetingType ?? data.meetupType;

    const request: PostRequest = {
      title: data.title,
      content: data.content || data.description,
      category: data.category,
      meetingType,
      meetingTime: data.meetingTime ?? data.time,
      maxMembers: data.maxMembers,
      locationName:
        meetingType === "ONLINE" ? null : (data.location ?? data.locationName),
      imageUrls: data.imageUrls ?? data.images,
    };

    try {
      const result = await apiCreatePost(request);

      // optimistic local update – still keep UX smooth until full sync
      const newPost: Post = {
        id: result.postId || Date.now(),
        authorId: currentUser.userId,
        authorName: currentUser.nickname,
        authorAvatar: currentUser.profileUrl,
        title: request.title,
        description: request.content,
        category: request.category as any,
        location: request.locationName || "",
        distance: "",
        meetingType: data.meetingType === "ONLINE" ? "ONLINE" : "OFFLINE",
        maxMembers: request.maxMembers,
        currentMembers: 1,
        time: request.meetingTime,
        tags: ["신규"],
        createdAt: Date.now(),
        comments: [],
        applicants: [],
        imageUrl:
          request.imageUrls && request.imageUrls.length > 0
            ? request.imageUrls[0]
            : undefined,
        images: request.imageUrls,
      };
      setPosts([newPost, ...posts]);
      setCurrentView(ViewState.HOME);
    } catch (err) {
      console.error(err);
      alert("모임 등록에 실패했습니다.");
    }
  };

  const editPost = async (data: any) => {
    if (!selectedPost) return;

    const meetingType = data.meetingType ?? data.meetupType;
    const request: PostRequest = {
      title: data.title,
      content: data.content || data.description,
      category: data.category,
      meetingType,
      meetingTime: data.meetingTime ?? data.time,
      maxMembers: data.maxMembers,
      locationName:
        meetingType === "ONLINE" ? null : (data.location ?? data.locationName),
      imageUrls: data.imageUrls ?? data.images,
    };

    try {
      // 1. 서버에 수정 API 요청
      const result = await apiUpdatePost(selectedPost.id, request);

      // 2. 프론트엔드 로컬 상태 업데이트
      const updatedPost = {
        ...selectedPost,
        title: request.title,
        description: request.content,
        category: request.category as any,
        meetingType: request.meetingType,
        time: request.meetingTime,
        maxMembers: request.maxMembers,
        location: request.locationName || "",
        images: request.imageUrls,
        imageUrl:
          request.imageUrls && request.imageUrls.length > 0
            ? request.imageUrls[0]
            : undefined,
      };

      setPosts(posts.map((p) => (p.id === selectedPost.id ? updatedPost : p)));
      setSelectedPost(updatedPost);

      // 3. 다시 상세 화면으로 이동
      setCurrentView(ViewState.POST_DETAIL);
      alert("모임이 수정되었습니다.");
    } catch (err) {
      console.error(err);
      alert("모임 수정에 실패했습니다.");
    }
  };

  const OAUTH_ERROR_MESSAGES: Record<string, string> = {
    access_denied: "로그인을 취소했습니다.",
    server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    temporarily_unavailable: "서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요.",
  };

  // OAuth2 콜백 처리 및 로그인 상태 확인
  // 토큰은 HttpOnly 쿠키로 백엔드가 관리하므로 JS에서 직접 접근하지 않음
  // loginCheckDoneRef로 StrictMode 이중 실행 및 currentView 변경 시 재실행 방지
  const checkLoginStatus = useCallback(async () => {
    if (loginCheckDoneRef.current) return;
    loginCheckDoneRef.current = true;

    // 1. OAuth2 콜백 에러 처리
    const callbackError = parseCallbackError();
    if (callbackError) {
      const message = OAUTH_ERROR_MESSAGES[callbackError] ?? "로그인에 실패했습니다.";
      alert(message);
      cleanUpUrl();
      return;
    }

    // 2. OAuth2 콜백 성공 처리 (URL에 userId, isNewUser 파라미터가 있는 경우)
    const loginData = parseCallbackParams();
    if (loginData) {
      cleanUpUrl();

      // TODO: 백엔드에서 is_deleted=true 파라미터 추가 시 동작
      if (loginData.isRejoin) {
        setShowRejoinConfirm(true);
        return;
      }

      if (loginData.isNewUser) {
        // userId만 임시 저장하고 프로필 설정 화면으로 이동
        setCurrentUser((prev) => ({ ...prev, userId: loginData.userId }));
        setCurrentView(ViewState.PROFILE_SETUP);
        return;
      }

      const userData = await fetchCurrentUser();
      if (userData) {
        setCurrentUser(userData);
      }

      setCurrentView(ViewState.HOME);
      return;
    }

    // 3. 쿠키 기반 자동 로그인 확인 (accessToken 쿠키가 유효한 경우)
    try {
      const userData = await fetchCurrentUser();
      if (userData) {
        setCurrentUser(userData);
        setCurrentView(ViewState.HOME);
      }
    } catch {
      // 인증되지 않은 상태 — 온보딩 화면 유지
    }
  }, []);

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
    goToEditPost,
    editPost,
    // 프로필 설정
    goToProfileSetup,
    handleProfileSetupSubmit,
    // 프로필 관리
    currentUser,
    isProfileLoading,
    goToProfileEdit,
    goToProfile,
    handleProfileUpdate,
    handleLogout,
    handleDeleteAccount,
    toggleNotification,
    checkLoginStatus,
    showRejoinConfirm,
    handleRejoinConfirm,
    handleRejoinCancel,
  };
};
