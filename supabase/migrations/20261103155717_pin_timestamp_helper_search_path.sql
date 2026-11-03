-- Only trusted built-ins are needed; preserve the function, grants and bindings.
alter function public.touch_updated_at() set search_path = pg_catalog;
