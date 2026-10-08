import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authHeader || !url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: "Sessão inválida ou serviço indisponível." }, { status: 401 });
  }

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${authHeader}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await client.auth.getUser(authHeader);
  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  try {
    // 1. Anonimiza os dados pessoais e cancela consultas pendentes via função de segurança
    const { error: rpcError } = await client.rpc("anonymize_patient_account", {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error("[Account Deletion RPC Error]", rpcError);
      // Fallback direto via admin caso a migration ainda esteja sendo executada
      await admin.from("patient_preferences").delete().eq("patient_id", user.id);
      await admin.from("patient_search_preferences").delete().eq("patient_id", user.id);
      await admin.from("notifications").delete().eq("recipient_id", user.id);
      await admin.from("patients").update({
        full_name: "Conta Encerrada (LGPD)",
        cpf: null,
        phone: null,
        birth_date: null,
      }).eq("id", user.id);
    }

    // 2. Remove o usuário do Supabase Auth permanentemente (Apple Guideline 5.1.1(v))
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      console.error("[Delete Auth User Error]", deleteUserError);
      return NextResponse.json(
        { error: "Erro ao excluir credenciais de acesso." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conta e dados de acesso excluídos com sucesso em conformidade com a LGPD.",
    });
  } catch (err) {
    console.error("[Account Deletion Error]", err);
    return NextResponse.json(
      { error: "Falha ao processar exclusão de conta." },
      { status: 500 }
    );
  }
}
