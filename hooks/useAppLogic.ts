import { useCallback, useState } from "react";
import {
  CURRENT_USER,
  MOCK_CHATS,
  MOCK_NOTIFICATIONS,
  MOCK_POSTS,
} from "../constants";
import {
  cleanUpUrl,
  clearTokens,
  getAccessToken,
  parseCallbackError,
  parseCallbackParams,
  saveAccessToken,
} from "../services/authService";
import { fetchCurrentUser } from "../services/userService";
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

  const goToEditPost = (post: Post) => {
    //setSelectedPost(post);
    setCurrentView(ViewState.EDIT_POST);
  };

  const goToChatRoom = (chatId: number) => {
    setSelectedChatId(chatId);
    setCurrentView(ViewState.CHAT_ROOM);
  };
  const goToProfileEdit = () => setCurrentView(ViewState.PROFILE_EDIT);
  const goToProfile = () => setCurrentView(ViewState.PROFILE);

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

  const handleDeletePost = (postId: number) => {
    if (!window.confirm("정말로 이 모임을 삭제하시겠습니까?")) return;
    setPosts(posts.filter((p) => p.id !== postId));

    if (selectedPost?.id === postId) {
      setSelectedPost(null);
      setCurrentView(ViewState.HOME);
    }

    alert("모임이 삭제되었습니다.");
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
      nickname: data.nickname,
      profileUrl: data.avatarUrl,
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
      clearTokens();
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
      const token = getAccessToken();
      if (!token) {
        alert(
          "로그인된 사용자만 모임을 개설할 수 있습니다. 소셜 로그인 후 다시 시도해주세요.",
        );
        return;
      }

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
      console.log("accessToken is", getAccessToken());
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

    // 2. OAuth2 콜백 성공 처리 (URL에 토큰 파라미터가 있는 경우)
    const loginData = parseCallbackParams();
    if (loginData) {
      saveAccessToken(loginData.accessToken);
      cleanUpUrl();

      if (loginData.isNewUser) {
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

    // 3. 기존 토큰 기반 로그인 상태 확인
    const existingToken = getAccessToken();
    if (!existingToken) {
      console.log("Not authenticated (No token found)");
      return;
    }

    try {
      const userData = await fetchCurrentUser();
      if (userData) {
        setCurrentUser(userData);
        if (currentView === ViewState.ONBOARDING) {
          setCurrentView(ViewState.HOME);
        }
      } else {
        console.log("Not authenticated (Token invalid or expired)");
        clearTokens();
      }
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
    handleDeletePost,
    goToEditPost,
    editPost,
    // 프로필 설정
    goToProfileSetup,
    handleProfileSetupSubmit,
    // 프로필 관리
    currentUser,
    goToProfileEdit,
    goToProfile,
    handleProfileUpdate,
    handleLogout,
    handleDeleteAccount,
    toggleNotification,
    checkLoginStatus,
  };
};
