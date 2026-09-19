"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ProfilePhoto({doctorId}:{doctorId?:string}={}) {
  const bucket=doctorId?"doctor-photos":"patient-avatars";
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
      const result = doctorId ? await supabase.from("doctors").select("photo_path").eq("id",doctorId).maybeSingle() : await supabase.from("patient_preferences").select("avatar_path").eq("patient_id", user.id).maybeSingle();
      if(result.error){if(alive)setMessage("Não foi possível carregar sua foto.");return;}
      const savedPath=doctorId?(result.data as {photo_path?:string})?.photo_path:(result.data as {avatar_path?:string})?.avatar_path;
      if (savedPath) {
        const signed = await supabase.storage.from(bucket).createSignedUrl(savedPath, 3600);
        if (alive) { setUrl(signed.data?.signedUrl || ""); setPath(savedPath); }
      }
    })();
    return () => { alive = false; };
  }, [doctorId,bucket]);
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5*1024*1024) { setMessage("Escolha uma imagem PNG, JPG ou WebP de até 5 MB."); return; }
    setBusy(true); setMessage("");
    let newPath = "";
    try {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("Entre novamente para enviar sua foto.");
      // Decode and re-encode to resize the photo and discard EXIF location metadata.
      const bitmap = await createImageBitmap(file); const size = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas"); canvas.width=512; canvas.height=512;
      canvas.getContext("2d")!.drawImage(bitmap,(bitmap.width-size)/2,(bitmap.height-size)/2,size,size,0,0,512,512); bitmap.close();
      const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Imagem inválida.")),"image/jpeg",.88));
      newPath = `${doctorId||user.id}/${crypto.randomUUID()}.jpg`;
      const uploaded = await supabase.storage.from(bucket).upload(newPath,blob,{contentType:"image/jpeg"}); if (uploaded.error) throw uploaded.error;
      const saved = doctorId ? await supabase.rpc("set_doctor_photo",{p_doctor_id:doctorId,p_path:newPath}) : await supabase.from("patient_preferences").upsert({patient_id:user.id,avatar_path:newPath},{onConflict:"patient_id"}); if (saved.error) throw saved.error;
      const signed = await supabase.storage.from(bucket).createSignedUrl(newPath,3600);
      setUrl(signed.data?.signedUrl || ""); if (path) await supabase.storage.from(bucket).remove([path]); setPath(newPath); setMessage("Foto atualizada.");
    } catch { if (newPath) await supabase.storage.from(bucket).remove([newPath]); setMessage("Não foi possível salvar a foto. Verifique a conexão e tente novamente."); }
    finally { setBusy(false); if (input.current) input.current.value=""; }
  }
  async function remove() {
    setBusy(true);
    const { data:{user} } = await supabase.auth.getUser();
    if (user) {
      const result = await supabase.from("patient_preferences").update({avatar_path:null}).eq("patient_id",user.id);
      if (!result.error) { await supabase.storage.from(bucket).remove([path]); setUrl(""); setPath(""); setMessage("Foto removida."); }
      else setMessage("Não foi possível remover a foto.");
    }
    setBusy(false);
  }
  return <section className="mn-panel mb-6 flex flex-wrap items-center gap-5"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-mn-teal-light">{url ? <Image src={url} alt="Sua foto de perfil" width={96} height={96} unoptimized className="h-full w-full object-cover" /> : <Camera size={28} className="text-mn-teal" />}</div><div className="flex-1"><h2 className="text-lg font-semibold">{doctorId?"Foto profissional obrigatória":"Seu perfil, do seu jeito"}</h2><p className="mb-3 text-sm text-slate-500">{doctorId?"Envie uma foto que permita reconhecer você. Ela será pública na busca, no perfil e no agendamento. Sem foto, seu perfil não recebe novas reservas.":"Adicione uma foto para personalizar seu cadastro."}</p><div className="flex gap-3"><button type="button" className="mn-button-secondary" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Salvando…" : "Escolher foto"}</button>{path && !doctorId && <button type="button" disabled={busy} onClick={() => void remove()} className="text-sm underline">Remover</button>}</div><input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label={doctorId?"Foto do médico":"Foto do paciente"} onChange={e => void upload(e.target.files?.[0])} />{message && <p role="status" className="mt-2 text-sm">{message}</p>}</div></section>;
}
