import { useCallback, useEffect, useState } from "react";
import { CURRENT_USER, MOCK_NOTIFICATIONS, MOCK_POSTS } from "../constants";
import {
  cleanUpUrl,
  clearTokens,
  getAccessToken,
  parseCallbackError,
  parseCallbackParams,
  saveAccessToken,
} from "../services/authService";
import {
  createPost as apiCreatePost,
  PostRequest,
} from "../services/postService";
import {
  ChatIncomingMessage,
  getChatRoomHistory,
  getChatRoomUsers,
  getMyChatRooms,
  sendChatMessage,
  subscribeChatRoom,
  unsubscribeChatRoom,
} from "../services/chatService";
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
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [selectedChatParticipants, setSelectedChatParticipants] = useState<User[]>([]);

  const mapIncomingMessageToState = (item: ChatIncomingMessage): Message => ({
    id: item.id,
    senderId: item.sender,
    senderUsername: item.senderUsername,
    text: item.message,
    timestamp:
      typeof item.timestamp === "number"
        ? item.timestamp
        : new Date(item.timestamp).getTime(),
  });

  const appendIncomingMessage = useCallback((incoming: ChatIncomingMessage) => {
    const incomingMessage = mapIncomingMessageToState(incoming);
    const incomingRoomId = Number(incoming.roomId);

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== incomingRoomId) return chat;

        const alreadyExists = chat.messages.some(
          (message) => String(message.id) === String(incomingMessage.id),
        );
        if (alreadyExists) return chat;

        return {
          ...chat,
          messages: [...chat.messages, incomingMessage],
          lastMessage: incomingMessage.text,
          lastMessageTime: new Date(incomingMessage.timestamp).toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            },
          ),
        };
      }),
    );
  }, []);


  // 네비게이션 헬퍼
  const goToHome = () => setCurrentView(ViewState.HOME);
  const goToProfileSetup = () => setCurrentView(ViewState.PROFILE_SETUP);

  const goToPostDetail = (post: Post) => {
    setSelectedPost(post);
    setCurrentView(ViewState.POST_DETAIL);
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
  // 채팅방 목록 로드 함수 추가
  const loadChatRooms = useCallback(async () => {
    try {
      const data = await getMyChatRooms();
      // 불필요한 필드 제거하고 id, title, postId만 저장
      setChats(data.map(room => ({
        id: room.id,
        title: room.title,
        postId: room.postId,
        lastMessage: "",
        lastMessageTime: "",
        unreadCount: 0,
        participants: [],
        messages: [],
      })));
    } catch (err) {
      console.error("채팅방 호출 에러:", err);
    }
  }, []);

  // 네비게이션: 채팅 목록으로 갈 때 호출
  const goToChatList = () => {
    loadChatRooms(); // API 호출 실행
    setCurrentView(ViewState.CHAT_LIST);
  };
  
  const goToChatRoom = async (chatId: number) => {
    unsubscribeChatRoom();
    setSelectedChatId(chatId);
    try {
      const [users, history] = await Promise.all([
        getChatRoomUsers(chatId),
        getChatRoomHistory(chatId),
      ]);

      const mappedMessages: Message[] = history.map((item) => ({
        id: item.id,
        senderId: item.sender,
        senderUsername: item.senderUsername,
        text:
          item.messageType === "TEXT"
            ? item.message
            : item.message || "[이미지 메시지]",
        timestamp: new Date(item.timestamp).getTime(),
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: mappedMessages,
                lastMessage:
                  mappedMessages.length > 0
                    ? mappedMessages[mappedMessages.length - 1].text
                    : "",
                lastMessageTime:
                  mappedMessages.length > 0
                    ? new Date(
                        mappedMessages[mappedMessages.length - 1].timestamp,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "",
              }
            : chat,
        ),
      );

      const mappedParticipants: User[] = users.map((user) => ({
        id: user.id,
        name: user.nickname,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=F3F4F6&color=111827`,
        isSanggyeongJwi: false,
        hometown: user.isManager ? "방장" : "참여자",
      }));

      setSelectedChatParticipants(
        mappedParticipants.length > 0
          ? mappedParticipants
          : [
              {
                ...currentUser,
                hometown: currentUser.hometown || "참여자",
              },
            ],
      );

        await subscribeChatRoom(chatId, appendIncomingMessage);
    } catch (err) {
      console.error("채팅방 유저 호출 에러:", err);
      setSelectedChatParticipants([
        {
          ...currentUser,
          hometown: currentUser.hometown || "참여자",
        },
      ]);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [],
                lastMessage: "",
                lastMessageTime: "",
              }
            : chat,
        ),
      );
    }
    setCurrentView(ViewState.CHAT_ROOM);
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
    alert(`${applicant.name}님의 참여를 승인했습니다!`);
  };

  const handleReject = (postId: number, applicantId: number) => {
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
      id: Date.now(), // comment Id 나중에 다시 number로 매치해야함
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
    try {
      await sendChatMessage({
        roomId: selectedChatId,
        senderId: currentUser.id,
        message: text,
        messageType: "TEXT",
        imageUrl: null,
      });
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleLeaveChat = (chatId: number) => {
    if (selectedChatId === chatId) {
      unsubscribeChatRoom();
    }
    const leftChats = chats.filter((c) => c.id !== chatId);
    setChats(leftChats);
    setCurrentView(ViewState.CHAT_LIST);
    setSelectedChatId(null);
  };

  useEffect(() => {
    return () => {
      unsubscribeChatRoom();
    };
  }, []);

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
      const result = await apiCreatePost(request);

      // optimistic local update – still keep UX smooth until full sync
      const newPost: Post = {
        id: result.postId || Date.now(),
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatarUrl,
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
      return result;
    } catch (err) {
      console.log("accessToken is", getAccessToken());
      console.error(err);
      alert("모임 등록에 실패했습니다.");
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

    // 3. 기존 토큰 기반 로그인 상태 확인
    const existingToken = getAccessToken();
    if (!existingToken) {
      console.debug("Not authenticated (No token found)");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/auth", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${existingToken}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const bodyPreview = (await response.text()).slice(0, 120);
          console.warn("Unexpected /auth response type:", contentType, bodyPreview);
          clearTokens();
          return;
        }

        const result = await response.json();
        if (result.data) {
          const userData = result.data;
          setCurrentUser({
            id: userData.id,
            name: userData.name,
            avatarUrl: userData.profileUrl || "/default_profile.png",
            isSanggyeongJwi: true,
            hometown: "지역 미설정",
            introduction: "",
            notificationEnabled: true,
          });

          if (currentView === ViewState.ONBOARDING) {
            setCurrentView(ViewState.HOME);
          }
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
    selectedChatParticipants,
    goToChatList,
    loadChatRooms,
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
    handleDeleteAccount,
    toggleNotification,
    checkLoginStatus,
  };
};
