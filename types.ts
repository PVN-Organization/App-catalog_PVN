import type React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSectionProps {
  label:string;
  children: React.ReactNode;
}

export interface SelectInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
}

export interface TextInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name: string;
}

export interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export interface Product {
  tieuDe: string;
  tenNgan: string;
  banChuTri: string;
  giaiDoan: string;
  phanLoai: string;
  congNghe: string;
  lienKet: string;
  moTa: string;
  lien_ket_csdl: string[];
  nhanSuDauMoi: string;
  nhanSuPhuTrach: string;
}

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product, file: File | null) => Promise<void>;
  isLoading: boolean;
  initiativeToEdit?: Initiative | null;
  allDatabases: Pick<Database, 'id' | 'name'>[];
}

// New types for Dashboard
export interface Initiative {
  ten_chinh_thuc: string;
  ten_ngan_gon: string;
  mo_ta: string;
  phan_loai: string;
  cong_nghe: string;
  doi_tuong: string;
  giai_doan: string;
  linh_vuc: string;
  link_truy_cap: string;
  ban_chu_tri: string;
  file_url?: string;
  created_by_email?: string;
  lien_ket_csdl?: string[];
  nhan_su_dau_moi?: string;
  nhan_su_phu_trach?: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}

export interface InitiativeCardProps {
  initiative: Initiative;
  onEdit: (initiative: Initiative) => void;
  onDelete: (initiativeName: string) => void;
  onViewDatabases: (initiative: Initiative) => void;
  onAccess: (initiative: Initiative) => void;
  onDoubleClick: (initiative: Initiative) => void;
  currentUserEmail: string;
}

export interface DatabaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: Initiative | null;
}

export interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiative: Initiative | null;
}


// --- Types from Database Management App ---

export enum UserRole {
  VIEWER = 'Viewer',
  DATA_ENTRY = 'Data Entry',
  ADMIN = 'Admin',
}

export enum KeyType {
  NONE = 'None',
  PK = 'PK',
  FK = 'FK',
}

export interface Field {
  id: string;
  name: string;
  description: string;
  source: string;
  storagePeriod: string;
  dataRange: string;
  format: string;
  unit: string;
  keyType: KeyType;
  relationship: string;
}

export interface Table {
  id: string;
  name: string;
  description: string;
  source: string;
  updateFrequency: string;
  fields: Field[];
}

export interface Database {
  id: string;
  name: string;
  description: string;
  domain: string;
  keywords: string[];
  responsibleDept: string;
  createdBy: string;
  creatorEmail: string;
  createdAt?: string;
  updatedAt?: string;
  tables: Table[];
}

// Type for the new Admin log viewer
export interface LogEntry {
  log_id: string;
  occurred_at: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  source: string | null;
  message: string;
  metadata: Record<string, any> | null;
}