"use client";
import { useRef } from "react";
import type { Rental, Vehicle } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
} from "@/lib/constants";
import { fmt, fmtDate } from "@/lib/utils";
import { Icons } from "../components/icons";

interface Props {
  rental: Rental;
  vehicle: Vehicle | { name: string; photo_url?: string };
  onClose: () => void;
}

export default function ReceiptModal({ rental, vehicle, onClose }: Props) {

  const handleDownloadPDF = async () => {
    // Dynamically import jsPDF (add to package.json: "jspdf": "^2.5.1")
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200], // thermal receipt width
    });

    const W = 80;
    let y = 10;

    const line = (style: "dash" | "solid" = "dash") => {
      if (style === "solid") {
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(0.4);
      } else {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([1, 1], 0);
      }
      doc.line(5, y, W - 5, y);
      doc.setLineDashPattern([], 0);
      y += 4;
    };

    const sectionTitle = (text: string) => {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont("courier", "bold");
      doc.text(text.toUpperCase(), 5, y);
      y += 4;
    };

    const row = (label: string, value: string) => {
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(label, 5, y);
      doc.setFont("courier", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text(value, W - 5, y, { align: "right" });
      y += 5;
    };

    // ── Header ──────────────────────────────
    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("RENTAL MOBIL", W / 2, y, { align: "center" });
    y += 5;

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text("Jl. Contoh No. 123, Batam", W / 2, y, { align: "center" });
    y += 4;
    doc.text("(0778) 000-000", W / 2, y, { align: "center" });
    y += 6;

    line("solid");

    // ── Informasi Sewa ──────────────────────
    sectionTitle("Informasi Sewa");
    row("No. Rental", `#${rental.id?.toString().slice(0, 8).toUpperCase() ?? "—"}`);
    row("Tgl. Cetak", new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }));
    y += 1;
    line();

    // ── Kendaraan ───────────────────────────
    sectionTitle("Detail Kendaraan");
    row("Kendaraan", rental.vehicle_name);
    row("Plat Nomor", rental.plate);
    y += 1;
    line();

    // ── Periode ─────────────────────────────
    sectionTitle("Periode Sewa");
    row("Ambil", fmtDate(rental.start_date));
    row("Kembali", fmtDate(rental.end_date));
    row("Durasi", `${rental.days} hari`);
    y += 1;
    line();

    // ── Rincian Biaya ───────────────────────
    sectionTitle("Rincian Biaya");
    row("Tarif/hari", fmt(rental.rate));
    row("Durasi", `x ${rental.days} hari`);
    y += 1;
    line("solid");

    // ── Total ───────────────────────────────
    doc.setFontSize(11);
    doc.setFont("courier", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("TOTAL", 5, y);
    doc.setTextColor(0, 160, 80);
    doc.text(fmt(rental.total_cost), W - 5, y, { align: "right" });
    y += 6;

    // Status badge
    doc.setFillColor(220, 255, 235);
    doc.setDrawColor(100, 200, 140);
    doc.roundedRect(W / 2 - 14, y - 4, 28, 6, 2, 2, "FD");
    doc.setFontSize(7.5);
    doc.setFont("courier", "bold");
    doc.setTextColor(30, 140, 80);
    doc.text("LUNAS", W / 2, y, { align: "center" });
    y += 8;

    line();

    // ── Footer ──────────────────────────────
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.setTextColor(140, 140, 140);
    doc.text("Tunjukkan struk ini saat", W / 2, y, { align: "center" });
    y += 4;
    doc.text("pengambilan kendaraan.", W / 2, y, { align: "center" });
    y += 4;
    doc.text("Terima kasih telah mempercayai kami!", W / 2, y, { align: "center" });

    // Resize page to content
    doc.internal.pageSize.height = y + 10;

    const filename = `struk-${rental.id?.toString().slice(0, 8).toUpperCase() ?? "rental"}.pdf`;
    doc.save(filename);
  };

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CARD_BG, borderRadius: 18,
          border: `0.5px solid ${CARD_BORDER}`,
          width: "100%", maxWidth: 400,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Success banner */}
        <div style={{ background: "rgba(34,197,94,0.12)", padding: "24px 24px 20px", textAlign: "center", borderBottom: `0.5px solid rgba(34,197,94,0.2)` }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <div style={{ color: "#4ade80" }}>
              <Icons.CheckCircle size={28} />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80", marginBottom: 4 }}>Pembayaran Berhasil!</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>Struk PDF siap diunduh untuk pengambilan kendaraan.</div>
        </div>

        {/* Receipt preview body */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.15em", color: TEXT_PRIMARY, textTransform: "uppercase" }}>RENTAL MOBIL</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Jl. Contoh No. 123, Batam · (0778) 000-000</div>
          </div>

          <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.1)", margin: "12px 0" }} />

          <ReceiptSection title="Informasi Sewa">
            <ReceiptRow label="No. Rental" value={`#${rental.id?.toString().slice(0, 8).toUpperCase() ?? "—"}`} />
            <ReceiptRow label="Tgl. Cetak" value={new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} />
          </ReceiptSection>

          <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.1)", margin: "12px 0" }} />

          <ReceiptSection title="Kendaraan">
            <ReceiptRow label="Nama" value={rental.vehicle_name} />
            <ReceiptRow label="Plat Nomor" value={rental.plate} />
          </ReceiptSection>

          <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.1)", margin: "12px 0" }} />

          <ReceiptSection title="Periode Sewa">
            <ReceiptRow label="Ambil" value={fmtDate(rental.start_date)} />
            <ReceiptRow label="Kembali" value={fmtDate(rental.end_date)} />
            <ReceiptRow label="Durasi" value={`${rental.days} hari`} />
          </ReceiptSection>

          <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.1)", margin: "12px 0" }} />

          <ReceiptSection title="Rincian Biaya">
            <ReceiptRow label="Tarif/hari" value={fmt(rental.rate)} />
            <ReceiptRow label="Durasi" value={`× ${rental.days} hari`} />
          </ReceiptSection>

          <div style={{ borderTop: `1.5px solid rgba(255,255,255,0.18)`, margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>TOTAL</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: ACCENT }}>{fmt(rental.total_cost)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>Status Pembayaran</span>
            <span style={{ fontSize: 11, fontWeight: 800, background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "3px 12px", borderRadius: 20, letterSpacing: "0.05em" }}>
              LUNAS
            </span>
          </div>

          <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.1)", margin: "16px 0 8px" }} />
          <div style={{ textAlign: "center", fontSize: 11, color: TEXT_MUTED, lineHeight: 1.6 }}>
            Tunjukkan struk ini saat pengambilan kendaraan.<br />
            Terima kasih telah mempercayai kami!
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, padding: "0 24px 20px" }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${CARD_BORDER}`,
              background: "transparent", color: TEXT_PRIMARY, fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}
          >
            <Icons.Receipt size={16} />
            Unduh PDF
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
              background: ACCENT, color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────
function ReceiptSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      <span style={{ fontSize: 12, color: TEXT_MUTED }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}