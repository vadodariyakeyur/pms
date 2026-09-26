-- bill_no becomes a display-only number; lookups move to id.
alter table "public"."parcels" drop constraint if exists parcels_bill_no_key;
drop index if exists parcels_bill_no_key;

create sequence if not exists public.bill_no_seq;
select setval('public.bill_no_seq', (select coalesce(max(bill_no), 0)::bigint from public.parcels), true);

-- bill_no auto-populates on insert; client no longer calls get_next_bill_no() first.
alter table "public"."parcels" alter column "bill_no" set default nextval('public.bill_no_seq');
drop function if exists public.get_next_bill_no();

create or replace function public.reset_bill_no()
returns void
language sql
as $$
  alter sequence public.bill_no_seq restart with 1;
$$;

drop function if exists public.get_parcel_details_by_bill_no(integer);

create or replace function public.get_parcel_details_by_id(p_id integer)
returns table(
  id integer,
  from_city_name text,
  to_city_name text,
  bill_no integer,
  created_at timestamp with time zone,
  parcel_date date,
  bus_registration text,
  sender_name text,
  sender_mobile_no text,
  receiver_name text,
  receiver_mobile_no text,
  description text,
  qty integer,
  remark text,
  amount numeric,
  amount_given numeric,
  office_mobile_no text,
  office_address text
)
language sql
security definer
as $$
  select
    p.id, fc.name, tc.name, p.bill_no, p.created_at, p.parcel_date,
    b.registration_no, p.sender_name, p.sender_mobile_no, p.receiver_name, p.receiver_mobile_no,
    p.description, p.qty, p.remark, p.amount, p.amount_given,
    o.mobile_no, o.address
  from public.parcels p
  left join public.buses b on p.bus_id = b.id
  left join public.cities fc on p.from_city_id = fc.id
  left join public.cities tc on p.to_city_id = tc.id
  left join public.offices o on p.office_id = o.id
  where p.id = p_id;
$$;
