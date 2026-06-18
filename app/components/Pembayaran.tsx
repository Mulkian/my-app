"use client";
// components/Pembayaran.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Payment, Rental } from "../types/types";
import {
  StatusBadge,
  Loading,
  Empty,
  PageHeader,
  Modal,
  Field,
  Input,
  Select,
  Btn,
  ErrAlert,
  fmt,
  fmtShort,
} from "./ui";
import { Icons } from "./icons";

const BLANK = {
  rental_id: "",
  amount: 0,
  method: "Tunai",
  date: new Date().toISOString().split("T")[0],
};

export default function Pembayaran() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [proofModal, setProofModal] = useState<Rental | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("rentals").select("*").neq("status", "Dibatalkan"),
    ]);
    setPayments(p.data ?? []);
    setRentals(r.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime: auto refresh saat ada update di tabel rentals (mis. user upload bukti bayar)
  useEffect(() => {
    const channel = supabase
      .channel("rentals-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentals" },
        () => {
          fetchData();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingVerification = rentals.filter(
    (r) => r.payment_status === "Menunggu Verifikasi",
  );
  const unpaidRentals = rentals.filter((r) => r.payment_status !== "Lunas");
  const selected = rentals.find((r) => r.id === form.rental_id);
  const totalRevenue = payments
    .filter((p) => p.status === "Lunas")
    .reduce((s, p) => s + p.amount, 0);
  const filteredPay =
    filter === "Semua" ? payments : payments.filter((p) => p.status === filter);

  // Verifikasi bukti bayar dari user portal
  const handleVerify = async (rental: Rental) => {
    setVerifying(rental.id);
    const { error } = await supabase
      .from("rentals")
      .update({ payment_status: "Lunas" })
      .eq("id", rental.id);

    if (!error) {
      setRentals((prev) =>
        prev.map((r) =>
          r.id === rental.id ? { ...r, payment_status: "Lunas" } : r,
        ),
      );
      await supabase
        .from("payments")
        .update({ status: "Lunas" })
        .eq("rental_id", rental.id);
      setPayments((prev) =>
        prev.map((p) =>
          p.rental_id === rental.id ? { ...p, status: "Lunas" } : p,
        ),
      );
    }
    setVerifying(null);
    setProofModal(null);
  };

  const handleSave = async () => {
    if (!form.rental_id || !form.amount || !form.date) {
      setErr("Semua field wajib diisi.");
      return;
    }
    if (form.amount <= 0) {
      setErr("Jumlah harus lebih dari 0.");
      return;
    }
    if (!selected) return;
    setSaving(true);
    setErr("");

    const newStatus: Payment["status"] =
      form.amount >= selected.total_cost ? "Lunas" : "DP";

    const { data: newPayment, error } = await supabase
      .from("payments")
      .insert({
        rental_id: form.rental_id,
        customer_name: selected.customer_name,
        amount: form.amount,
        method: form.method,
        date: form.date,
        status: newStatus,
      })
      .select()
      .single();

    if (error) {
      setErr(error.message);
      setSaving(false);
      return;
    }

    await supabase
      .from("rentals")
      .update({ payment_status: newStatus })
      .eq("id", form.rental_id);
    setPayments((p) => [newPayment, ...p]);
    setRentals((p) =>
      p.map((r) =>
        r.id === form.rental_id ? { ...r, payment_status: newStatus } : r,
      ),
    );
    setForm(BLANK);
    setSaving(false);
    setShow(false);
  };

  const handleLunas = async (p: Payment) => {
    await Promise.all([
      supabase.from("payments").update({ status: "Lunas" }).eq("id", p.id),
      supabase
        .from("rentals")
        .update({ payment_status: "Lunas" })
        .eq("id", p.rental_id),
    ]);
    setPayments((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, status: "Lunas" } : x)),
    );
    setRentals((prev) =>
      prev.map((r) =>
        r.id === p.rental_id ? { ...r, payment_status: "Lunas" } : r,
      ),
    );
  };

  const summaryStats = [
    {
      label: "Total Tagihan",
      val: rentals.reduce((s, r) => s + r.total_cost, 0),
      color: "#60a5fa",
    },
    { label: "Sudah Lunas", val: totalRevenue, color: "#4ade80" },
    {
      label: "Belum Lunas",
      val: rentals
        .filter((r) => r.payment_status !== "Lunas")
        .reduce((s, r) => s + r.total_cost, 0),
      color: "#f87171",
    },
    {
      label: "Menunggu Verifikasi",
      val: pendingVerification.length,
      color: "#fbbf24",
      isCount: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pembayaran"
        sub="Monitor status pembayaran seluruh transaksi."
        action={
          <Btn
            onClick={() => {
              setForm(BLANK);
              setErr("");
              setShow(true);
            }}
            icon={<Icons.plus />}
            disabled={unpaidRentals.length === 0 || loading}
          >
            Catat Pembayaran
          </Btn>
        }
      />

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        {summaryStats.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontSize: "22px",
                fontWeight: 800,
                color: s.color,
                fontFamily: "Syne, sans-serif",
              }}
            >
              {s.isCount ? `${s.val} transaksi` : fmtShort(s.val)}
            </p>
          </div>
        ))}
      </div>

      {/* Bukti Bayar Menunggu Verifikasi */}
      {pendingVerification.length > 0 && (
        <div
          style={{
            background: "#0f172a",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "14px",
            marginBottom: "22px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(245,158,11,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div
                style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24" }}
              >
                Bukti Bayar Menunggu Verifikasi
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {pendingVerification.length} transaksi perlu dikonfirmasi
              </div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {[
                    "Pelanggan",
                    "Kendaraan",
                    "Total",
                    "Metode",
                    "Bukti Bayar",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#475569",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingVerification.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#f1f5f9",
                      }}
                    >
                      {r.customer_name}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "13px",
                        color: "#94a3b8",
                      }}
                    >
                      {r.vehicle_name}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#fbbf24",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmt(r.total_cost)}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      {r.payment_method ?? "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {r.payment_proof_url ? (
                        <button
                          onClick={() => setProofModal(r)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            background: "rgba(96,165,250,0.1)",
                            border: "1px solid rgba(96,165,250,0.3)",
                            color: "#60a5fa",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                            fontFamily: "inherit",
                          }}
                        >
                          🖼 Lihat Bukti
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#475569" }}>
                          Tidak ada
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        onClick={() => handleVerify(r)}
                        disabled={verifying === r.id}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          background:
                            verifying === r.id ? "#1e293b" : "#14532d33",
                          border: "1px solid #4ade8033",
                          color: "#4ade80",
                          cursor:
                            verifying === r.id ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          fontWeight: 600,
                          fontFamily: "inherit",
                          opacity: verifying === r.id ? 0.6 : 1,
                        }}
                      >
                        {verifying === r.id
                          ? "Memproses..."
                          : "✓ Konfirmasi Lunas"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {["Semua", "Lunas", "DP", "Belum Bayar"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              background: filter === f ? "#f59e0b" : "transparent",
              color: filter === f ? "#0f0f0f" : "#64748b",
              borderColor: filter === f ? "#f59e0b" : "#1e293b",
              fontFamily: "inherit",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Payments table */}
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Loading />
        ) : filteredPay.length === 0 ? (
          <Empty text="Belum ada data pembayaran." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0a0f1e" }}>
                  {[
                    "Pelanggan",
                    "ID Sewa",
                    "Jumlah",
                    "Metode",
                    "Tanggal",
                    "Status",
                    "Bukti Bayar",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#475569",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPay.map((p, i) => {
                  const r = rentals.find((x) => x.id === p.rental_id);
                  return (
                    <tr key={i} style={{ borderTop: "1px solid #1e293b" }}>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#f1f5f9",
                        }}
                      >
                        {p.customer_name}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <code
                          style={{
                            fontSize: "11px",
                            background: "#1e293b",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            color: "#60a5fa",
                          }}
                        >
                          {p.rental_id.slice(0, 8)}…
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#f1f5f9",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(p.amount)}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: "12.5px",
                          color: "#94a3b8",
                        }}
                      >
                        {p.method}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: "12.5px",
                          color: "#64748b",
                        }}
                      >
                        {p.date}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {r?.payment_proof_url ? (
                          <button
                            onClick={() => setProofModal(r)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              background: "rgba(96,165,250,0.1)",
                              border: "1px solid rgba(96,165,250,0.3)",
                              color: "#60a5fa",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              fontFamily: "inherit",
                            }}
                          >
                            🖼 Lihat
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#475569" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {p.status !== "Lunas" && (
                          <button
                            onClick={() => handleLunas(p)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              background: "#14532d33",
                              border: "1px solid #4ade8033",
                              color: "#4ade80",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              fontFamily: "inherit",
                            }}
                          >
                            ✓ Konfirmasi Lunas
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lihat Bukti Bayar */}
      {proofModal && (
        <div
          onClick={() => setProofModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0f172a",
              borderRadius: 16,
              border: "1px solid #1e293b",
              width: "100%",
              maxWidth: 480,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #1e293b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}
                >
                  Bukti Pembayaran
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {proofModal.customer_name} · {proofModal.vehicle_name}
                </div>
              </div>
              <button
                onClick={() => setProofModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div
                style={{
                  background: "#1e293b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}
                  >
                    Total Tagihan
                  </div>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}
                  >
                    {fmt(proofModal.total_cost)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}
                  >
                    Metode
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}
                  >
                    {proofModal.payment_method ?? "—"}
                  </div>
                </div>
              </div>

              {proofModal.payment_proof_url ? (
                <div
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid #1e293b",
                  }}
                >
                  <img
                    src={proofModal.payment_proof_url}
                    alt="Bukti pembayaran"
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      objectFit: "contain",
                      background: "#0a0f1e",
                      display: "block",
                    }}
                  />
                  {proofModal.payment_proof_filename && (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "#1e293b",
                        fontSize: 11,
                        color: "#64748b",
                      }}
                    >
                      {proofModal.payment_proof_filename}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 0",
                    fontSize: 13,
                    color: "#475569",
                    border: "1px dashed #1e293b",
                    borderRadius: 10,
                  }}
                >
                  Tidak ada bukti bayar
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, padding: "0 20px 18px" }}>
              <button
                onClick={() => setProofModal(null)}
                style={{
                  flex: 1,
                  padding: 11,
                  borderRadius: 10,
                  border: "1px solid #1e293b",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Tutup
              </button>
              {proofModal.payment_status !== "Lunas" && (
                <button
                  onClick={() => handleVerify(proofModal)}
                  disabled={verifying === proofModal.id}
                  style={{
                    flex: 1,
                    padding: 11,
                    borderRadius: 10,
                    border: "none",
                    background: "#f59e0b",
                    color: "#0f0f0f",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor:
                      verifying === proofModal.id ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: verifying === proofModal.id ? 0.7 : 1,
                  }}
                >
                  {verifying === proofModal.id
                    ? "Memproses..."
                    : "✓ Konfirmasi Lunas"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Pembayaran */}
      {show && (
        <Modal title="Catat Pembayaran" onClose={() => setShow(false)}>
          <ErrAlert msg={err} />
          <Field label="Transaksi Sewa" required>
            <Select
              value={form.rental_id}
              onChange={(e) => {
                const r = rentals.find((x) => x.id === e.target.value);
                setForm((p) => ({
                  ...p,
                  rental_id: e.target.value,
                  amount: r?.total_cost ?? 0,
                }));
              }}
            >
              <option value="">-- Pilih Transaksi --</option>
              {unpaidRentals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.customer_name} · {r.vehicle_name} · {fmt(r.total_cost)}
                </option>
              ))}
            </Select>
          </Field>
          {selected && (
            <div
              style={{
                background: "#1e293b",
                borderRadius: "9px",
                padding: "10px 14px",
                marginBottom: "14px",
                fontSize: "12.5px",
                color: "#94a3b8",
              }}
            >
              Tagihan:{" "}
              <strong style={{ color: "#f59e0b" }}>
                {fmt(selected.total_cost)}
              </strong>{" "}
              · Status:{" "}
              <strong style={{ color: "#f1f5f9" }}>
                {selected.payment_status}
              </strong>
            </div>
          )}
          <Field label="Jumlah Dibayar (Rp)" required>
            <Input
              type="number"
              value={form.amount || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: Number(e.target.value) }))
              }
              placeholder="1000000"
            />
          </Field>
          <Field label="Metode Pembayaran">
            <Select
              value={form.method}
              onChange={(e) =>
                setForm((p) => ({ ...p, method: e.target.value }))
              }
            >
              <option>Tunai</option>
              <option>Transfer Bank</option>
              <option>QRIS</option>
              <option>Kartu Debit</option>
            </Select>
          </Field>
          <Field label="Tanggal Pembayaran" required>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </Field>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            <Btn variant="secondary" onClick={() => setShow(false)}>
              Batal
            </Btn>
            <Btn onClick={handleSave} icon={<Icons.save />} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
