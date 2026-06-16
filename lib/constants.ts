// ─── Design Tokens ────────────────────────────────────────────
export const BRAND = "Walid Rent Car Aceh";
export const BRAND_SHORT = "Walid Rent Car";

export const ACCENT = "#F59E0B";
export const ACCENT_DARK = "#D97706";
export const ACCENT_LIGHT = "#FEF3C7";
export const SIDEBAR_BG = "#0f1724";
export const SIDEBAR_HOVER = "#1a2540";
export const SIDEBAR_ACTIVE_BG = "rgba(245,158,11,0.15)";
export const PAGE_BG = "#0d1117";
export const CARD_BG = "#131c2e";
export const CARD_BORDER = "rgba(255,255,255,0.07)";
export const TOPBAR_BG = "#0f1724";
export const TEXT_PRIMARY = "#f1f5f9";
export const TEXT_MUTED = "#64748b";
export const TEXT_SOFT = "#94a3b8";

// ─── Shared Styles ─────────────────────────────────────────────
export const lStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: TEXT_MUTED,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  marginBottom: 6,
};

export const iStyle: React.CSSProperties = {
  width: "100%",
  background: "#0f1724",
  border: `0.5px solid rgba(255,255,255,0.1)`,
  borderRadius: 8,
  padding: "9px 12px",
  color: TEXT_PRIMARY,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  marginBottom: 0,
};

// ─── Mock Data ─────────────────────────────────────────────────
import type { Notification } from "../types/types";

export const MOCK_NOTIFS: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Booking Dikonfirmasi",
    message: "Booking Toyota Avanza 10–13 Apr telah dikonfirmasi admin.",
    time: "2 jam lalu",
    read: false,
  },
  {
    id: "2",
    type: "warning",
    title: "Pembayaran Jatuh Tempo",
    message: "Tagihan sewa Honda Jazz Rp 900.000 jatuh tempo besok.",
    time: "5 jam lalu",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Kendaraan Tersedia",
    message: "Mitsubishi Pajero kini tersedia. Booking sekarang!",
    time: "1 hari lalu",
    read: true,
  },
  {
    id: "4",
    type: "success",
    title: "Pembayaran Diterima",
    message: "Pembayaran Rp 1.400.000 untuk Toyota Avanza berhasil.",
    time: "3 hari lalu",
    read: true,
  },
];

export const FAQS = [
  {
    q: "Bagaimana cara melakukan booking kendaraan?",
    a: "Pilih menu Booking, pilih kendaraan yang tersedia, tentukan tanggal mulai dan selesai, lalu klik Konfirmasi Booking. Admin akan memverifikasi dalam 1×24 jam.",
  },
  {
    q: "Apa saja metode pembayaran yang tersedia?",
    a: "Kami menerima Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS, dan tunai di kantor kami.",
  },
  {
    q: "Bagaimana kebijakan pembatalan booking?",
    a: "Pembatalan lebih dari 24 jam sebelum tanggal mulai sewa: pengembalian 100%. Kurang dari 24 jam: pengembalian 50%. Hari H: tidak ada pengembalian.",
  },
  {
    q: "Apakah tersedia layanan antar-jemput?",
    a: "Ya, tersedia layanan antar-jemput dalam radius 20 km dari kantor kami. Biaya tambahan Rp 50.000–150.000 tergantung jarak.",
  },
  {
    q: "Dokumen apa yang diperlukan untuk sewa?",
    a: "KTP asli, SIM A yang masih berlaku, dan deposit (tergantung jenis kendaraan). Untuk perusahaan diperlukan NPWP dan surat kuasa.",
  },
  {
    q: "Bagaimana jika kendaraan mengalami kerusakan?",
    a: "Segera hubungi kami di 0821-xxxx-xxxx. Kerusakan akibat kelalaian penyewa menjadi tanggung jawab penyewa. Kami menyediakan asuransi opsional.",
  },
];
