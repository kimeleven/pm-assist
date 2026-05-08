import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ReportStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VIOLATION_TYPES = [
  "차도 위 방치",
  "보도 위 방치",
  "횡단보도 위 방치",
  "교차로 부근 방치",
  "점자블록 위 방치",
  "기타",
];

export const STATUS_LABELS: Record<ReportStatus, string> = {
  RECEIVED: "접수",
  GRACE: "유예중",
  FIXED: "정비완료",
  TOWED: "견인완료",
  NOT_FOUND: "기기미발견",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  GRACE: "bg-yellow-100 text-yellow-800",
  FIXED: "bg-green-100 text-green-800",
  TOWED: "bg-gray-100 text-gray-800",
  NOT_FOUND: "bg-red-100 text-red-800",
};

export const GRACE_PERIOD_MINUTES = 30;

export function isOverGrace(gracePeriodEnd: Date | string): boolean {
  return new Date(gracePeriodEnd) < new Date();
}
