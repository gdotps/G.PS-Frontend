import React, { useState, useEffect } from 'react';
import { Post } from '../types';
import { Search, Users, Crosshair } from 'lucide-react';

export const MapView: React.FC<{ posts: Post[], onViewPost: (post: Post) => void }> = ({ posts, onViewPost }) => {
    const [myLocation, setMyLocation] = useState<{lat: number, lng: number} | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');

    const CATEGORIES = [
        { id: 'ALL', label: '전체' },
        { id: 'FOOD', label: '🍽 맛집' },
        { id: 'EXERCISE', label: '🏃 운동' },
        { id: 'STUDY', label: '📚 스터디' },
        { id: 'HOBBY', label: '🎨 취미' },
        { id: 'OTHER', label: '🎸 기타' },
    ];

    // Mock positions for visual demo distributed around center
    // We use a predefined set of relative positions to simulate markers on a static map background
    const mockPositions = [
        { top: '30%', left: '25%' },
        { top: '50%', right: '25%' },
        { top: '40%', left: '60%' },
        { bottom: '35%', left: '40%' },
        { top: '20%', right: '40%' },
        { top: '60%', left: '30%' },
        { bottom: '25%', right: '35%' },
    ];

    useEffect(() => {
        // Only auto-select if no filter is active to avoid confusion
        if (posts.length > 0 && !selectedPostId && !searchQuery && activeCategory === 'ALL') {
            setSelectedPostId(posts[0].id);
        }
    }, [posts]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMyLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                },
                (error) => {
                    console.error("Error fetching location", error);
                    setLoading(false);
                }
            );
        } else {
            setLoading(false);
        }
    }, []);

    const handleRefreshLocation = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMyLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoading(false);
                },
                () => setLoading(false)
            );
        }
    };

    // Filter Logic
    const filteredPosts = posts.filter(post => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            post.title.toLowerCase().includes(query) || 
            post.location.toLowerCase().includes(query) ||
            (post.description && post.description.toLowerCase().includes(query));
            
        const matchesCategory = activeCategory === 'ALL' || post.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const selectedPost = posts.find(p => p.id === selectedPostId);

    return (
        <div className="w-full h-screen bg-gray-100 relative max-w-md mx-auto overflow-hidden">
            {/* Search & Filter Overlay */}
            <div className="absolute top-4 left-4 right-4 z-40 space-y-3">
                 <div className="relative shadow-md rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 bg-white rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="모임 이름, 장소 검색"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 
                 <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-colors ${
                                activeCategory === cat.id 
                                ? 'bg-gray-900 text-white' 
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                 </div>
            </div>

            {/* Fake Map Background */}
            <div className="absolute inset-0 bg-[#eef2f5] flex items-center justify-center overflow-hidden" onClick={() => setSelectedPostId(null)}>
                <div className="grid grid-cols-6 grid-rows-12 w-full h-full opacity-10 pointer-events-none">
                    {Array.from({length: 72}).map((_, i) => (
                        <div key={i} className="border border-gray-400"></div>
                    ))}
                </div>
                {/* Decorative Map elements */}
                <div className="absolute top-1/4 left-0 w-full h-2 bg-blue-100/50 -rotate-6 transform"></div>
                <div className="absolute top-2/3 right-0 w-2/3 h-4 bg-gray-200/50 rotate-12 transform"></div>
                <div className="absolute text-gray-300 font-bold text-4xl rotate-12 opacity-20 select-none">MAP VIEW</div>
            </div>

            {/* Pins (Filtered Posts) */}
            {filteredPosts.map((post, index) => {
                // We need to map the original index to keep consistent positions if possible, 
                // or just map by new index. For a mock map, mapping by index is fine.
                // To make it feel more consistent when filtering, we could try to hash the ID to an index.
                const posIndex = post.id.charCodeAt(post.id.length - 1) % mockPositions.length;
                
                return (
                <div
                    key={post.id}
                    className="absolute cursor-pointer transition-all duration-300"
                    style={{
                        // Assign a position based on ID hash to keep it stable during filtering
                        ...mockPositions[posIndex],
                        zIndex: selectedPostId === post.id ? 20 : 10,
                        transform: selectedPostId === post.id ? 'scale(1.1) translateY(-10px)' : 'scale(1)'
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedPostId(post.id); }}
                >
                     {/* Map Pin: Yellow Default, Dark Gray Selected */}
                     <div className={`p-2 rounded-full shadow-lg border-2 border-white transition-colors flex items-center justify-center ${selectedPostId === post.id ? 'bg-gray-900' : 'bg-gps-500'}`}>
                        {/* Simple Icon based on category could go here */}
                        <Users className={selectedPostId === post.id ? "text-white w-4 h-4" : "text-gray-900 w-4 h-4"}/>
                    </div>
                    {/* Tooltip Title */}
                    {selectedPostId === post.id && (
                        <div className="bg-white px-3 py-1.5 rounded-lg shadow-md text-xs font-bold absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 text-gray-800 animate-bounce">
                            {post.title}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white"></div>
                        </div>
                    )}
                </div>
            )})}
            
            {filteredPosts.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur px-6 py-4 rounded-xl text-center shadow-sm">
                    <p className="text-gray-500 text-sm font-bold">조건에 맞는 모임이 없습니다.</p>
                </div>
            )}

            {/* My Location Marker */}
            {myLocation && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none">
                    <div className="relative">
                        <div className="w-4 h-4 bg-gray-900 rounded-full border-2 border-white shadow-sm z-10 relative"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-900 rounded-full opacity-20 animate-ping"></div>
                        <div className="bg-black/70 text-white px-2 py-1 rounded text-[10px] font-bold absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            나
                        </div>
                    </div>
                </div>
            )}

            {/* Location Control Button */}
             <div className="absolute bottom-40 right-4 flex flex-col gap-2">
                <button 
                    onClick={handleRefreshLocation}
                    className="p-3 bg-white rounded-full shadow-lg text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                >
                    <Crosshair size={20} className={loading ? 'animate-spin text-gray-400' : (myLocation ? 'text-gray-900' : '')} />
                </button>
             </div>

             {/* Bottom Card Preview */}
             {selectedPost && filteredPosts.find(p => p.id === selectedPost.id) && (
                <div className="absolute bottom-20 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl z-30 flex gap-4 items-center animate-slide-up transition-all">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0 overflow-hidden">
                        <img src={selectedPost.imageUrl || selectedPost.authorAvatar} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate mb-0.5">{selectedPost.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="text-gray-900 font-bold">{selectedPost.distance}</span>
                            <span>•</span>
                            <span className="truncate">{selectedPost.location}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate">{selectedPost.time}</p>
                    </div>
                    <button 
                        onClick={() => onViewPost(selectedPost)}
                        className="ml-auto bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-gray-200 shrink-0 hover:bg-gray-800 transition-colors"
                    >
                        참여
                    </button>
                </div>
             )}
        </div>
    );
};