-- LexCalc — Migração inicial
-- Execute no SQL Editor do Supabase

-- ────────────────────────────────────────────────────────────────────────────
-- profiles (vinculado a auth.users)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users primary key,
  nome text,
  oab text,
  avatar_url text,
  plano text default 'free',
  propostas_mes int default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Usuário vê seu próprio perfil"
  on profiles for all
  using (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao registrar usuário
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- clientes
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  nome text not null,
  email text,
  telefone text,
  cpf_cnpj text,
  tipo_cliente text default 'PF',
  observacoes text,
  created_at timestamptz default now()
);

alter table clientes enable row level security;

create policy "user owns clientes"
  on clientes for all
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- propostas
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists propostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  cliente_id uuid references clientes(id),
  numero serial,
  status text default 'rascunho',
  tipo_acao text,
  horas numeric default 0,
  valor_hora numeric default 450,
  honorario_base numeric default 0,
  fator_complexidade numeric default 1.3,
  imposto_pct numeric default 13.33,
  parcelamento text default 'À vista',
  valor_total numeric default 0,
  pdf_url text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table propostas enable row level security;

create policy "user owns propostas"
  on propostas for all
  using (auth.uid() = user_id);

-- Trigger: atualiza updated_at automaticamente
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger propostas_updated_at
  before update on propostas
  for each row execute procedure set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- casos_exito
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists casos_exito (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  nome text not null,
  proveito numeric default 0,
  perc_exito numeric default 30,
  probabilidade text default 'Alta',
  meses int default 24,
  created_at timestamptz default now()
);

alter table casos_exito enable row level security;

create policy "user owns casos_exito"
  on casos_exito for all
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- configuracoes_escritorio
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists configuracoes_escritorio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) unique not null,
  nome_escritorio text,
  oab text,
  valor_hora_padrao numeric default 450,
  imposto_padrao numeric default 13.33,
  fator_padrao text default 'Intermediário',
  logo_url text,
  cor_primaria text default '#1e3a5f',
  updated_at timestamptz default now()
);

alter table configuracoes_escritorio enable row level security;

create policy "user owns configuracoes_escritorio"
  on configuracoes_escritorio for all
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Storage bucket para PDFs
-- ────────────────────────────────────────────────────────────────────────────
-- Execute separadamente no Supabase Storage ou via API:
-- insert into storage.buckets (id, name, public) values ('propostas-pdf', 'propostas-pdf', false);
-- create policy "user uploads own pdfs" on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "user reads own pdfs" on storage.objects for select using (auth.uid()::text = (storage.foldername(name))[1]);
