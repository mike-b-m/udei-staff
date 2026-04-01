import { supabase } from '@/app/component/db'

export async function logAudit(
  action: string,
  tableName: string,
  recordId: string,
  oldData?: unknown,
  newData?: unknown
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    table_name: tableName,
    record_id: recordId,
    old_data: oldData ?? null,
    new_data: newData ?? null,
  })
}
