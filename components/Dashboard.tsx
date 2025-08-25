import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Product, Initiative } from '../types';
import { supabase } from '../lib/supabaseClient';
import { uploadFileToSharePoint } from '../lib/sharepoint';
import type { Session } from '@supabase/supabase-js';

import ProductModal from './ProductModal';
import StatCard from './StatCard';
import InitiativeCard from './InitiativeCard';
import StatusChart from './charts/StatusChart';
import ClassificationChart from './charts/ClassificationChart';
import DepartmentChart from './charts/DepartmentChart';

import RocketIcon from './icons/RocketIcon';
import CheckIcon from './icons/CheckIcon';
import WrenchIcon from './icons/WrenchIcon';
import BuildingIcon from './icons/BuildingIcon';

interface DashboardProps {
  session: Session;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // State for dynamic data from Supabase
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('');

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const fetchInitiatives = useCallback(async () => {
    setIsFetching(true);
    setStatusMessage('Đang tải dữ liệu...');
    setIsError(false);
    try {
        const { data, error } = await supabase
            .from('Catalog_data')
            .select('*');

        if (error) {
            throw new Error(`Lỗi tải dữ liệu: ${error.message}`);
        }

        if (data) {
            const mappedData: Initiative[] = data.map(item => ({
                tenChinhThuc: item['Tên chính thức SKS/công cụ'] || '',
                tenNganGon: item['Tên ngắn gọn'] || '',
                moTa: item['Mô tả SKS/công cụ'] || '',
                phanLoai: item['Phân loại'] || '',
                congNghe: item['Công nghệ/Nền tảng'] || '',
                doiTuong: item['Đối tượng sử dụng'] || '',
                giaiDoan: item['Giai đoạn triển khai'] || '',
                linhVuc: typeof item['Phân loại lĩnh vực'] === 'string' 
                    ? item['Phân loại lĩnh vực'] 
                    : JSON.stringify(item['Phân loại lĩnh vực']) || '',
                link: item['Link truy cập'] || '',
                banChuTri: item['Ban chủ trì'] || '',
                fileUrl: item['file_url'] || '',
            }));
            setInitiatives(mappedData);
            setStatusMessage('');
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định khi tải dữ liệu.';
        setStatusMessage(errorMessage);
        setIsError(true);
    } finally {
        setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchInitiatives();
  }, [fetchInitiatives]);

  // Memoize filter options based on dynamic data
  const filterOptions = useMemo(() => {
    const departments = [...new Set(initiatives.map(item => item.banChuTri).filter(Boolean))].sort();
    const statuses = [...new Set(initiatives.map(item => item.giaiDoan).filter(Boolean))].sort();
    const classifications = [...new Set(initiatives.map(item => item.phanLoai).filter(Boolean))].sort();
    return { departments, statuses, classifications };
  }, [initiatives]);

  // Memoize filtered initiatives for performance
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(item => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = (
        (item.tenNganGon || '').toLowerCase().includes(lowerSearchTerm) ||
        (item.tenChinhThuc || '').toLowerCase().includes(lowerSearchTerm) ||
        (item.moTa || '').toLowerCase().includes(lowerSearchTerm)
      );
      const matchesDept = !selectedDept || item.banChuTri === selectedDept;
      const matchesStatus = !selectedStatus || item.giaiDoan === selectedStatus;
      const matchesClassification = !selectedClassification || item.phanLoai === selectedClassification;

      return matchesSearch && matchesDept && matchesStatus && matchesClassification;
    });
  }, [searchTerm, selectedDept, selectedStatus, selectedClassification, initiatives]);
  
  // Memoize stats calculation
  const stats = useMemo(() => {
    const data = filteredInitiatives;
    const total = data.length;
    const departments = [...new Set(data.map(item => item.banChuTri).filter(Boolean))].length;
    const deployed = data.filter(item => item.giaiDoan === 'Đã đưa vào sử dụng').length;
    const inProgress = data.filter(item => ['Đang triển khai', 'Đang phát triển'].includes(item.giaiDoan)).length;
    return { total, departments, deployed, inProgress };
  }, [filteredInitiatives]);

  const handleSubmit = useCallback(async (product: Product, file: File | null) => {
    setIsLoading(true);
    setStatusMessage('Đang xử lý...');
    setIsError(false);

    try {
      let fileUrl: string | null = null;
      
      if (file) {
        setStatusMessage('Đang tải tệp lên SharePoint...');
        fileUrl = await uploadFileToSharePoint(file);
        if (!fileUrl) {
            throw new Error('Không thể tải tệp lên SharePoint.');
        }
      }

      setStatusMessage('Đang lưu thông tin sản phẩm...');
      const productDataForDb = {
        "Tên chính thức SKS/công cụ": product.tieuDe,
        "Tên ngắn gọn": product.tenNgan,
        "Ban chủ trì": product.banChuTri,
        "Giai đoạn triển khai": product.giaiDoan,
        "Phân loại": product.phanLoai,
        "Công nghệ/Nền tảng": product.congNghe,
        "Link truy cập": product.lienKet,
        "Mô tả SKS/công cụ": product.moTa,
        "file_url": fileUrl,
      };

      const { error: insertError } = await supabase
        .from('Catalog_data')
        .insert([productDataForDb] as any);

      if (insertError) {
        throw new Error(`Lỗi lưu dữ liệu: ${insertError.message}`);
      }

      setStatusMessage('Thêm sản phẩm thành công! Đang làm mới dashboard...');
      setIsError(false);
      closeModal();
      await fetchInitiatives(); // REFRESH DATA!
      setTimeout(() => setStatusMessage(''), 3000);

    } catch (error) {
      console.error('Lỗi khi thêm sản phẩm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Vui lòng kiểm tra console.';
      setStatusMessage(`Thêm sản phẩm thất bại: ${errorMessage}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchInitiatives]);


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Dashboard theo dõi Ứng dụng số PVN</h1>
          <p className="text-gray-600 mt-2">Theo dõi tổng quan và tìm kiếm thông tin các Ứng dụng số tại PVN.</p>
        </div>
        <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800 truncate" title={session.user.email}>{session.user.email}</p>
            </div>
            <button
                onClick={fetchInitiatives}
                disabled={isFetching}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isFetching ? 'Đang tải...' : 'Làm mới dữ liệu'}
            </button>
            <button
                onClick={openModal}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition"
            >
                Thêm sản phẩm
            </button>
             <button
                onClick={handleLogout}
                title="Đăng xuất"
                aria-label="Đăng xuất"
                className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-600 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
      </header>
      
       {statusMessage && (
            <p className={`mb-4 text-sm font-medium text-center p-3 rounded-lg ${isError ? 'text-red-700 bg-red-100' : 'text-green-700 bg-green-100'}`}>
                {statusMessage}
            </p>
        )}

      {/* Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<RocketIcon />} value={stats.total} label="Tổng Sáng kiến" color="blue" />
        <StatCard icon={<CheckIcon />} value={stats.deployed} label="Đã triển khai" color="green" />
        <StatCard icon={<WrenchIcon />} value={stats.inProgress} label="Đang thực hiện" color="yellow" />
        <StatCard icon={<BuildingIcon />} value={stats.departments} label="Ban tham gia" color="indigo" />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-4">Sáng kiến theo Giai đoạn</h3>
              <div className="h-80"><StatusChart initiatives={initiatives} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-4">Sáng kiến theo Phân loại</h3>
              <div className="h-80"><ClassificationChart initiatives={initiatives} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold mb-4">Sáng kiến theo Ban chủ trì</h3>
              <div className="h-80"><DepartmentChart initiatives={initiatives} /></div>
          </div>
      </section>
      
      {/* Filters */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input type="text" placeholder="Tìm theo tên, mô tả..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo Ban chủ trì</label>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">Tất cả các Ban</option>
              {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo Giai đoạn</label>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">Tất cả giai đoạn</option>
              {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo Phân loại</label>
            <select value={selectedClassification} onChange={e => setSelectedClassification(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <option value="">Tất cả phân loại</option>
              {filterOptions.classifications.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      {/* Initiatives Grid */}
      {isFetching ? (
         <div className="text-center py-16">
          <p className="text-xl font-semibold text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : filteredInitiatives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInitiatives.map((item, index) => (
            <InitiativeCard key={`${item.tenChinhThuc}-${index}`} initiative={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-gray-600">Không tìm thấy sáng kiến nào</p>
          <p className="text-gray-500">Vui lòng thử lại với từ khóa hoặc bộ lọc khác, hoặc thêm sản phẩm mới.</p>
        </div>
      )}

      {/* Modal */}
      <ProductModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Dashboard;
