// types/index.ts

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  year: string;
  color: string;
  rate: number;
  status: "Tersedia" | "Disewa" | "Maintenance";
  odometer: string;
  fuel: string;
  transmission: string;
  created_at?: string;
}

export type UserPageId =
  | "home"
  | "booking"
  | "riwayat"
  | "profil";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  id_type: string;
  id_number: string;
  ktp_photo_url?: string | null; // ← foto KTP di Supabase Storage
  total_rent?: number;
  join_date?: string;
  status?: string;
  created_at?: string;
}

export interface Rental {
  id: string;
  customer_id: string;
  customer_name: string;
  vehicle_id: string;
  vehicle_name: string;
  plate: string;
  start_date: string;
  end_date: string;
  days: number;
  rate: number;
  total_cost: number;
  status: "Aktif" | "Selesai" | "Pending" | "Dibatalkan";
  payment_status: "Lunas" | "DP" | "Belum Bayar" | "Menunggu Verifikasi";
  payment_method?: string;
  payment_proof_url?: string;
  payment_proof_filename?: string;
  notes?: string;
  created_at?: string;
}

export interface Return {
  id: string;
  rental_id: string;
  customer_name: string;
  vehicle_name: string;
  vehicle_id: string;
  return_date: string;
  due_date: string;
  late_days: number;
  late_fee: number;
  condition: string;
  status: "Selesai" | "Diproses";
  created_at?: string;
}

export interface Payment {
  id: string;
  rental_id: string;
  customer_name: string;
  amount: number;
  method: string;
  date: string;
  status: "Lunas" | "DP" | "Belum Bayar";
  created_at?: string;
}



export type PageId =
  | "dashboard"
  | "armada"
  | "penyewaan"
  | "pengembalian"
  | "pelanggan"
  | "pembayaran"
  | "laporan"
  | "pengaturan"
  |  "portal"
  |  "home";
