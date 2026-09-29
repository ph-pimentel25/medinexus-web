"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
import {canResetPassword,clearRecoveryGrant} from "../lib/recovery-session";
import {MIN_PASSWORD_LENGTH,isValidNewPassword} from "../lib/password-policy";
export default function Recovery(){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[repeat,setRepeat]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[updating,setUpdating]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  let alive=true;
  const params=new URLSearchParams(window.location.search);
  const hash=new URLSearchParams(window.location.hash.slice(1));
  const invalidLink=params.has("error")||hash.has("error");
  const update=params.get("update")==="1"||hash.get("type")==="recovery";
  // Pasting a fresh link over an expired link can change only the fragment.
  // Reinitialize the SDK instead of treating the old page's state as recovery.
  const freshLink=()=>{const next=new URLSearchParams(window.location.hash.slice(1));if(next.get("type")==="recovery"&&next.has("access_token")&&next.has("refresh_token"))window.location.reload();};
  window.addEventListener("hashchange",freshLink);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
   if(!alive)return;
   setReady(!invalidLink&&canResetPassword(session));
   if(event==="PASSWORD_RECOVERY")setUpdating(true);
  });
  void supabase.auth.getSession().then(({data,error})=>{
   if(!alive)return;
   const authorized=!error&&!invalidLink&&canResetPassword(data.session);
   setUpdating(update||authorized);setReady(authorized);
   if(invalidLink||(update&&!authorized))setMessage("Link de recuperação inválido ou expirado. Solicite um novo link.");
  });
  const timer=setInterval(()=>{void supabase.auth.getSession().then(({data})=>{if(alive)setReady(!invalidLink&&canResetPassword(data.session));});},30_000);
  return()=>{alive=false;clearInterval(timer);subscription.unsubscribe();window.removeEventListener("hashchange",freshLink);};
 },[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setMessage("");try{
  if(updating){const {data,error}=await supabase.auth.getSession();if(error||!canResetPassword(data.session))throw new Error("Abra um link de recuperação válido enviado ao seu e-mail.");if(!isValidNewPassword(password)||password!==repeat)throw new Error("Use pelo menos 8 caracteres e repita a mesma senha.");const r=await supabase.auth.updateUser({password});if(r.error)throw new Error("Não foi possível alterar a senha. Solicite um novo link.");clearRecoveryGrant();await supabase.auth.signOut();setReady(false);window.history.replaceState(null,"","/recuperar-conta");setPassword("");setRepeat("");setMessage("Senha atualizada. Entre novamente com sua nova senha.");setUpdating(false);}
  else{const r=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/recuperar-conta?update=1`});if(r.error)throw new Error("Não foi possível enviar agora. Aguarde e tente novamente.");setMessage("Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha. Confira também o spam.");}
 }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível continuar.");}finally{setBusy(false);}}
 return <main className="app-shell py-12"><section className="mn-panel mx-auto max-w-lg"><h1 className="text-2xl font-semibold">{updating?"Criar uma nova senha":"Recuperar acesso"}</h1><form onSubmit={submit} className="mt-6 space-y-4">{updating?<><label className="block text-sm">Nova senha<input className="mn-input mt-2" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="block text-sm">Repita a nova senha<input className="mn-input mt-2" type="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>{!ready&&<p className="text-sm">Abra o link recebido por e-mail. Se ele expirou, solicite outro.</p>}</>:<label className="block text-sm">E-mail da conta<input className="mn-input mt-2" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}<button className="mn-button" disabled={busy||(updating&&!ready)}>{busy?"Aguarde…":updating?"Salvar nova senha":"Enviar link de recuperação"}</button></form>{message&&<p role="status" className="mt-4 text-sm">{message}</p>}<div className="mt-6 flex gap-4 text-sm"><Link href="/login" className="underline">Voltar ao login</Link>{updating&&<a href="/recuperar-conta" className="underline" onClick={()=>clearRecoveryGrant()}>Solicitar outro link</a>}</div></section></main>;
}
