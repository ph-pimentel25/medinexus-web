"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Stethoscope,
  Activity,
  Layers,
  ShieldAlert,
} from "lucide-react";

interface PhysicalRoom {
  id: string;
  name: string;
  type: "consultorio" | "ultrassom" | "cirurgia" | "coleta";
  equipmentDescription: string;
  status: "disponivel" | "ocupado" | "manutencao";
}

interface RoomReservation {
  id: string;
  roomId: string;
  doctorName: string;
  procedureOrSpecialty: string;
  date: string;
  timeSlot: string;
}

const INITIAL_ROOMS: PhysicalRoom[] = [
  {
    id: "room-1",
    name: "Consultório 01",
    type: "consultorio",
    equipmentDescription: "Maca clínica, negatoscópio digital, balança antropométrica",
    status: "ocupado",
  },
  {
    id: "room-2",
    name: "Consultório 02 - Cardiologia",
    type: "consultorio",
    equipmentDescription: "Eletrocardiógrafo 12 derivações TEB, monitor de pressão MAPA",
    status: "ocupado",
  },
  {
    id: "room-3",
    name: "Consultório 03 - Dermatologia",
    type: "consultorio",
    equipmentDescription: "Dermatoscópio Heine Delta 30, lâmpada de Wood",
    status: "disponivel",
  },
  {
    id: "room-4",
    name: "Sala de Ultrassonografia",
    type: "ultrassom",
    equipmentDescription: "Aparelho GE Logiq S8 compartilhado com sondas linear e convexa",
    status: "ocupado",
  },
  {
    id: "room-5",
    name: "Sala de Pequenas Cirurgias",
    type: "cirurgia",
    equipmentDescription: "Foco cirúrgico LED, eletrocautério bipolar WEM, autoclave 21L",
    status: "disponivel",
  },
  {
    id: "room-6",
    name: "Sala de Coleta & Vacinas",
    type: "coleta",
    equipmentDescription: "Cadeira de coleta reclinável, geladeira biológica 2°C a 8°C",
    status: "disponivel",
  },
];

