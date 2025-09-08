import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Product, ProductModalProps, Initiative } from '../types';
import FormSection from './FormSection';
import TextInput from './TextInput';

const initialProductState: Product = {
  tieuDe: '',
  tenNgan: '',
  banChuTri: '',
  giaiDoan: '',
  phanLoai: '',
  congNghe: '',
  lienKet: '',
  moTa: '',
  lien_ket_csdl: [],
  nhanSuDauMoi: '',
  nhanSuPhuTrach: '',
};

const mapInitiativeToProduct = (initiative: Initiative): Product => ({
  tieuDe: initiative.ten_chinh_thuc,
  tenNgan: initiative.ten_ngan_gon,
  banChuTri: initiative.ban_chu_tri,
  giaiDoan: initiative.giai_doan,
  phanLoai: initiative.phan_loai,
  congNghe: initiative.cong_nghe,
  lienKet: initiative.link_truy_cap,
  moTa: initiative.mo_ta,
  lien_ket_csdl: initiative.lien_ket_csdl || [],
  nhanSuDauMoi: initiative.nhan_su_dau_moi || '',
  nhanSuPhuTrach: initiative.nhan_su_phu_trach || '',
});


const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, isLoading, initiativeToEdit, allDatabases }) => {
  const [product, setProduct] = useState<Product>(initialProductState);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isEditMode = Boolean(initiativeToEdit);

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && initiativeToEdit) {
            setProduct(mapInitiativeToProduct(initiativeToEdit));
        } else {
            setProduct(initialProductState);
        }
    }
  }, [initiativeToEdit, isEditMode, isOpen]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'select-multiple') {
      const selectedOptions = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
      setProduct(prev => ({ ...prev, [name]: selectedOptions }));
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    } else {
      setFile(null);
    }
  };

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.tieuDe) {
      setError('Tiêu đề là bắt buộc.');
      return;
    }
    
    setError(null);
    await onSubmit(product, file);
  }, [product, file, onSubmit]);

  const handleClose = () => {
    if (isLoading) return;
    setFile(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <FormSection label="Tiêu đề">
                <TextInput name="tieuDe" value={product.tieuDe} onChange={handleChange} />
                </FormSection>
            </div>
            <FormSection label="Tên ngắn">
              <TextInput name="tenNgan" value={product.tenNgan} onChange={handleChange} />
            </FormSection>
             <FormSection label="Ban chủ trì">
              <TextInput name="banChuTri" value={product.banChuTri} onChange={handleChange} />
            </FormSection>
             <FormSection label="Nhân sự đầu mối">
              <TextInput name="nhanSuDauMoi" value={product.nhanSuDauMoi} onChange={handleChange} />
            </FormSection>
             <FormSection label="Nhân sự phụ trách">
              <TextInput name="nhanSuPhuTrach" value={product.nhanSuPhuTrach} onChange={handleChange} />
            </FormSection>
            <FormSection label="Giai đoạn">
              <TextInput name="giaiDoan" value={product.giaiDoan} onChange={handleChange} />
            </FormSection>
             <FormSection label="Phân loại">
              <TextInput name="phanLoai" value={product.phanLoai} onChange={handleChange} />
            </FormSection>
            <FormSection label="Công nghệ">
              <TextInput name="congNghe" value={product.congNghe} onChange={handleChange} />
            </FormSection>
            <FormSection label="Liên kết">
              <TextInput name="lienKet" value={product.lienKet} onChange={handleChange} />
            </FormSection>
            <div className="md:col-span-2">
                <FormSection label="Mô tả">
                <textarea
                    name="moTa"
                    value={product.moTa}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                </FormSection>
            </div>
             <div className="md:col-span-2">
                 <FormSection label="CSDL liên kết (giữ Ctrl/Cmd để chọn nhiều)">
                    <select
                        multiple
                        name="lien_ket_csdl"
                        value={product.lien_ket_csdl}
                        onChange={handleChange}
                        className="block w-full h-32 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        {allDatabases.map(dbName => <option key={dbName} value={dbName}>{dbName}</option>)}
                    </select>
                </FormSection>
            </div>
            <div className="md:col-span-2">
                 <FormSection label="Tệp đính kèm">
                   <input 
                     ref={fileInputRef}
                     type="file" 
                     onChange={handleFileChange}
                     className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {!file && initiativeToEdit?.file_url && (
                    <p className="text-sm text-gray-500 mt-2">
                        Tệp hiện tại: <a href={initiativeToEdit.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{initiativeToEdit.file_url.split(/[\\/]/).pop()}</a>
                    </p>
                  )}
                  {file && <p className="text-sm text-gray-500 mt-2">Tệp mới: {file.name}</p>}
                </FormSection>
            </div>

            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          </div>
          <div className="p-6 bg-gray-50 border-t flex justify-end items-center space-x-3">
            <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (isEditMode ? 'Đang lưu...' : 'Đang thêm...') : (isEditMode ? 'Lưu thay đổi' : 'Thêm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;