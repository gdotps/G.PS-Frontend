import { useCallback, useEffect, useRef, useState } from "react";
import { CURRENT_USER, MOCK_NOTIFICATIONS, MOCK_POSTS } from "../constants";
import {
  cleanUpUrl,
  parseCallbackError,
  parseCallbackParams,
} from "../services/authService";
import {
  fetchCurrentUser,
  getLikedMeetings,
  getMyApplications,
  logoutUser,
  updateNotificationSetting,
  updateUserProfile,
  withdrawUser,
} from "../services/userService";
import {
  createPost as apiCreatePost,
  updatePost as apiUpdatePost,
  deletePost as apiDeletePost,
  PostRequest,
} from "../services/postService";
import { toggleLike as apiToggleLike } from "../services/likeService";
import {
  ChatIncomingMessage,
  ChatMessageReadEvent,
  deleteChatMessage,
  exitChatRoom,
  getChatRoomHistory,
  getChatRoomUsers,
  markChatMessageAsRead,
  getMyChatRooms,
  sendChatMessage,
  subscribeChatRoom,
  unsubscribeChatRoom,
} from "../services/chatService";
import {
  ApplicationItem,
  ChatRoom,
  Comment,
  LikedMeeting,
  Message,
  Notification,
  Post,
  UpdateProfileRequest,
  User,
  ViewState,
} from "../types";

