import React from 'react';
import { Post } from '../types';
import { CURRENT_USER } from '../constants';
import { Header } from './Header';
import { ChevronLeft, Users, UserCheck } from 'lucide-react';

export const ApplicantListView: React.FC<{
    posts: Post[],
    onBack: () => void,
    onApprove: (postId: string, applicantId: string) => void
}> = ({ posts, onBack, onApprove }) => {
    // Filter posts created by the current user
    const myHostedPosts = posts.filter(p => p.authorId === CURRENT_USER.id);

    return (
        <div className="bg-white min-h-screen pb-20">
            <Header 
                leftIcon={<ChevronLeft />} 
                onLeftClick={onBack}
                title="지원자 관리"
            />
            <div className="pt-16 px-4 space-y-6">
                {myHostedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                        <Users size={48} className="mb-4 opacity-20"/>
                        <p>내가 만든 모임이 없습니다.</p>
                    </div>
                ) : (
                    myHostedPosts.map(post => (
                        <div key={post.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 truncate mb-1">{post.title}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{post.time}</span>
                                    <span>•</span>
                                    <span>{post.location}</span>
                                    <span className="ml-auto font-bold text-gray-900">{post.currentMembers}/{post.maxMembers}명</span>
                                </div>
                            </div>
                            
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1">
                                    <UserCheck size={14}/> 지원자 목록 ({post.applicants ? post.applicants.length : 0}명)
                                </h4>
                                
                                {(!post.applicants || post.applicants.length === 0) ? (
                                    <p className="text-sm text-gray-400 py-2">아직 지원자가 없습니다.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {post.applicants.map((user, idx) => (
                                            <div key={`${post.id}-app-${idx}`} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.hometown} ➔ 서울</p>
                                                </div>
                                                <button 
                                                    onClick={() => onApprove(post.id, user.id)}
                                                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                                                >
                                                    승인
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};