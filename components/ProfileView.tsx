import React from 'react';
import { User } from '../types';
import { ChevronRight } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  bookmarkCount: number;
  onViewBookmarks: () => void;
  onViewApplicants: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  bookmarkCount, 
  onViewBookmarks, 
  onViewApplicants 
}) => {
  return (
    <div className="pt-20 px-4 text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
            <img src={user.avatarUrl} alt="me" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-gray-500 mb-8">{user.hometown} ➔ 서울 상경 1년차</p>
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