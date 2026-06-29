# Style Story Salons — Setup Guide

Everything in this project is real, working code — there is nothing to "finish" in
the code itself. The steps below connect it to your own Supabase project and put
your real business details in.

## 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's ready, open **SQL Editor** and run, in order:
   - `sql/01_schema.sql` — creates every table, security policy, and the storage bucket.
   - `sql/02_seed.sql` — loads the real Style Story copy (services, testimonials, etc.)
     that used to be hard-coded in the mock repository, so the site isn't empty.
3. Open **Project Settings → API**. You'll need the **Project URL** and the
   **anon public key** for step 3 below.

## 2. Create your one admin login
The admin panel uses a single salon-owner account — no sign-up flow on purpose.
1. In Supabase, go to **Authentication → Users → Add user**.
2. Enter your email and a password. Toggle **Auto Confirm User** on.
3. That's it — this is the only account that can sign in to `admin.html`. Any other
   visitor only ever gets the public, read-only/booking-only access defined by the
   RLS policies in `01_schema.sql`.

## 3. Fill in `config.js`
Open `config.js` and replace the three placeholder values:

```js
NEXT_PUBLIC_SUPABASE_URL: "https://YOUR-PROJECT-REF.supabase.co",
NEXT_PUBLIC_SUPABASE_ANON_KEY: "YOUR-SUPABASE-ANON-PUBLIC-KEY",
NEXT_PUBLIC_WHATSAPP_NUMBER: "91XXXXXXXXXX", // digits only, country code first
```
The anon key is safe to ship in client-side code — every table it can touch is
locked down by the RLS policies you just ran, not by hiding this key. Never put
the Supabase **service_role** key anywhere in this project.

## 4. Add your real business details
1. Open `admin.html` in a browser, sign in with the account from step 2.
2. Go to **Settings** and fill in your real phone, WhatsApp number, address,
   hours, Instagram, and upload your logo/favicon/hero image.
3. Go to **Services**, **Gallery**, **Testimonials**, **Stylists**, **Offers** and
   replace or add to the seeded content with your real photos and copy.

## 5. Deploy
This is a static site — any static host works (Netlify, Vercel, GitHub Pages,
Cloudflare Pages, or your own server). Upload the whole folder, including
`config.js` with your real credentials filled in. There is no build step.

## File map
| File | Purpose |
|---|---|
| `index.html`, `script.js`, `styles.css` | The public landing page (design unchanged) |
| `admin.html`, `admin.css`, `admin.js` | The admin panel |
| `repository.js` | Data access layer — the only thing that talks to Supabase tables |
| `upload.js` | Image compression + Supabase Storage upload/delete |
| `auth.js` | Admin sign-in / sign-out / session |
| `booking-service.js` | Saves a booking, then opens WhatsApp |
| `supabase-client.js`, `config.js` | Supabase connection setup |
| `sql/01_schema.sql` | Tables, triggers, Row Level Security, storage bucket |
| `sql/02_seed.sql` | Initial content (safe to re-run, won't duplicate) |

## A note on `salon.html`
`salon.html` was in the uploaded files but is an earlier draft of `index.html`
(missing a couple of recent markup tweaks). It hasn't been touched — `index.html`
is the production landing page this whole project wires up. Let me know if you'd
like `salon.html` removed or brought in sync instead.

## A note on Offers
The `offers` table, repository, and full admin CRUD module are built and working.
The public landing page doesn't display an offers section yet, since adding one
would mean adding new layout to a design you said is final. Say the word if you'd
like a tasteful offers strip added (e.g. inside the hero or as a small banner).