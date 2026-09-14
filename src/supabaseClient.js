import { createClient } from "@supabase/supabase-js";

// Legggiamo i valori dentro al file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("URL:", supabaseUrl)
console.log("KEY presente:", !!supabaseKey)
console.log("KEY inizia con:", supabaseKey?.substring(0, 15));

// Creaiamo l'oggetto attraverso il quale il nostro React parlerà con il database
// con export... lo rendiamo disponibile anche su App.jsx
export const supabase = createClient(
    supabaseUrl, 
    supabaseKey
);