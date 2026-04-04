import React, { useState } from "react";
import { Post, User } from "../types";
import { Header } from "./Header";
import {
  Bookmark,
  ChevronLeft,
  Clock,
  CornerDownRight,
  Edit,
  MapPin,
  Send,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

export const PostDetail: React.FC<{
  post: Post;
  currentUser: User;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onBack: () => void;
  onJoin: () => void;
  onCancelJoin: () => void;
  onApprove: (postId: number, applicantId: number) => void;
  onReject: (postId: number, applicantId: number) => void;
  onAddComment: (text: string, parentId?: number | null) => void;
  onEdit: () => void;
  onDelete: (postId: number) => void;
}> = ({
  post,
  currentUser,
  isBookmarked,
  onToggleBookmark,
  onBack,
  onJoin,
  onCancelJoin,
  onApprove,
  onReject,
  onAddComment,
  onEdit,
  onDelete,
}) => {
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    authorName: string;
  } | null>(null);

  const tags = post.tags ?? [];
  const applicants = post.applicants ?? [];
  const comments = post.comments ?? [];
  const totalCommentCount = comments.reduce(
    (count, comment) => count + 1 + (comment.replies?.length ?? 0),
    0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(commentText, replyTarget?.id ?? null);
    setCommentText("");
    setReplyTarget(null);
  };

  const isHost = post.authorId === currentUser.userId;
  const hasApplied =
    post.viewer?.hasApplied ??
    applicants.some((applicant) => applicant.userId === currentUser.userId);

  return (
    <div className="bg-white min-h-screen pb-32">
      <Header
        leftIcon={<ChevronLeft />}
        onLeftClick={onBack}
        rightIcon={
          <Bookmark
            className={
              isBookmarked ? "text-gps-500 fill-gps-500" : "text-gray-400"
            }
          />
        }
        onRightClick={onToggleBookmark}
        transparent={false}
        title="모임 상세"
      />

      <div className="pt-16 px-5">
        {post.images && post.images.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 -mx-5 px-5 snap-x">
            {post.images.map((img, i) => (
              <div
                key={`${img}-${i}`}
                className="w-full h-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-md snap-center relative"
              >
                <img
                  src={img}
                  alt={`img-${i}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                  {i + 1} / {post.images.length}
                </span>
              </div>
            ))}
          </div>
        ) : (
          post.imageUrl && (
            <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 shadow-md">
              <img
                src={post.imageUrl}
                alt="cover"
                className="w-full h-full object-cover"
              />
            </div>
          )
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src={post.authorAvatar}
              className="w-12 h-12 rounded-full border border-gray-100"
            />
            <div>
              <h3 className="text-gray-900 font-bold">{post.authorName}</h3>
              <p className="text-xs text-gray-500 bg-gray-100 inline-block px-1.5 py-0.5 rounded font-bold">
                호스트
              </p>
            </div>
          </div>

          {isHost && (
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                aria-label="게시물 수정"
              >
                <Edit size={16} className="text-gray-500" />
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                aria-label="게시물 삭제"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{post.title}</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <Clock className="text-gray-600 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold text-gray-900 text-sm">시간</p>
              <p className="text-sm text-gray-600">{post.time}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <MapPin className="text-gray-600 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold text-gray-900 text-sm">장소</p>
              <p className="text-sm text-gray-600">{post.location}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold text-gray-900 mb-2">모임 소개</h3>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {post.description}
          </p>
        </div>

        {isHost && applicants.length > 0 && (
          <div className="mb-8 border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-gray-600" />
              참여 요청 ({applicants.length}명)
            </h3>
            <div className="space-y-3">
              {applicants.map((applicant) => (
                <div
                  key={applicant.userId}
                  className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                >
                  <img
                    src={applicant.profileUrl}
                    alt={applicant.nickname}
                    className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {applicant.nickname}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onReject(post.id, applicant.userId)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      거절
                    </button>
                    <button
                      onClick={() => onApprove(post.id, applicant.userId)}
                      className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                    >
                      승인
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6 mt-6">
          <h3 className="font-bold text-gray-900 mb-4 px-1">
            댓글 ({totalCommentCount})
          </h3>

          <div className="space-y-6 mb-6">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                첫 댓글을 남겨보세요.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  <div className="flex gap-3">
                    <img
                      src={
                        comment.authorAvatar ||
                        `https://ui-avatars.com/api/?name=${comment.authorName}`
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 object-cover border border-gray-50"
                      alt="avatar"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-gray-900">
                          {comment.authorName}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-r-xl rounded-bl-xl inline-block">
                        {comment.text}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setReplyTarget({
                            id: comment.id,
                            authorName: comment.authorName,
                          })
                        }
                        className="mt-2 block text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        답글 달기
                      </button>
                    </div>
                  </div>

                  {(comment.replies?.length ?? 0) > 0 && (
                    <div className="ml-11 space-y-3 border-l border-gray-100 pl-4">
                      {comment.replies?.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="pt-1 text-gray-300">
                            <CornerDownRight size={14} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold text-gray-900">
                                {reply.authorName}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {new Date(reply.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-r-xl rounded-bl-xl inline-block">
                              {reply.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0 overflow-hidden">
              <img
                src={currentUser.profileUrl}
                alt="me"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              {replyTarget && (
                <div className="mb-2 flex items-center justify-between rounded-2xl bg-gray-100 px-3 py-2 text-xs text-gray-600">
                  <span>{replyTarget.authorName}님에게 답글 남기는 중</span>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="text-gray-500 hover:text-gray-900"
                    aria-label="답글 취소"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    replyTarget
                      ? `${replyTarget.authorName}님에게 답글을 남겨보세요.`
                      : "궁금한 점을 자유롭게 남겨보세요."
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-gray-900 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-1 top-1 p-1.5 bg-gray-900 text-white rounded-full disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto z-20">
        <button
          onClick={hasApplied ? onCancelJoin : onJoin}
          disabled={isHost}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 ${
            isHost
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : hasApplied
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-gray-900 text-white hover:bg-gray-800 shadow-gray-200"
          }`}
        >
          {isHost
            ? "내가 만든 모임입니다"
            : hasApplied
              ? "참여 취소"
              : "참여하기 (프로필 전송)"}
        </button>
      </div>
    </div>
  );
};
