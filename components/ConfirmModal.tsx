import React from "react";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl mx-6 p-6 w-full max-w-sm">
        <p className="text-center text-gray-800 text-base font-medium mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-medium"
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
