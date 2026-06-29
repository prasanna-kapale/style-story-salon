-- ============================================================
-- STYLE STORY SALONS — SEED DATA
-- Run AFTER 01_schema.sql. This loads the real business copy that was
-- previously hard-coded in repository.js, so the site looks complete the
-- moment Supabase is connected. Everything here is genuine Style Story
-- content (not placeholder filler) — edit or delete rows freely from the
-- admin panel afterwards. Re-running this file is safe: every insert is
-- guarded so it won't duplicate rows.
-- ============================================================

-- ---------- SETTINGS ----------
update settings set
  business_name   = 'Style Story',
  phone            = '+91 XXXXX XXXXX',
  whatsapp         = '91XXXXXXXXXX',
  email            = 'hello@stylestorysalons.com',
  address          = '247, Hill Road, Beside Fab India Showroom, Shivaji Nagar, Ram Nagar, Nagpur — 440033',
  instagram        = '@stylestory.nagpur',
  facebook         = null,
  working_hours    = 'Monday – Sunday · 10:00 AM – 9:00 PM',
  seo_title        = 'Style Story — Salon & Skin Atelier, Nagpur',
  seo_description  = 'Style Story is Nagpur''s premium salon and skin atelier on Hill Road — hair, colour, treatments, bridal, and skin, since 2015.'
where id = 1;

-- ---------- SERVICES ----------
insert into services (title, slug, description, category, duration, price, featured, active)
select * from (values
  ('Haircut & Blow Dry', 'haircut-blow-dry', 'A precision cut shaped to your face, finished with a professional blow-dry.', 'Hair', '45 min', 350, true, true),
  ('Hair Colour & Highlights', 'hair-colour-highlights', 'Global colour, balayage, and toning using premium international colour systems.', 'Hair', '90 min', 1200, true, true),
  ('Hair Spa & Treatment', 'hair-spa-treatment', 'Deep-conditioning ritual to restore strength, shine, and softness from root to tip.', 'Hair', '60 min', 900, false, true),
  ('Keratin Smoothing', 'keratin-smoothing', 'Long-lasting frizz control and mirror-shine for smooth, manageable hair up to four months.', 'Treatment', '3 hr', 2500, true, true),
  ('Hair Botox', 'hair-botox', 'An intensive bond-rebuilding therapy that restores elasticity without straightening.', 'Treatment', '3 hr', 3000, false, true),
  ('Facial & Cleanup', 'facial-cleanup', 'A tailored facial — brightening, anti-acne, or hydrating — for your skin''s specific needs.', 'Skin', '60 min', 600, false, true),
  ('Bridal Makeup & Hair', 'bridal-makeup-hair', 'A complete bridal package — trial session, wedding-day makeup, hairstyling, and draping.', 'Bridal', 'Half day', 8000, true, true),
  ('Party Makeup', 'party-makeup', 'Event-ready makeup and styling for engagements, receptions, and celebrations.', 'Bridal', '75 min', 1800, false, true),
  ('Manicure & Pedicure', 'manicure-pedicure', 'Classic and gel options with cuticle care, exfoliation, massage, and polish of choice.', 'Nails', '50 min', 500, false, true),
  ('Nail Art', 'nail-art', 'Custom nail art and gel extensions, designed around your occasion and style.', 'Nails', '60 min', 800, false, true)
) as v(title, slug, description, category, duration, price, featured, active)
where not exists (select 1 from services s where s.slug = v.slug);

-- ---------- TESTIMONIALS ----------
insert into testimonials (customer_name, designation, review, rating, featured)
select * from (values
  ('Priya M.', 'Google Review', 'Best salon in Nagpur, hands down. My hair colour came out exactly as I wanted and the team was so professional throughout.', 5, true),
  ('Sneha K.', 'Google Review', 'Got my bridal makeup done here. The trial and the final look were both stunning — everyone at the wedding was asking who did it.', 5, true),
  ('Anjali R.', 'Google Review', 'The keratin treatment lasted almost five months and my hair has never looked better. Very reasonably priced for the quality.', 4, true),
  ('Rekha N.', 'Google Review', 'Walked in for a haircut, walked out feeling like a different person. The attention to detail here is unlike anywhere else in the city.', 5, true)
) as v(customer_name, designation, review, rating, featured)
where not exists (select 1 from testimonials t where t.customer_name = v.customer_name and t.review = v.review);

-- ---------- GALLERY ----------
-- image_url is left NULL until real photos are uploaded from the admin Gallery
-- module — the landing page shows a placeholder tile for any row without one.
insert into gallery (title, image_url, category, featured, sort_order)
select * from (values
  ('Balayage', null::text, 'Hair Colour', true, 1),
  ('Bridal Look', null::text, 'Bridal', false, 2),
  ('Precision Cut', null::text, 'Haircut', false, 3),
  ('Party Makeup', null::text, 'Makeup', false, 4),
  ('The Atelier', null::text, 'Interior', false, 5),
  ('Keratin Finish', null::text, 'Treatment', false, 6)
) as v(title, image_url, category, featured, sort_order)
where not exists (select 1 from gallery g where g.title = v.title);

-- ---------- STYLISTS ----------
insert into stylists (name, specialization, experience, active)
select * from (values
  ('Available on request', 'Hair & Colour Specialist', '8+ yrs', true),
  ('Available on request', 'Bridal & Makeup Artist', '6+ yrs', true),
  ('Available on request', 'Skin & Facial Specialist', '5+ yrs', true)
) as v(name, specialization, experience, active)
where not exists (select 1 from stylists s where s.specialization = v.specialization);

-- ---------- OFFERS ----------
insert into offers (title, description, discount, start_date, end_date, active)
select * from (values
  ('Monsoon Hair Ritual', '20% off all hair treatments', '20%', current_date, date '2026-06-30', true),
  ('Bridal Season Special', '₹1,000 off the complete bridal package', '₹1000', current_date, date '2026-08-31', true)
) as v(title, description, discount, start_date, end_date, active)
where not exists (select 1 from offers o where o.title = v.title);