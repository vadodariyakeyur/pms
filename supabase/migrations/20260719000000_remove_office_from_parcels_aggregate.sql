-- Revert office_id filter; no-op safe if the 6-arg version was never applied.
DROP FUNCTION IF EXISTS public.get_parcels_aggregated_by_date(integer, integer, integer, integer, date, date);

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
