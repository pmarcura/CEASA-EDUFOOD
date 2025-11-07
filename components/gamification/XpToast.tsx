import React, { useEffect } from 'react';
// FIX: Changed imported type from XpToastInfo (which doesn't exist) to XpNoticeInfo and updated the path.
import type { XpNoticeInfo } from '../../types';

interface XpToastProps {
  // FIX: Updated the type to XpNoticeInfo.
  toast: XpNoticeInfo;
  onRemove: (id: number) => void;
}

const XpToast: React.FC<XpToastProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000); // Toast disappears after 3 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  // FIX: The property for gained XP in XpNoticeInfo is `xpGained`, not `xp`.
  const xpColor = toast.xpGained > 0 ? 'text-green-500' : 'text-red-500';
  const xpSign = toast.xpGained > 0 ? '+' : '';

  return (
    <div className="bg-brand-surface rounded-full shadow-lg p-2 pl-4 pr-5 flex items-center gap-2 animate-fade-in">
      {/* FIX: The property for gained XP in XpNoticeInfo is `xpGained`, not `xp`. */}
      <span className={`font-bold text-sm ${xpColor}`}>{xpSign}{toast.xpGained} XP</span>
      <span className="text-sm text-brand-text-secondary">{toast.reason}</span>
    </div>
  );
};

export default XpToast;
