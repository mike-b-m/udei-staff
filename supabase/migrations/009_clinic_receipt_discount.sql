alter table public.clinic_receipt
  add column if not exists discount numeric not null default 0;

drop function if exists public.insert_clinic_invoice(
  text,
  numeric,
  numeric,
  public.clinic_pay_input[]
);

create or replace function public.insert_clinic_invoice(
  p_student_name text,
  p_year numeric,
  p_total_price numeric,
  p_discount numeric,
  p_line_items public.clinic_pay_input[]
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_receipt_id bigint;
  item_row public.clinic_pay_input;
  valid_items_count integer := 0;
  subtotal_amount numeric := 0;
  applied_discount numeric := coalesce(p_discount, 0);
  net_total numeric;
begin
  if p_line_items is null or array_length(p_line_items, 1) is null then
    raise exception 'Aucune prestation n’a été fournie.';
  end if;

  if applied_discount < 0 then
    raise exception 'La réduction ne peut pas être négative.';
  end if;

  foreach item_row in array p_line_items loop
    if item_row.service_name is null or trim(item_row.service_name) = '' then
      continue;
    end if;

    if item_row.quantity is null then
      continue;
    end if;

    if item_row.quantity < 0 then
      raise exception 'La quantité ne peut pas être négative pour la prestation : %', item_row.service_name;
    end if;

    if item_row.quantity > 0 then
      if item_row.price is null or item_row.price < 0 then
        raise exception 'Le montant est invalide pour la prestation : %', item_row.service_name;
      end if;

      valid_items_count := valid_items_count + 1;
      subtotal_amount := subtotal_amount + item_row.price;
    end if;
  end loop;

  if valid_items_count = 0 then
    raise exception 'Ajoutez au moins une prestation avec une quantité supérieure à zéro.';
  end if;

  if applied_discount > subtotal_amount then
    raise exception 'La réduction ne peut pas dépasser le sous-total.';
  end if;

  net_total := round(subtotal_amount - applied_discount, 2);

  if p_total_price is null or abs(p_total_price - net_total) > 0.01 then
    raise exception 'Le total transmis ne correspond pas au sous-total moins la réduction.';
  end if;

  insert into public.clinic_receipt (student_name, year, total_price, discount)
  values (p_student_name, p_year, net_total, applied_discount)
  returning id into new_receipt_id;

  foreach item_row in array p_line_items loop
    if item_row.service_name is null or trim(item_row.service_name) = '' then
      continue;
    end if;

    if item_row.quantity is not null and item_row.quantity > 0 then
      insert into public.clinic_pay (receipt_id, service_name, quantity, price)
      values (
        new_receipt_id,
        item_row.service_name,
        item_row.quantity,
        item_row.price
      );
    end if;
  end loop;

  return new_receipt_id;
end;
$$;