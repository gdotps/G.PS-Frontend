import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants';

interface ProfileSetupProps {
    initialNickname?: string;
    onComplete: (data: { nickname: string; avatarUrl: string; introduction: string }) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ initialNickname = '', onComplete }) => {
    const [nickname, setNickname] = useState(initialNickname);
    const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
    const [introduction, setIntroduction] = useState('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isNicknameValid = nickname.trim().length > 0 && nickname.trim().length <= 10;
    const isIntroValid = introduction.length <= 50;
    const isValid = isNicknameValid && isIntroValid;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("파일 크기는 5MB 이하여야 합니다.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isNicknameValid) {
            setError('닉네임을 1자 이상 10자 이내로 입력해주세요.');
            return;
        }
        if (!isIntroValid) {
            setError('한줄 소개는 50자 이내여야 합니다.');
            return;
        }
        onComplete({
            nickname: nickname.trim(),
            avatarUrl,
            introduction: introduction.trim()
        });
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
        if (error) setError(null);
    };

    return (
        <div className="flex flex-col h-screen bg-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-gradient-to-b from-gps-50 to-white rounded-bl-[50%] z-0 pointer-events-none"></div>

            <div className="flex-1 flex flex-col px-8 pt-10 z-10 overflow-y-auto">
                {/* Header */}
                <div className="mb-8 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        반가워요! 👋<br />
                        프로필을 완성해주세요.
                    </h1>
                    <p className="text-gray-500 text-sm">
                        G.PS에서 사용할 멋진 프로필을 만들어보세요.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div
                            className="w-28 h-28 bg-gray-100 rounded-full overflow-hidden relative group cursor-pointer border-4 border-white shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={28} />
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
                            type="button"
                            className="text-gps-600 text-xs font-bold bg-gps-50 px-3 py-1.5 rounded-full"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            사진 변경
                        </button>
                    </div>

                    {/* Nickname */}
                    <div className="space-y-2">
                        <label htmlFor="nickname" className="block text-sm font-bold text-gray-700">
                            닉네임 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                onChange={handleNicknameChange}
                                placeholder="예: 상경한꿈돌이"
                                maxLength={10}
                                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${error
                                    ? 'border-red-400 focus:border-red-500'
                                    : 'border-transparent focus:border-gps-400'
                                    }`}
                            />
                            <div className="absolute right-3 top-3.5 text-xs font-bold text-gray-400">
                                {nickname.length}/10
                            </div>
                        </div>
                        {error && (
                            <p className="text-red-500 text-xs font-medium ml-1 animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Introduction */}
                    <div className="space-y-2">
                        <label htmlFor="introduction" className="block text-sm font-bold text-gray-700">
                            한줄 소개
                            <span className="text-gray-400 font-normal ml-1 text-xs">({introduction.length}/50)</span>
                        </label>
                        <textarea
                            id="introduction"
                            value={introduction}
                            onChange={(e) => setIntroduction(e.target.value)}
                            rows={3}
                            maxLength={50}
                            placeholder="나를 표현하는 한마디를 적어주세요."
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gps-400 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!isValid}
                            className={`w-full h-14 rounded-xl flex items-center justify-center font-bold text-lg transition-all shadow-sm ${isValid
                                ? 'bg-gps-500 text-gray-900 hover:bg-gps-400 active:scale-[0.98] shadow-gps-200'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            시작하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
