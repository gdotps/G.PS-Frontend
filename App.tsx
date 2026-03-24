import { useEffect } from "react";
import { BottomNav } from "./components/BottomNav";
import { useAppLogic } from "./hooks/useAppLogic";
import { getUserInfo } from "./services/userService";
import { ViewState } from "./types";

// Components
import { ApplicantListView } from "./components/ApplicantListView";
import { BookmarksView } from "./components/BookmarksView";
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
    // Profile Setup
    goToProfileSetup,
    handleProfileSetupSubmit,
    // Profile Management
    currentUser,
    goToProfileEdit,
    goToProfile,
    handleProfileUpdate,
    handleLogout,
    handleDeleteAccount,
    toggleNotification,
    checkLoginStatus, // Updated hook name
    goToEditPost,
    editPost,
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
              currentUser.nickname === "상경한꿈돌이" ? "" : currentUser.nickname
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
          />
        );
      case ViewState.HOME:
        return (
          <HomeView
            posts={posts}
            notifications={notifications}
            onViewPost={goToPostDetail}
            onOpenNotifications={() => setCurrentView(ViewState.NOTIFICATIONS)}
          />
        );
      case ViewState.POST_DETAIL:
        return selectedPost ? (
          <PostDetail
            post={selectedPost}
            currentUser={currentUser}
            isBookmarked={bookmarkedIds.includes(selectedPost.id)}
            onToggleBookmark={() => toggleBookmark(selectedPost.id)}
            onBack={goToHome}
            onJoin={handleJoin}
            onCancelJoin={handleCancelJoin}
            onApprove={handleApprove}
            onReject={handleReject}
            onAddComment={handleAddComment}
            onEdit={goToEditPost}
          />
        ) : null;
      case ViewState.MAP:
        return <MapView posts={posts} onViewPost={goToPostDetail} />;
      case ViewState.CHAT_LIST:
        return <ChatList chats={chats} onSelectChat={goToChatRoom} />;
      case ViewState.CHAT_ROOM:
        const currentChat = chats.find((c) => c.id === selectedChatId);
        return currentChat ? (
          <ChatRoomView
            chatRoom={currentChat}
            participantsInfo={currentChat.participants.map((uid) =>
              getUserInfo(uid, posts),
            )}
            onBack={() => setCurrentView(ViewState.CHAT_LIST)}
            onSendMessage={handleSendMessage}
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
            onCancel={() => setCurrentView(ViewState.POST_DETAIL)}
            onCreate={editPost}
          />
        ) : null;

      case ViewState.PROFILE:
        return (
          <ProfileView
            user={currentUser}
            bookmarkCount={bookmarkedIds.length}
            onViewBookmarks={() => setCurrentView(ViewState.BOOKMARKS)}
            onViewApplicants={() => setCurrentView(ViewState.APPLICANTS)}
            onEditProfile={goToProfileEdit}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onToggleNotification={toggleNotification}
          />
        );
      case ViewState.NOTIFICATIONS:
        return (
          <NotificationView notifications={notifications} onBack={goToHome} />
        );
      case ViewState.BOOKMARKS:
        const bookmarkedPosts = posts.filter((p) =>
          bookmarkedIds.includes(p.id),
        );
        return (
          <BookmarksView
            posts={bookmarkedPosts}
            onViewPost={goToPostDetail}
            onBack={() => setCurrentView(ViewState.PROFILE)}
          />
        );
      case ViewState.APPLICANTS:
        return (
          <ApplicantListView
            posts={posts}
            onBack={() => setCurrentView(ViewState.PROFILE)}
            onApprove={handleApprove}
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

  return (
    <div className="bg-white min-h-screen max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans text-gray-900">
      {renderContent()}
      {showNav && (
        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      )}
    </div>
  );
}
