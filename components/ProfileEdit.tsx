import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Camera } from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants';

interface ProfileEditProps {
    user: User;
    onSave: (updatedUser: User) => void;
    onCancel: () => void;
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ user, onSave, onCancel }) => {
    const [nickname, setNickname] = useState(user.nickname);
    const [introduction, setIntroduction] = useState(user.introduction || '');
    const [profileUrl, setProfileUrl] = useState(user.profileUrl || DEFAULT_AVATAR);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("파일 크기는 5MB 이하여야 합니다.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (nickname.trim().length === 0) newErrors.name = '닉네임을 입력해주세요.';
        if (nickname.trim().length > 10) newErrors.name = '닉네임은 10자 이내여야 합니다.';
        if (introduction.length > 50) newErrors.introduction = '자기소개는 50자 이내여야 합니다.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            ...user,
            nickname: nickname.trim(),
            introduction: introduction.trim() || undefined,
            profileUrl,
        });
    };

    return (
        <div className="flex flex-col h-screen bg-white relative">
            <div className="flex items-center px-4 h-14 border-b border-gray-100">
                <button onClick={onCancel} className="text-gray-500 font-bold p-2 -ml-2">
                    취소
                </button>
                <h1 className="flex-1 text-center font-bold text-lg mr-8">프로필 수정</h1>
                <button
                    onClick={handleSubmit}
                    className="text-gps-600 font-bold p-2 -mr-2"
                >
                    저장
                </button>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex flex-col items-center mb-6">
                    <div
                        className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden mb-2 relative group cursor-pointer border-2 border-transparent hover:border-gps-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <img src={profileUrl} alt="profile" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <button
                        className="text-gps-500 text-sm font-bold mt-1"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        사진 변경
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            닉네임
                            <span className="text-gray-400 font-normal ml-1 text-xs">({nickname.length}/10)</span>
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={10}
                            className={`w-full p-3 bg-gray-50 rounded-xl border-2 focus:outline-none focus:bg-white transition-colors ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-gps-400'}`}
                            placeholder="닉네임 입력"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            한줄 소개 📝
                            <span className="text-gray-400 font-normal ml-1 text-xs">({introduction.length}/50)</span>
                        </label>
                        <textarea
                            value={introduction}
                            onChange={(e) => setIntroduction(e.target.value)}
                            rows={3}
                            maxLength={50}
                            className={`w-full p-3 bg-gray-50 rounded-xl border-2 focus:outline-none focus:bg-white transition-colors resize-none ${errors.introduction ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-gps-400'}`}
                            placeholder="자신을 자유롭게 소개해보세요."
                        />
                        {errors.introduction && <p className="text-red-500 text-xs mt-1 ml-1">{errors.introduction}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
