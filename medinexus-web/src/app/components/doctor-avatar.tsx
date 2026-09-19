import Image from "next/image";
import { UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";
export default function DoctorAvatar({path,name,size=64}:{path?:string|null;name:string;size?:number}){
  return <span className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mn-teal-light text-mn-teal" style={{width:size,height:size}}>{path?<Image unoptimized src={supabase.storage.from("doctor-photos").getPublicUrl(path).data.publicUrl} width={size} height={size} alt={`Foto de ${name}`} className="h-full w-full object-cover"/>:<UserRound size={size/2} aria-label="Foto profissional pendente"/>}</span>;
}
