-- Referencia de masterplan:kit-datos. Tabla de negocio multi-tenant con RLS completa.
-- Supone las tablas orgs y memberships y las funciones is_member/has_role de masterplan:kit-auth.

create table public.proyectos (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  nombre      text not null check (char_length(nombre) between 1 and 120),
  estado      text not null default 'activo' check (estado in ('activo', 'archivado')),
  presupuesto_centavos bigint not null default 0 check (presupuesto_centavos >= 0),
  moneda      char(3) not null default 'COP',
  creado_por  uuid not null default auth.uid() references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Índices por consulta: la lista de la org (política + pantalla) y la papelera.
create index proyectos_org_lista_idx on public.proyectos (org_id, created_at desc, id)
  where deleted_at is null;
create index proyectos_papelera_idx on public.proyectos (deleted_at)
  where deleted_at is not null;

-- updated_at automático (la función se crea una vez en la migración base).
create or replace function public.tocar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger proyectos_updated_at before update on public.proyectos
  for each row execute function public.tocar_updated_at();

-- RLS: habilitada siempre, una política por operación.
alter table public.proyectos enable row level security;

create policy proyectos_select on public.proyectos for select to authenticated
  using (deleted_at is null and public.is_member(org_id));

create policy proyectos_insert on public.proyectos for insert to authenticated
  with check (public.is_member(org_id) and creado_por = auth.uid());

-- with check evita mover la fila a otra org.
create policy proyectos_update on public.proyectos for update to authenticated
  using (public.is_member(org_id))
  with check (public.is_member(org_id));

create policy proyectos_delete on public.proyectos for delete to authenticated
  using (public.has_role(org_id, array['owner', 'admin']));

-- Ninguna política para anon: un anónimo ve 0 filas.
