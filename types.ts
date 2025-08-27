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
}

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product, file: File | null) => Promise<void>;
  isLoading: boolean;
  initiativeToEdit?: Initiative | null;
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
}