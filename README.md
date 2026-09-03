# Frontend React — Agendamentos

Tela responsiva de Login/Registro em React + JavaScript usando Material UI (MUI).

## Instalação

```bash
npm.cmd install
```

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd`.

## Configuração

Copie `.env.example` para `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Executar

```bash
npm.cmd run dev
```

A aplicação normalmente abrirá em `http://localhost:5173`.

## Backend

Login:
`POST /api/auth/login`

Registro:
`POST /api/auth/register`

O JWT retornado pela API é salvo em `localStorage` como `auth_token`, e o usuário como `auth_user`.

O próximo passo é criar o Dashboard e um interceptor Axios para enviar:
`Authorization: Bearer SEU_TOKEN`
nas rotas protegidas.
