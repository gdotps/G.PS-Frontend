import React from 'react';
import { User } from '../types';
import { ChevronRight, Settings } from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants';

interface ProfileViewProps {
  user: User;
  bookmarkCount: number;
  onViewBookmarks: () => void;
  onViewApplicants: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  bookmarkCount,
  onViewBookmarks,
  onViewApplicants,
  onEditProfile,
  onLogout,
  onDeleteAccount
}) => {
  return (
    <div className="pt-20 px-4 text-center">
      <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
        <img src={user.avatarUrl || DEFAULT_AVATAR} alt="me" className="w-full h-full object-cover" />
      </div>
      {/* 닉네임 + 설정 아이콘 컨테이너 */}
      <div className="flex justify-center mb-2">
        <div className="relative inline-block">
          <h2 className="text-2xl font-bold px-2">{user.name}</h2>
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

      <div className="bg-white p-4 rounded-2xl shadow-sm text-left mb-4 space-y-4">
        <h3 className="font-bold mb-2">나의 활동</h3>
        <div className="flex justify-between text-sm py-2 border-b border-gray-50">
          <span>참여한 모임</span>
          <span className="font-bold text-gray-900">12회</span>
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
    </div>
  );
};