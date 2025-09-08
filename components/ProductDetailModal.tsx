import React from 'react';
import type { ProductDetailModalProps } from '../types';
import { BriefcaseIcon, TagIcon, CogIcon, LinkIcon, DatabaseIcon, CalendarIcon, IdentificationIcon, UsersIcon } from './icons/DetailIcons';
import { DocumentTextIcon } from './icons/AdminIcons';

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

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | string[] | null }> = ({ icon, label, value }) => {
  const displayValue = value && (Array.isArray(value) ? value.join(', ') : value);

  if (!displayValue) {
    return (
     <div className="flex items-start">
      <div className="flex-shrink-0 text-gray-400">{icon}</div>
      <div className="ml-3">
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-base text-gray-400 italic">Chưa có thông tin</p>
      </div>
    </div>
    );
  }

  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 text-pvn-brand-blue">{icon}</div>
      <div className="ml-3 min-w-0">
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-base text-gray-800 break-words">{displayValue}</p>
      </div>
    </div>
  );
};

const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObject = new URL(url);
    const fileNameFromParam = urlObject.searchParams.get('file');
    if (fileNameFromParam) {
      return decodeURIComponent(fileNameFromParam);
    }
    
    const pathname = urlObject.pathname;
    const lastPart = pathname.split('/').pop();
    if (lastPart) {
      return decodeURIComponent(lastPart);
    }

    return 'Tệp không xác định';
  } catch (e) {
    try {
        const simpleMatch = url.split(/[\\/]/).pop()?.split('?')[0];
        return decodeURIComponent(simpleMatch || 'Tệp không xác định');
    } catch {
        return 'Tệp không xác định';
    }
  }
};

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, initiative }) => {
  if (!isOpen || !initiative) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-pvn-blue">{initiative.ten_ngan_gon || initiative.ten_chinh_thuc}</h2>
            <p className="text-sm text-pvn-gray-600">{initiative.ten_chinh_thuc}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <DetailItem icon={<DocumentTextIcon />} label="Mô tả" value={initiative.mo_ta} />
              <DetailItem icon={<CogIcon />} label="Công nghệ" value={initiative.cong_nghe} />
              <DetailItem icon={<DatabaseIcon className="w-6 h-6"/>} label="CSDL liên kết" value={initiative.lien_ket_csdl && initiative.lien_ket_csdl.length > 0 ? initiative.lien_ket_csdl : null} />
               {initiative.file_urls && initiative.file_urls.length > 0 && (
                    <div className="flex items-start">
                        <div className="flex-shrink-0 text-pvn-brand-blue"><LinkIcon /></div>
                        <div className="ml-3 min-w-0">
                            <p className="text-sm font-semibold text-gray-500">Tệp đính kèm</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                            {initiative.file_urls.map(url => (
                                <li key={url}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 hover:underline break-all">
                                        {getFileNameFromUrl(url)}
                                    </a>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </div>
               )}
               {initiative.link_truy_cap ? (
                <div className="flex items-start">
                  <div className="flex-shrink-0 text-pvn-brand-blue"><LinkIcon /></div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-semibold text-gray-500">Liên kết truy cập</p>
                    <a href={initiative.link_truy_cap} target="_blank" rel="noopener noreferrer" className="text-base text-blue-600 hover:underline break-all">{initiative.link_truy_cap}</a>
                  </div>
                </div>
              ) : <DetailItem icon={<LinkIcon />} label="Liên kết truy cập" value={null}/>}
            </div>
            <div className="md:col-span-1 space-y-6 bg-gray-50 p-4 rounded-lg border">
               <div className="flex items-start">
                 <div className="flex-shrink-0 text-pvn-brand-blue"><CalendarIcon /></div>
                 <div className="ml-3">
                   <p className="text-sm font-semibold text-gray-500">Trạng thái</p>
                   {getStatusPill(initiative.giai_doan)}
                 </div>
               </div>
               <DetailItem icon={<BriefcaseIcon />} label="Ban chủ trì" value={initiative.ban_chu_tri} />
               <DetailItem icon={<IdentificationIcon />} label="Nhân sự đầu mối" value={initiative.nhan_su_dau_moi} />
               <DetailItem icon={<UsersIcon />} label="Nhân sự phụ trách" value={initiative.nhan_su_phu_trach} />
               <DetailItem icon={<TagIcon />} label="Phân loại" value={initiative.phan_loai} />
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
           <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Đóng
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;