-- Privileged reporting functions are invoked only by trusted server code using
-- the service role. Do not expose them directly to authenticated browser clients.
revoke all on function public.get_teacher_report(uuid, uuid, integer) from public;
revoke all on function public.get_teacher_report(uuid, uuid, integer) from anon;
revoke all on function public.get_teacher_report(uuid, uuid, integer) from authenticated;
grant execute on function public.get_teacher_report(uuid, uuid, integer) to service_role;

revoke all on function public.get_dashboard_statistics(uuid) from public;
revoke all on function public.get_dashboard_statistics(uuid) from anon;
revoke all on function public.get_dashboard_statistics(uuid) from authenticated;
grant execute on function public.get_dashboard_statistics(uuid) to service_role;
