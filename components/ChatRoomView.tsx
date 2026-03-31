import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatRoom, User } from '../types';
import { Header } from './Header';
import { ChevronLeft, MoreHorizontal, Users, LogOut, X, Send, Trash2 } from 'lucide-react';

export const ChatRoomView: React.FC<{ 
    chatRoom: ChatRoom, 
    participantsInfo: User[],
    currentUserId: number,
    currentUserName: string,
    isCurrentUserManager: boolean,
    onBack: () => void, 
    onSendMessage: (text: string) => void,
    onDeleteMessage: (messageId: string) => void,
    onLeave: () => void 
}> = ({ chatRoom, participantsInfo, currentUserId, currentUserName, isCurrentUserManager, onBack, onSendMessage, onDeleteMessage, onLeave }) => {
    const [messageText, setMessageText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const sortedMessages = useMemo(
        () => [...chatRoom.messages].sort((a, b) => a.timestamp - b.timestamp),
        [chatRoom.messages]
    );

    const otherParticipantIds = useMemo(
        () =>
            Array.from(
                new Set(
                    participantsInfo
                        .map((user) => Number(user.userId))
                        .filter((id) => Number.isFinite(id) && id !== currentUserId)
                )
            ),
        [participantsInfo, currentUserId]
    );

    const getDayKey = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    };

    const formatDateSeparator = (timestamp: number) => {
        const targetDate = new Date(timestamp);
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const weekday = ['일', '월', '화', '수', '목', '금', '토'][targetDate.getDay()];

        return `${year}.${month}.${day} (${weekday})`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatRoom.messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        onSendMessage(messageText);
        setMessageText('');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 relative">
            <Header 
                title={chatRoom.title}
                leftIcon={<ChevronLeft />} 
                onLeftClick={onBack}
                rightIcon={<MoreHorizontal />}
                onRightClick={() => setShowMenu(!showMenu)}
                transparent={false}
            />
            
            {/* 드롭다운 메뉴 */}
            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute top-14 right-4 z-50 bg-white shadow-xl rounded-xl border border-gray-100 p-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => { setShowParticipants(true); setShowMenu(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors"
                        >
                            <Users size={16} className="text-gray-500" /> 대화상대 ({participantsInfo.length})
                        </button>
                        <div className="h-px bg-gray-50 my-1"></div>
                        <button 
                            onClick={() => {
                                if (isCurrentUserManager) {
                                    if (window.confirm('방장은 채팅방을 나갈 수 없습니다. 작성한 게시글로 이동하시겠습니까?')) {
                                        onLeave();
                                    }
                                    return;
                                }

                                if (window.confirm('정말 채팅방을 나가시겠습니까? 대화 내용이 삭제될 수 있습니다.')) {
                                    onLeave();
                                }
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg text-sm font-medium text-red-500 flex items-center gap-2 transition-colors"
                        >
                            <LogOut size={16} /> {isCurrentUserManager ? '게시글로 이동' : '채팅방 나가기'}
                        </button>
                    </div>
                </>
            )}

            {/* 참여자 목록 모달 */}
            {showParticipants && (
                 <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowParticipants(false)}>
                    <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-lg text-gray-900">대화상대</h3>
                            <button onClick={() => setShowParticipants(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                  {participantsInfo.map(user => (
                                      <div key={user.userId} className="flex items-center gap-3">
                                <div className="relative">
                                                <img src={user.profileUrl} alt={user.nickname} className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100"/>
                                                {user.userId === currentUserId && <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded-full border border-white font-bold">나</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{user.nickname}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.introduction || '참여자'}</p>
                                </div>
                             </div>
                          ))}
                        </div>
                    </div>
                 </div>
            )}
            
            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto pt-16 pb-20 px-4 space-y-6">
                {sortedMessages.length === 0 && (
                    <div className="h-full min-h-[240px] flex items-center justify-center text-center text-gray-400 text-sm">
                        채팅방에 작성된 채팅 내역이 없습니다.
                    </div>
                )}
                {sortedMessages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId;
                    const isDeletedMessage = Boolean(msg.deleted);
                    const prevMsg = index > 0 ? sortedMessages[index - 1] : null;
                    const showDateSeparator = !prevMsg || getDayKey(prevMsg.timestamp) !== getDayKey(msg.timestamp);
                    const readByOtherIds = new Set(
                        (msg.readByUserIds ?? [])
                            .map((id) => Number(id))
                            .filter((id) => Number.isFinite(id) && id !== currentUserId)
                    );
                    const readByOtherCount = otherParticipantIds.filter((id) => readByOtherIds.has(id)).length;
                    const unreadOtherCount = Math.max(otherParticipantIds.length - readByOtherCount, 0);
                    // 메시지 보낸 사람 정보 찾기
                    const sender = participantsInfo.find(u => u.userId === msg.senderId);
                    const senderName = sender
                        ? sender.nickname
                        : (msg.senderUsername || (isMe ? currentUserName : '알 수 없는 사용자'));

                    return (
                        <React.Fragment key={msg.id}>
                            {showDateSeparator && (
                                <div className="w-full flex items-center gap-3 py-2">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-[11px] font-semibold text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                                        {formatDateSeparator(msg.timestamp)}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                            )}

                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {/* 상대방일 때만 말풍선 위에 이름 표시 */}
                                {!isMe && (
                                    <span className="text-[11px] font-bold text-gray-600 mb-1 ml-1">
                                        {senderName}
                                    </span>
                                )}
                                
                                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end w-full gap-2`}>
                                    {isMe && unreadOtherCount > 0 && (
                                        <span className="text-[10px] font-semibold text-gray-500 leading-none mb-1">
                                            {unreadOtherCount}
                                        </span>
                                    )}
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-gray-900 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                    }`}>
                                        <span className={isDeletedMessage ? 'text-gray-400 italic' : ''}>{msg.text}</span>
                                        <div className={`text-[10px] mt-1 flex items-center gap-2 ${isMe ? 'justify-end text-gray-400' : 'justify-end text-gray-500'}`}>
                                            {isMe && !isDeletedMessage && !String(msg.id).startsWith('local-') && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('이 메시지를 삭제하시겠습니까?')) {
                                                                onDeleteMessage(String(msg.id));
                                                            }
                                                        }}
                                                        className="inline-flex items-center hover:text-red-300 transition-colors"
                                                        aria-label="메시지 삭제"
                                                        type="button"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </>
                                            )}
                                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력창 */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 max-w-md mx-auto">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                        placeholder="메시지 보내기..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={!messageText.trim()}
                        className="p-3 bg-gray-900 text-white rounded-full disabled:bg-gray-300 disabled:text-gray-500 transition-colors shadow-md shadow-gray-200"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};