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
                onClick={onComplete}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#391B1B] h-14 rounded-xl flex items-center justify-center relative active:scale-[0.98] transition-all shadow-sm"
             >
                 <span className="absolute left-5">
                    <svg viewBox="0 0 24 24" width="22" height="22" className="fill-current">
                       <path d="M12 3C6.48 3 2 6.48 2 10.77C2 13.63 3.97 16.11 6.89 17.38C6.66 18.23 6.2 19.8 6.13 20.15C6.13 20.15 6.09 20.44 6.29 20.57C6.48 20.71 6.74 20.61 6.96 20.46C9.48 18.73 10.87 17.75 12 17.75C17.52 17.75 22 14.27 22 9.98C22 5.69 17.52 3 12 3Z"/>
                    </svg>
                 </span>
                 <span className="font-bold text-[15px]">카카오로 계속하기</span>
             </button>

             {/* Naver Button */}
             <button 
                onClick={onComplete}
                className="w-full bg-[#03C75A] hover:bg-[#02b351] text-white h-14 rounded-xl flex items-center justify-center relative active:scale-[0.98] transition-all shadow-sm"
             >
                 <span className="absolute left-6 font-black text-lg">N</span>
                 <span className="font-bold text-[15px]">네이버로 계속하기</span>
             </button>
        </div>
    </div>
  );
};