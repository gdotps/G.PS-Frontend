import React from 'react';

export const Header: React.FC<{ 
  title?: string; 
  leftIcon?: React.ReactNode; 
  onLeftClick?: () => void;
  rightIcon?: React.ReactNode;
  onRightClick?: () => void;
  transparent?: boolean;
}> = ({ title, leftIcon, onLeftClick, rightIcon, onRightClick, transparent }) => (
  <div className={`fixed top-0 max-w-md w-full z-40 flex items-center justify-between px-4 h-14 ${transparent ? 'bg-transparent' : 'bg-white/90 backdrop-blur-md border-b border-gray-50'}`}>
    <div className="w-10">
      {leftIcon && (
        <button onClick={onLeftClick} className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          {leftIcon}
        </button>
      )}
    </div>
    <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
    <div className="w-10 flex justify-end">
      {rightIcon && (
        <button onClick={onRightClick} className="p-2 -mr-2 text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          {rightIcon}
        </button>
      )}
    </div>
  </div>
);