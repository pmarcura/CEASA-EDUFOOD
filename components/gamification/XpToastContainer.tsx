import React from 'react';
// FIX: Changed imported type from XpToastInfo (which doesn't exist) to XpNoticeInfo and updated the path.
import type { XpNoticeInfo } from '../../types';
import XpToast from './XpToast';

interface XpToastContainerProps {
  // FIX: Updated the type to XpNoticeInfo.
  toasts: XpNoticeInfo[];
  removeToast: (id: number) => void;
}

const XpToastContainer: React.FC<XpToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {toasts.map(toast => (
        <XpToast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default XpToastContainer;
