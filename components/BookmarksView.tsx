import React from 'react';
import { LikedMeeting } from '../types';
import { Header } from './Header';
import { ChevronLeft, Bookmark, Clock, MapPin } from 'lucide-react';

interface BookmarksViewProps {
  meetings: LikedMeeting[];
  isLoading: boolean;
  isLast: boolean;
  onLoadMore: () => void;
  onBack: () => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  meetings,
  isLoading,
  isLast,
  onLoadMore,
  onBack,
}) => {
  return (
    <div className="bg-white min-h-screen pb-20">
      <Header
        leftIcon={<ChevronLeft />}
        onLeftClick={onBack}
        title="찜한 모임"
      />
      <div className="pt-16 px-4 space-y-4">
        {isLoading && meetings.length === 0 ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="w-6 h-6 border-2 border-gps-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <Bookmark size={48} className="mb-4 opacity-20" />
            <p>아직 찜한 모임이 없습니다.</p>
          </div>
        ) : (
          <>
            {meetings.map((meeting) => (
              <div
                key={meeting.meetingId}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
              >
                {/* TODO: navigate to post detail by meetingId when API available */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">
                      {meeting.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {meeting.dateTime}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">
                  {meeting.title}
                </h3>

                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{meeting.content}</p>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  {meeting.location}
                </div>
              </div>
            ))}

            {!isLast && (
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-xl active:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex justify-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </span>
                ) : (
                  "더보기"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
