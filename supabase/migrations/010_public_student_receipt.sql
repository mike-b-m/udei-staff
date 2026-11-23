CREATE OR REPLACE FUNCTION public.get_public_student_receipt(p_student_id bigint)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT jsonb_build_object(
    'student', (
      SELECT jsonb_build_object(
        'id', s.id,
        'last_name', s.last_name,
        'first_name', s.first_name,
        'faculty', s.faculty,
        'student_code', s.student_code
      )
      FROM public.student AS s
      WHERE s.id = p_student_id
    ),
    'payment', (
      SELECT jsonb_build_object(
        'id', p.id,
        'student_id', p.student_id,
        'payment_history', p.payment_history,
        'balance', p.balance,
        'discount', p.discount,
        'faculty', p.faculty,
        'price', p.price,
        'level', p.level,
        'v_1', p.v_1,
        'v_2', p.v_2,
        'v_3', p.v_3
      )
      FROM public.student_payment AS p
      WHERE p.student_id = p_student_id
      ORDER BY p.id DESC
      LIMIT 1
    ),
    'year', COALESCE(
      (
        SELECT ss.year_study
        FROM public.student_status AS ss
        WHERE ss.student_id = p_student_id
        ORDER BY ss.id DESC
        LIMIT 1
      ),
      (
        SELECT p.level
        FROM public.student_payment AS p
        WHERE p.student_id = p_student_id
        ORDER BY p.id DESC
        LIMIT 1
      )
    ),
    'history', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'created_at', h.created_at,
            'amount', h.amount,
            'balance', h.balance,
            'method', h.method,
            'insert_by', h.insert_by
          )
          ORDER BY h.created_at DESC
        )
        FROM public.payment_history AS h
        WHERE h.student_id = p_student_id
      ),
      '[]'::jsonb
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_student_receipt(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_student_receipt(bigint) TO anon, authenticated;
