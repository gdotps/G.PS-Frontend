import React, { useState, useEffect, useMemo } from 'react';
import { Container as MapContainer, NaverMap, Marker } from 'react-naver-maps';
import { Post } from '../types';
import { Search, Crosshair } from 'lucide-react';
import { CURRENT_USER } from '../constants';

const CATEGORIES = [
    { id: 'ALL', label: '전체', emoji: '🏠' },
    { id: 'SPORTS', label: '스포츠', emoji: '⚽' },
    { id: 'STUDY', label: '스터디', emoji: '📝' },
    { id: 'FOOD', label: '맛집', emoji: '🍕' },
    { id: 'HOBBY', label: '취미', emoji: '🎨' },
    { id: 'GAME', label: '게임', emoji: '🎮' },
    { id: 'MUSIC', label: '음악', emoji: '🎸' },
];

export const MapView: React.FC<{ posts: Post[], onViewPost: (post: Post) => void }> = ({ posts, onViewPost }) => {
    const [myLocation, setMyLocation] = useState({ lat: 37.5665, lng: 126.9780 });
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
    const [loading, setLoading] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [mapBounds, setMapBounds] = useState<any>(null);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
    };

    useEffect(() => {
        let watchId: number;
        if (navigator.geolocation && isTracking) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setMyLocation(newLoc);
                    setMapCenter(newLoc);
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [isTracking]);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = post.title.toLowerCase().includes(query) || post.location.toLowerCase().includes(query);
            const matchesCategory = activeCategory === 'ALL' || post.category === activeCategory;
            let isInBounds = true;
            if (mapBounds && post.lat && post.lng) {
                isInBounds = mapBounds.hasLatLng({ lat: post.lat, lng: post.lng });
            }
            return matchesSearch && matchesCategory && isInBounds;
        });
    }, [posts, searchQuery, activeCategory, mapBounds]);

    const selectedPost = useMemo(() => posts.find(p => p.id === selectedPostId), [posts, selectedPostId]);

    const handleRefreshLocation = () => {
        setIsTracking(true);
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(newLoc);
                setMapCenter(newLoc);
                setLoading(false);
            },
            () => setLoading(false)
        );
    };

    return (
        <div className="w-full h-screen bg-gray-100 relative max-w-md mx-auto overflow-hidden">
            {/* 상단 검색 및 정렬된 카테고리 영역 */}
            <div className="absolute top-4 left-0 right-0 z-40 space-y-3 px-4">
                <div className="relative shadow-lg rounded-xl bg-white/90 backdrop-blur-md border border-white/20 overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-4 py-3 bg-transparent text-[13px] focus:outline-none"
                        placeholder="모임 이름, 장소 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                {/* 카테고리: 가로 스크롤(옆으로 넘기기) 및 크기 축소 */}
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-0.5 -mx-4 px-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-all shadow-sm border whitespace-nowrap ${
                                activeCategory === cat.id 
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                                : 'bg-white text-gray-500 border-gray-100'
                            }`}
                        >
                            <span className="text-[13px]">{cat.emoji}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <MapContainer className="w-full h-full">
                <NaverMap
                    center={mapCenter}
                    onCenterChanged={(center) => {
                        setMapCenter({ lat: center.y, lng: center.x });
                        if (isTracking) setIsTracking(false);
                    }}
                    onBoundsChanged={(bounds) => setMapBounds(bounds)}
                    defaultZoom={15}
                >
                    <Marker 
                        position={myLocation}
                        icon={{
                            content: `
                                <div class="relative">
                                    <div class="absolute -inset-2 bg-blue-500/20 rounded-full animate-ping"></div>
                                    <div style="width:16px; height:16px; background:#4285F4; border:2.5px solid white; border-radius:50%; box-shadow:0 2px 5px rgba(0,0,0,0.2); position:relative; z-index:1;"></div>
                                </div>`,
                            anchor: { x: 7, y: 7 }
                        }}
                    />

                    {filteredPosts.map((post) => {
                        const isMyPost = post.authorId === CURRENT_USER.userId;
                        const isSelected = selectedPostId === post.id;
                        const pinColor = isSelected ? '#111827' : (isMyPost ? '#FFD43B' : '#FFFFFF');
                        const iconColor = isSelected ? '#FFFFFF' : (isMyPost ? '#111827' : '#4B5563');

                        return (
                            post.lat && post.lng && (
                                <Marker
                                    key={post.id}
                                    position={{ lat: post.lat, lng: post.lng }}
                                    onClick={() => isSelected ? onViewPost(post) : setSelectedPostId(post.id)}
                                    icon={{
                                        content: `
                                            <div style="filter: drop-shadow(0 3px 4px rgba(0,0,0,0.15)); transform: ${isSelected ? 'scale(1.1) translateY(-4px)' : 'scale(1)'}; transition: all 0.2s ease-out;">
                                                <div style="
                                                    width: 32px; 
                                                    height: 32px; 
                                                    background: ${pinColor}; 
                                                    border-radius: 50% 50% 50% 0; 
                                                    transform: rotate(-45deg); 
                                                    display: flex; 
                                                    align-items: center; 
                                                    justify-content: center;
                                                    border: 1.5px solid rgba(0,0,0,0.05);
                                                ">
                                                    <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; margin-top: 2px; margin-left: 3px;">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                            <circle cx="9" cy="7" r="4"></circle>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>`,
                                        anchor: { x: 14, y: 30 }
                                    }}
                                />
                            )
                        );
                    })}
                </NaverMap>
            </MapContainer>

            {/* 내 위치 찾기 버튼 - 여백 확보를 위해 위치 조정 */}
            <div className={`absolute right-4 z-40 transition-all duration-300 ${selectedPost ? 'bottom-48' : 'bottom-24'}`}>
                <button 
                    onClick={handleRefreshLocation}
                    className={`p-3 rounded-2xl shadow-xl active:scale-90 transition-all ${isTracking ? 'bg-blue-500 text-white' : 'bg-white text-gray-900'}`}
                >
                    <Crosshair size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* 하단 선택된 모집글 */}
            {selectedPost && (
                <div 
                    onClick={() => onViewPost(selectedPost)}
                    className="absolute bottom-20 left-4 right-4 bg-white p-3.5 rounded-2xl shadow-2xl z-40 flex gap-3.5 items-center animate-in slide-in-from-bottom-5 duration-300 cursor-pointer"
                >
                    <div className="w-12 h-12 bg-gray-50 rounded-xl shrink-0 overflow-hidden relative border border-gray-100">
                        <img src={selectedPost.imageUrl || selectedPost.authorAvatar} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-[14.5px] truncate leading-tight">{selectedPost.title}</h4>
                        <div className="flex items-center gap-1.5 text-[11.5px] mt-1 font-medium">
                            <span className="text-blue-600">
                                {calculateDistance(myLocation.lat, myLocation.lng, selectedPost.lat!, selectedPost.lng!)}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="text-gray-500 truncate">{selectedPost.location}</span>
                        </div>
                    </div>
                    <button className="bg-gray-900 text-white text-[11.5px] font-bold px-4 py-2 rounded-xl shrink-0">
                        자세히 보기
                    </button>
                </div>
            )}
        </div>
    );
};