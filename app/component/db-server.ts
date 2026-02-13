import { createServerClient } from '@supabase/ssr'
import {cookies} from "next/headers"
//import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseServer = ()=> createBrowserClient(supabaseUrl,supabaseKey,{
  cookies: {
    get:(name)=>
      cookies().get(name)?.value,
  },
});