const INITIAL_RESERVATIONS: RoomReservation[] = [
  {
    id: "res-1",
    roomId: "room-1",
    doctorName: "Dr. André Valente",
    procedureOrSpecialty: "Clínica Geral",
    date: "2026-10-07",
    timeSlot: "09:00",
  },
  {
    id: "res-2",
    roomId: "room-2",
    doctorName: "Dra. Camila Vasconcelos",
    procedureOrSpecialty: "Eletrocardiograma & Consulta",
    date: "2026-10-07",
    timeSlot: "10:00",
  },
  {
    id: "res-3",
    roomId: "room-4",
    doctorName: "Dr. Marcelo Bittencourt",
    procedureOrSpecialty: "Ultrassom Abdominal Total",
    date: "2026-10-07",
    timeSlot: "10:00",
  },
  {
    id: "res-4",
    roomId: "room-1",
    doctorName: "Dr. André Valente",
    procedureOrSpecialty: "Consulta Pediátrica",
    date: "2026-10-07",
    timeSlot: "14:00",
  },
  {
    id: "res-5",
    roomId: "room-4",
    doctorName: "Dra. Camila Vasconcelos",
    procedureOrSpecialty: "Ecocardiograma Transtorácico",
    date: "2026-10-07",
    timeSlot: "15:00",
  },
];

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function GestaoSalasPage() {
  const [rooms] = useState<PhysicalRoom[]>(INITIAL_ROOMS);
  const [reservations, setReservations] = useState<RoomReservation[]>(INITIAL_RESERVATIONS);
  const [selectedDate, setSelectedDate] = useState("2026-10-07");

  // Modal Reserva
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("room-4");
  const [doctorName, setDoctorName] = useState("Dr. Rodrigo Medeiros");
  const [procedure, setProcedure] = useState("Ultrassom Obstétrico");
  const [timeSlot, setTimeSlot] = useState("10:00");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const checkConflict = (roomId: string, time: string, date: string, doctor: string) => {
    // 1. Conflito de Sala/Equipamento
    const roomConflict = reservations.find(
      (r) => r.roomId === roomId && r.timeSlot === time && r.date === date
    );
    if (roomConflict) {
      const room = rooms.find((rm) => rm.id === roomId);
      return `Conflito de equipamento: A ${room?.name} já está reservada às ${time} para ${roomConflict.doctorName} (${roomConflict.procedureOrSpecialty}). Selecione outro horário.`;
    }

    // 2. Conflito de agenda do mesmo médico em duas salas simultâneas
    const doctorConflict = reservations.find(
      (r) => r.doctorName === doctor && r.timeSlot === time && r.date === date
    );
    if (doctorConflict) {
      const busyRoom = rooms.find((rm) => rm.id === doctorConflict.roomId);
      return `Conflito de profissional: O médico ${doctor} já está alocado na ${busyRoom?.name} às ${time}.`;
    }

    return null;
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    const conflict = checkConflict(selectedRoomId, timeSlot, selectedDate, doctorName);
    if (conflict) {
      setConflictWarning(conflict);
      return;
    }

    const newRes: RoomReservation = {
      id: `res-${Date.now()}`,
      roomId: selectedRoomId,
      doctorName,
      procedureOrSpecialty: procedure,
      date: selectedDate,
      timeSlot,
    };

    setReservations((prev) => [...prev, newRes]);
    setModalOpen(false);
    setSuccessMessage("Reserva confirmada sem conflitos de salas e equipamentos!");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  return (
    <main className="min-h-screen bg-mn-sand">
      {/* Top Banner */}
      <section className="border-b border-mn-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <span className="inline-flex rounded-full border border-mn-border bg-mn-sand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mn-teal">
              Recursos Físicos da Clínica
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Gestão de Salas & Equipamentos
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Controle a ocupação de consultórios, sala de ultrassom e pequenas cirurgias com prevenção automática de conflito de agenda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clinica/painel-tv"
              className="inline-flex items-center gap-2 rounded-2xl border border-mn-border bg-white px-5 py-3 text-sm font-semibold text-mn-teal transition hover:bg-mn-sand"
            >
              <span>Abrir Painel TV</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setConflictWarning(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-mn-teal px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123B46]"
            >
              <Plus size={16} />
              <span>Nova reserva de sala</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Grade de Salas & Recursos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => {
            const todayRes = reservations.filter(
              (r) => r.roomId === room.id && r.date === selectedDate
            );

            return (
              <div
                key={room.id}
                className="flex flex-col justify-between rounded-3xl border border-mn-border bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mn-sage-light text-mn-teal">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{room.name}</h3>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          {room.type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        todayRes.length === 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-teal-50 text-mn-teal border border-teal-200"
                      }`}
                    >
                      {todayRes.length === 0 ? "Livre hoje" : `${todayRes.length} agendamentos`}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-600 bg-mn-sand p-3 rounded-xl border border-slate-100">
                    <strong>Recursos:</strong> {room.equipmentDescription}
                  </p>
                </div>

                {/* Reservas do dia para esta sala */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Ocupação ({selectedDate}):
                  </span>

                  {todayRes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhuma reserva para este dia.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {todayRes.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs border border-slate-100"
                        >
                          <span className="font-mono font-bold text-mn-teal">{r.timeSlot}</span>
                          <span className="font-medium text-slate-800 truncate max-w-[140px]">
                            {r.doctorName}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                            {r.procedureOrSpecialty}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Matriz Completa de Horários do Dia */}
        <div className="rounded-3xl border border-mn-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-mn-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Grade de Ocupação por Horário
              </h3>
              <p className="text-xs text-slate-500">
                Visualize horários disponíveis para evitar choque de agendamento em equipamentos compartilhados.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-mn-teal" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-mn-border bg-mn-sand px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Horário</th>
                  {rooms.map((rm) => (
                    <th key={rm.id} className="py-3 px-3">
                      {rm.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="hover:bg-mn-sand/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{slot}</td>
                    {rooms.map((rm) => {
                      const res = reservations.find(
                        (r) => r.roomId === rm.id && r.timeSlot === slot && r.date === selectedDate
                      );

                      return (
                        <td key={rm.id} className="py-3 px-3">
                          {res ? (
                            <div className="rounded-xl bg-teal-50 border border-teal-200 p-2 text-[11px] text-teal-900">
                              <strong className="block truncate font-bold">{res.doctorName}</strong>
                              <span className="text-[10px] text-teal-700 truncate block">
                                {res.procedureOrSpecialty}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              — Livre —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal Nova Reserva com Detector de Conflitos */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-mn-border bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-mn-border pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-mn-teal" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Reservar Sala / Equipamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Alerta de Conflito Ativo */}
            {conflictWarning && (
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-xs text-red-900 animate-in fade-in">
                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <strong className="block font-bold">BLOQUEIO DE CONFLITO DETECTADO</strong>
                  <p className="mt-0.5 leading-relaxed">{conflictWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateReservation} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Sala ou Equipamento</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    setConflictWarning(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                >
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.equipmentDescription.slice(0, 35)}...)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Médico Responsável</label>
                <select
                  value={doctorName}
                  onChange={(e) => {
                    setDoctorName(e.target.value);
                    setConflictWarning(null);
                  }}
                  className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                >
                  <option value="Dr. Rodrigo Medeiros">Dr. Rodrigo Medeiros (Ginecologia & Obstetrícia)</option>
                  <option value="Dra. Camila Vasconcelos">Dra. Camila Vasconcelos (Cardiologia)</option>
                  <option value="Dr. Marcelo Bittencourt">Dr. Marcelo Bittencourt (Ultrassonografia)</option>
                  <option value="Dr. André Valente">Dr. André Valente (Clínica Geral & Cirurgias)</option>
                  <option value="Dra. Beatriz Menezes">Dra. Beatriz Menezes (Dermatologia)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Procedimento / Especialidade</label>
                <input
                  type="text"
                  required
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  placeholder="Ex: Ultrassom Morfológico, Biópsia Cutânea..."
                  className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Data</label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setConflictWarning(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Horário</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => {
                      setTimeSlot(e.target.value);
                      setConflictWarning(null);
                    }}
                    className="mt-1 w-full rounded-xl border border-mn-border bg-mn-sand px-3 py-2 text-sm outline-none focus:border-mn-teal focus:bg-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-mn-border px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-mn-teal px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#123B46]"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
