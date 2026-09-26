-- ALTER SEQUENCE needs sequence ownership; run as the function owner.
create or replace function public.reset_bill_no()
returns void
language sql
security definer
set search_path = ''
as $$
  alter sequence public.bill_no_seq restart with 1;
$$;

revoke execute on function public.reset_bill_no() from public, anon;
grant execute on function public.reset_bill_no() to authenticated;
