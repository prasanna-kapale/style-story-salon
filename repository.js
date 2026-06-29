/**
 * STYLE STORY — DATA REPOSITORY LAYER
 * ------------------------------------------------------------
 * Every repository below returns mock data today. When you connect
 * Supabase, swap the body of each function for a `supabase.from(...)`
 * call — the function signature and return shape stay identical, so
 * NOTHING in the UI layer (script.js) needs to change.
 *
 * Pattern:
 *   export async function getServices() { ...mock today, supabase later... }
 *
 * When you migrate to Next.js, this file maps 1:1 onto:
 *   /repositories/services.repository.ts
 *   /repositories/testimonials.repository.ts
 *   /repositories/gallery.repository.ts
 *   /repositories/stylists.repository.ts
 *   /repositories/offers.repository.ts
 *   /repositories/settings.repository.ts
 * ------------------------------------------------------------
 */

const StyleStoryRepo = (() => {

  // ---------- SETTINGS REPOSITORY ----------
  async function getSettings() {
    return {
      brandName: "Style Story",
      tagline: "Salon & Skin Atelier",
      city: "Nagpur",
      established: 2015,
      address: {
        line1: "247, Hill Road",
        line2: "Beside Fab India Showroom, Shivaji Nagar, Ram Nagar",
        city: "Nagpur",
        pincode: "440033",
      },
      hours: "Monday – Sunday · 10:00 AM – 9:00 PM",
      phoneDisplay: "+91 XXXXX XXXXX",
      whatsappNumber: "91XXXXXXXXXX", // NEXT_PUBLIC_WHATSAPP_NUMBER in production
      googleRating: 4.7,
      googleReviewCount: 353,
      instagramHandle: "@stylestory.nagpur",
    };
  }

  // ---------- SERVICES REPOSITORY ----------
  async function getServices() {
    return [
      {
        id: "haircut",
        category: "Hair",
        name: "Haircut & Blow Dry",
        description: "A precision cut shaped to your face, finished with a professional blow-dry.",
        priceFrom: 350,
        duration: "45 min",
      },
      {
        id: "colour",
        category: "Hair",
        name: "Hair Colour & Highlights",
        description: "Global colour, balayage, and toning using premium international colour systems.",
        priceFrom: 1200,
        duration: "90 min",
      },
      {
        id: "spa",
        category: "Hair",
        name: "Hair Spa & Treatment",
        description: "Deep-conditioning ritual to restore strength, shine, and softness from root to tip.",
        priceFrom: 900,
        duration: "60 min",
      },
      {
        id: "keratin",
        category: "Treatment",
        name: "Keratin Smoothing",
        description: "Long-lasting frizz control and mirror-shine for smooth, manageable hair up to four months.",
        priceFrom: 2500,
        duration: "3 hr",
      },
      {
        id: "botox",
        category: "Treatment",
        name: "Hair Botox",
        description: "An intensive bond-rebuilding therapy that restores elasticity without straightening.",
        priceFrom: 3000,
        duration: "3 hr",
      },
      {
        id: "facial",
        category: "Skin",
        name: "Facial & Cleanup",
        description: "A tailored facial — brightening, anti-acne, or hydrating — for your skin's specific needs.",
        priceFrom: 600,
        duration: "60 min",
      },
      {
        id: "bridal",
        category: "Bridal",
        name: "Bridal Makeup & Hair",
        description: "A complete bridal package — trial session, wedding-day makeup, hairstyling, and draping.",
        priceFrom: 8000,
        duration: "Half day",
      },
      {
        id: "party-makeup",
        category: "Bridal",
        name: "Party Makeup",
        description: "Event-ready makeup and styling for engagements, receptions, and celebrations.",
        priceFrom: 1800,
        duration: "75 min",
      },
      {
        id: "mani-pedi",
        category: "Nails",
        name: "Manicure & Pedicure",
        description: "Classic and gel options with cuticle care, exfoliation, massage, and polish of choice.",
        priceFrom: 500,
        duration: "50 min",
      },
      {
        id: "nail-art",
        category: "Nails",
        name: "Nail Art",
        description: "Custom nail art and gel extensions, designed around your occasion and style.",
        priceFrom: 800,
        duration: "60 min",
      },
    ];
  }

  // ---------- TESTIMONIALS REPOSITORY ----------
  async function getTestimonials() {
    return [
      {
        id: "t1",
        name: "Priya M.",
        source: "Google Review",
        rating: 5,
        text: "Best salon in Nagpur, hands down. My hair colour came out exactly as I wanted and the team was so professional throughout.",
        avatarInitial: "P",
      },
      {
        id: "t2",
        name: "Sneha K.",
        source: "Google Review",
        rating: 5,
        text: "Got my bridal makeup done here. The trial and the final look were both stunning — everyone at the wedding was asking who did it.",
        avatarInitial: "S",
      },
      {
        id: "t3",
        name: "Anjali R.",
        source: "Google Review",
        rating: 4,
        text: "The keratin treatment lasted almost five months and my hair has never looked better. Very reasonably priced for the quality.",
        avatarInitial: "A",
      },
      {
        id: "t4",
        name: "Rekha N.",
        source: "Google Review",
        rating: 5,
        text: "Walked in for a haircut, walked out feeling like a different person. The attention to detail here is unlike anywhere else in the city.",
        avatarInitial: "R",
      },
    ];
  }

  // ---------- GALLERY REPOSITORY ----------
  // NOTE: image URLs point to /assets/gallery/ — swap with Supabase Storage
  // public URLs once images are uploaded to the `gallery` bucket.
  async function getGalleryItems() {
    return [
      { id: "g1", label: "Balayage", category: "Hair Colour", size: "large" },
      { id: "g2", label: "Bridal Look", category: "Bridal", size: "small" },
      { id: "g3", label: "Precision Cut", category: "Haircut", size: "small" },
      { id: "g4", label: "Party Makeup", category: "Makeup", size: "small" },
      { id: "g5", label: "The Atelier", category: "Interior", size: "small" },
      { id: "g6", label: "Keratin Finish", category: "Treatment", size: "small" },
    ];
  }

  // ---------- STYLISTS REPOSITORY ----------
  async function getStylists() {
    return [
      { id: "s1", name: "Available on request", specialization: "Hair & Colour Specialist", experience: "8+ yrs" },
      { id: "s2", name: "Available on request", specialization: "Bridal & Makeup Artist", experience: "6+ yrs" },
      { id: "s3", name: "Available on request", specialization: "Skin & Facial Specialist", experience: "5+ yrs" },
    ];
  }

  // ---------- OFFERS REPOSITORY ----------
  async function getActiveOffers() {
    return [
      { id: "o1", title: "Monsoon Hair Ritual", description: "20% off all hair treatments", validTill: "30 Jun 2026" },
      { id: "o2", title: "Bridal Season Special", description: "₹1,000 off the complete bridal package", validTill: "31 Aug 2026" },
    ];
  }

  return {
    getSettings,
    getServices,
    getTestimonials,
    getGalleryItems,
    getStylists,
    getActiveOffers,
  };
})();
