import React, { useState } from 'react';
import { Header } from './Header';
import { ChevronLeft, Search } from 'lucide-react';

const MOCK_ADDRESSES = [
  "서울 강남구 테헤란로 1",
  "서울 강남구 강남대로 396",
  "서울 마포구 양화로 160",
  "서울 성동구 아차산로 17",
  "서울 용산구 이태원로 1",
  "서울 종로구 세종대로 1",
  "서울 송파구 올림픽로 300",
  "서울 영등포구 여의동로 330"
];

export const AddressSearchModal: React.FC<{ onClose: () => void, onSelect: (addr: string) => void }> = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  
  const filtered = query ? MOCK_ADDRESSES.filter(a => a.includes(query)) : [];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
       <Header 
         leftIcon={<ChevronLeft />} 
         onLeftClick={onClose}
         title="주소 검색"
       />
       <div className="pt-16 px-4">
         <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" size={20}/>
            <input 
              autoFocus
              className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="동명(읍/면) 또는 도로명 검색 (예: 역삼동)"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
         </div>
         <div className="space-y-0 divider-y divide-gray-100">
            {filtered.length > 0 ? filtered.map((addr, i) => (
                <button 
                  key={i}
                  className="w-full text-left py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => onSelect(addr)}
                >
                    <div className="font-bold text-gray-900">{addr}</div>
                    <div className="text-xs text-gray-400 mt-0.5">지번: {addr}</div>
                </button>
            )) : query && (
                <div className="text-center text-gray-400 py-10">검색 결과가 없습니다.</div>
            )}
            {!query && (
               <div className="text-center text-gray-400 py-10 text-sm">
                  검색어를 입력해주세요.<br/>
                  (데모: '강남', '마포', '서울' 등 입력)
               </div>
            )}
         </div>
       </div>
    </div>
  );
}