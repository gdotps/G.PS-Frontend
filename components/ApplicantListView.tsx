import React, { useEffect, useState } from "react";
import { ApplicantInfo, ApplicantPostSummary, ApplicantStatus } from "../types";
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
  onBack: () => void;
  onFetchApplicantPosts: () => Promise<ApplicantPostSummary[]>;
  onFetchApplicants: (postId: number) => Promise<ApplicantInfo[]>;
  onApprove: (postId: number, applicantId: number) => Promise<void>;
  onReject: (postId: number, applicantId: number) => Promise<void>;
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
  onBack,
  onFetchApplicantPosts,
  onFetchApplicants,
  onApprove,
  onReject,
}) => {
  const [posts, setPosts] = useState<ApplicantPostSummary[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [openPostId, setOpenPostId] = useState<number | null>(null);
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null);
  const [applicantsByPostId, setApplicantsByPostId] = useState<
    Record<number, ApplicantInfo[]>
  >({});

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setIsPostsLoading(true);
      try {
        const result = await onFetchApplicantPosts();
        if (!cancelled) {
          setPosts(result);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load applicant post summaries:", error);
          alert("지원자 게시글 목록을 불러오지 못했습니다. 다시 시도해주세요.");
        }
      } finally {
        if (!cancelled) {
          setIsPostsLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [onFetchApplicantPosts]);

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

  const updateApplicantStatusLocally = (
    postId: number,
    applicantId: number,
    status: ApplicantStatus,
  ) => {
    setApplicantsByPostId((prev) => ({
      ...prev,
      [postId]: (prev[postId] ?? []).map((applicant) =>
        applicant.userId === applicantId ? { ...applicant, status } : applicant,
      ),
    }));

    if (status === "APPROVED") {
      setPosts((prev) =>
        prev.map((post) =>
          post.postId === postId
            ? {
                ...post,
                currentMembers: post.currentMembers + 1,
                applicantCount: Math.max(post.applicantCount - 1, 0),
              }
            : post,
        ),
      );
      return;
    }

    if (status === "REJECTED") {
      setPosts((prev) =>
        prev.map((post) =>
          post.postId === postId
            ? {
                ...post,
                applicantCount: Math.max(post.applicantCount - 1, 0),
              }
            : post,
        ),
      );
    }
  };

  const handleApproveClick = async (postId: number, applicantId: number) => {
    await onApprove(postId, applicantId);
    updateApplicantStatusLocally(postId, applicantId, "APPROVED");
  };

  const handleRejectClick = async (postId: number, applicantId: number) => {
    await onReject(postId, applicantId);
    updateApplicantStatusLocally(postId, applicantId, "REJECTED");
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <Header
        leftIcon={<ChevronLeft />}
        onLeftClick={onBack}
        title="지원자 관리"
      />

      <div className="pt-16 px-4 space-y-4">
        {isPostsLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-gps-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p>지원자가 있는 게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map((post) => {
            const applicants = applicantsByPostId[post.postId] ?? [];
            const isOpen = openPostId === post.postId;
            const isLoading = loadingPostId === post.postId;

            return (
              <div
                key={post.postId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => void handleTogglePost(post.postId)}
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">
                        {post.category}
                      </span>
                      <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded-md font-bold">
                        새로운 지원자 : {post.applicantCount}명
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
                      {post.locationName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {post.meetingTime}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      현재 확정 인원 현황
                    </div>
                    <span className="font-semibold text-gray-900">
                      {post.currentMembers}/{post.maxMembers}명
                    </span>
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
                              key={`${post.postId}-${applicant.userId}`}
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
                                <div className="mt-4 flex justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      void handleRejectClick(
                                        post.postId,
                                        applicant.userId,
                                      )
                                    }
                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                  >
                                    거절
                                  </button>
                                  <button
                                    onClick={() =>
                                      void handleApproveClick(
                                        post.postId,
                                        applicant.userId,
                                      )
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
