import React, { useState } from 'react';

interface NicknameSetupProps {
    initialNickname?: string;
    onComplete: (nickname: string) => void;
}

export const NicknameSetup: React.FC<NicknameSetupProps> = ({ initialNickname = '', onComplete }) => {
    const [nickname, setNickname] = useState(initialNickname);
    const [error, setError] = useState<string | null>(null);

    const isValid = nickname.trim().length > 0 && nickname.trim().length <= 10;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) {
            setError('닉네임을 1자 이상 10자 이내로 입력해주세요.');
            return;
        }
        onComplete(nickname.trim());
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNickname(e.target.value);
        if (error) setError(null);
    };

    return (
        <div className="flex flex-col h-screen bg-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-gradient-to-b from-gps-50 to-white rounded-bl-[50%] z-0 pointer-events-none"></div>

            <div className="flex-1 flex flex-col px-8 pt-20 z-10">
                {/* Header */}
                <div className="mb-10 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        반가워요! 👋<br />
                        어떻게 불러드릴까요?
                    </h1>
                    <p className="text-gray-500 text-sm">
                        G.PS에서 활동할 닉네임을 정해주세요.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="nickname" className="block text-sm font-bold text-gray-700">
                            닉네임
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                onChange={handleChange}
                                placeholder="예: 상경한꿈돌이"
                                maxLength={10}
                                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${error
                                        ? 'border-red-400 focus:border-red-500'
                                        : 'border-transparent focus:border-gps-400'
                                    }`}
                                autoFocus
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

                    <div className="pt-4">
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
