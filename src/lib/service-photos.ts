/**
 * Service photos — real photography from Pixabay (Pixabay Content License: free for commercial use, no attribution
 * required; photographers are still credited on /{locale}/credits). Self-hosted in
 * public/images/services/{slug}-{480|960}-{v}.webp, cropped to 16:10. Services without an entry show their icon.
 */
export type ServicePhoto = { v: string; page: string; author: string };

export const servicePhotos: Record<string, ServicePhoto> = {
  "visa-application-assistance": {
    "v": "04305530",
    "page": "https://pixabay.com/photos/passport-smile-travel-exploration-7564502/",
    "author": "Getkeel123"
  },
  "visa-consultation": {
    "v": "051fdbd1",
    "page": "https://pixabay.com/photos/focused-american-men-customer-meeting-8165458/",
    "author": "ThomasMDesign"
  },
  "document-preparation": {
    "v": "ee7507bc",
    "page": "https://pixabay.com/photos/folders-files-office-binders-desk-7382940/",
    "author": "RosZie"
  },
  "appointment-guidance": {
    "v": "04b7883a",
    "page": "https://pixabay.com/photos/meeting-calendar-saturday-weekend-273857/",
    "author": "Basti93"
  },
  "application-follow-up": {
    "v": "26a05c96",
    "page": "https://pixabay.com/photos/girl-smartphone-happy-portrait-7078324/",
    "author": "sewuparistudio"
  },
  "online-procedures": {
    "v": "534e4258",
    "page": "https://pixabay.com/photos/computer-desk-typing-laptop-1867758/",
    "author": "Pexels"
  },
  "administrative-forms": {
    "v": "267ad170",
    "page": "https://pixabay.com/photos/man-men-person-people-male-3653353/",
    "author": "F1Digitals"
  },
  "translation-coordination": {
    "v": "695bf933",
    "page": "https://pixabay.com/photos/spanish-language-error-learn-speak-761512/",
    "author": "777546"
  },
  "document-scanning-pdf": {
    "v": "0ef7c253",
    "page": "https://pixabay.com/photos/print-digital-printing-scan-office-2797178/",
    "author": "CreaPark"
  },
  "flight-reservation": {
    "v": "0c87841a",
    "page": "https://pixabay.com/photos/aircraft-aircraft-wing-airplane-1868097/",
    "author": "Pexels"
  },
  "hotel-reservation": {
    "v": "4dfdac94",
    "page": "https://pixabay.com/photos/bed-hotel-luxurious-bedroom-4416515/",
    "author": "Engin_Akyurt"
  },
  "travel-insurance": {
    "v": "7a3b74b0",
    "page": "https://pixabay.com/photos/merry-christmas-boarding-pass-travel-5219496/",
    "author": "JoshuaWoroniecki"
  },
  "travel-assistance": {
    "v": "aa4165ce",
    "page": "https://pixabay.com/photos/globe-trotter-traveller-globe-map-1828079/",
    "author": "822640"
  },
  "airport-transfers": {
    "v": "a28cb061",
    "page": "https://pixabay.com/photos/taxi-airport-to-travel-vacations-3960176/",
    "author": "652234"
  },
  "esim": {
    "v": "35fad178",
    "page": "https://pixabay.com/photos/woman-cigarette-casual-looking-7916611/",
    "author": "Surprising_Media"
  },
  "university-application": {
    "v": "f4afdbdd",
    "page": "https://pixabay.com/photos/people-students-university-campus-6027028/",
    "author": "naassomz1"
  },
  "university-documents": {
    "v": "a0a9319e",
    "page": "https://pixabay.com/photos/graduation-college-graduate-4502796/",
    "author": "Leo_Fontes"
  },
  "student-visa-preparation": {
    "v": "6eb845d5",
    "page": "https://pixabay.com/photos/read-a-book-woman-young-795943/",
    "author": "422737"
  },
  "student-accommodation": {
    "v": "03d265ed",
    "page": "https://pixabay.com/photos/laptop-woman-education-study-young-3087585/",
    "author": "JESHOOTS-com"
  },
  "student-arrival": {
    "v": "2e19b009",
    "page": "https://pixabay.com/photos/airport-woman-flight-boarding-2373727/",
    "author": "JESHOOTS-com"
  }
};

/** Portrait (3:4) versions for tall cards, where one exists. */
const TALL = new Set(["visa-application-assistance"]);

export function servicePhotoTallSrc(slug: string) {
  const p = servicePhotos[slug];
  return p && TALL.has(slug) ? `/images/services/${slug}-tall-600-${p.v}.webp` : null;
}

export function servicePhotoSrc(slug: string, w: 480 | 960) {
  const p = servicePhotos[slug];
  return p ? `/images/services/${slug}-${w}-${p.v}.webp` : null;
}
