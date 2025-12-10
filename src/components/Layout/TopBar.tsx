'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { UserType } from '@/types';
import { Users, User, Home, Menu, Bell, Search } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
}

export default function TopBar({
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  onProfileClick
}: TopBarProps) {
  const { currentUser } = useFinance();

  return (
    <div className="top-bar">
      <div className="left-section">
        <button className="icon-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
      </div>

      <div className="right-section">
        <button className="icon-btn" onClick={onSearchClick}>
          <Search size={24} />
        </button>
        <button className="icon-btn" onClick={onNotificationsClick}>
          <Bell size={24} />
        </button>
        <div className="profile-pic" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
          {/* Placeholder for user image */}
          <img
            src={`https://ui-avatars.com/api/?name=${currentUser}&background=0D8ABC&color=fff`}
            alt="Profile"
          />
        </div>
      </div>

      <style jsx>{`
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: transparent;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .icon-btn {
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          cursor: pointer;
        }

        .right-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-pic {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .profile-pic img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}
