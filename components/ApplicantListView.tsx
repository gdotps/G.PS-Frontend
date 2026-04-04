import React, { useEffect, useMemo, useState } from "react";
import { ApplicantInfo, ApplicantStatus, Post, User } from "../types";
import { Header } from "./Header";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
  UserCheck,
  Users,
} from "lucide-react";

interface ApplicantListViewProps {
  posts: Post[];
  currentUser: User;
  onBack: () => void;
  onFetchApplicants: (postId: number) => Promise<ApplicantInfo[]>;
  onApprove: (postId: number, applicantId: number) => void;
}

const STATUS_CONFIG: Record<
  ApplicantStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "대기중",
    className: "bg-yellow-100 text-yellow-700",
  },
  APPROVED: {
    label: "승인됨",
    className: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "거절됨",
    className: "bg-red-100 text-red-700",
  },
};

export const ApplicantListView: React.FC<ApplicantListViewProps> = ({
  posts,
  currentUser,
  onBack,
  onFetchApplicants,
  onApprove,
}) => {
  const myHostedPosts = useMemo(
    () => posts.filter((post) => post.authorId === currentUser.userId),
    [currentUser.userId, posts],
  );
  const [openPostId, setOpenPostId] = useState<number | null>(null);
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [applicantsByPostId, setApplicantsByPostId] = useState<
    Record<number, ApplicantInfo[]>
  >({});

  useEffect(() => {
    let cancelled = false;

    const loadApplicantSummaries = async () => {
      if (myHostedPosts.length === 0) return;

      setIsSummaryLoading(true);
      try {
        const results = await Promise.all(
          myHostedPosts.map(async (post) => ({
            postId: post.id,
            applicants: await onFetchApplicants(post.id),
          })),
        );

        if (cancelled) return;

        setApplicantsByPostId((prev) => {
          const next = { ...prev };
          results.forEach(({ postId, applicants }) => {
            next[postId] = applicants;
          });
          return next;
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load applicant summaries:", error);
          alert("지원자 수를 불러오지 못했습니다. 다시 시도해주세요.");
        }
      } finally {
        if (!cancelled) {
          setIsSummaryLoading(false);
        }
      }
    };

    void loadApplicantSummaries();

    return () => {
      cancelled = true;
    };
  }, [myHostedPosts, onFetchApplicants]);

  const postsWithApplicants = useMemo(
    () =>
      myHostedPosts.filter(
        (post) => (applicantsByPostId[post.id]?.length ?? 0) > 0,
      ),
    [applicantsByPostId, myHostedPosts],
  );

  const handleTogglePost = async (postId: number) => {
    if (openPostId === postId) {
      setOpenPostId(null);
      return;
    }

    setOpenPostId(postId);
    if (applicantsByPostId[postId]) return;

    setLoadingPostId(postId);
    try {
      const applicants = await onFetchApplicants(postId);
      setApplicantsByPostId((prev) => ({ ...prev, [postId]: applicants }));
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
      alert("지원자 목록을 불러오지 못했습니다. 다시 시도해주세요.");
    } finally {
      setLoadingPostId((current) => (current === postId ? null : current));
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <Header
        leftIcon={<ChevronLeft />}
        onLeftClick={onBack}
        title="지원자 관리"
      />

      <div className="pt-16 px-4 space-y-4">
        {myHostedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p>내가 작성한 게시글이 없습니다.</p>
          </div>
        ) : isSummaryLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gps-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : postsWithApplicants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <Users size={48} className="mb-4 opacity-20" />
            <p>지원자가 있는 게시글이 없습니다.</p>
          </div>
        ) : (
          postsWithApplicants.map((post) => {
            const applicants = applicantsByPostId[post.id] ?? [];
            const isOpen = openPostId === post.id;
            const isLoading = loadingPostId === post.id;

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => void handleTogglePost(post.id)}
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">
                        {post.category}
                      </span>
                      <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md font-bold">
                        {applicants.length}명 지원
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">
                    {post.title}
                  </h3>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin size={14} className="text-gray-400" />
                      {post.location}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {post.time}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      지원자 보기
                    </div>
                    <span className="font-semibold text-gray-900">
                      {applicantsByPostId[post.id]?.length || 0}/
                      {post.maxMembers}명
                    </span>
                    {/* TODO: 지원자 보기에는 accept된 사람만 보게 하는걸로 수정? */}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/70">
                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-8 h-8 border-4 border-gps-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : applicants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <UserCheck size={36} className="mb-3 opacity-20" />
                        <p>아직 지원자가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {applicants.map((applicant) => {
                          const statusConfig = STATUS_CONFIG[
                            applicant.status
                          ] ?? {
                            label: applicant.status,
                            className: "bg-gray-100 text-gray-600",
                          };

                          return (
                            <div
                              key={`${post.id}-${applicant.userId}`}
                              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={
                                    applicant.profileUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.nickname)}&background=F3F4F6&color=111827`
                                  }
                                  alt={applicant.nickname}
                                  className="w-11 h-11 rounded-full bg-gray-200 object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                      {applicant.nickname}
                                    </p>
                                    <span
                                      className={`text-[11px] px-2 py-1 rounded-md font-bold ${statusConfig.className}`}
                                    >
                                      {statusConfig.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">
                                    지원일{" "}
                                    {new Date(
                                      applicant.appliedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
                                    {applicant.introduction ||
                                      "소개가 없습니다."}
                                  </p>
                                </div>
                              </div>

                              {applicant.status === "PENDING" && (
                                <div className="mt-4 flex justify-end">
                                  <button
                                    onClick={() =>
                                      onApprove(post.id, applicant.userId)
                                    }
                                    className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                                  >
                                    승인
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
