import React, { useState, useRef } from "react";
import { Category } from "../types";
import { Header } from "./Header";
import { AddressSearchModal } from "./AddressSearchModal";
import { ChevronLeft, Camera, X } from "lucide-react";

export const CreatePostView: React.FC<{
  onCancel: () => void;
  onCreate: (post: any) => void | Promise<void>;
}> = ({ onCancel, onCreate }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [meetupType, setMeetupType] = useState<"OFFLINE" | "ONLINE">("OFFLINE");
  const [maxMembers, setMaxMembers] = useState<number>(2);
  const [images, setImages] = useState<string[]>([]);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tag, setTag] = useState<Category>("FOOD");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files) as File[];
      const fileReaders = fileArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(fileReaders).then((newImages) => {
        setImages((prev) => [...prev, ...newImages]);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (type: "OFFLINE" | "ONLINE") => {
    setMeetupType(type);
    if (type === "ONLINE") {
      setLocation("");
    } else {
      setLocation("");
    }
  };

  const handleTagChange = (type: Category) => {
    setTag(type);
  };

  const handleSubmit = async () => {
    if (!title || !date || !time || !description) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    if (meetupType === "OFFLINE" && !location) {
      alert("오프라인 모임의 장소를 입력해주세요.");
      return;
    }

    if (maxMembers < 2) {
      alert("최소 2명 이상 설정해주세요.");
      return;
    }

    if (images.length > 3) {
      alert("사진은 최대 3장까지 업로드 가능합니다.");
      return;
    }

    // backend expects yyyy-MM-dd HH:mm:ss
    const meetingTime = `${date} ${time}:00`;

    try {
      setSubmitting(true);
      await onCreate({
        title,
        content: description,
        meetingTime,
        maxMembers,
        locationName: meetupType === "ONLINE" ? null : location,
        images: images,
        meetingType: meetupType,
        category: tag,
      });
      // the parent hook will navigate back to home upon success
    } catch (e) {
      console.error(e);
      alert("모임 개설 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showAddressSearch) {
    return (
      <AddressSearchModal
        onClose={() => setShowAddressSearch(false)}
        onSelect={(addr) => {
          setLocation(addr);
          setShowAddressSearch(false);
        }}
      />
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <Header
        leftIcon={<ChevronLeft />}
        onLeftClick={onCancel}
        title="모임 만들기"
      />
      <div className="pt-20 px-5 space-y-6">
        {/* Multi Image Upload */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            사진 등록 ({images.length})
          </label>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            {/* Add Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer border border-dashed border-gray-300 hover:bg-gray-100 transition-colors"
            >
              <Camera size={24} />
              <span className="text-[10px] mt-1 font-bold">추가</span>
            </div>

            {/* Images */}
            {images.map((img, idx) => (
              <div
                key={idx}
                className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative border border-gray-100 shadow-sm group"
              >
                <img
                  src={img}
                  className="w-full h-full object-cover"
                  alt="preview"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gps-500 text-gray-900 text-[9px] text-center py-0.5 font-bold">
                    대표
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            제목
          </label>
          <input
            className="w-full p-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
            placeholder="모임 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            모임 형태
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange("OFFLINE")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all border ${meetupType === "OFFLINE" ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >
              오프라인
            </button>
            <button
              onClick={() => handleTypeChange("ONLINE")}
              className={`flex-1 py-3 rounded-xl font-bold transition-all border ${meetupType === "ONLINE" ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
            >
              온라인
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            모임 카테고리
          </label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { id: "SPORTS", label: "스포츠" },
              { id: "STUDY", label: "스터디" },
              { id: "FOOD", label: "맛집" },
              { id: "HOBBY", label: "취미" },
              { id: "GAME", label: "게임" },
              { id: "MUSIC", label: "음악" },
              { id: "ETC", label: "기타" },
            ] as { id: Category; label: string }[]).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleTagChange(cat.id)}
                className={`py-3 rounded-xl font-bold transition-all border ${tag === cat.id ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Members */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            정원
          </label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setMaxMembers((m) => Math.max(2, m - 1))}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-lg font-bold">{maxMembers}</span>
            <button
              type="button"
              onClick={() => setMaxMembers((m) => m + 1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
            >
              +
            </button>
          </div>
        </div>

        {/* Time */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              날짜
            </label>
            <input
              type="date"
              className="w-full p-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              시간
            </label>
            <input
              type="time"
              className="w-full p-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {/* Location with Search */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            장소
          </label>
          <div className="flex gap-2">
            <input
              readOnly={meetupType === "OFFLINE"}
              disabled={meetupType === "ONLINE"}
              className="flex-1 p-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all text-gray-600 disabled:bg-gray-100 disabled:text-gray-400"
              placeholder={
                meetupType === "OFFLINE"
                  ? "주소 검색을 이용해주세요"
                  : "온라인 모임입니다"
              }
              value={location}
              onChange={meetupType === "ONLINE" ? undefined : undefined} // ReadOnly for Offline
            />
            {meetupType === "OFFLINE" && (
              <button
                onClick={() => setShowAddressSearch(true)}
                className="bg-gray-900 text-white font-bold px-4 rounded-xl hover:bg-gray-800 transition-colors"
              >
                검색
              </button>
            )}
          </div>
        </div>

        {/* Description - AI Removed */}
        <div>
          <div className="mb-2">
            <label className="block text-sm font-bold text-gray-900">
              모임 소개
            </label>
          </div>
          <textarea
            className="w-full p-4 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all h-32 resize-none"
            placeholder="어떤 모임인지 자세히 설명해주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-800 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "등록 중..." : "모임 개설하기"}
        </button>
      </div>
    </div>
  );
};
