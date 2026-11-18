/**
 * Home hero photos — real travel photography from Pixabay (Pixabay Content License: free for commercial use, no
 * attribution required; photographers are still credited on /{locale}/credits). Self-hosted in
 * public/images/hero/{name}-{360|640}-{v}.webp, cropped to 4:5.
 */
export type HeroPhoto = { v: string; page: string; author: string };

export const heroPhotos = {
  "beach": {
    "v": "91f1a7b6",
    "page": "https://pixabay.com/photos/mexico-cancel-sun-party-summer-2459322/",
    "author": "EmilianDanaila"
  },
  "family-sea": {
    "v": "1853eb7a",
    "page": "https://pixabay.com/photos/father-daughter-beach-family-daddy-656734/",
    "author": "sarahbernier3140"
  },
  "green": {
    "v": "e9c79975",
    "page": "https://pixabay.com/photos/hiking-mountain-nature-valley-top-4369332/",
    "author": "Tumisu"
  },
  "old-town": {
    "v": "a33fd531",
    "page": "https://pixabay.com/photos/sicily-taormina-street-scene-city-2186830/",
    "author": "user32212"
  }
} satisfies Record<string, HeroPhoto>;

export type HeroPhotoName = keyof typeof heroPhotos;

export function heroPhotoSrc(name: HeroPhotoName, w: 360 | 640) {
  return `/images/hero/${name}-${w}-${heroPhotos[name].v}.webp`;
}
