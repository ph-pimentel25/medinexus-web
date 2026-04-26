"use client";

import RoleGuard from "../components/role-guard";

export default function MedicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleGuard area="doctor">{children}</RoleGuard>;
}