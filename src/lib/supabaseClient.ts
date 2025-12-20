import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DIAGNÓSTICO: Isso vai aparecer no console do seu navegador (F12)
console.log("--- DEBUG SUPABASE ---");
console.log("URL:", supabaseUrl);
console.log("Key existe?", !!supabaseAnonKey); // Retorna true ou false
console.log("----------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  // Se entrar aqui, o arquivo .env.local não está sendo lido
  throw new Error(
    "ERRO CRÍTICO: Variáveis de ambiente não encontradas. Verifique o arquivo .env.local na raiz."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
