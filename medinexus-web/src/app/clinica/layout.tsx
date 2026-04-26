"use client";

import RoleGuard from "../components/role-guard";

export default function ClinicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard area="clinic">{children}</RoleGuard>;
}