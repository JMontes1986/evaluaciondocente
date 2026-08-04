create index if not exists audit_logs_created_at_idx
on public.audit_logs (created_at desc);

create index if not exists audit_logs_user_created_idx
on public.audit_logs (user_id, created_at desc);

create index if not exists audit_logs_action_created_idx
on public.audit_logs (action, created_at desc);

create index if not exists audit_logs_entity_created_idx
on public.audit_logs (entity, created_at desc);

create index if not exists audit_logs_metadata_gin_idx
on public.audit_logs using gin (metadata);
