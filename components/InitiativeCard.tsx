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
  return <span className={`inline-block flex-shrink-0 ${classes} text-xs font-medium px-2.5 py-1 rounded-full`}>{status || 'Chưa xác định'}</span>;
};

const InitiativeCard: React.FC<InitiativeCardProps> = ({ initiative, onEdit, onDelete, onViewDatabases, currentUserEmail }) => {
  const isOwner = initiative.created_by_email === currentUserEmail;
  const hasLinkedDatabases = initiative.lien_ket_csdl && initiative.lien_ket_csdl.length > 0;
  const linkedDbCount = initiative.lien_ket_csdl?.length || 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between transition-transform transform hover:-translate-y-1 hover:shadow-lg">
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-800 pr-2">{initiative.ten_ngan_gon || initiative.ten_chinh_thuc}</h3>
          {getStatusPill(initiative.giai_doan)}
        </div>
        <p className="text-sm text-gray-500 mb-2 font-medium">{initiative.ban_chu_tri || 'Chưa xác định'}</p>
        <p className="text-gray-600 text-sm mb-4 h-20 overflow-auto">{initiative.mo_ta || 'Không có mô tả.'}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-xs text-gray-500 break-words mb-4">
             <span className="font-semibold">Công nghệ:</span>
             <span>{initiative.cong_nghe || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
            {/* Left side: Admin actions */}
            <div className="flex flex-wrap gap-4 items-center">
                 {isOwner && (
                    <>
                        <button onClick={() => onEdit(initiative)} className="text-gray-600 hover:text-blue-600 font-semibold transition flex items-center" title="Chỉnh sửa">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                            </svg>
                            Sửa
                        </button>
                        <button onClick={() => onDelete(initiative.ten_chinh_thuc)} className="text-gray-600 hover:text-red-600 font-semibold transition flex items-center" title="Xóa">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Xóa
                        </button>
                    </>
                )}
                 {initiative.file_url && (
                    <a href={initiative.file_url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 font-semibold transition flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Tệp
                    </a>
                )}
            </div>
            
            {/* Right side: User actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onViewDatabases(initiative)}
                    disabled={!hasLinkedDatabases}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-1.5 border ${
                    hasLinkedDatabases
                        ? 'bg-white text-pvn-brand-blue border-pvn-brand-blue/50 hover:bg-pvn-brand-blue/10'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    }`}
                    title={hasLinkedDatabases ? 'Xem CSDL liên quan' : 'Chưa có CSDL nào được liên kết'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
                    </svg>
                    CSDL ({linkedDbCount})
                </button>

                {initiative.link_truy_cap ? (
                <a href={initiative.link_truy_cap} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white text-center font-semibold rounded-lg shadow-md hover:bg-blue-700 transition">
                    Truy cập
                </a>
                ) : <span className="px-4 py-2 bg-gray-300 text-white font-semibold rounded-lg shadow-md cursor-not-allowed">
                    Truy cập
                </span>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default InitiativeCard;