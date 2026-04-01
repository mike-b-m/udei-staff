import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const paymentId = request.nextUrl.searchParams.get('payment_id')
  if (!paymentId) {
    return NextResponse.json({ error: 'payment_id required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: payment, error: paymentError } = await supabase
    .from('student_payment')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (paymentError || !payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  const { data: student } = await supabase
    .from('student')
    .select('first_name, last_name, student_code, faculty')
    .eq('id', payment.student_id)
    .single()

  // Return structured JSON receipt data
  // TODO: Replace with actual PDF generation using @react-pdf/renderer
  return NextResponse.json({
    receipt: {
      id: payment.id,
      amount: payment.amount,
      payment_method: payment.pay_method,
      date: payment.created_at || payment.date_time,
      description: payment.description || 'Paiement frais de scolarité',
    },
    student: student ? {
      name: `${student.last_name} ${student.first_name}`,
      code: student.student_code,
      faculty: student.faculty,
    } : null,
    university: {
      name: 'Université d\'Études Internationales d\'Haïti',
      abbreviation: 'UDEI',
    },
    generated_at: new Date().toISOString(),
  })
}
