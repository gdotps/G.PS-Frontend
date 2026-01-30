import React from 'react';
import { ViewState } from './types';
import { CURRENT_USER } from './constants';
import { BottomNav } from './components/BottomNav';
import { useAppLogic } from './hooks/useAppLogic';
import { getUserInfo } from './services/userService';

// Components
import { Onboarding } from './components/Onboarding';
import { HomeView } from './components/HomeView';
import { BookmarksView } from './components/BookmarksView';
import { ApplicantListView } from './components/ApplicantListView';
import { NotificationView } from './components/NotificationView';
import { PostDetail } from './components/PostDetail';
import { ChatList } from './components/ChatList';
import { ChatRoomView } from './components/ChatRoomView';
import { MapView } from './components/MapView';
import { CreatePostView } from './components/CreatePostView';
import { ProfileView } from './components/ProfileView';
import { ProfileSetup } from './components/ProfileSetup';
import { ProfileEdit } from './components/ProfileEdit';

export default function App() {
  const {
    currentView, setCurrentView,
    posts, chats, notifications, bookmarkedIds,
    selectedPost, selectedChatId,
    goToHome, goToPostDetail, goToChatRoom,
    toggleBookmark,
    handleJoin, handleCancelJoin,
    handleApprove, handleReject,
    handleAddComment,
    handleSendMessage, handleLeaveChat,
    createPost,
    // Profile Setup
    goToProfileSetup, handleProfileSetupSubmit,
    // Profile Management
    currentUser,
    goToProfileEdit, goToProfile,
    handleProfileUpdate, handleLogout, handleDeleteAccount,
    toggleNotification
  } = useAppLogic();

  // Route/View Switcher
  const renderContent = () => {
    switch (currentView) {
      case ViewState.ONBOARDING:
        return <Onboarding onComplete={goToProfileSetup} />;
      case ViewState.PROFILE_SETUP:
        return (
          <ProfileSetup
            initialNickname={currentUser.name === '상경한꿈돌이' ? '' : currentUser.name}
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
            isBookmarked={bookmarkedIds.includes(selectedPost.id)}
            onToggleBookmark={() => toggleBookmark(selectedPost.id)}
            onBack={goToHome}
            onJoin={handleJoin}
            onCancelJoin={handleCancelJoin}
            onApprove={handleApprove}
            onReject={handleReject}
            onAddComment={handleAddComment}
          />
        ) : null;
      case ViewState.MAP:
        return <MapView posts={posts} onViewPost={goToPostDetail} />;
      case ViewState.CHAT_LIST:
        return <ChatList chats={chats} onSelectChat={goToChatRoom} />;
      case ViewState.CHAT_ROOM:
        const currentChat = chats.find(c => c.id === selectedChatId);
        return currentChat ? (
          <ChatRoomView
            chatRoom={currentChat}
            participantsInfo={currentChat.participants.map(uid => getUserInfo(uid, posts))}
            onBack={() => setCurrentView(ViewState.CHAT_LIST)}
            onSendMessage={handleSendMessage}
            onLeave={() => handleLeaveChat(currentChat.id)}
          />
        ) : <div>Chat not found</div>;
      case ViewState.CREATE_POST:
        return <CreatePostView onCancel={goToHome} onCreate={createPost} />;
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
        return <NotificationView notifications={notifications} onBack={goToHome} />;
      case ViewState.BOOKMARKS:
        const bookmarkedPosts = posts.filter(p => bookmarkedIds.includes(p.id));
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

  const showNav = [ViewState.HOME, ViewState.MAP, ViewState.CHAT_LIST, ViewState.PROFILE].includes(currentView);

  return (
    <div className="bg-white min-h-screen max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans text-gray-900">
      {renderContent()}
      {showNav && <BottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
}