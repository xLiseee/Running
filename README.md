# Running Tracker op Vercel

Deze app kan nu als Vercel-project deployed worden met een API in `api/`.

## Wat is veranderd

- De oude `server.js` backend is niet meer nodig voor Vercel.
- API-endpoints zijn omgezet naar Vercel serverless functions in `api/program/...`.
- Data wordt via Supabase opgeslagen voor gedeelde voortgang.
- Frontend laadt de status via `/api/program`.

## Vereisten

- Vercel account
- Supabase account

## Supabase inrichten

1. Maak een nieuw Supabase project aan.
2. Ga naar `SQL Editor` en voer deze query uit:

```sql
create table running_program (
  id text primary key,
  program jsonb,
  updated_at timestamptz default now()
);
```

3. Maak een `anon` of service role key in `Settings > API`.

## Vercel environment variables

Stel in Vercel de volgende variabelen in:

- `SUPABASE_URL`
- `SUPABASE_KEY`

## Deploy naar Vercel

1. Zet de project root op de map `Running`
2. Voeg `package.json` en `api/` toe
3. Deploy met:

```bash
cd "/Users/liseversmissen/Documents/Running app/Running"
vercel
```

## Lokale test

Je kunt lokaal blijven testen met de oude Express backend:

```bash
cd "/Users/liseversmissen/Documents/Running app/Running"
npm install
npm start
```

## Belangrijk

- Op Vercel moet de app draaien vanuit de `Running` map.
- De echte gedeelde status werkt pas als je Supabase env vars hebt ingesteld.
