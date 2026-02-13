import { createServerClient } from '@supabase/ssr'
import {cookies} from "next/headers"
//import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const cookieStore = await cookies()
export const supabaseServer = ()=> createServerClient(supabaseUrl,supabaseKey,{
  cookies: {
     getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
  //   get:(name)=>
  //     cookies().get(name)?.value,
  },
});
