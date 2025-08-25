import React from 'react';
import type { InitiativeCardProps } from '../types';

const getStatusPill = (status?: string) => {
  const statusClasses = {
    'Đã đưa vào sử dụng': 'bg-green-100 text-green-800',
    'Đang triển khai': 'bg-yellow-100 text-yellow-800',
    'Đang phát triển': 'bg-blue-100 text-blue-800',
    'Kế hoạch': 'bg-purple-100 text-purple-800',
  };
  const key = status as keyof typeof statusClasses;
  const classes = statusClasses[key] || 'bg-gray-100 text-gray-800';
  return <span className={`inline-block ${classes} text-xs font-medium px-2.5 py-1 rounded-full`}>{status || 'Chưa xác định'}</span>;
};

const InitiativeCard: React.FC<InitiativeCardProps> = ({ initiative }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between transition-transform transform hover:-translate-y-1 hover:shadow-lg">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800 pr-2">{initiative.tenNganGon || initiative.tenChinhThuc}</h3>
          {getStatusPill(initiative.giaiDoan)}
        </div>
        <p className="text-sm text-gray-500 mb-2 font-medium">{initiative.banChuTri || 'Chưa xác định'}</p>
        <p className="text-gray-600 text-sm mb-4 h-20 overflow-auto">{initiative.moTa || 'Không có mô tả.'}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-xs text-gray-500 break-all mb-3">
             <span className="font-semibold">Công nghệ:</span>
             <span>{initiative.congNghe || 'N/A'}</span>
        </div>
        <div className="flex flex-wrap gap-4 justify-end items-center text-sm">
            {initiative.fileUrl && (
                <a href={initiative.fileUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800 font-semibold transition flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Tệp đính kèm
                </a>
            )}
            {initiative.link ? (
              <a href={initiative.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold transition">
                Truy cập &rarr;
              </a>
            ) : (!initiative.fileUrl && <span className="text-gray-400 text-sm">Không có link</span>)}
        </div>
      </div>
    </div>
  );
};

export default InitiativeCard;