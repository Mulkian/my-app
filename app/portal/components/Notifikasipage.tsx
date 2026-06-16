"use client";
import type { Notification } from "types/types";
import { ACCENT, CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED, TEXT_SOFT } from "@/lib/constants";
import { NotifIcon } from "./ui";

interface Props {
  notifs: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export default function NotifikasiPage({ notifs, onMarkRead, onMarkAllRead }: Props) {
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Notifikasi</h1>
          <p style={{ fontSize: 13, color: TEXT_MUTED }}>{unread} belum dibaca</p>
        </div>
        <button onClick={onMarkAllRead}
          style={{ padding: "8px 16px", borderRadius: 8, border: `0.5px solid ${CARD_BORDER}`, background: "#1a2540", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: TEXT_MUTED }}>
          Tandai Semua Dibaca
        </button>
      </div>

      {/* List */}
      <div style={{ background: CARD_BG, borderRadius: 14, border: `0.5px solid ${CARD_BORDER}`, overflow: "hidden" }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>Tidak ada notifikasi.</div>
        ) : (
          notifs.map((n, i) => (
            <NotifRow
              key={n.id}
              notif={n}
              isLast={i === notifs.length - 1}
              onClick={() => onMarkRead(n.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Notif Row ────────────────────────────────────────────────
function NotifRow({ notif: n, isLast, onClick }: { notif: Notification; isLast: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick}
      style={{ padding: "16px 20px", borderBottom: isLast ? "none" : `0.5px solid rgba(255,255,255,0.04)`, display: "flex", gap: 14, alignItems: "flex-start", background: n.read ? CARD_BG : "rgba(245,158,11,0.04)", cursor: "pointer" }}>
      <NotifIcon type={n.type} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{n.title}</span>
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>{n.time}</span>
        </div>
        <p style={{ fontSize: 13, color: TEXT_SOFT, lineHeight: 1.5 }}>{n.message}</p>
      </div>
      {!n.read && (
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, flexShrink: 0, marginTop: 4 }} />
      )}
    </div>
  );
}