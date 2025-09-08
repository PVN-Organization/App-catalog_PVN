import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Product, Initiative, Database } from '../types';
import { supabase } from '../lib/supabaseClient';
import { databaseSupabase } from '../lib/databaseSupabaseClient'; 
import { uploadFileToSharePoint } from '../lib/sharepoint';
import type { Session, SupabaseClient } from '@supabase/js';

import ProductModal from './ProductModal';
import DatabaseDetailModal from './DatabaseDetailModal';
import ProductDetailModal from './ProductDetailModal';
import AdminDashboard from './AdminDashboard';
import StatCard from './StatCard';
import InitiativeCard from './InitiativeCard';
import StatusChart from './charts/StatusChart';
import ClassificationChart from './charts/ClassificationChart';
import DepartmentChart from './charts/DepartmentChart';

import RocketIcon from './icons/RocketIcon';
import CheckIcon from './icons/CheckIcon';
import WrenchIcon from './icons/WrenchIcon';
import BuildingIcon from './icons/BuildingIcon';
import { ShieldCheckIcon } from './icons/AdminIcons';

interface DashboardProps {
  session: Session;
}

// Helper function to log user actions
const logAction = async (
  supabaseClient: SupabaseClient,
  userEmail: string | undefined,
  action: string,
  details: Record<string, any> = {}
) => {
  if (!userEmail) return;

  const { error } = await supabaseClient.from('logs').insert({
    level: 'INFO',
    source: 'UserInteraction',
    message: `User '${userEmail}' performed action: ${action}.`,
    metadata: {
      userEmail,
      action,
      ...details
    }
  });
  if (error) {
    console.error(`Failed to log action "${action}":`, error);
  }
};

interface CatalogViewProps {
  stats: { total: number; departments: number; deployed: number; inProgress: number };
  isFetching: boolean;
  statusMessage: string;
  isError: boolean;
  filteredInitiatives: Initiative[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  filterOptions: { departments: string[]; statuses: string[]; classifications: string[] };
  openModal: () => void;
  fetchInitiatives: () => Promise<void>;
  handleEdit: (initiative: Initiative) => void;
  handleDelete: (name: string) => Promise<void>;
  handleViewDatabases: (initiative: Initiative) => void;
  handleAccessInitiative: (initiative: Initiative) => void;
  handleDoubleClick: (initiative: Initiative) => void;
  isSuperAdmin: boolean;
  currentUserEmail: string;
}

const CatalogView: React.FC<CatalogViewProps> = ({
  stats, isFetching, statusMessage, isError, filteredInitiatives,
  searchTerm, setSearchTerm, selectedDept, setSelectedDept,
  selectedStatus, setSelectedStatus, sortOption, setSortOption,
  filterOptions, openModal, fetchInitiatives, handleEdit, handleDelete,
  handleViewDatabases, handleAccessInitiative, handleDoubleClick, currentUserEmail, isSuperAdmin,
}) => (
    <>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <div className="lg:col-span-2">
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
                <div>
                    <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp theo</label>
                    <select id="sort" value={sortOption} onChange={e => setSortOption(e.target.value)} className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="name-asc">Tên (A-Z)</option>
                        <option value="name-desc">Tên (Z-A)</option>
                        <option value="dept-asc">Ban chủ trì (A-Z)</option>
                        <option value="status-asc">Trạng thái (A-Z)</option>
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
                <p className="whitespace-pre-wrap">{statusMessage}</p>
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
                        onAccess={handleAccessInitiative}
                        onDoubleClick={handleDoubleClick}
                        currentUserEmail={currentUserEmail}
                        isSuperAdmin={isSuperAdmin}
                    />
                ))}
            </div>
        )}
    </>
);


