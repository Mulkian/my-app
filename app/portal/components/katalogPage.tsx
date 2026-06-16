"use client";
import { useState } from "react";
import type { Vehicle } from "types/types";
import {
  ACCENT,
  CARD_BG,
  CARD_BORDER,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_SOFT,
} from "@/lib/constants";
import { fmt } from "@/lib/utils";
import { Icons } from "./icons";
import { Badge, VehicleImg } from "./ui";

interface Props {
  vehicles: Vehicle[];
  onBookNow: (vehicle: Vehicle) => void;
}

type SortKey = "name" | "rate_asc" | "rate_desc";
type TransFilter = "Semua" | "Matic" | "Manual";
type StatusFilter = "Semua" | "Tersedia" | "Disewa" | "Maintenance";

export default function KatalogPage({ vehicles, onBookNow }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTrans, setFilterTrans] = useState<TransFilter>("Semua");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("Tersedia");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  const filtered = vehicles
    .filter(
      (v) =>
        (filterStatus === "Semua" || v.status === filterStatus) &&
        (filterTrans === "Semua" || (v.transmission ?? "") === filterTrans) &&
        (v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.plate.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) =>
      sortBy === "rate_asc"
        ? a.rate - b.rate
        : sortBy === "rate_desc"
          ? b.rate - a.rate
          : a.name.localeCompare(b.name),
    );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: TEXT_PRIMARY,
            marginBottom: 4,
          }}
        >
          Katalog Kendaraan
        </h1>
        <p style={{ fontSize: 13, color: TEXT_MUTED }}>
          {filtered.length} kendaraan ditemukan
        </p>
      </div>

      {/* Filters bar */}
      <div
        style={{
          background: CARD_BG,
          borderRadius: 12,
          border: `0.5px solid ${CARD_BORDER}`,
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: 160,
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 10,
              color: TEXT_MUTED,
              display: "flex",
            }}
          >
            <Icons.Search size={15} />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau plat…"
            style={{
              width: "100%",
              background: "#0f1724",
              border: `0.5px solid rgba(255,255,255,0.1)`,
              borderRadius: 8,
              padding: "9px 12px 9px 34px",
              color: TEXT_PRIMARY,
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Select dropdowns */}
        {(
          [
            {
              label: "Status",
              value: filterStatus,
              setter: setFilterStatus,
              opts: ["Semua", "Tersedia", "Disewa", "Maintenance"],
            },
            {
              label: "Trans",
              value: filterTrans,
              setter: setFilterTrans,
              opts: ["Semua", "Matic", "Manual"],
            },
            {
              label: "Urutkan",
              value: sortBy,
              setter: setSortBy,
              opts: [
                { v: "name", l: "Nama A–Z" },
                { v: "rate_asc", l: "Harga ↑" },
                { v: "rate_desc", l: "Harga ↓" },
              ] as any,
            },
          ] as const
        ).map((f) => (
          <select
            key={f.label}
            value={f.value}
            onChange={(e) => (f.setter as any)(e.target.value)}
            style={{
              background: "#0f1724",
              border: `0.5px solid ${CARD_BORDER}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              fontFamily: "inherit",
              cursor: "pointer",
              outline: "none",
              color: TEXT_PRIMARY,
            }}
          >
            {f.opts.map((o: any) =>
              typeof o === "string" ? (
                <option key={o} value={o}>
                  {o}
                </option>
              ) : (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ),
            )}
          </select>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyKatalog />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onBookNow={onBookNow} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vehicle Card ─────────────────────────────────────────────
function VehicleCard({
  vehicle: v,
  onBookNow,
}: {
  vehicle: Vehicle;
  onBookNow: (v: Vehicle) => void;
}) {
  const unavail = v.status !== "Tersedia";
  return (
    <div
      style={{
        background: CARD_BG,
        borderRadius: 14,
        border: `0.5px solid ${CARD_BORDER}`,
        overflow: "hidden",
        opacity: unavail ? 0.55 : 1,
        transition: "transform 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!unavail) {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(245,158,11,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.borderColor = CARD_BORDER;
      }}
    >
      {/* Image */}
      <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
        <VehicleImg
          vehicle={v}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Badge status={v.status} />
        </div>
        {v.transmission && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: 6,
            }}
          >
            {v.transmission}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: TEXT_PRIMARY,
            marginBottom: 2,
          }}
        >
          {v.name}
        </div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 3 }}>
          {v.plate}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            fontSize: 12,
            color: TEXT_SOFT,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          {v.year && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icons.Calendar size={12} /> {v.year}
            </span>
          )}
          {v.color && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icons.Palette size={12} /> {v.color}
            </span>
          )}
          {v.fuel && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Icons.Fuel size={12} /> {v.fuel}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <span style={{ fontSize: 17, fontWeight: 800, color: ACCENT }}>
              {fmt(v.rate)}
            </span>
            <span style={{ fontSize: 12, color: TEXT_MUTED }}>/hari</span>
          </div>
        </div>

        <button
          disabled={unavail}
          onClick={() => onBookNow(v)}
          style={{
            width: "100%",
            padding: "9px",
            borderRadius: 9,
            border: "none",
            background: unavail ? "#1a2540" : ACCENT,
            color: unavail ? TEXT_MUTED : "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: unavail ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {unavail ? "Tidak Tersedia" : "Booking Sekarang"}
        </button>
      </div>
    </div>
  );
}

function EmptyKatalog() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: TEXT_MUTED }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 12,
          color: "#1e2d45",
        }}
      >
        <Icons.Car size={48} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: TEXT_SOFT }}>
        Tidak ada kendaraan ditemukan
      </p>
      <p style={{ fontSize: 13, marginTop: 4 }}>
        Coba ubah filter atau kata kunci pencarian
      </p>
    </div>
  );
}
