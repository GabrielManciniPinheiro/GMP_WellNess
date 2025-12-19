import { createClient } from "@supabase/supabase-js";
// Importando suas chaves que já existiam
import { projectId, publicAnonKey } from "../../utils/supabase/info";

// Monta a URL automaticamente baseada no ID do projeto
const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);
