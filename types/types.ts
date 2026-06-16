// ─── Navigation ───────────────────────────────────────────────
export type NavId =
  | "home"
  | "katalog"
  | "booking"
  | "riwayat"
  | "pembayaran"
  | "notifikasi"
  | "profil"
  | "bantuan";

// ─── Domain Models ────────────────────────────────────────────
export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  rate: number;
  status: string;
  transmission?: string;
  year?: number;
  color?: string;
  fuel?: string;
  photo_url?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  id_type: string;       // "KTP" | "SIM" | "Passport"
  id_number: string;     // nomor NIK / nomor SIM / nomor paspor
  nik?: string;          // alias NIK dari booking form
  sim_number?: string;   // nomor SIM dari booking form
  ktp_url?: string | null;
  sim_url?: string | null;
  status?: string;
  total_rent?: number;
  join_date?: string;
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
  status: string;
  payment_status: string;
  notes?: string;
  ktp_url?: string | null;
  sim_url?: string | null;
  created_at?: string;
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface ProfilState {
  name: string;
  phone: string;
  address: string;
  nik: string;
  emergency: string;
}

export interface BookForm {
  start: string;
  end: string;
  notes: string;
  withDriver: boolean;
  pickup: string;
}

export interface Review {
  vehicleName: string;
  rating: number;
  comment: string;
  date: string;
}