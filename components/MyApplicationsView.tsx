import React, { useEffect, useState } from "react";
import { MyApplication, Category, ApplicationStatus } from "../types";
import { fetchMyApplications } from "../services/applicationService";
import { Header } from "./Header";
import { ChevronLeft, ClipboardList, Clock, MapPin } from "lucide-react";

const CATEGORY_LABEL: Record<Category, string> = {
  SPORTS: "스포츠",
  STUDY: "스터디",
  FOOD: "맛집",
  HOBBY: "취미",
  GAME: "게임",
  MUSIC: "음악",
  ETC: "기타",
};

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  PENDING: { label: "대기중", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "승인됨", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "거절됨", className: "bg-red-100 text-red-800" },
};

export const MyApplicationsView: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [applications, setApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [error, setError] = useState(false);

  const loadApplications = async (pageNum: number, append: boolean = false) => {
    const result = await fetchMyApplications(pageNum);

    if (result.status === "success") {
      setApplications((prev) =>
        append ? [...prev, ...result.data.content] : result.data.content,
      );
      setIsLast(result.data.last);
      setError(false);
    } else {
      setError(true);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadApplications(0);
      setLoading(false);
    };
    init();
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await loadApplications(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <Header
        leftIcon={<ChevronLeft />}
        onLeftClick={onBack}
        title="참여한 모임"
      />
      <div className="pt-16 px-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-4" />
            <p>불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <p className="mb-4">목록을 불러오지 못했습니다.</p>
            <button
              onClick={async () => {
                setLoading(true);
                setError(false);
                setPage(0);
                await loadApplications(0);
                setLoading(false);
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold"
            >
              다시 시도
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p>아직 참여 신청한 모임이 없습니다.</p>
          </div>
        ) : (
          <>
            {applications.map((app) => {
              const statusConfig = STATUS_CONFIG[app.status];
              return (
                <div
                  key={app.applicationId}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-4">
                    {/* 이미지 썸네일 */}
                    {app.postImageUrl && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-gray-100">
                        <img
                          src={app.postImageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* 카테고리 + 상태 뱃지 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">
                          {CATEGORY_LABEL[app.category] ?? app.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-md font-bold ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* 제목 */}
                      <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug truncate">
                        {app.title}
                      </h3>

                      {/* 장소 + 시간 */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {app.locationName && (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            {app.locationName}
                          </div>
                        )}
                        {app.meetingTime && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-gray-400" />
                            {app.meetingTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 더 보기 */}
            {!isLast && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 text-sm font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "불러오는 중..." : "더 보기"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
