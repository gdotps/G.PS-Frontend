import React from 'react';
import { User } from '../types';
import { ChevronRight, Settings } from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants';

interface ProfileViewProps {
  user: User;
  bookmarkCount: number;
  onViewBookmarks: () => void;
  onViewApplicants: () => void;
  onViewMyApplications: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onToggleNotification: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  bookmarkCount,
  onViewBookmarks,
  onViewApplicants,
  onViewMyApplications,
  onEditProfile,
  onLogout,
  onDeleteAccount,
  onToggleNotification
}) => {
  return (
    <div className="pt-20 px-4 text-center">
      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
        <img src={user.avatarUrl || DEFAULT_AVATAR} alt="me" className="w-full h-full object-cover" />
      </div>
      {/* 닉네임 + 설정 아이콘 컨테이너 */}
      <div className="flex justify-center mb-2">
        <div className="relative inline-block">
          <h2 className="text-2xl font-bold px-2">{user.nickname}</h2>
          <button
            onClick={onEditProfile}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-1 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-1.5 rounded-full"
            aria-label="프로필 수정"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {user.introduction && (
        <p className="text-gray-600 text-sm mb-6 bg-gray-50 py-2 px-4 rounded-lg inline-block max-w-[90%]">
          "{user.introduction}"
        </p>
      )}

      {/* 설정 섹션 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm text-left mb-4 space-y-4">
        <h3 className="font-bold mb-2">설정</h3>
        <div className="flex justify-between items-center py-2">
          <span>알림 설정</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={user.notificationEnabled !== false} // 기본값 true 처리
              onChange={onToggleNotification}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gps-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gps-500"></div>
          </label>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm text-left mb-4 space-y-4">
        <h3 className="font-bold mb-2">나의 활동</h3>
        <div
          className="flex justify-between text-sm py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors px-1 -mx-1 border-b border-gray-50"
          onClick={onViewMyApplications}
        >
          <span>참여한 모임</span>
          <div className="flex items-center gap-1 font-bold text-gray-900">
            <ChevronRight size={14} />
          </div>
        </div>
        <div
          className="flex justify-between text-sm py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors px-1 -mx-1"
          onClick={onViewBookmarks}
        >
          <span>찜한 모임</span>
          <div className="flex items-center gap-1 font-bold text-gray-900">
            {bookmarkCount}개 <ChevronRight size={14} />
          </div>
        </div>
        <div
          className="flex justify-between text-sm py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors px-1 -mx-1"
          onClick={onViewApplicants}
        >
          <span>지원자 관리</span>
          <div className="flex items-center gap-1 font-bold text-gray-900">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3 pb-24">
        <button
          onClick={onLogout}
          className="w-full py-3 text-sm font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
        >
          로그아웃
        </button>
        <button
          onClick={onDeleteAccount}
          className="w-full py-3 text-sm font-medium text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
};