const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [allDatabases, setAllDatabases] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  const [detailModalInitiative, setDetailModalInitiative] = useState<Initiative | null>(null);
  const [selectedInitiativeForDbView, setSelectedInitiativeForDbView] = useState<Initiative | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('catalog');

  const parsePostgresArray = (arrayString: unknown): string[] => {
      if (Array.isArray(arrayString)) {
          return arrayString.filter(l => typeof l === 'string');
      }
      if (typeof arrayString !== 'string') {
        return [];
      }
      // First, try to parse as JSON, which is the robust format.
      if (arrayString.startsWith('[') && arrayString.endsWith(']')) {
          try {
              const parsed = JSON.parse(arrayString);
              if (Array.isArray(parsed)) {
                  return parsed.filter(l => typeof l === 'string');
              }
          } catch (e) {
              // Not valid JSON, fall through to legacy format.
          }
      }
      
      // Fallback for legacy PostgreSQL array string format '{...}'
      if (arrayString.startsWith('{') && arrayString.endsWith('}')) {
          const cleaned = arrayString.slice(1, -1);
          if (cleaned === '') return [];

          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < cleaned.length; i++) {
              const char = cleaned[i];
              if (char === '"') {
                  inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                  result.push(current.trim());
                  current = '';
              } else {
                  current += char;
              }
          }
          result.push(current.trim());
          return result.filter(Boolean);
      }
      
      return [];
  };
  
  const checkAdminStatus = useCallback(async (userEmail: string) => {
    if (userEmail === 'vpi.sonnt@pvn.vn') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        return;
    }
    try {
        const { data, error } = await supabase
            .from('admins')
            .select('email')
            .eq('email', userEmail)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error('Error checking admin status:', error);
        }
        setIsAdmin(!!data);
        setIsSuperAdmin(false);
    } catch(err) {
        console.error('Failed to query admins table:', err);
        setIsAdmin(false);
        setIsSuperAdmin(false);
    }
  }, []);


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
      logAction(supabase, session.user.email, 'VIEW_DATABASES', { initiativeName: initiative.ten_chinh_thuc });
  };

  const handleShowDetails = (initiative: Initiative) => {
    setDetailModalInitiative(initiative);
  };

  const closeDetailModal = () => {
    setDetailModalInitiative(null);
  };
  
  const handleAccessInitiative = (initiative: Initiative) => {
      logAction(supabase, session.user.email, 'ACCESS_INITIATIVE', {
          initiativeName: initiative.ten_chinh_thuc,
          url: initiative.link_truy_cap,
      });
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
                file_urls: parsePostgresArray(item.file_urls),
                created_by_email: item.created_by_email || '',
                lien_ket_csdl: item.lien_ket_csdl === null ? undefined : parsePostgresArray(item.lien_ket_csdl),
                nhan_su_dau_moi: item.nhan_su_dau_moi || '',
                nhan_su_phu_trach: item.nhan_su_phu_trach || '',
            }));
            
            const uniqueInitiatives = Array.from(new Map(mappedData.map(item => [item.ten_chinh_thuc, item])).values())
                .filter(item => item.ten_chinh_thuc);
            
            setInitiatives(uniqueInitiatives);
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
                throw error;
            }

            if (data) {
                setAllDatabases(data.map(db => db.ten_csdl).sort());
            }
        } catch (error) {
            console.error('Failed to fetch database list.', error);
        }
    }, []);

  useEffect(() => {
    fetchInitiatives();
    fetchAllDatabases();
    if (session.user.email) {
        checkAdminStatus(session.user.email);
        logAction(supabase, session.user.email, 'DASHBOARD_VIEW');
    }
  }, [fetchInitiatives, fetchAllDatabases, checkAdminStatus, session.user.email]);
  
  useEffect(() => {
    if (isFetching || initiatives.length === 0 || allDatabases.length === 0) {
        return;
    }

    const normalize = (str: string): string => {
        if (!str) return '';
        return str
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
            .toLowerCase()
            .replace(/cơ sở dữ liệu|csdl|hệ thống|ứng dụng|pvn|quản lý/g, '')
            .replace(/sổ tay/g, 'sotay') 
            .replace(/\s+/g, ' ').trim();
    };
    
    let hasChanges = false;
    const reconciledInitiatives = initiatives.map(initiative => {
        if (initiative.lien_ket_csdl === undefined) {
            hasChanges = true;
            const linkedDbs = new Set<string>();
            const initiativeNormName = normalize(initiative.ten_ngan_gon || initiative.ten_chinh_thuc);
            
            if (initiativeNormName) {
                allDatabases.forEach(dbName => {
                    const dbNormName = normalize(dbName);
                    if (dbNormName && (dbNormName.includes(initiativeNormName) || initiativeNormName.includes(dbNormName))) {
                        linkedDbs.add(dbName);
                    }
                });
            }
            
            return {
                ...initiative,
                lien_ket_csdl: Array.from(linkedDbs)
            };
        }
        
        return {
            ...initiative,
            lien_ket_csdl: initiative.lien_ket_csdl || []
        };
    });
    
    if(hasChanges) {
        setInitiatives(reconciledInitiatives);
    }
  }, [isFetching, allDatabases, initiatives]);

  const filterOptions = useMemo(() => {
    const departments = [...new Set(initiatives.map(item => item.ban_chu_tri).filter(Boolean))].sort();
    const statuses = [...new Set(initiatives.map(item => item.giai_doan).filter(Boolean))].sort();
    const classifications = [...new Set(initiatives.map(item => item.phan_loai).filter(Boolean))].sort();
    return { departments, statuses, classifications };
  }, [initiatives]);
  
  const filteredInitiatives = useMemo(() => {
    return initiatives
        .filter(item => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                item.ten_chinh_thuc.toLowerCase().includes(searchTermLower) ||
                item.ten_ngan_gon.toLowerCase().includes(searchTermLower) ||
                item.mo_ta.toLowerCase().includes(searchTermLower);

            const matchesDept = selectedDept === '' || item.ban_chu_tri === selectedDept;
            const matchesStatus = selectedStatus === '' || item.giai_doan === selectedStatus;

            return matchesSearch && matchesDept && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortOption) {
                case 'name-desc':
                    return b.ten_ngan_gon.localeCompare(a.ten_ngan_gon);
                case 'dept-asc':
                    return a.ban_chu_tri.localeCompare(b.ban_chu_tri);
                case 'status-asc':
                    return a.giai_doan.localeCompare(b.giai_doan);
                case 'name-asc':
                default:
                    return a.ten_ngan_gon.localeCompare(b.ten_ngan_gon);
            }
        });
    }, [initiatives, searchTerm, selectedDept, selectedStatus, sortOption]);

    const stats = useMemo(() => ({
        total: initiatives.length,
        departments: new Set(initiatives.map(i => i.ban_chu_tri).filter(Boolean)).size,
        deployed: initiatives.filter(i => i.giai_doan === 'Đã đưa vào sử dụng').length,
        inProgress: initiatives.filter(i => i.giai_doan === 'Đang triển khai').length,
    }), [initiatives]);

   const handleSubmit = async (product: Product, files: File[]) => {
        setIsLoading(true);
        setStatusMessage(editingInitiative ? 'Đang cập nhật sản phẩm...' : 'Đang thêm sản phẩm...');
        setIsError(false);

        try {
            const newFileUrls: string[] = [];
            const uploadErrors: { fileName: string; reason: string }[] = [];
            
            if (files.length > 0) {
                // Tải lên tuần tự
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    setStatusMessage(`Đang tải tệp ${i + 1}/${files.length}: ${file.name}...`);
                    try {
                        const url = await uploadFileToSharePoint(file);
                        newFileUrls.push(url);
                        // Thêm một khoảng chờ ngắn để tránh rate-limiting
                        if (i < files.length - 1) {
                           await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (error) {
                        const reason = error instanceof Error ? error.message : 'Lỗi không rõ';
                        uploadErrors.push({ fileName: file.name, reason });
                    }
                }
            }

            if (uploadErrors.length > 0) {
                const errorDetails = uploadErrors.map(err => `  - Tệp "${err.fileName}": ${err.reason}`).join('\n');
                throw new Error(`Không thể tải lên ${uploadErrors.length}/${files.length} tệp do lỗi sau:\n${errorDetails}`);
            }

            const existingFileUrls = editingInitiative?.file_urls || [];
            const allFileUrls = [...existingFileUrls, ...newFileUrls];

            const productData = {
                ten_chinh_thuc: product.tieuDe,
                ten_ngan_gon: product.tenNgan,
                mo_ta: product.moTa,
                phan_loai: product.phanLoai,
                cong_nghe: product.congNghe,
                giai_doan: product.giaiDoan,
                link_truy_cap: product.lienKet,
                ban_chu_tri: product.banChuTri,
                file_urls: allFileUrls,
                lien_ket_csdl: product.lien_ket_csdl,
                nhan_su_dau_moi: product.nhanSuDauMoi,
                nhan_su_phu_trach: product.nhanSuPhuTrach,
                created_by_email: editingInitiative?.created_by_email || session.user.email,
            };

            let result;
            if (editingInitiative) {
                setStatusMessage('Đang lưu thay đổi vào cơ sở dữ liệu...');
                result = await supabase
                    .from('Catalog_data')
                    .update(productData)
                    .eq('ten_chinh_thuc', editingInitiative.ten_chinh_thuc);
            } else {
                setStatusMessage('Đang lưu sản phẩm mới vào cơ sở dữ liệu...');
                result = await supabase
                    .from('Catalog_data')
                    .insert([productData]);
            }

            if (result.error) {
                throw result.error;
            }

            setStatusMessage(editingInitiative ? 'Sản phẩm đã được cập nhật thành công!' : 'Sản phẩm đã được thêm thành công!');
            await fetchInitiatives();
            closeModal();
            
            const action = editingInitiative ? 'EDIT_INITIATIVE' : 'ADD_INITIATIVE';
            logAction(supabase, session.user.email, action, { initiativeName: product.tieuDe });

        } catch (error: any) {
            setStatusMessage(`Lỗi: ${error.message}`);
            setIsError(true);
            console.error('Error submitting product:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (initiativeName: string) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${initiativeName}" không?`)) {
            setIsLoading(true);
            setStatusMessage('Đang xóa sản phẩm...');
            
            const { error } = await supabase
                .from('Catalog_data')
                .delete()
                .eq('ten_chinh_thuc', initiativeName);

            if (error) {
                alert(`Lỗi khi xóa: ${error.message}`);
                setStatusMessage(`Lỗi khi xóa: ${error.message}`);
            } else {
                setStatusMessage('Sản phẩm đã được xóa.');
                logAction(supabase, session.user.email, 'DELETE_INITIATIVE', { initiativeName });
                await fetchInitiatives();
            }
            setIsLoading(false);
        }
    };

    const currentUserEmail = session.user.email || 'unknown@pvn.vn';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="https://i.ibb.co/nMdwMV4S/pvn-log.png" alt="Logo PVN" className="h-10" />
              <h1 className="text-xl font-bold text-pvn-blue">Hệ thống quản lý ứng dụng số</h1>
            </div>
            {isAdmin && (
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setCurrentView('catalog')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${currentView === 'catalog' ? 'bg-white text-pvn-blue shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                        Catalog
                    </button>
                    <button onClick={() => setCurrentView('admin')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${currentView === 'admin' ? 'bg-white text-pvn-blue shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                        Admin
                    </button>
                </div>
            )}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{session.user.user_metadata.full_name || session.user.email}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {currentView === 'catalog' ? (
             <CatalogView
                stats={stats}
                isFetching={isFetching}
                statusMessage={statusMessage}
                isError={isError}
                filteredInitiatives={filteredInitiatives}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedDept={selectedDept}
                setSelectedDept={setSelectedDept}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                sortOption={sortOption}
                setSortOption={setSortOption}
                filterOptions={filterOptions}
                openModal={openModal}
                fetchInitiatives={fetchInitiatives}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleViewDatabases={handleViewDatabases}
                handleAccessInitiative={handleAccessInitiative}
                handleDoubleClick={handleShowDetails}
                currentUserEmail={currentUserEmail}
                isSuperAdmin={isSuperAdmin}
            />
        ) : currentView === 'admin' && isAdmin ? (
          <AdminDashboard session={session} />
        ) : (
          <div className="text-center p-8">
            <p>Redirecting...</p>
          </div>
        )}
      </main>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSubmit={handleSubmit} 
        isLoading={isLoading}
        initiativeToEdit={editingInitiative}
        allDatabases={allDatabases}
      />
      <DatabaseDetailModal 
        isOpen={!!selectedInitiativeForDbView} 
        onClose={closeDbModal} 
        initiative={selectedInitiativeForDbView} 
      />
       <ProductDetailModal
        isOpen={!!detailModalInitiative}
        onClose={closeDetailModal}
        initiative={detailModalInitiative}
      />
    </div>
  );
};

export default Dashboard;