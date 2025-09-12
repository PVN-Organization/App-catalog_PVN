import React, { useState, useEffect, useMemo } from 'react';
import { KeyType, type DatabaseDetailModalProps, type Database, type Table, type Field } from '../types';
import { databaseSupabase } from '../lib/databaseSupabaseClient';
import { DatabaseIcon, ChevronDownIcon, ChevronRightIcon } from './icons/DatabaseIcons';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pvn-brand-blue"></div>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="text-center p-4 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-bold">Lỗi</h3>
        <p>{message}</p>
    </div>
);


const TableRow: React.FC<{ table: Table }> = ({ table }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="border border-pvn-gray-200 rounded-lg">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-4 bg-pvn-off-white/80 hover:bg-pvn-gray-100 transition-colors">
                <div className="text-left">
                    <h3 className="font-semibold text-lg text-pvn-blue">{table.name}</h3>
                    <p className="text-sm text-pvn-gray-600">{table.description}</p>
                </div>
                <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
                </div>
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-pvn-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-pvn-gray-100 text-pvn-gray-600 uppercase">
                                <tr>
                                    <th className="p-3">Tên trường</th>
                                    <th className="p-3">Mô tả</th>
                                    <th className="p-3">Định dạng</th>
                                    <th className="p-3">Loại khóa</th>
                                    <th className="p-3">Quan hệ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {table.fields.length > 0 ? table.fields.map(field => (
                                    <tr key={field.id} className="border-b border-pvn-gray-200 hover:bg-pvn-gray-50">
                                        <td className="p-3 font-medium text-pvn-blue">{field.name || '—'}</td>
                                        <td className="p-3">{field.description || '—'}</td>
                                        <td className="p-3">{field.format || '—'}</td>
                                        <td className="p-3">{field.keyType || '—'}</td>
                                        <td className="p-3 font-mono text-xs">{field.relationship || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="p-3 text-center text-gray-500">Bảng này không có trường dữ liệu nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
};


const DatabaseDetailModal: React.FC<DatabaseDetailModalProps> = ({ isOpen, onClose, initiative }) => {
    const [databases, setDatabases] = useState<Database[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDatabaseDetails = async () => {
            if (!initiative || !initiative.lien_ket_csdl || initiative.lien_ket_csdl.length === 0) {
                setDatabases([]);
                return;
            }
            
            setIsLoading(true);
            setError(null);

            try {
                // FIX: Query by 'ten_csdl' as it is the unique identifier stored in the initiative's links.
                const { data, error: dbError } = await databaseSupabase
                    .from('co_so_du_lieu')
                    .select(`
                        *,
                        nguoi_dung(*),
                        thong_tin_bang (
                            *,
                            thong_tin_truong (*)
                        )
                    `)
                    .in('ten_csdl', initiative.lien_ket_csdl);
                
                if (dbError) throw dbError;

                const mappedData: Database[] = (data || []).map((db: any) => ({
                    id: db.ten_csdl, // FIX: Use 'ten_csdl' as the unique ID for consistency.
                    name: db.ten_csdl,
                    description: db.mo_ta,
                    domain: db.linh_vuc?.ten_linh_vuc || db.linh_vuc || 'Không rõ',
                    keywords: db.tu_khoa ? String(db.tu_khoa).split(',').map((k: string) => k.trim()) : [],
                    responsibleDept: db.ban_phu_trach || 'Không rõ',
                    createdBy: db.nguoi_dung?.ten_nguoi_dung || db.nguoi_tao || 'Không rõ',
                    creatorEmail: db.nguoi_dung?.email || db.nguoi_tao || '',
                    createdAt: db.ngay_tao,
                    updatedAt: db.ngay_cap_nhat,
                    tables: (db.thong_tin_bang || []).map((t: any) => ({
                        id: t.ten_bang, name: t.ten_bang, description: t.mo_ta, source: t.nguon, updateFrequency: t.tan_suat_cap_nhat,
                        fields: (t.thong_tin_truong || []).map((f: any) => ({
                            id: f.ten_truong, name: f.ten_truong, description: f.mo_ta, source: f.nguon, storagePeriod: f.thoi_gian_luu_tru,
                            dataRange: f.khoang_du_lieu, format: f.dinh_dang, unit: f.don_vi, keyType: f.loai_khoa || KeyType.NONE, relationship: f.quan_he
                        }))
                    }))
                }));
                setDatabases(mappedData);

            } catch (err: any) {
                console.error("Error fetching database details:", err);
                setError(`Không thể tải chi tiết CSDL: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchDatabaseDetails();
        }

    }, [isOpen, initiative]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-pvn-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-pvn-blue">CSDL liên quan đến "{initiative?.ten_ngan_gon}"</h2>
                        <p className="text-sm text-pvn-gray-600">Thông tin chi tiết từ Hệ thống Quản lý CSDL PVN.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}
                    {!isLoading && !error && databases.length === 0 && (
                        <div className="text-center py-8">
                            <DatabaseIcon className="w-12 h-12 mx-auto text-pvn-gray-300" />
                            <p className="mt-4 text-pvn-gray-600">Không có dữ liệu CSDL để hiển thị.</p>
                        </div>
                    )}
                    {!isLoading && !error && databases.map(db => (
                        <div key={db.id} className="bg-pvn-white p-6 rounded-lg shadow-lg border border-pvn-gray-200">
                             <div className="mb-4">
                                <h1 className="text-3xl font-bold text-pvn-blue">{db.name}</h1>
                                <span className="text-sm font-semibold bg-pvn-brand-blue text-pvn-white px-3 py-1 rounded-full mt-2 inline-block">{db.domain}</span>
                            </div>
                            <p className="text-lg text-pvn-gray-700 mb-6">{db.description}</p>
                            <div className="border-t border-pvn-gray-200 pt-6">
                                <h2 className="text-2xl font-bold text-pvn-blue mb-4">Danh sách bảng ({db.tables.length})</h2>
                                <div className="space-y-4">
                                    {db.tables.length > 0 ? db.tables.map(table => (
                                        <TableRow key={table.id} table={table} />
                                    )) : <p className="text-gray-500">CSDL này không có bảng nào.</p>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="p-4 bg-gray-50 border-t flex justify-end items-center space-x-3 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseDetailModal;