set check_function_bodies = off;

CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$function$
;

revoke delete on table "public"."bus_driver_assignments" from "anon";

revoke insert on table "public"."bus_driver_assignments" from "anon";

revoke references on table "public"."bus_driver_assignments" from "anon";

revoke select on table "public"."bus_driver_assignments" from "anon";

revoke trigger on table "public"."bus_driver_assignments" from "anon";

revoke truncate on table "public"."bus_driver_assignments" from "anon";

revoke update on table "public"."bus_driver_assignments" from "anon";

revoke delete on table "public"."bus_driver_assignments" from "authenticated";

revoke insert on table "public"."bus_driver_assignments" from "authenticated";

revoke references on table "public"."bus_driver_assignments" from "authenticated";

revoke select on table "public"."bus_driver_assignments" from "authenticated";

revoke trigger on table "public"."bus_driver_assignments" from "authenticated";

revoke truncate on table "public"."bus_driver_assignments" from "authenticated";

revoke update on table "public"."bus_driver_assignments" from "authenticated";

revoke delete on table "public"."bus_driver_assignments" from "service_role";

revoke insert on table "public"."bus_driver_assignments" from "service_role";

revoke references on table "public"."bus_driver_assignments" from "service_role";

revoke select on table "public"."bus_driver_assignments" from "service_role";

revoke trigger on table "public"."bus_driver_assignments" from "service_role";

revoke truncate on table "public"."bus_driver_assignments" from "service_role";

revoke update on table "public"."bus_driver_assignments" from "service_role";

revoke delete on table "public"."buses" from "anon";

revoke insert on table "public"."buses" from "anon";

revoke references on table "public"."buses" from "anon";

revoke select on table "public"."buses" from "anon";

revoke trigger on table "public"."buses" from "anon";

revoke truncate on table "public"."buses" from "anon";

revoke update on table "public"."buses" from "anon";

revoke delete on table "public"."buses" from "authenticated";

revoke insert on table "public"."buses" from "authenticated";

revoke references on table "public"."buses" from "authenticated";

revoke select on table "public"."buses" from "authenticated";

revoke trigger on table "public"."buses" from "authenticated";

revoke truncate on table "public"."buses" from "authenticated";

revoke update on table "public"."buses" from "authenticated";

revoke delete on table "public"."buses" from "service_role";

revoke insert on table "public"."buses" from "service_role";

revoke references on table "public"."buses" from "service_role";

revoke select on table "public"."buses" from "service_role";

revoke trigger on table "public"."buses" from "service_role";

revoke truncate on table "public"."buses" from "service_role";

revoke update on table "public"."buses" from "service_role";

revoke delete on table "public"."cities" from "anon";

revoke insert on table "public"."cities" from "anon";

revoke references on table "public"."cities" from "anon";

revoke select on table "public"."cities" from "anon";

revoke trigger on table "public"."cities" from "anon";

revoke truncate on table "public"."cities" from "anon";

revoke update on table "public"."cities" from "anon";

revoke delete on table "public"."cities" from "authenticated";

revoke insert on table "public"."cities" from "authenticated";

revoke references on table "public"."cities" from "authenticated";

revoke select on table "public"."cities" from "authenticated";

revoke trigger on table "public"."cities" from "authenticated";

revoke truncate on table "public"."cities" from "authenticated";

revoke update on table "public"."cities" from "authenticated";

revoke delete on table "public"."cities" from "service_role";

revoke insert on table "public"."cities" from "service_role";

revoke references on table "public"."cities" from "service_role";

revoke select on table "public"."cities" from "service_role";

revoke trigger on table "public"."cities" from "service_role";

revoke truncate on table "public"."cities" from "service_role";

revoke update on table "public"."cities" from "service_role";

revoke delete on table "public"."drivers" from "anon";

revoke insert on table "public"."drivers" from "anon";

revoke references on table "public"."drivers" from "anon";

revoke select on table "public"."drivers" from "anon";

revoke trigger on table "public"."drivers" from "anon";

revoke truncate on table "public"."drivers" from "anon";

revoke update on table "public"."drivers" from "anon";

revoke delete on table "public"."drivers" from "authenticated";

revoke insert on table "public"."drivers" from "authenticated";

revoke references on table "public"."drivers" from "authenticated";

revoke select on table "public"."drivers" from "authenticated";

revoke trigger on table "public"."drivers" from "authenticated";

revoke truncate on table "public"."drivers" from "authenticated";

revoke update on table "public"."drivers" from "authenticated";

revoke delete on table "public"."drivers" from "service_role";

revoke insert on table "public"."drivers" from "service_role";

revoke references on table "public"."drivers" from "service_role";

revoke select on table "public"."drivers" from "service_role";

revoke trigger on table "public"."drivers" from "service_role";

revoke truncate on table "public"."drivers" from "service_role";

revoke update on table "public"."drivers" from "service_role";

revoke delete on table "public"."offices" from "anon";

revoke insert on table "public"."offices" from "anon";

revoke references on table "public"."offices" from "anon";

revoke select on table "public"."offices" from "anon";

revoke trigger on table "public"."offices" from "anon";

revoke truncate on table "public"."offices" from "anon";

revoke update on table "public"."offices" from "anon";

revoke delete on table "public"."offices" from "authenticated";

revoke insert on table "public"."offices" from "authenticated";

revoke references on table "public"."offices" from "authenticated";

revoke select on table "public"."offices" from "authenticated";

revoke trigger on table "public"."offices" from "authenticated";

revoke truncate on table "public"."offices" from "authenticated";

revoke update on table "public"."offices" from "authenticated";

revoke delete on table "public"."offices" from "service_role";

revoke insert on table "public"."offices" from "service_role";

revoke references on table "public"."offices" from "service_role";

revoke select on table "public"."offices" from "service_role";

revoke trigger on table "public"."offices" from "service_role";

revoke truncate on table "public"."offices" from "service_role";

revoke update on table "public"."offices" from "service_role";

revoke delete on table "public"."parcels" from "anon";

revoke insert on table "public"."parcels" from "anon";

revoke references on table "public"."parcels" from "anon";

revoke select on table "public"."parcels" from "anon";

revoke trigger on table "public"."parcels" from "anon";

revoke truncate on table "public"."parcels" from "anon";

revoke update on table "public"."parcels" from "anon";

revoke delete on table "public"."parcels" from "authenticated";

revoke insert on table "public"."parcels" from "authenticated";

revoke references on table "public"."parcels" from "authenticated";

revoke select on table "public"."parcels" from "authenticated";

revoke trigger on table "public"."parcels" from "authenticated";

revoke truncate on table "public"."parcels" from "authenticated";

revoke update on table "public"."parcels" from "authenticated";

revoke delete on table "public"."parcels" from "service_role";

revoke insert on table "public"."parcels" from "service_role";

revoke references on table "public"."parcels" from "service_role";

revoke select on table "public"."parcels" from "service_role";

revoke trigger on table "public"."parcels" from "service_role";

revoke truncate on table "public"."parcels" from "service_role";

revoke update on table "public"."parcels" from "service_role";

alter table "public"."bus_driver_assignments" alter column "bus_id" set not null;

alter table "public"."bus_driver_assignments" alter column "driver_id" set not null;

alter table "public"."parcels" alter column "bus_id" set not null;

alter table "public"."parcels" alter column "driver_id" set not null;

alter table "public"."parcels" alter column "from_city_id" set not null;

alter table "public"."parcels" alter column "qty" set not null;

alter table "public"."parcels" alter column "to_city_id" set not null;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_latest_customer_contacts()
 RETURNS TABLE(customer_name text, mobile_no text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- The RETURN QUERY statement executes the query and returns its results
  RETURN QUERY
  -- Common Table Expression (CTE) to combine sender and receiver data
  WITH combined_customers AS (
      -- Select sender details
      SELECT
          sender_name AS name,         -- Alias sender_name as name
          sender_mobile_no AS number,  -- Alias sender_mobile_no as number
          created_at                   -- Include the timestamp for ordering
      FROM public.parcels
      UNION ALL -- Combine with receiver details, keeping duplicates for now
      -- Select receiver details
      SELECT
          receiver_name AS name,       -- Alias receiver_name as name
          receiver_mobile_no AS number,-- Alias receiver_mobile_no as number
          created_at                   -- Include the timestamp for ordering
      FROM public.parcels
  ),
  -- CTE to rank the combined customer records based on mobile number and timestamp
  ranked_customers AS (
      SELECT
          name,
          number,
          created_at,
          -- Assign a rank to each record within partitions of the same mobile number.
          -- The latest record (based on created_at descending) gets rank 1.
          ROW_NUMBER() OVER(PARTITION BY number ORDER BY created_at DESC) as rn
      FROM combined_customers
      -- Filter out any potential null or empty string mobile numbers, although
      -- the schema defines them as NOT NULL, this adds robustness.
      WHERE number IS NOT NULL AND trim(number) <> ''
  )
  -- Final SELECT statement to retrieve the latest name for each unique mobile number
  SELECT
      rc.name,    -- The customer name from the ranked results
      rc.number   -- The unique mobile number
  FROM ranked_customers rc
  -- Filter to include only the latest record (rank 1) for each mobile number
  WHERE rc.rn = 1;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_next_bill_no()
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    last_bill_no BIGINT;
    next_bill_no BIGINT;
BEGIN
    -- Get the bill_no from the last created parcel.
    SELECT bill_no INTO last_bill_no
    FROM parcels
    ORDER BY created_at DESC
    LIMIT 1;

    -- If no parcels exist, return 1.
    IF last_bill_no IS NULL THEN
        next_bill_no := 1;
    ELSE
        -- Otherwise, return the last bill_no + 1.
        next_bill_no := last_bill_no + 1;
    END IF;

    RETURN next_bill_no;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_parcel_details_by_bill_no(bill_number integer)
 RETURNS TABLE(from_city_name text, to_city_name text, bill_no integer, created_at timestamp with time zone, parcel_date date, bus_registration text, sender_name text, sender_mobile_no text, receiver_name text, receiver_mobile_no text, description text, qty integer, remark text, amount numeric, amount_given numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
SELECT
  fc.name AS from_city_name,
  tc.name AS to_city_name,
  p.bill_no,
  p.created_at,
  p.parcel_date,
  b.registration_no AS bus_registration,
  p.sender_name,
  p.sender_mobile_no,
  p.receiver_name,
  p.receiver_mobile_no,
  p.description,
  p.qty,
  p.remark,
  p.amount,
  p.amount_given
FROM parcels p
LEFT JOIN buses b ON p.bus_id = b.id
LEFT JOIN drivers d ON p.driver_id = d.id
LEFT JOIN cities fc ON p.from_city_id = fc.id
LEFT JOIN cities tc ON p.to_city_id = tc.id
WHERE p.bill_no = bill_number;
$function$
;

CREATE OR REPLACE FUNCTION public.get_parcels_aggregated_by_date(p_bus_id integer, p_from_city_id integer, p_to_city_id integer, p_start_date date, p_end_date date)
 RETURNS TABLE(parcel_date date, record_count bigint, total_qty numeric, total_amount_given numeric, total_amount_remaining numeric)
 LANGUAGE sql
AS $function$SELECT 
    p.parcel_date,
    COUNT(*)::BIGINT AS record_count,
    COALESCE(SUM(p.qty), 0)::NUMERIC AS total_qty,
    COALESCE(SUM(p.amount_given), 0)::NUMERIC AS total_amount_given,
    COALESCE(SUM(p.amount), 0) - COALESCE(SUM(p.amount_given), 0)::NUMERIC AS total_amount_remaining
  FROM 
    public.parcels p
  WHERE 
    p.bus_id = p_bus_id
    AND p.from_city_id = p_from_city_id
    AND p.to_city_id = p_to_city_id
    AND p.parcel_date BETWEEN p_start_date AND p_end_date
  GROUP BY 
    p.parcel_date
  ORDER BY 
    p.parcel_date ASC;$function$
;

CREATE OR REPLACE FUNCTION public.get_unique_descriptions_and_remarks()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare
  descriptions json;
  remarks json;
begin
  select json_agg(description) into descriptions
  from (
    select distinct description
    from parcels
    where description is not null
  ) as sub;

  select json_agg(remark) into remarks
  from (
    select distinct remark
    from parcels
    where remark is not null
  ) as sub;

  return json_build_object(
    'descriptions', descriptions,
    'remarks', remarks
  );
end;
$function$
;


