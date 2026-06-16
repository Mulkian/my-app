"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Rental, Vehicle } from "types/types";
import {
  ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
} from "@/lib/constants";
import { fmt, fmtDate } from "@/lib/utils";
import { Icons } from "../components/icons";
import { Badge, VehicleImg } from "../components/ui";

interface Props {
  rentals: Rental[];
  vehicles: Vehicle[];
  preselectedRental?: Rental | null;
  onPaymentComplete: (updatedRentals: Rental[]) => void;
  onNotify: (msg: { type: "success"; title: string; message: string }) => void;
}

const PAY_METHODS = [
  { id: "QRIS",  icon: "Wallet", desc: "Scan QR dari e-wallet atau mobile banking" },
  { id: "Tunai", icon: "Receipt", desc: "Bayar langsung di kantor (Senin–Sabtu, 08–17)" },
] as const;

// ─── Receipt Modal ────────────────────────────────────────────
function ReceiptModal({ rental, vehicle, onClose }: {
  rental: Rental;
  vehicle: Vehicle | { name: string; photo_url?: string };
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>Struk – ${rental.vehicle_name}</title>
        <meta charset="utf-8" />
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Courier New',monospace; background:#fff; color:#111; padding:24px; }
          .receipt { max-width:320px; margin:0 auto; }
          .center { text-align:center; }
          h1 { font-size:20px; font-weight:700; letter-spacing:2px; }
          .sub { font-size:11px; color:#666; margin-top:2px; }
          .dash { border:none; border-top:1.5px dashed #bbb; margin:12px 0; }
          .solid { border:none; border-top:1.5px solid #111; margin:12px 0; }
          .section-title { font-size:10px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#888; margin-bottom:6px; }
          .row { display:flex; justify-content:space-between; font-size:12px; margin:5px 0; }
          .row .label { color:#555; }
          .row .value { font-weight:600; }
          .total-row { display:flex; justify-content:space-between; font-size:15px; font-weight:700; margin:6px 0; }
          .badge { display:inline-block; background:#111; color:#fff; font-size:11px; font-weight:700; padding:3px 12px; border-radius:20px; }
          .footer { text-align:center; font-size:11px; color:#888; margin-top:16px; }
        </style>
      </head><body><div class="receipt">
        <div class="center">
          <h1>RENTAL MOBIL</h1>
          <p class="sub">Jl. Contoh No. 123, Batam · (0778) 000-000</p>
        </div>
        <hr class="solid" />
        <p class="section-title">Informasi Sewa</p>
        <div class="row"><span class="label">No. Rental</span><span class="value">#${rental.id?.toString().slice(0,8).toUpperCase() ?? "—"}</span></div>
        <div class="row"><span class="label">Tgl. Cetak</span><span class="value">${new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</span></div>
        <hr class="dash" />
        <p class="section-title">Kendaraan</p>
        <div class="row"><span class="label">Nama</span><span class="value">${rental.vehicle_name}</span></div>
        <div class="row"><span class="label">Plat Nomor</span><span class="value">${rental.plate}</span></div>
        <hr class="dash" />
        <p class="section-title">Periode Sewa</p>
        <div class="row"><span class="label">Ambil</span><span class="value">${fmtDate(rental.start_date)}</span></div>
        <div class="row"><span class="label">Kembali</span><span class="value">${fmtDate(rental.end_date)}</span></div>
        <div class="row"><span class="label">Durasi</span><span class="value">${rental.days} hari</span></div>
        <hr class="dash" />
        <p class="section-title">Rincian Biaya</p>
        <div class="row"><span class="label">Tarif/hari</span><span class="value">${fmt(rental.rate)}</span></div>
        <div class="row"><span class="label">Durasi</span><span class="value">× ${rental.days} hari</span></div>
        <hr class="solid" />
        <div class="total-row"><span>TOTAL</span><span>${fmt(rental.total_cost)}</span></div>
        <div class="row"><span class="label">Status</span><span class="value"><span class="badge">LUNAS</span></span></div>
        <hr class="dash" />
        <div class="footer">
          <p>Tunjukkan struk ini saat pengambilan kendaraan.</p>
          <p style="margin-top:6px">Terima kasih telah mempercayai kami!</p>
        </div>
      </div>
      <script>window.onload=()=>window.print()<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:CARD_BG, borderRadius:18, border:`0.5px solid ${CARD_BORDER}`, width:"100%", maxWidth:400, overflow:"hidden" }}>

        {/* Success banner */}
        <div style={{ background:"rgba(34,197,94,0.12)", padding:"24px 24px 20px", textAlign:"center", borderBottom:"0.5px solid rgba(34,197,94,0.2)" }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(34,197,94,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
           <div style={{ color: "#4ade80" }}>
  <Icons.CheckCircle size={28} />
</div>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:"#4ade80", marginBottom:4 }}>Pembayaran Berhasil!</div>
          <div style={{ fontSize:12, color:TEXT_MUTED }}>Simpan struk ini untuk pengambilan kendaraan.</div>
        </div>

        {/* Receipt body */}
        <div ref={printRef} style={{ padding:"20px 24px" }}>
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:800, letterSpacing:"0.15em", color:TEXT_PRIMARY, textTransform:"uppercase" }}>RENTAL MOBIL</div>
            <div style={{ fontSize:11, color:TEXT_MUTED, marginTop:2 }}>Jl. Contoh No. 123, Batam · (0778) 000-000</div>
          </div>

          <Dash />
          <Section title="Informasi Sewa">
            <Row label="No. Rental" value={`#${rental.id?.toString().slice(0,8).toUpperCase() ?? "—"}`} />
            <Row label="Tgl. Cetak" value={new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })} />
          </Section>

          <Dash />
          <Section title="Kendaraan">
            <Row label="Nama" value={rental.vehicle_name} />
            <Row label="Plat Nomor" value={rental.plate} />
          </Section>

          <Dash />
          <Section title="Periode Sewa">
            <Row label="Ambil" value={fmtDate(rental.start_date)} />
            <Row label="Kembali" value={fmtDate(rental.end_date)} />
            <Row label="Durasi" value={`${rental.days} hari`} />
          </Section>

          <Dash />
          <Section title="Rincian Biaya">
            <Row label="Tarif/hari" value={fmt(rental.rate)} />
            <Row label="Durasi" value={`× ${rental.days} hari`} />
          </Section>

          {/* Total */}
          <div style={{ borderTop:`1.5px solid rgba(255,255,255,0.18)`, margin:"12px 0" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0" }}>
            <span style={{ fontSize:14, fontWeight:800, color:TEXT_PRIMARY }}>TOTAL</span>
            <span style={{ fontSize:18, fontWeight:900, color:ACCENT }}>{fmt(rental.total_cost)}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
            <span style={{ fontSize:12, color:TEXT_MUTED }}>Status Pembayaran</span>
            <span style={{ fontSize:11, fontWeight:800, background:"rgba(34,197,94,0.15)", color:"#4ade80", padding:"3px 12px", borderRadius:20, letterSpacing:"0.05em" }}>LUNAS</span>
          </div>

          <Dash />
          <div style={{ textAlign:"center", fontSize:11, color:TEXT_MUTED, lineHeight:1.6 }}>
            Tunjukkan struk ini saat pengambilan kendaraan.<br />
            Terima kasih telah mempercayai kami!
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10, padding:"0 24px 20px" }}>
          <button onClick={handlePrint} style={{ flex:1, padding:"11px 0", borderRadius:10, border:`1px solid ${CARD_BORDER}`, background:"transparent", color:TEXT_PRIMARY, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <Icons.Receipt size={16} /> Cetak Struk
          </button>
          <button onClick={onClose} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:ACCENT, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────
const Dash = () => <div style={{ borderTop:"1.5px dashed rgba(255,255,255,0.1)", margin:"12px 0" }} />;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:2 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:TEXT_MUTED, marginBottom:6 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
      <span style={{ fontSize:12, color:TEXT_MUTED }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:600, color:TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function PembayaranPage({ rentals, vehicles, preselectedRental, onPaymentComplete, onNotify }: Props) {
  const [selectedRental, setSelectedRental] = useState<Rental | null>(preselectedRental ?? null);
  const [payMethod, setPayMethod] = useState("QRIS");
  const [payLoading, setPayLoading] = useState(false);
  const [receiptRental, setReceiptRental] = useState<Rental | null>(null);

  const unpaid = rentals.filter((r) => r.payment_status === "Belum Bayar");
  const paid   = rentals.filter((r) => r.payment_status === "Lunas");

  const getVehicleByName = (name: string) =>
    vehicles.find((v) => v.name === name) ?? { name, photo_url: undefined };

  const handlePay = async () => {
    if (!selectedRental) return;
    setPayLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const { error } = await supabase.from("rentals").update({ payment_status: "Lunas" }).eq("id", selectedRental.id);
    if (!error) {
      const { data: r } = await supabase.from("rentals").select("*").order("created_at", { ascending: false });
      onPaymentComplete(r ?? []);
      onNotify({ type: "success", title: "Pembayaran Berhasil", message: `Pembayaran ${fmt(selectedRental.total_cost)} untuk ${selectedRental.vehicle_name} berhasil.` });
      setReceiptRental(selectedRental); // ← tampilkan struk
    }
    setPayLoading(false);
  };

  const handleCloseReceipt = () => {
    setReceiptRental(null);
    setSelectedRental(null);
  };

  const MethodIcon = ({ id }: { id: string }) => {
    if (id === "QRIS") return <Icons.Wallet size={18} />;
    if (id === "Tunai") return <Icons.Receipt size={18} />;
    return <Icons.CreditCard size={18} />;
  };

  return (
    <div>
      {receiptRental && (
        <ReceiptModal
          rental={receiptRental}
          vehicle={getVehicleByName(receiptRental.vehicle_name)}
          onClose={handleCloseReceipt}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:TEXT_PRIMARY, marginBottom:4 }}>Pembayaran</h1>
        <p style={{ fontSize:13, color:TEXT_MUTED }}>Kelola tagihan dan riwayat pembayaran</p>
      </div>

      {/* Unpaid bills */}
      {unpaid.length > 0 && (
        <section style={{ marginBottom:22 }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:TEXT_PRIMARY, marginBottom:12 }}>Tagihan Belum Dibayar</h2>
          {unpaid.map((r, i) => (
            <div key={i} style={{ background:CARD_BG, borderRadius:12, border:"0.5px solid rgba(245,158,11,0.25)", padding:"16px 18px", marginBottom:10, display:"flex", gap:14, alignItems:"center" }}>
              <VehicleImg vehicle={getVehicleByName(r.vehicle_name)} style={{ width:60, height:44, objectFit:"cover", borderRadius:8 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:TEXT_PRIMARY, marginBottom:2 }}>{r.vehicle_name}</div>
                <div style={{ fontSize:12, color:TEXT_MUTED }}>{fmtDate(r.start_date)} – {fmtDate(r.end_date)} · {r.days} hari</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:15, fontWeight:800, color:ACCENT, marginBottom:8 }}>{fmt(r.total_cost)}</div>
                <button onClick={() => setSelectedRental(r)} style={{ padding:"7px 16px", borderRadius:8, border:"none", background:ACCENT, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Bayar
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Payment form */}
      {selectedRental && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:18, marginBottom:22 }}>
          <div style={{ background:CARD_BG, borderRadius:14, border:`0.5px solid ${CARD_BORDER}`, padding:22 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:TEXT_PRIMARY, marginBottom:18 }}>Pilih Metode Pembayaran</h2>
            {PAY_METHODS.map((m) => (
              <label key={m.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:10, border:`1.5px solid ${payMethod === m.id ? ACCENT : CARD_BORDER}`, background:payMethod === m.id ? "rgba(245,158,11,0.08)" : "#0f1724", cursor:"pointer", marginBottom:10 }}>
                <input type="radio" name="pay" value={m.id} checked={payMethod === m.id} onChange={() => setPayMethod(m.id)} style={{ accentColor:ACCENT }} />
                <span style={{ display:"flex", color:payMethod === m.id ? ACCENT : TEXT_MUTED }}><MethodIcon id={m.id} /></span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:TEXT_PRIMARY }}>{m.id}</div>
                  <div style={{ fontSize:12, color:TEXT_MUTED }}>{m.desc}</div>
                </div>
              </label>
            ))}
            {/* QR Code QRIS */}
            {payMethod === "QRIS" && selectedRental && (
              <div style={{
                background: "#fff",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 10 }}>
                  Scan QR untuk Membayar
                </div>
                <QRCodeSVG
  value={`QRIS-${selectedRental.id}-${selectedRental.total_cost}`}
  size={200}
  level="H"
  includeMargin={true}
  style={{ margin: "0 auto", display: "block" }}
/>
                <div style={{ fontSize: 11, color: "#888", marginTop: 10, lineHeight: 1.5 }}>
                  Bisa dibayar via GoPay, OVO, Dana,<br />
                  m-BCA, BRImo, dan semua e-wallet QRIS
                </div>
                <div style={{
                  marginTop: 12,
                  background: "#f0fdf4",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "#16a34a",
                  fontWeight: 600,
                }}>
                  Total: {fmt(selectedRental.total_cost)}
                </div>
              </div>
            )}
            <button onClick={handlePay} disabled={payLoading} style={{ width:"100%", padding:13, borderRadius:10, border:"none", background:ACCENT, color:"#fff", fontSize:14, fontWeight:700, cursor:payLoading?"not-allowed":"pointer", fontFamily:"inherit", opacity:payLoading?0.7:1, marginTop:6 }}>
              {payLoading
  ? "Memproses…"
  : payMethod === "QRIS"
  ? "Konfirmasi Sudah Bayar"
  : `Bayar ${fmt(selectedRental.total_cost)}`}
            </button>
          </div>
          <BillSummary rental={selectedRental} vehicle={getVehicleByName(selectedRental.vehicle_name)} />
        </div>
      )}

      {/* Payment history */}
      <div style={{ background:CARD_BG, borderRadius:14, border:`0.5px solid ${CARD_BORDER}`, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`0.5px solid ${CARD_BORDER}` }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:TEXT_PRIMARY }}>Riwayat Pembayaran</h2>
        </div>
        {paid.length === 0 ? (
          <div style={{ padding:"40px 0", textAlign:"center", color:TEXT_MUTED, fontSize:14 }}>Belum ada riwayat pembayaran lunas.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#0f1724" }}>
                  {["Kendaraan","Tanggal","Durasi","Total","Status"].map((h) => (
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:TEXT_MUTED, letterSpacing:"0.07em", textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paid.map((r, i) => (
                  <tr key={i} style={{ borderTop:"0.5px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <VehicleImg vehicle={getVehicleByName(r.vehicle_name)} style={{ width:48, height:36, objectFit:"cover", borderRadius:6 }} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:TEXT_PRIMARY }}>{r.vehicle_name}</div>
                          <div style={{ fontSize:11, color:TEXT_MUTED }}>{r.plate}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px", fontSize:12, color:"#94a3b8" }}>{fmtDate(r.start_date)}</td>
                    <td style={{ padding:"12px 16px", fontSize:13, color:TEXT_PRIMARY }}>{r.days}h</td>
                    <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"#4ade80" }}>{fmt(r.total_cost)}</td>
                    <td style={{ padding:"12px 16px" }}><Badge status="Lunas" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Bill Summary ─────────────────────────────────────────────
function BillSummary({ rental, vehicle }: { rental: Rental; vehicle: any }) {
  return (
    <div style={{ background:CARD_BG, borderRadius:14, border:`0.5px solid ${CARD_BORDER}`, overflow:"hidden", height:"fit-content" }}>
      <div style={{ padding:"14px 18px", borderBottom:`0.5px solid ${CARD_BORDER}` }}>
        <h3 style={{ fontSize:13, fontWeight:700, color:TEXT_PRIMARY }}>Ringkasan Tagihan</h3>
      </div>
      <div style={{ padding:18 }}>
        <VehicleImg vehicle={vehicle} style={{ width:"100%", height:120, objectFit:"cover", borderRadius:10, marginBottom:14 }} />
        <div style={{ fontSize:14, fontWeight:800, marginBottom:2, color:TEXT_PRIMARY }}>{rental.vehicle_name}</div>
        <div style={{ fontSize:12, color:TEXT_MUTED, marginBottom:14 }}>{rental.plate}</div>
        {[
          ["Periode", `${fmtDate(rental.start_date)} – ${fmtDate(rental.end_date)}`],
          ["Durasi", `${rental.days} hari`],
          ["Tarif/hari", fmt(rental.rate)],
        ].map(([k, v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"0.5px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize:12, color:TEXT_MUTED }}>{k}</span>
            <span style={{ fontSize:13, fontWeight:600, color:TEXT_PRIMARY }}>{v}</span>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", marginTop:4 }}>
          <span style={{ fontSize:14, fontWeight:700, color:TEXT_PRIMARY }}>Total</span>
          <span style={{ fontSize:16, fontWeight:800, color:ACCENT }}>{fmt(rental.total_cost)}</span>
        </div>
      </div>
    </div>
  );
}