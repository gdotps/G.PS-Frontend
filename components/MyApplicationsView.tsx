import React from "react";
import { ApplicationItem, ApplicationStatus } from "../types";
import { Header } from "./Header";
import { ChevronLeft, ClipboardList, Clock, MapPin } from "lucide-react";

interface MyApplicationsViewProps {
  applications: ApplicationItem[];
  isLoading: boolean;
  isLast: boolean;
  onLoadMore: () => void;
  onBack: () => void;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
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

export const MyApplicationsView: React.FC<MyApplicationsViewProps> = ({
  applications,
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
        title="나의 신청 목록"
      />
      <div className="pt-16 px-4 space-y-4">
        {applications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p>아직 신청한 모임이 없습니다.</p>
          </div>
        ) : (
          applications.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] ?? {
              label: item.status,
              className: "bg-gray-100 text-gray-600",
            };
            return (
              <div
                key={item.applicationId}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">
                      {item.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-bold ${statusConfig.className}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug">
                  {item.title}
                </h3>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={14} className="text-gray-400" />
                    {item.locationName}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {item.meetingTime}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex justify-center py-6">
            <div className="w-8 h-8 border-4 border-gps-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLast && applications.length > 0 && (
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            aria-label="신청 목록 더 불러오기"
            className="w-full py-3 text-sm font-medium text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            더보기
          </button>
        )}
      </div>
    </div>
  );
};