export const useAppLogic = () => {
  const DELETED_MESSAGE_TEXT = "메시지가 삭제되었습니다.";
  const [currentView, setCurrentView] = useState<ViewState>(
    ViewState.ONBOARDING,
  );
  const loginCheckDoneRef = useRef(false);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [selectedChatParticipants, setSelectedChatParticipants] = useState<
    User[]
  >([]);
  const [selectedChatIsManager, setSelectedChatIsManager] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false);
  const [showRejoinConfirm, setShowRejoinConfirm] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [myApplications, setMyApplications] = useState<ApplicationItem[]>([]);
  const [myApplicationsPage, setMyApplicationsPage] = useState<number>(0);
  const [myApplicationsIsLast, setMyApplicationsIsLast] =
    useState<boolean>(false);
  const [isApplicationsLoading, setIsApplicationsLoading] =
    useState<boolean>(false);
  const [likedMeetings, setLikedMeetings] = useState<LikedMeeting[]>([]);
  const [likedMeetingsPage, setLikedMeetingsPage] = useState<number>(0);
  const [likedMeetingsIsLast, setLikedMeetingsIsLast] =
    useState<boolean>(false);
  const [likedMeetingsTotalElements, setLikedMeetingsTotalElements] =
    useState<number>(0);
  const [isLikedMeetingsLoading, setIsLikedMeetingsLoading] =
    useState<boolean>(false);

  const mapIncomingMessageToState = (item: ChatIncomingMessage): Message => ({
    id: item.id,
    senderId: item.sender,
    senderUsername: item.senderUsername,
    text: item.messageType === "DELETED" ? DELETED_MESSAGE_TEXT : item.message,
    timestamp:
      typeof item.timestamp === "number"
        ? item.timestamp
        : new Date(item.timestamp).getTime(),
    deleted: item.messageType === "DELETED",
  });

  const hasPersistedMessageId = (id: string | number): boolean => {
    const value = String(id);
    return /^[a-f0-9]{24}$/i.test(value) || /^\d+$/.test(value);
  };

  const mapHistoryToMessages = (
    history: Awaited<ReturnType<typeof getChatRoomHistory>>,
  ): Message[] => {
    return history.map((item) => {
      const isDeleted = Boolean(item.deleted) || item.messageType === "DELETED";
      return {
        id: item.id,
        senderId: item.sender,
        senderUsername: item.senderUsername,
        text: isDeleted
          ? DELETED_MESSAGE_TEXT
          : item.messageType === "TEXT"
            ? item.message
            : item.message || "[이미지 메시지]",
        timestamp: new Date(item.timestamp).getTime(),
        readByUserIds: item.readBy ?? [],
        deleted: isDeleted,
      };
    });
  };

  const applyDeletedMessageToChat = (
    chat: ChatRoom,
    messageId: string,
  ): ChatRoom => {
    let changed = false;
    const nextMessages = chat.messages.map((message) => {
      if (String(message.id) !== String(messageId)) return message;
      changed = true;
      if (message.deleted && message.text === DELETED_MESSAGE_TEXT) {
        return message;
      }
      return {
        ...message,
        text: DELETED_MESSAGE_TEXT,
        deleted: true,
      };
    });

    if (!changed) return chat;

    const latestMessage = nextMessages[nextMessages.length - 1];
    return {
      ...chat,
      messages: nextMessages,
      lastMessage: latestMessage?.text ?? "",
      lastMessageTime: latestMessage
        ? new Date(latestMessage.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    };
  };

  const updateChatMessages = useCallback(
    (chatId: number, mappedMessages: Message[]) => {
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
    },
    [],
  );

  const markUnreadMessagesInRoom = useCallback(
    async (chatId: number, messages: Message[]) => {
      const unreadTargetMessages = messages.filter(
        (message) =>
          message.senderId !== currentUser.userId &&
          !(message.readByUserIds ?? []).includes(currentUser.userId) &&
          hasPersistedMessageId(message.id),
      );

      if (unreadTargetMessages.length === 0) return;

      await Promise.all(
        unreadTargetMessages.map((message) =>
          markChatMessageAsRead({
            roomId: chatId,
            messageId: String(message.id),
            userId: currentUser.userId,
          }),
        ),
      );
    },
    [currentUser.userId],
  );

  const syncRoomHistory = useCallback(
    async (chatId: number, markUnread = false) => {
      const history = await getChatRoomHistory(chatId);
      const mappedMessages = mapHistoryToMessages(history);
      updateChatMessages(chatId, mappedMessages);
      if (markUnread) {
        await markUnreadMessagesInRoom(chatId, mappedMessages);
      }
      return mappedMessages;
    },
    [markUnreadMessagesInRoom, updateChatMessages],
  );

  const appendIncomingMessage = useCallback(
    (incoming: ChatIncomingMessage) => {
      const incomingMessage = mapIncomingMessageToState(incoming);
      const incomingRoomId = Number(incoming.roomId);

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== incomingRoomId) return chat;

          const alreadyExists = chat.messages.some(
            (message) => String(message.id) === String(incomingMessage.id),
          );
          if (alreadyExists) return chat;

          const optimisticMessageIndex = chat.messages.findIndex((message) => {
            if (!String(message.id).startsWith("local-")) return false;
            if (message.senderId !== incomingMessage.senderId) return false;
            if (message.text !== incomingMessage.text) return false;
            return (
              Math.abs(message.timestamp - incomingMessage.timestamp) <= 15000
            );
          });

          if (optimisticMessageIndex >= 0) {
            const nextMessages = [...chat.messages];
            const prevOptimistic = nextMessages[optimisticMessageIndex];
            nextMessages[optimisticMessageIndex] = {
              ...prevOptimistic,
              ...incomingMessage,
              readByUserIds:
                incoming.readBy ?? prevOptimistic.readByUserIds ?? [],
            };

            return {
              ...chat,
              messages: nextMessages,
              lastMessage: incomingMessage.text,
              lastMessageTime: new Date(
                incomingMessage.timestamp,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };
          }

          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                ...incomingMessage,
                readByUserIds: incoming.readBy ?? [],
              },
            ],
            lastMessage: incomingMessage.text,
            lastMessageTime: new Date(
              incomingMessage.timestamp,
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        }),
      );

      if (
        selectedChatId === incomingRoomId &&
        incomingMessage.senderId !== currentUser.userId
      ) {
        if (hasPersistedMessageId(incomingMessage.id)) {
          void markChatMessageAsRead({
            roomId: incomingRoomId,
            messageId: String(incomingMessage.id),
            userId: currentUser.userId,
          });
        } else {
          void syncRoomHistory(incomingRoomId, true);
        }
      }
    },
    [currentUser.userId, selectedChatId, syncRoomHistory],
  );

  const applyReadEvent = useCallback(
    (event: ChatMessageReadEvent) => {
      let matched = false;

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== event.roomId) return chat;

          return {
            ...chat,
            messages: chat.messages.map((message) => {
              if (String(message.id) !== String(event.messageId))
                return message;
              matched = true;
              const baseReadBy = message.readByUserIds ?? [];
              if (baseReadBy.includes(event.userId)) return message;
              return {
                ...message,
                readByUserIds: [...baseReadBy, event.userId],
              };
            }),
          };
        }),
      );

      // Optimistic local IDs(local-*)와 서버 messageId가 불일치하는 경우를 보정한다.
      if (!matched) {
        void syncRoomHistory(event.roomId, false);
      }
    },
    [syncRoomHistory],
  );

  const applyDeleteEvent = useCallback((messageId: string) => {
    setChats((prev) =>
      prev.map((chat) => applyDeletedMessageToChat(chat, messageId)),
    );
  }, []);

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

  const loadChatRooms = useCallback(async () => {
    try {
      const data = await getMyChatRooms();
      setChats(
        data.map((room) => ({
          id: room.id,
          title: room.title,
          postId: room.postId,
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
          participants: [],
          messages: [],
        })),
      );
    } catch (err) {
      console.error("채팅방 호출 에러:", err);
    }
  }, []);

  const goToChatList = () => {
    void loadChatRooms();
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

      const mappedMessages = mapHistoryToMessages(history);
      updateChatMessages(chatId, mappedMessages);

      const mappedParticipants: User[] = users.map((user) => ({
        userId: user.id,
        nickname: user.nickname,
        profileUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nickname)}&background=F3F4F6&color=111827`,
        introduction: user.isManager ? "방장" : "참여자",
      }));

      setSelectedChatParticipants(
        mappedParticipants.length > 0
          ? mappedParticipants
          : [
              {
                ...currentUser,
                introduction: currentUser.introduction || "참여자",
              },
            ],
      );

      const me = users.find((user) => user.id === currentUser.userId);
      setSelectedChatIsManager(Boolean(me?.isManager));

      await subscribeChatRoom(
        chatId,
        appendIncomingMessage,
        applyReadEvent,
        applyDeleteEvent,
      );

      await markUnreadMessagesInRoom(chatId, mappedMessages);
    } catch (err) {
      console.error("채팅방 유저 호출 에러:", err);
      setSelectedChatIsManager(false);
      setSelectedChatParticipants([
        {
          ...currentUser,
          introduction: currentUser.introduction || "참여자",
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

  const fetchMyApplications = useCallback(async (page: number = 0) => {
    setIsApplicationsLoading(true);
    try {
      const data = await getMyApplications(page);
      if (page === 0) {
        setMyApplications(data.content);
      } else {
        setMyApplications((prev) => [...prev, ...data.content]);
      }
      setMyApplicationsPage(page);
      setMyApplicationsIsLast(data.last);
    } catch {
      alert("신청 목록을 불러오는 데 실패했습니다.");
    } finally {
      setIsApplicationsLoading(false);
    }
  }, []);

  const goToMyApplications = () => {
    setCurrentView(ViewState.MY_APPLICATIONS);
    fetchMyApplications(0);
  };

  const fetchLikedMeetings = useCallback(async (page: number = 0) => {
    setIsLikedMeetingsLoading(true);
    try {
      const data = await getLikedMeetings(page);
      if (page === 0) {
        setLikedMeetings(data.content);
      } else {
        setLikedMeetings((prev) => [...prev, ...data.content]);
      }
      setLikedMeetingsPage(page);
      setLikedMeetingsIsLast(data.isLast);
      setLikedMeetingsTotalElements(data.totalElements);
    } catch {
      alert("찜한 모임 목록을 불러오는 데 실패했습니다.");
    } finally {
      setIsLikedMeetingsLoading(false);
    }
  }, []);

  const goToBookmarks = () => {
    setCurrentView(ViewState.BOOKMARKS);
    fetchLikedMeetings(0);
  };

  const loadMoreLikedMeetings = useCallback(() => {
    if (!likedMeetingsIsLast && !isLikedMeetingsLoading) {
      fetchLikedMeetings(likedMeetingsPage + 1);
    }
  }, [
    likedMeetingsIsLast,
    isLikedMeetingsLoading,
    likedMeetingsPage,
    fetchLikedMeetings,
  ]);

  const loadMoreApplications = useCallback(() => {
    if (!myApplicationsIsLast && !isApplicationsLoading) {
      fetchMyApplications(myApplicationsPage + 1);
    }
  }, [
    myApplicationsIsLast,
    isApplicationsLoading,
    myApplicationsPage,
    fetchMyApplications,
  ]);

  // 액션
  const toggleLike = async (postId: number) => {
    if (isLikeLoading) return;

    const prevLiked = bookmarkedIds.includes(postId);
    // 낙관적 업데이트
    setBookmarkedIds((prev) =>
      prevLiked ? prev.filter((id) => id !== postId) : [...prev, postId],
    );

    setIsLikeLoading(true);
    try {
      const result = await apiToggleLike(postId);
      // 서버 응답으로 상태 확정
      setBookmarkedIds((prev) =>
        result.isLiked
          ? prev.includes(postId)
            ? prev
            : [...prev, postId]
          : prev.filter((id) => id !== postId),
      );
    } catch {
      // 실패 시 롤백
      setBookmarkedIds((prev) =>
        prevLiked ? [...prev, postId] : prev.filter((id) => id !== postId),
      );
      alert("좋아요 처리에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLikeLoading(false);
    }
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
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const optimisticMessage: Message = {
      id: `local-${Date.now()}`,
      senderId: currentUser.userId,
      senderUsername: currentUser.nickname,
      text: trimmedText,
      timestamp: Date.now(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, optimisticMessage],
              lastMessage: trimmedText,
              lastMessageTime: new Date(
                optimisticMessage.timestamp,
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : chat,
      ),
    );

    try {
      await sendChatMessage({
        roomId: selectedChatId,
        senderId: currentUser.userId,
        message: trimmedText,
        messageType: "TEXT",
        imageUrl: null,
      });
      void syncRoomHistory(selectedChatId, false);
    } catch (error) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                messages: chat.messages.filter(
                  (message) => message.id !== optimisticMessage.id,
                ),
              }
            : chat,
        ),
      );
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChatId) return;

    const prevChats = chats;
    setChats((current) =>
      current.map((chat) =>
        chat.id === selectedChatId
          ? applyDeletedMessageToChat(chat, messageId)
          : chat,
      ),
    );

    try {
      await deleteChatMessage({ messageId });
    } catch (error) {
      setChats(prevChats);
      console.error("메시지 삭제 실패:", error);
      alert("메시지 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleLeaveChat = async (chatId: number) => {
    if (selectedChatIsManager) {
      const targetChat = chats.find((chat) => chat.id === chatId);
      if (!targetChat) {
        alert("채팅방 정보를 찾을 수 없습니다.");
        return;
      }

      const targetPost = posts.find((post) => post.id === targetChat.postId);
      if (!targetPost) {
        alert(
          "게시글 정보를 찾을 수 없습니다. 홈에서 게시글을 다시 확인해주세요.",
        );
        return;
      }

      setSelectedPost(targetPost);
      setCurrentView(ViewState.POST_DETAIL);
      return;
    }

    try {
      await exitChatRoom(chatId);

      if (selectedChatId === chatId) {
        unsubscribeChatRoom();
      }
      const leftChats = chats.filter((c) => c.id !== chatId);
      setChats(leftChats);
      setCurrentView(ViewState.CHAT_LIST);
      setSelectedChatId(null);
      setSelectedChatIsManager(false);
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      alert("채팅방 나가기에 실패했습니다. 다시 시도해주세요.");
    }
  };

  useEffect(() => {
    return () => {
      unsubscribeChatRoom();
    };
  }, []);

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
    if (
      !window.confirm(
        "정말로 탈퇴하시겠습니까?\n탈퇴 후 30일간 데이터가 보관되며, 이후 완전히 삭제됩니다.",
      )
    )
      return;
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
      return result;
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
    temporarily_unavailable:
      "서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요.",
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
      const message =
        OAUTH_ERROR_MESSAGES[callbackError] ?? "로그인에 실패했습니다.";
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
    selectedChatParticipants,
    selectedChatIsManager,
    goToChatList,
    loadChatRooms,
    // 핸들러
    goToHome,
    goToPostDetail,
    goToChatRoom,
    toggleLike,
    handleJoin,
    handleCancelJoin,
    handleApprove,
    handleReject,
    handleAddComment,
    handleSendMessage,
    handleDeleteMessage,
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
    // 나의 신청 목록
    myApplications,
    myApplicationsIsLast,
    isApplicationsLoading,
    goToMyApplications,
    loadMoreApplications,
    // 찜한 모임
    likedMeetings,
    likedMeetingsTotalElements,
    likedMeetingsIsLast,
    isLikedMeetingsLoading,
    goToBookmarks,
    loadMoreLikedMeetings,
  };
};
