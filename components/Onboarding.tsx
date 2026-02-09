import React from 'react';

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-gray-50 to-white rounded-b-[50%] z-0 pointer-events-none"></div>
        {/* Minimal Yellow Points */}
        <div className="absolute top-20 right-10 w-4 h-4 bg-gps-200 rounded-full opacity-60 animate-bounce delay-700 pointer-events-none"></div>
        <div className="absolute top-40 left-10 w-2 h-2 bg-gps-400 rounded-full opacity-60 animate-bounce delay-1000 pointer-events-none"></div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 px-8 pt-10">
            {/* Logo Area */}
            <div className="relative mb-12">
                <div className="w-36 h-36 bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 flex items-center justify-center rotate-6 transform transition-transform hover:rotate-0 duration-500 border border-gray-50 p-6">
                     {/* 3D Cheese Image Logo */}
                     <img 
                        src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Food/Cheese%20Wedge.png" 
                        alt="G.PS Cheese Logo" 
                        className="w-full h-full object-contain drop-shadow-lg"
                     />
                </div>
            </div>

            {/* Main Text */}
            <div className="text-center space-y-5">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                    낯선 서울, <br/>
                    <span className="text-gray-900 relative inline-block">
                        함께라면
                        <span className="absolute bottom-1 left-0 w-full h-3 bg-gps-300 -z-10 opacity-60"></span>
                    </span> 꽤 살만한 곳
                </h1>
                <p className="text-gray-500 text-base leading-relaxed max-w-[260px] mx-auto font-medium">
                    서울에 갓 상경한 <span className="text-gray-900 font-bold bg-gps-100 px-1 rounded">상경쥐</span>들을 위한<br/>
                    동네 모임 커뮤니티, <span className="font-bold text-gray-800">G.PS</span>
                </p>
            </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 pb-12 z-10 space-y-3 bg-white/60 backdrop-blur-sm">
             <div className="text-center mb-6">
                <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full">3초만에 빠른 시작</span>
             </div>
             
             {/* Kakao Button */}
             <button 
                onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/kakao'}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#391B1B] h-14 rounded-xl flex items-center justify-center relative active:scale-[0.98] transition-all shadow-sm"
             >
                 <span className="absolute left-5">
                    <svg viewBox="0 0 24 24" width="22" height="22" className="fill-current">
                       <path d="M12 3C6.48 3 2 6.48 2 10.77C2 13.63 3.97 16.11 6.89 17.38C6.66 18.23 6.2 19.8 6.13 20.15C6.13 20.15 6.09 20.44 6.29 20.57C6.48 20.71 6.74 20.61 6.96 20.46C9.48 18.73 10.87 17.75 12 17.75C17.52 17.75 22 14.27 22 9.98C22 5.69 17.52 3 12 3Z"/>
                    </svg>
                 </span>
                 <span className="font-bold text-[15px]">카카오로 계속하기</span>
             </button>

             {/* Google Button */}
             <button 
                onClick={() => window.location.href = 'http://localhost:8080/oauth2/authorization/google'}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 h-14 rounded-xl flex items-center justify-center relative active:scale-[0.98] transition-all shadow-sm"
             >
                 <span className="absolute left-5">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                 </span>
                 <span className="font-bold text-[15px]">Google로 계속하기</span>
             </button>
        </div>
    </div>
  );
};