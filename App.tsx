import { useEffect } from "react";
import { BottomNav } from "./components/BottomNav";
import { useAppLogic } from "./hooks/useAppLogic";
import { ViewState } from "./types";

// Components
import { ApplicantListView } from "./components/ApplicantListView";
import { BookmarksView } from "./components/BookmarksView";
import { MyApplicationsView } from "./components/MyApplicationsView";
import { ChatList } from "./components/ChatList";
import { ChatRoomView } from "./components/ChatRoomView";
import { CreatePostView } from "./components/CreatePostView";
import { HomeView } from "./components/HomeView";
import { MapView } from "./components/MapView";
import { NotificationView } from "./components/NotificationView";
import { Onboarding } from "./components/Onboarding";
import { PostDetail } from "./components/PostDetail";
import { ProfileEdit } from "./components/ProfileEdit";
import { ProfileSetup } from "./components/ProfileSetup";
import { ProfileView } from "./components/ProfileView";
import { ConfirmModal } from "./components/ConfirmModal";

export default function App() {
  const {
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
    goToHome,
    goToPostDetail,
    goToPostDetailById,
    goToChatList,
    goToChatRoom,
    toggleLike,
    handleJoin,
    handleCancelJoin,
    handleApprove,
    handleReject,
    handleAddComment,
    handleDeleteComment,
    handleSendMessage,
    handleDeleteMessage,
    handleLeaveChat,
    createPost,
    // Profile Setup
    goToProfileSetup,
    handleProfileSetupSubmit,
    // Profile Management
    currentUser,
    isProfileLoading,
    goToProfileEdit,
    goToProfile,
    handleProfileUpdate,
    handleLogout,
    handleDeleteAccount,
    toggleNotification,
    checkLoginStatus, // Updated hook name
    goToEditPost,
    editPost,
    handleDeletePost,
    showRejoinConfirm,
    handleRejoinConfirm,
    handleRejoinCancel,
    myApplications,
    myApplicationsIsLast,
    isApplicationsLoading,
    goToMyApplications,
    loadMoreApplications,
    fetchApplicantPostSummaries,
    fetchApplicantsByPostId,
    likedMeetings,
    likedMeetingsTotalElements,
    likedMeetingsIsLast,
    isLikedMeetingsLoading,
    goToBookmarks,
    loadMoreLikedMeetings,
    // Push notifications
    isPushSupportedState,
    pushSubscription,
    isPushLoading,
    handleSubscribeToPush,
    handleUnsubscribeFromPush,
    // Notifications
    goToNotifications,
    loadMoreNotifications,
    handleMarkNotificationAsRead,
    isNotificationLoading,
    notificationIsLast,
    inAppNotification,
    dismissInAppNotification,
  } = useAppLogic();

  useEffect(() => {
    // 앱 시작 시 로그인 상태 확인 (OAuth2 콜백 처리 포함)
    checkLoginStatus();
  }, [checkLoginStatus]);

  // Route/View Switcher
  const renderContent = () => {
    switch (currentView) {
      case ViewState.ONBOARDING:
        return <Onboarding onComplete={goToHome} />;
      case ViewState.PROFILE_SETUP:
        return (
          <ProfileSetup
            initialNickname={
              currentUser.nickname === "상경한꿈돌이"
                ? ""
                : currentUser.nickname
            }
            onComplete={handleProfileSetupSubmit}
          />
        );
      case ViewState.PROFILE_EDIT:
        return (
          <ProfileEdit
            user={currentUser}
            onSave={handleProfileUpdate}
            onCancel={goToProfile}
            isLoading={isProfileLoading}
          />
        );
      case ViewState.HOME:
        return (
          <HomeView
            posts={posts}
            notifications={notifications}
            onViewPost={goToPostDetail}
            onOpenNotifications={goToNotifications}
          />
        );
      case ViewState.POST_DETAIL:
        return selectedPost ? (
          <PostDetail
            post={selectedPost}
            currentUser={currentUser}
            isBookmarked={bookmarkedIds.includes(selectedPost.id)}
            onToggleBookmark={() => toggleLike(selectedPost.id)}
            onBack={goToHome}
            onJoin={handleJoin}
            onCancelJoin={handleCancelJoin}
            onApprove={handleApprove}
            onReject={handleReject}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            onEdit={() => goToEditPost(selectedPost)}
            onDelete={handleDeletePost}
          />
        ) : null;
      case ViewState.MAP:
        return <MapView posts={posts} onViewPost={goToPostDetail} />;
      case ViewState.CHAT_LIST:
        return (
          <ChatList chats={chats} posts={posts} onSelectChat={goToChatRoom} />
        );
      case ViewState.CHAT_ROOM:
        const currentChat = chats.find((c) => c.id === selectedChatId);
        return currentChat ? (
          <ChatRoomView
            chatRoom={currentChat}
            participantsInfo={selectedChatParticipants}
            currentUserId={currentUser.userId}
            currentUserName={currentUser.nickname}
            isCurrentUserManager={selectedChatIsManager}
            onBack={() => setCurrentView(ViewState.CHAT_LIST)}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onLeave={() => handleLeaveChat(currentChat.id)}
          />
        ) : (
          <div>Chat not found</div>
        );
      case ViewState.CREATE_POST:
        return <CreatePostView onCancel={goToHome} onCreate={createPost} />;

      case ViewState.EDIT_POST: // 추가된 화면 렌더링
        return selectedPost ? (
          <CreatePostView
            initialPost={selectedPost}
            onCancel={() => void goToPostDetailById(selectedPost.id)}
            onCreate={editPost}
          />
        ) : null;

      case ViewState.PROFILE:
        return (
          <ProfileView
            user={currentUser}
            bookmarkCount={likedMeetingsTotalElements}
            onViewBookmarks={goToBookmarks}
            onViewApplicants={() => setCurrentView(ViewState.APPLICANTS)}
            onViewMyApplications={goToMyApplications}
            onEditProfile={goToProfileEdit}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onToggleNotification={toggleNotification}
            isPushSupported={isPushSupportedState}
            pushSubscription={pushSubscription}
            isPushLoading={isPushLoading}
            onSubscribeToPush={handleSubscribeToPush}
            onUnsubscribeFromPush={handleUnsubscribeFromPush}
            isLoading={isProfileLoading}
          />
        );
      case ViewState.NOTIFICATIONS:
        return (
          <NotificationView
            notifications={notifications}
            onBack={goToHome}
            onNotificationClick={async (notification) => {
              // 알림 읽음 처리
              if (!notification.isRead) {
                await handleMarkNotificationAsRead(notification.id);
              }
              // 알림 타입에 따라 네비게이션
              if (notification.postId) {
                goToPostDetailById(notification.postId);
              } else if (notification.chatRoomId) {
                goToChatRoom(notification.chatRoomId);
              } else {
                // 다른 타입의 알림은 홈으로
                goToHome();
              }
            }}
            onLoadMore={loadMoreNotifications}
            isLoading={isNotificationLoading}
            hasMore={!notificationIsLast}
          />
        );
      case ViewState.BOOKMARKS:
        return (
          <BookmarksView
            meetings={likedMeetings}
            isLoading={isLikedMeetingsLoading}
            isLast={likedMeetingsIsLast}
            onLoadMore={loadMoreLikedMeetings}
            onBack={() => setCurrentView(ViewState.PROFILE)}
          />
        );
      case ViewState.APPLICANTS:
        return (
          <ApplicantListView
            onBack={() => setCurrentView(ViewState.PROFILE)}
            onFetchApplicantPosts={fetchApplicantPostSummaries}
            onFetchApplicants={fetchApplicantsByPostId}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        );
      case ViewState.MY_APPLICATIONS:
        return (
          <MyApplicationsView
            applications={myApplications}
            isLoading={isApplicationsLoading}
            isLast={myApplicationsIsLast}
            onLoadMore={loadMoreApplications}
            onBack={() => setCurrentView(ViewState.PROFILE)}
          />
        );
      default:
        return <div>Not found</div>;
    }
  };

  const showNav = [
    ViewState.HOME,
    ViewState.MAP,
    ViewState.CHAT_LIST,
    ViewState.PROFILE,
  ].includes(currentView);

  const handleChangeView = (view: ViewState) => {
    if (view === ViewState.CHAT_LIST) {
      goToChatList();
      return;
    }
    setCurrentView(view);
  };

  return (
    <div className="bg-white min-h-screen max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans text-gray-900">
      {renderContent()}

      {inAppNotification && (
        <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto bg-white border border-gray-200 shadow-xl rounded-3xl overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gps-500 text-white text-lg">
                🔔
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {inAppNotification.title}
                  </p>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    onClick={dismissInAppNotification}
                  >
                    ×
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {inAppNotification.body}
                </p>
                <button
                  className="mt-3 w-full rounded-2xl bg-gps-500 px-3 py-2 text-sm font-medium text-white hover:bg-gps-600"
                  onClick={() => {
                    dismissInAppNotification();
                    goToNotifications();
                  }}
                >
                  알림 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNav && (
        <BottomNav currentView={currentView} onChangeView={handleChangeView} />
      )}
      {showRejoinConfirm && (
        <ConfirmModal
          message="재가입하시겠습니까?"
          onConfirm={handleRejoinConfirm}
          onCancel={handleRejoinCancel}
        />
      )}
    </div>
  );
}
