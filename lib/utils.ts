import type { Vehicle } from "../types/types";

export const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const diffDays = (a: string, b: string) =>
  Math.max(
    1,
    Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000),
  );

export const getCarImg = (
  v?: Pick<Vehicle, "photo_url" | "name"> | null,
): string => {
  if (v?.photo_url) return v.photo_url;
  return `https://placehold.co/400x200/131c2e/64748b?text=${encodeURIComponent(v?.name ?? "Kendaraan")}`;
};
