import React from 'react';
import { Post } from '../types';
import { Header } from './Header';
import { ChevronLeft, Bookmark, Clock, MapPin, Users } from 'lucide-react';

export const BookmarksView: React.FC<{ 
    posts: Post[], 
    onViewPost: (post: Post) => void,
    onBack: () => void
  }> = ({ posts, onViewPost, onBack }) => {
    return (
      <div className="bg-white min-h-screen pb-20">
         <Header 
           leftIcon={<ChevronLeft />} 
           onLeftClick={onBack}
           title="찜한 모임"
         />
         <div className="pt-16 px-4 space-y-4">
            {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                    <Bookmark size={48} className="mb-4 opacity-20"/>
                    <p>아직 찜한 모임이 없습니다.</p>
                </div>
            ) : (
                posts.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => onViewPost(post)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                         <div className="flex items-center gap-2">
                           <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">{post.category}</span>
                           <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> {post.time}</span>
                         </div>
                         <span className="text-gray-900 text-xs font-bold">{post.distance}</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">{post.title}</h3>
                      
                      <div className="flex items-center justify-between mt-4">
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin size={14} className="text-gray-400"/>
                            {post.location}
                         </div>
                         <div className="flex items-center gap-1 text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                            <Users size={14} className="text-gray-500"/>
                            {post.currentMembers}/{post.maxMembers}
                         </div>
                      </div>
                    </div>
                  ))
            )}
         </div>
      </div>
    );
  };