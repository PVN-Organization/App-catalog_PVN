import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Product, Initiative, Database } from '../types';
import { supabase } from '../lib/supabaseClient';
import { databaseSupabase } from '../lib/databaseSupabaseClient'; 
import { uploadFileToSharePoint } from '../lib/sharepoint';
import type { Session } from '@supabase/supabase-js';

import ProductModal from './ProductModal';
import DatabaseDetailModal from './DatabaseDetailModal';
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
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [allDatabases, setAllDatabases] = useState<Pick<Database, 'id' | 'name'>[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDataReconciled, setIsDataReconciled] = useState(false);

  const [selectedInitiativeForDbView, setSelectedInitiativeForDbView] = useState<Initiative | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('');

  const openModal = () => {
    setEditingInitiative(null);
    setIsModalOpen(true);
  };

  const handleEdit = (initiative: Initiative) => {
    setEditingInitiative(initiative);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInitiative(null);
  };
  
  const handleViewDatabases = (initiative: Initiative) => {
      setSelectedInitiativeForDbView(initiative);
  };

  const closeDbModal = () => {
      setSelectedInitiativeForDbView(null);
  };

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

        if (error) throw new Error(`Lỗi tải dữ liệu: ${error.message}`);

        if (data) {
            const mappedData: Initiative[] = data.map(item => ({
                ten_chinh_thuc: item.ten_chinh_thuc || '',
                ten_ngan_gon: item.ten_ngan_gon || '',
                mo_ta: item.mo_ta || '',
                phan_loai: item.phan_loai || '',
                cong_nghe: item.cong_nghe || '',
                doi_tuong: item.doi_tuong || '',
                giai_doan: item.giai_doan || '',
                linh_vuc: typeof item.linh_vuc === 'string' 
                    ? item.linh_vuc 
                    : JSON.stringify(item.linh_vuc) || '',
                link_truy_cap: item.link_truy_cap || '',
                ban_chu_tri: item.ban_chu_tri || '',
                file_url: item.file_url || '',
                created_by_email: item.created_by_email || '',
                lien_ket_csdl: item.lien_ket_csdl || [],
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

   const fetchAllDatabases = useCallback(async () => {
        try {
            const { data, error } = await databaseSupabase
                .from('co_so_du_lieu')
                .select('ten_csdl');

            if (error) {
                console.warn(`Could not fetch database list: ${error.message}`);
                return;
            }
            if (data) {
                setAllDatabases(data.map(db => ({ id: db.ten_csdl, name: db.ten_csdl })));
            }
        } catch (error) {
            console.warn('Failed to fetch database list.', error);
        }
    }, []);

  useEffect(() => {
    fetchInitiatives();
    fetchAllDatabases();
  }, [fetchInitiatives, fetchAllDatabases]);
  
  useEffect(() => {
    // Run this effect only once after data is fetched and not yet reconciled.
    if (isFetching || isDataReconciled || initiatives.length === 0 || allDatabases.length === 0) {
        return;
    }

    const normalize = (str: string): string => {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/cơ sở dữ liệu|csdl|hệ thống|ứng dụng|pvn|quản lý/g, '')
            .replace(/sổ tay/g, 'sotay') // Handle specific known synonyms
            .replace(/\s+/g, ' ').trim();
    };

    const updatedInitiatives = initiatives.map(initiative => {
        const linkedDbs = new Set<string>(initiative.lien_ket_csdl || []);

        // Specific Rule from user request
        if (initiative.ten_chinh_thuc === 'Sổ tay hoạt động chính PVN') {
            const targetDb = allDatabases.find(db => db.name === 'Sổ tay PVN 2025');
            if (targetDb) {
                linkedDbs.add(targetDb.id);
            }
        }

        // General Heuristic Rule for matching
        const initiativeNormName = normalize(initiative.ten_ngan_gon || initiative.ten_chinh_thuc);
        if (initiativeNormName) {
            allDatabases.forEach(db => {
                const dbNormName = normalize(db.name);
                if (dbNormName && (dbNormName.includes(initiativeNormName) || initiativeNormName.includes(dbNormName))) {
                    linkedDbs.add(db.id);
                }
            });
        }
        
        // Only update if there are changes
        if (linkedDbs.size > (initiative.lien_ket_csdl?.length || 0)) {
            return {
                ...initiative,
                lien_ket_csdl: Array.from(linkedDbs)
            };
        }
        return initiative;
    });

    setInitiatives(updatedInitiatives);
    setIsDataReconciled(true); // Set flag to prevent re-running

}, [isFetching, initiatives, allDatabases, isDataReconciled]);

  const filterOptions = useMemo(() => {
    const departments = [...new Set(initiatives.map(item => item.ban_chu_tri).filter(Boolean))].sort();
    const statuses = [...new Set(initiatives.map(item => item.giai_doan).filter(Boolean))].sort();
    const classifications = [...new Set(initiatives.map(item => item.phan_loai).filter(Boolean))].sort();
    return { departments, statuses, classifications };
  }, [initiatives]);

  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(item => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = (
        (item.ten_ngan_gon || '').toLowerCase().includes(lowerSearchTerm) ||
        (item.ten_chinh_thuc || '').toLowerCase().includes(lowerSearchTerm) ||
        (item.mo_ta || '').toLowerCase().includes(lowerSearchTerm)
      );
      const matchesDept = !selectedDept || item.ban_chu_tri === selectedDept;
      const matchesStatus = !selectedStatus || item.giai_doan === selectedStatus;
      const matchesClassification = !selectedClassification || item.phan_loai === selectedClassification;

      return matchesSearch && matchesDept && matchesStatus && matchesClassification;
    });
  }, [searchTerm, selectedDept, selectedStatus, selectedClassification, initiatives]);
  
  const stats = useMemo(() => {
    const data = filteredInitiatives;
    const total = data.length;
    const departments = [...new Set(data.map(item => item.ban_chu_tri).filter(Boolean))].length;
    const deployed = data.filter(item => item.giai_doan === 'Đã đưa vào sử dụng').length;
    const inProgress = data.filter(item => ['Đang triển khai', 'Đang phát triển'].includes(item.giai_doan)).length;
    return { total, departments, deployed, inProgress };
  }, [filteredInitiatives]);

  const handleSave = useCallback(async (product: Product, file: File | null) => {
    setIsLoading(true);
    setStatusMessage('Đang xử lý...');
    setIsError(false);

    try {
        let fileUrl: string | null = editingInitiative ? editingInitiative.file_url || null : null;
      
        if (file) {
            setStatusMessage('Đang tải tệp lên SharePoint...');
            fileUrl = await uploadFileToSharePoint(file);
        }

        const productDataForDb = {
            ten_chinh_thuc: product.tieuDe,
            ten_ngan_gon: product.tenNgan,
            ban_chu_tri: product.banChuTri,
            giai_doan: product.giaiDoan,
            phan_loai: product.phanLoai,
            cong_nghe: product.congNghe,
            link_truy_cap: product.lienKet,
            mo_ta: product.moTa,
            file_url: fileUrl,
            lien_ket_csdl: product.lien_ket_csdl,
        };
        
        if (editingInitiative) {
            setStatusMessage('Đang cập nhật thông tin sản phẩm...');
            const { error: updateError, count } = await supabase
                .from('Catalog_data')
                .update(productDataForDb)
                .eq('ten_chinh_thuc', editingInitiative.ten_chinh_thuc);
            
            if (updateError) throw new Error(`Lỗi cập nhật dữ liệu: ${updateError.message}`);
            if (count === 0) throw new Error('Cập nhật thất bại. Không có sản phẩm nào được cập nhật. Nguyên nhân có thể là do bạn không có quyền (chính sách RLS) hoặc sản phẩm không tồn tại.');

            setStatusMessage('Cập nhật sản phẩm thành công! Đang làm mới...');
        } else {
            setStatusMessage('Đang lưu thông tin sản phẩm...');
            const dataToInsert = { ...productDataForDb, created_by_email: session.user.email };
            const { error: insertError } = await supabase.from('Catalog_data').insert([dataToInsert]);
            if (insertError) throw new Error(`Lỗi lưu dữ liệu: ${insertError.message}`);
            setStatusMessage('Thêm sản phẩm thành công! Đang làm mới...');
        }

        setIsError(false);
        closeModal();
        await fetchInitiatives();
        setIsDataReconciled(false); // Allow reconciliation to run again after saving
        setTimeout(() => setStatusMessage(''), 3000);

    } catch (error) {
      console.error('Lỗi khi lưu sản phẩm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Vui lòng kiểm tra console.';
      setStatusMessage(`Lưu sản phẩm thất bại: ${errorMessage}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [editingInitiative, fetchInitiatives, session.user.email]);

  const handleDelete = useCallback(async (initiativeName: string) => {
    const initiativeToDelete = initiatives.find(i => i.ten_chinh_thuc === initiativeName);
    if (!initiativeToDelete) {
      setStatusMessage('Lỗi: Không tìm thấy sản phẩm để xóa.');
      setIsError(true);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${initiativeToDelete.ten_ngan_gon || initiativeToDelete.ten_chinh_thuc}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setIsLoading(true);
    setStatusMessage('Đang xóa sản phẩm...');
    setIsError(false);

    try {
      const { error: deleteError, count } = await supabase
        .from('Catalog_data')
        .delete()
        .eq('ten_chinh_thuc', initiativeName);

      if (deleteError) throw new Error(`Lỗi khi xóa: ${deleteError.message}`);
      if (count === 0) throw new Error('Xóa thất bại. Không có sản phẩm nào bị xóa. Nguyên nhân có thể là do bạn không có quyền (chính sách RLS) hoặc sản phẩm không tồn tại.');

      setStatusMessage('Xóa sản phẩm thành công! Đang làm mới...');
      setIsError(false);
      await fetchInitiatives();
      setIsDataReconciled(false); // Allow reconciliation to run again after deleting
      setTimeout(() => setStatusMessage(''), 3000);

    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Vui lòng kiểm tra console.';
      setStatusMessage(`Xóa sản phẩm thất bại: ${errorMessage}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [initiatives, fetchInitiatives]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              <h1 className="text-xl font-bold text-gray-800">Hệ thống quản lý ứng dụng số PetroVietnam</h1>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 hidden sm:block">
                  Xin chào, <span className="font-semibold">{session.user.email}</span>
                </span>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg text-sm hover:bg-red-600 transition"
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={<RocketIcon />} value={stats.total} label="Tổng số sáng kiến" color="blue" />
          <StatCard icon={<BuildingIcon />} value={stats.departments} label="Số ban tham gia" color="indigo" />
          <StatCard icon={<CheckIcon />} value={stats.deployed} label="Đã đưa vào sử dụng" color="green" />
          <StatCard icon={<WrenchIcon />} value={stats.inProgress} label="Đang triển khai" color="yellow" />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md col-span-1 lg:col-span-1 h-80 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Phân loại Sáng kiến</h3>
                <div className="flex-grow relative">{!isFetching && <ClassificationChart initiatives={filteredInitiatives} />}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md col-span-1 lg:col-span-1 h-80 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Trạng thái Triển khai</h3>
                <div className="flex-grow relative">{!isFetching && <StatusChart initiatives={filteredInitiatives} />}</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md col-span-1 lg:col-span-1 h-80 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sáng kiến theo Ban</h3>
                <div className="flex-grow relative">{!isFetching && <DepartmentChart initiatives={filteredInitiatives} />}</div>
            </div>
        </div>
        
        {/* Filters and Actions */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2 lg:col-span-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                    <input type="text" id="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nhập tên, mô tả..." className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                </div>
                 <div>
                    <label htmlFor="dept" className="block text-sm font-medium text-gray-700 mb-1">Ban chủ trì</label>
                    <select id="dept" value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Tất cả</option>
                        {filterOptions.departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select id="status" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="">Tất cả</option>
                        {filterOptions.statuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                <div className="lg:col-span-1">
                    <button onClick={openModal} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out">
                        Thêm sản phẩm
                    </button>
                </div>
            </div>
        </div>
        
        {/* Loading/Error/Empty State */}
        {isFetching ? (
            <div className="text-center p-10 bg-white rounded-xl shadow-md">
                <p className="text-gray-600 font-semibold">{statusMessage || "Đang tải danh sách sản phẩm..."}</p>
            </div>
        ) : isError ? (
            <div className="text-center p-10 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-md">
                <p className="font-bold">Đã xảy ra lỗi</p>
                <p>{statusMessage}</p>
                <button onClick={fetchInitiatives} className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Thử lại</button>
            </div>
        ) : filteredInitiatives.length === 0 ? (
           <div className="text-center p-10 bg-white rounded-xl shadow-md">
             <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có sản phẩm nào</h3>
             <p className="text-gray-500 max-w-2xl mx-auto">Hiện không có sản phẩm nào trong danh mục hoặc không có quyền xem. Vui lòng kiểm tra lại chính sách RLS trên Supabase hoặc nhấn 'Thêm sản phẩm' để bắt đầu.</p>
           </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInitiatives.map((item) => (
                    <InitiativeCard 
                        key={item.ten_chinh_thuc} 
                        initiative={item} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        onViewDatabases={handleViewDatabases}
                        currentUserEmail={session.user.email!}
                    />
                ))}
            </div>
        )}
      </main>

      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        isLoading={isLoading}
        initiativeToEdit={editingInitiative}
        allDatabases={allDatabases}
      />
      
      <DatabaseDetailModal
        isOpen={!!selectedInitiativeForDbView}
        onClose={closeDbModal}
        initiative={selectedInitiativeForDbView}
      />

       {/* Status Snackbar */}
        {statusMessage && !isFetching && (
            <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-lg text-white ${isError ? 'bg-red-500' : 'bg-green-500'}`}>
                {statusMessage}
            </div>
        )}
    </div>
  );
};

export default Dashboard;