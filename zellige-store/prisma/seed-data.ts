/**
 * Starter content. Prices, stock, delivery fees and exchange rates are PLACEHOLDERS: set real values in the admin.
 * Products describe only what the photos show (printed zellige-inspired patterns); none is labelled handmade.
 */
type T = { fr: string; ar: string; en: string };

export const categories: { slug: string; name: T; description?: T; image?: string; children: { slug: string; name: T }[] }[] = [
  {
    slug: "ceramique-marocaine",
    name: { fr: "Céramique marocaine", ar: "الخزف المغربي", en: "Moroccan ceramics" },
    description: { fr: "Mugs, tasses, bols et assiettes aux motifs zellige.", ar: "أكواب وفناجين وأوعية وصحون بزخارف الزليج.", en: "Mugs, cups, bowls and plates with zellige patterns." },
    image: "/catalog/i-love-morocco-mug.jpg",
    children: [
      { slug: "mugs-zellige", name: { fr: "Mugs zellige", ar: "أكواب الزليج", en: "Zellige mugs" } },
      { slug: "tasses-the-cafe", name: { fr: "Tasses à thé et à café", ar: "فناجين الشاي والقهوة", en: "Tea and coffee cups" } },
      { slug: "services-a-the", name: { fr: "Services à thé", ar: "أطقم الشاي", en: "Tea sets" } },
      { slug: "bols", name: { fr: "Bols en céramique", ar: "أوعية خزفية", en: "Ceramic bowls" } },
      { slug: "assiettes-decoratives", name: { fr: "Assiettes décoratives", ar: "صحون مزخرفة", en: "Decorative plates" } },
      { slug: "plats-de-service", name: { fr: "Plats de service", ar: "أطباق التقديم", en: "Serving dishes" } },
      { slug: "cuilleres-accessoires", name: { fr: "Cuillères et accessoires", ar: "ملاعق وإكسسوارات", en: "Spoons and accessories" } },
    ],
  },
  {
    slug: "decoration-maison",
    name: { fr: "Décoration de la maison", ar: "ديكور المنزل", en: "Home decoration" },
    description: { fr: "Plateaux, miroirs, bougies et objets décoratifs.", ar: "صواني ومرايا وشموع وقطع ديكور.", en: "Trays, mirrors, candles and decorative objects." },
    image: "/catalog/rose-candle-tin.jpg",
    children: [
      { slug: "plateaux-decoratifs", name: { fr: "Plateaux décoratifs", ar: "صواني مزخرفة", en: "Decorative trays" } },
      { slug: "miroirs-mosaique", name: { fr: "Miroirs mosaïque", ar: "مرايا الفسيفساء", en: "Mosaic mirrors" } },
      { slug: "vases", name: { fr: "Vases décoratifs", ar: "مزهريات", en: "Decorative vases" } },
      { slug: "bougies-photophores", name: { fr: "Bougies et photophores", ar: "شموع وحاملات شموع", en: "Candles and candle holders" } },
      { slug: "lampes", name: { fr: "Lampes en céramique", ar: "مصابيح خزفية", en: "Ceramic lamps" } },
      { slug: "decoration-murale", name: { fr: "Décoration murale", ar: "ديكور جداري", en: "Wall decoration" } },
      { slug: "objets-mosaique", name: { fr: "Objets en mosaïque", ar: "قطع فسيفساء", en: "Mosaic objects" } },
    ],
  },
  {
    slug: "cuisine-art-de-la-table",
    name: { fr: "Cuisine et art de la table", ar: "المطبخ وفن المائدة", en: "Kitchen and dining" },
    description: { fr: "Pour servir le thé et dresser une belle table.", ar: "لتقديم الشاي وتزيين المائدة.", en: "For serving tea and setting a beautiful table." },
    image: "/catalog/serving-paddle.jpg",
    children: [
      { slug: "plateaux-de-service", name: { fr: "Plateaux et planches de service", ar: "صواني وألواح التقديم", en: "Serving trays and boards" } },
      { slug: "assiettes-et-bols", name: { fr: "Assiettes et bols", ar: "صحون وأوعية", en: "Plates and bowls" } },
      { slug: "accessoires-the", name: { fr: "Accessoires à thé", ar: "مستلزمات الشاي", en: "Tea accessories" } },
      { slug: "sucriers", name: { fr: "Sucriers", ar: "سكريات", en: "Sugar bowls" } },
      { slug: "boites-a-epices", name: { fr: "Boîtes à épices", ar: "علب التوابل", en: "Spice containers" } },
      { slug: "decoration-de-table", name: { fr: "Décoration de table", ar: "زينة المائدة", en: "Table decoration" } },
    ],
  },
  {
    slug: "cadeaux-marocains",
    name: { fr: "Cadeaux marocains", ar: "هدايا مغربية", en: "Moroccan gifts" },
    description: { fr: "Coffrets et souvenirs prêts à offrir.", ar: "علب وتذكارات جاهزة للإهداء.", en: "Gift sets and keepsakes, ready to offer." },
    image: "/catalog/star-cup-giftbox.jpg",
    children: [
      { slug: "coffrets-cadeaux", name: { fr: "Coffrets cadeaux", ar: "علب الهدايا", en: "Gift sets" } },
      { slug: "souvenirs-du-maroc", name: { fr: "Souvenirs du Maroc", ar: "تذكارات من المغرب", en: "Moroccan souvenirs" } },
      { slug: "ceramique-personnalisee", name: { fr: "Céramique personnalisée", ar: "خزف مخصص", en: "Personalised ceramics" } },
      { slug: "ecrins-premium", name: { fr: "Écrins premium", ar: "علب فاخرة", en: "Premium gift boxes" } },
      { slug: "mariages-occasions", name: { fr: "Mariages et occasions", ar: "الأعراس والمناسبات", en: "Weddings and occasions" } },
    ],
  },
];

const ceramicCare: T = {
  fr: "Laver délicatement à la main avec une éponge douce. Éviter les produits abrasifs pour préserver le décor.",
  ar: "يُغسل برفق باليد باستعمال إسفنجة ناعمة. تجنّب المنظفات الخشنة للحفاظ على الزخرفة.",
  en: "Wash gently by hand with a soft sponge. Avoid abrasive products to protect the decoration.",
};
const ceramic: T = {
  fr: "Céramique émaillée blanche, décor zellige imprimé, finition brillante.",
  ar: "خزف أبيض مزجّج بزخرفة زليج مطبوعة ولمسة نهائية لامعة.",
  en: "White glazed ceramic with a printed zellige decoration and glossy finish.",
};

export type SeedProduct = {
  sku: string;
  slug: string;
  category: string;
  name: T;
  short: T;
  description: T;
  materials?: T;
  care?: T;
  price: number;
  compareAt?: number;
  stock: number;
  colors: string[];
  patterns: string[];
  images: string[];
  featured?: boolean;
  giftable?: boolean;
  personalizable?: boolean;
  variants?: { sku: string; name: T; pattern?: string; color?: string; stock: number; price?: number; image?: string }[];
};

export const products: SeedProduct[] = [
  {
    sku: "DZ-CUP-001",
    slug: "tasse-expresso-soucoupe-morocco",
    category: "tasses-the-cafe",
    name: { fr: "Tasse expresso et soucoupe « Morocco »", ar: "فنجان قهوة مع صحن «Morocco»", en: "“Morocco” espresso cup and saucer" },
    short: {
      fr: "Petite tasse à motif d'étoiles et sa soucoupe aux grandes rosaces rouges et bleues.",
      ar: "فنجان صغير بزخرفة النجوم مع صحنه المزيّن بورود حمراء وزرقاء.",
      en: "A small star-patterned cup with its saucer of large red and blue rosettes.",
    },
    description: {
      fr: "Une tasse expresso blanche habillée d'une mosaïque d'étoiles à huit branches, avec le mot MOROCCO autour d'un médaillon central.\n\nLa soucoupe reprend les grandes rosaces du zellige en rouge, bleu, jaune et vert. Un joli format pour le café du matin ou un nus-nus après le repas.",
      ar: "فنجان قهوة أبيض مكسو بفسيفساء من النجوم الثمانية، وكلمة MOROCCO حول ميدالية في الوسط.\n\nويستعيد الصحن الورود الكبيرة للزليج بالأحمر والأزرق والأصفر والأخضر. حجم جميل لقهوة الصباح أو لنص نص بعد الأكل.",
      en: "A white espresso cup dressed in a mosaic of eight-pointed stars, with the word MOROCCO around a central medallion.\n\nThe saucer echoes the large zellige rosettes in red, blue, yellow and green. A lovely size for the morning coffee or a nus-nus after a meal.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 7900,
    stock: 24,
    colors: ["blue", "red", "yellow", "green", "white"],
    patterns: ["star-8", "rosette"],
    images: ["/catalog/espresso-cup-saucer.jpg"],
  },
  {
    sku: "DZ-CND-001",
    slug: "bougie-petales-de-rose-boite-zellige",
    category: "bougies-photophores",
    name: { fr: "Bougie aux pétales de rose, boîte zellige", ar: "شمعة ببتلات الورد في علبة زليج", en: "Rose petal candle in a zellige tin" },
    short: {
      fr: "Bougie blanche parsemée de pétales séchés, dans une boîte ronde à couvercle au décor zellige.",
      ar: "شمعة بيضاء مرصّعة ببتلات مجففة، في علبة دائرية بغطاء مزخرف بالزليج.",
      en: "A white candle scattered with dried petals, in a round lidded tin with a zellige pattern.",
    },
    description: {
      fr: "La cire blanche est décorée de pétales de rose séchés, coulée dans une boîte métallique ronde imprimée d'étoiles zellige en vert, ocre, bordeaux et noir.\n\nLe couvercle protège la bougie entre deux utilisations et fait de la boîte un joli rangement une fois la bougie terminée.",
      ar: "شمع أبيض مزيّن ببتلات ورد مجففة، مصبوب في علبة معدنية دائرية مطبوعة بنجوم الزليج بالأخضر والمغرة والعنابي والأسود.\n\nيحمي الغطاء الشمعة بين الاستعمالات، وتصبح العلبة بعد انتهائها مكاناً أنيقاً للحفظ.",
      en: "White wax decorated with dried rose petals, poured into a round metal tin printed with zellige stars in green, ochre, burgundy and black.\n\nThe lid protects the candle between uses, and the tin makes a pretty keepsake box once the candle is finished.",
    },
    materials: {
      fr: "Cire, pétales de rose séchés, boîte métallique imprimée avec couvercle.",
      ar: "شمع، بتلات ورد مجففة، علبة معدنية مطبوعة بغطاء.",
      en: "Wax, dried rose petals, printed metal tin with lid.",
    },
    care: {
      fr: "Ne jamais laisser une bougie allumée sans surveillance. Poser sur une surface stable, loin des objets inflammables.",
      ar: "لا تترك الشمعة مشتعلة دون مراقبة. ضعها على سطح ثابت بعيداً عن المواد القابلة للاشتعال.",
      en: "Never leave a burning candle unattended. Place on a stable surface away from flammable objects.",
    },
    price: 8900,
    stock: 30,
    colors: ["multicolor", "green", "brown"],
    patterns: ["star-8", "mosaic"],
    images: ["/catalog/rose-candle-tin.jpg"],
    giftable: true,
  },
  {
    sku: "DZ-PLT-001",
    slug: "assiette-decorative-medaillon-zellige",
    category: "assiettes-decoratives",
    name: { fr: "Assiette décorative médaillon zellige", ar: "صحن ديكور بميدالية الزليج", en: "Zellige medallion decorative plate" },
    short: {
      fr: "Une rosace centrale entourée de huit panneaux de zellige différents, rehaussés de doré.",
      ar: "وردة مركزية تحيط بها ثماني لوحات زليج مختلفة، مزيّنة بلمسات ذهبية.",
      en: "A central rosette framed by eight different zellige panels, highlighted in gold.",
    },
    description: {
      fr: "Huit panneaux, huit compositions : rosaces bleues, étoiles noires et or, arcs turquoise… autour d'un grand médaillon rouge, vert et safran.\n\nÀ poser sur un buffet, à accrocher au mur ou à utiliser comme dessous de plat décoratif.",
      ar: "ثماني لوحات وثماني تركيبات: ورود زرقاء، ونجوم سوداء وذهبية، وأقواس فيروزية… حول ميدالية كبيرة بالأحمر والأخضر والزعفراني.\n\nتوضع على البوفيه أو تعلّق على الحائط أو تُستعمل كقاعدة ديكور للأطباق.",
      en: "Eight panels, eight compositions: blue rosettes, black and gold stars, turquoise arches… around a large red, green and saffron medallion.\n\nDisplay it on a sideboard, hang it on the wall, or use it as a decorative trivet.",
    },
    materials: {
      fr: "Support rigide à surface imprimée, motifs en relief doré.",
      ar: "قاعدة صلبة بسطح مطبوع وزخارف ذهبية بارزة.",
      en: "Rigid base with a printed surface and raised gold details.",
    },
    care: { fr: "Essuyer avec un chiffon doux et sec.", ar: "يُمسح بقطعة قماش ناعمة وجافة.", en: "Wipe with a soft, dry cloth." },
    price: 12900,
    stock: 15,
    colors: ["blue", "green", "red", "gold", "multicolor"],
    patterns: ["medallion", "rosette", "star-8"],
    images: ["/catalog/medallion-plate.jpg"],
    featured: true,
  },
  {
    sku: "DZ-GFT-001",
    slug: "tasse-embleme-etoile-coffret",
    category: "ecrins-premium",
    name: { fr: "Tasse emblème étoilé en coffret", ar: "فنجان بشعار النجمة في علبة", en: "Star emblem cup in a gift box" },
    short: {
      fr: "Tasse à l'étoile verte sur fond rouge, filet doré, présentée dans un coffret zellige à fenêtre.",
      ar: "فنجان بنجمة خضراء على خلفية حمراء وإطار ذهبي، في علبة زليج بنافذة شفافة.",
      en: "A cup with a green star on red, gold trim, presented in a windowed zellige box.",
    },
    description: {
      fr: "La tasse porte l'étoile verte sur un médaillon rouge cerclé d'or, entourée d'une mosaïque colorée et d'une frise dorée de caravanes.\n\nElle est présentée dans un coffret carré à fenêtre transparente, décoré de zellige à l'intérieur : un cadeau prêt à offrir.",
      ar: "يحمل الفنجان النجمة الخضراء على ميدالية حمراء بإطار ذهبي، تحيط بها فسيفساء ملونة وإفريز ذهبي للقوافل.\n\nويُقدَّم في علبة مربعة بنافذة شفافة ومزخرفة بالزليج من الداخل: هدية جاهزة للإهداء.",
      en: "The cup carries the green star on a gold-rimmed red medallion, surrounded by a colourful mosaic and a gold caravan frieze.\n\nIt comes in a square box with a clear window and a zellige-printed interior: a ready-to-give present.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 11900,
    stock: 18,
    colors: ["red", "green", "gold", "multicolor"],
    patterns: ["star-emblem", "mosaic"],
    images: ["/catalog/star-cup-giftbox.jpg"],
    giftable: true,
  },
  {
    sku: "DZ-SRV-001",
    slug: "planche-de-service-zellige-a-poignee",
    category: "plateaux-de-service",
    name: { fr: "Planche de service zellige à poignée", ar: "لوح تقديم زليج بمقبض", en: "Zellige serving board with handle" },
    short: {
      fr: "Planche ronde à poignée, grande rosace bleue, rouge et verte, surface brillante.",
      ar: "لوح دائري بمقبض، بوردة كبيرة زرقاء وحمراء وخضراء وسطح لامع.",
      en: "A round board with a handle, a large blue, red and green rosette, and a glossy surface.",
    },
    description: {
      fr: "Une rosace en rayons bleus et rouges, encadrée d'étoiles et d'entrelacs, s'étend jusqu'au manche. Le trou dans la poignée permet de la suspendre en cuisine.\n\nPour présenter des msemen, des gâteaux ou des fruits secs, ou comme pièce décorative.",
      ar: "وردة بأشعة زرقاء وحمراء، يحيط بها إطار من النجوم والتشابكات، تمتد حتى المقبض. ويسمح ثقب المقبض بتعليقها في المطبخ.\n\nلتقديم المسمن أو الحلويات أو الفواكه الجافة، أو كقطعة للزينة.",
      en: "A rosette of blue and red rays, framed by stars and interlacing, runs all the way to the handle. The hole in the handle lets you hang it in the kitchen.\n\nFor serving msemen, pastries or dried fruit, or as a decorative piece.",
    },
    materials: {
      fr: "Planche à surface décorée brillante, bordure couleur bois.",
      ar: "لوح بسطح مزخرف لامع وحافة بلون الخشب.",
      en: "Board with a glossy decorated surface and a wood-tone edge.",
    },
    care: { fr: "Essuyer avec un chiffon humide. Ne pas laisser tremper.", ar: "يُمسح بقطعة قماش مبللة. لا يُترك في الماء.", en: "Wipe with a damp cloth. Do not soak." },
    price: 14900,
    stock: 12,
    colors: ["blue", "red", "green", "white"],
    patterns: ["rosette", "star-8"],
    images: ["/catalog/serving-paddle.jpg"],
  },
  {
    sku: "DZ-SOU-001",
    slug: "mini-assiette-embleme-morocco",
    category: "souvenirs-du-maroc",
    name: { fr: "Mini assiette emblème « Morocco »", ar: "صحن صغير بشعار «Morocco»", en: "“Morocco” emblem mini plate" },
    short: {
      fr: "Petite assiette ronde à l'étoile verte sur médaillon rouge, couronne de rosaces jaunes et bleues.",
      ar: "صحن دائري صغير بنجمة خضراء على ميدالية حمراء، وتاج من الورود الصفراء والزرقاء.",
      en: "A small round plate with the green star on a red medallion and a crown of yellow and blue rosettes.",
    },
    description: {
      fr: "Un souvenir lumineux : l'étoile verte au centre d'un médaillon rouge où s'inscrit MOROCCO, entourée de rosaces jaunes, rouges et bleues sur fond turquoise.\n\nÀ glisser dans une valise ou à offrir avec une tasse assortie.",
      ar: "تذكار مشرق: النجمة الخضراء في وسط ميدالية حمراء تحمل كلمة MOROCCO، تحيط بها ورود صفراء وحمراء وزرقاء على خلفية فيروزية.\n\nمناسب للحقيبة أو للإهداء مع فنجان متناسق.",
      en: "A bright keepsake: the green star in a red medallion inscribed MOROCCO, surrounded by yellow, red and blue rosettes on turquoise.\n\nEasy to pack in a suitcase, or to give with a matching cup.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 4900,
    stock: 40,
    colors: ["red", "yellow", "blue", "turquoise", "green"],
    patterns: ["star-emblem", "rosette"],
    images: ["/catalog/star-mini-plate.jpg"],
    giftable: true,
  },
  {
    sku: "DZ-GFT-002",
    slug: "coffret-mug-arc-de-fes-et-cuillere",
    category: "coffrets-cadeaux",
    name: { fr: "Coffret mug « Arc de Fès » et cuillère", ar: "علبة كوب «قوس فاس» مع ملعقة", en: "“Fez Arch” mug and spoon gift set" },
    short: {
      fr: "Grand mug à l'arc mauresque bleu et aux rosaces jaunes, avec sa cuillère en céramique rouge.",
      ar: "كوب كبير بقوس أندلسي أزرق وورود صفراء، مع ملعقة خزفية حمراء.",
      en: "A large mug with a blue Moorish arch and yellow rosettes, with its red ceramic spoon.",
    },
    description: {
      fr: "Le mug reprend la silhouette d'un arc de médersa, en mosaïque bleue, face à un mur de rosaces jaunes, vertes et rouges.\n\nIl est livré avec une cuillère en céramique rouge dans un coffret entièrement décoré de zellige, avec une frise de calligraphie.",
      ar: "يستعيد الكوب شكل قوس المدرسة بفسيفساء زرقاء، مقابل جدار من الورود الصفراء والخضراء والحمراء.\n\nويأتي مع ملعقة خزفية حمراء في علبة مزخرفة بالكامل بالزليج مع إفريز من الخط.",
      en: "The mug follows the outline of a madrasa arch in blue mosaic, facing a wall of yellow, green and red rosettes.\n\nIt comes with a red ceramic spoon in a box decorated with zellige throughout, with a calligraphy frieze.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 14900,
    stock: 20,
    colors: ["blue", "yellow", "green", "red"],
    patterns: ["arch", "rosette", "mosaic"],
    images: ["/catalog/arch-mug-spoon-box.jpg"],
    featured: true,
    giftable: true,
  },
  {
    sku: "DZ-MUG-001",
    slug: "mug-i-love-morocco",
    category: "mugs-zellige",
    name: { fr: "Mug « I ♥ Morocco »", ar: "كوب «I ♥ Morocco»", en: "“I ♥ Morocco” mug" },
    short: {
      fr: "Mug galbé, grand cœur rouge sur mosaïque d'étoiles, anse ajourée.",
      ar: "كوب منحني بقلب أحمر كبير على فسيفساء النجوم، ومقبض مزخرف.",
      en: "A curved mug with a big red heart on a star mosaic, and an openwork handle.",
    },
    description: {
      fr: "Un clin d'œil gai et coloré : I ♥ MOROCCO sur un fond de zellige rouge, vert, bleu et noir, avec une frise de losanges au bord et un intérieur rouge.\n\nSa forme galbée tient bien en main, son anse est façonnée en volutes.",
      ar: "لمسة مرحة وملونة: I ♥ MOROCCO على خلفية زليج حمراء وخضراء وزرقاء وسوداء، مع إفريز من المعيّنات على الحافة وداخل أحمر.\n\nشكله المنحني مريح في اليد، ومقبضه على شكل لولبي.",
      en: "A cheerful, colourful nod: I ♥ MOROCCO on a red, green, blue and black zellige background, with a lozenge frieze at the rim and a red interior.\n\nIts curved shape sits well in the hand, and the handle is shaped in scrolls.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 9900,
    stock: 26,
    colors: ["red", "blue", "green", "black"],
    patterns: ["i-love-morocco", "star-8"],
    images: ["/catalog/i-love-morocco-mug.jpg"],
    featured: true,
    personalizable: true,
  },
  {
    sku: "DZ-GFT-003",
    slug: "coffret-duo-de-mugs-embleme-etoile",
    category: "coffrets-cadeaux",
    name: { fr: "Coffret duo de mugs emblème étoilé", ar: "علبة زوج أكواب بشعار النجمة", en: "Star emblem mug duo gift box" },
    short: {
      fr: "Deux mugs à l'étoile marocaine et aux anses festonnées, filet doré, dans un coffret à cordelette.",
      ar: "كوبان بالنجمة المغربية ومقابض مموجة وإطار ذهبي، في علبة بحبل للحمل.",
      en: "Two mugs with the Moroccan star, scalloped handles and gold trim, in a box with a rope handle.",
    },
    description: {
      fr: "Chaque coffret contient deux mugs assortis, ornés de médaillons rouges à l'étoile, d'une mosaïque zellige et d'un filet doré. Les anses festonnées rappellent les arcs des riads.\n\nLe coffret décoré de zellige se porte grâce à sa cordelette : idéal à offrir. Trois décors au choix.",
      ar: "تحتوي كل علبة على كوبين متناسقين، مزيّنين بميداليات حمراء بالنجمة وفسيفساء زليج وإطار ذهبي. وتذكّر المقابض المموجة بأقواس الرياض.\n\nتُحمل العلبة المزخرفة بالزليج بحبلها: مثالية للإهداء. ثلاث زخارف للاختيار.",
      en: "Each box holds two matching mugs decorated with red star medallions, a zellige mosaic and gold trim. The scalloped handles recall the arches of riads.\n\nThe zellige-printed box has a rope handle for carrying: ideal as a gift. Three designs to choose from.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 18900,
    compareAt: 21900,
    stock: 0,
    colors: ["red", "green", "blue", "gold", "multicolor"],
    patterns: ["star-emblem", "mosaic", "medallion", "rosette"],
    images: ["/catalog/twin-mug-set-box.jpg", "/catalog/twin-mug-sets-display.jpg", "/catalog/twin-mug-set-side.jpg"],
    featured: true,
    giftable: true,
    variants: [
      { sku: "DZ-GFT-003-MED", name: { fr: "Médaillon doré et bleu", ar: "ميدالية ذهبية وزرقاء", en: "Gold and blue medallion" }, pattern: "medallion", color: "gold", stock: 8 },
      { sku: "DZ-GFT-003-VRT", name: { fr: "Rosaces vertes et bleues", ar: "ورود خضراء وزرقاء", en: "Green and blue rosettes" }, pattern: "rosette", color: "green", stock: 6 },
      { sku: "DZ-GFT-003-RGE", name: { fr: "Grande rosace rouge", ar: "وردة حمراء كبيرة", en: "Large red rosette" }, pattern: "rosette", color: "red", stock: 3 },
    ],
  },
  {
    sku: "DZ-CUP-002",
    slug: "petit-mug-expresso-et-cuillere-rouge",
    category: "tasses-the-cafe",
    name: { fr: "Petit mug expresso et cuillère rouge", ar: "كوب قهوة صغير مع ملعقة حمراء", en: "Espresso mug with red spoon" },
    short: {
      fr: "Petit mug à rosaces et emblèmes étoilés, intérieur rouge, cuillère assortie glissée dans l'anse.",
      ar: "كوب صغير بورود وشعارات النجمة، داخله أحمر، وملعقة متناسقة توضع في المقبض.",
      en: "A small mug with rosettes and star emblems, red inside, with a matching spoon tucked in the handle.",
    },
    description: {
      fr: "Rosaces rouges, jaunes et vertes, deux médaillons à l'étoile et une frise dorée en haut et en bas.\n\nLa petite cuillère rouge se range dans l'anse : pratique pour le café ou le lait chaud.",
      ar: "ورود حمراء وصفراء وخضراء، وميداليتان بالنجمة، وإفريز ذهبي في الأعلى والأسفل.\n\nتوضع الملعقة الحمراء الصغيرة في المقبض: عملية للقهوة أو الحليب الساخن.",
      en: "Red, yellow and green rosettes, two star medallions and a gold frieze at the top and bottom.\n\nThe little red spoon slots into the handle: handy for coffee or hot milk.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 6900,
    stock: 35,
    colors: ["red", "green", "yellow", "black", "gold"],
    patterns: ["star-emblem", "rosette", "star-8"],
    images: ["/catalog/espresso-mug-spoon.jpg"],
  },
  {
    sku: "DZ-GFT-004",
    slug: "duo-de-tasses-ecrin-noir",
    category: "ecrins-premium",
    name: { fr: "Duo de tasses en écrin noir", ar: "زوج فناجين في علبة سوداء", en: "Cup duo in a black presentation box" },
    short: {
      fr: "Deux tasses vertes et rouges à l'étoile, calées dans un écrin noir au couvercle zellige.",
      ar: "فنجانان أخضر وأحمر بالنجمة، مثبّتان في علبة سوداء بغطاء زليج.",
      en: "Two green and red star cups, set in a black presentation box with a zellige lid.",
    },
    description: {
      fr: "Les deux tasses associent une mosaïque verte, rouge et jaune à de grands médaillons à l'étoile. Elles reposent dans un écrin noir compartimenté, à l'extérieur décoré de zellige.\n\nUne présentation soignée pour un cadeau d'anniversaire, de mariage ou de remerciement.",
      ar: "يجمع الفنجانان بين فسيفساء خضراء وحمراء وصفراء وميداليات كبيرة بالنجمة. ويستقران في علبة سوداء مقسّمة مزخرفة بالزليج من الخارج.\n\nتقديم أنيق لهدية عيد ميلاد أو عرس أو شكر.",
      en: "Both cups pair a green, red and yellow mosaic with large star medallions. They rest in a black compartmented box, decorated with zellige on the outside.\n\nA polished presentation for a birthday, wedding or thank-you gift.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 16900,
    stock: 14,
    colors: ["green", "red", "black", "yellow"],
    patterns: ["star-emblem", "rosette"],
    images: ["/catalog/duo-cups-black-box.jpg"],
    giftable: true,
  },
  {
    sku: "DZ-MUG-002",
    slug: "mug-ondule-embleme-etoile",
    category: "mugs-zellige",
    name: { fr: "Mug ondulé emblème étoilé", ar: "كوب متموّج بشعار النجمة", en: "Wavy star emblem mug" },
    short: {
      fr: "Mug à la paroi ondulée, étoiles rouges, bleues et noires, deux médaillons et filet doré.",
      ar: "كوب بجدار متموّج، بنجوم حمراء وزرقاء وسوداء، وميداليتين وإطار ذهبي.",
      en: "A mug with a wavy wall, red, blue and black stars, two medallions and gold trim.",
    },
    description: {
      fr: "Une forme originale, comme un carreau de zellige qui ondule : étoiles à huit branches rouges, bleu ciel et noires sur fond blanc, deux médaillons à l'étoile et une bordure dorée.\n\nUne pièce graphique qui se remarque sur un bureau ou une étagère.",
      ar: "شكل مبتكر كبلاطة زليج متموّجة: نجوم ثمانية حمراء وزرقاء فاتحة وسوداء على خلفية بيضاء، وميداليتان بالنجمة وإطار ذهبي.\n\nقطعة لافتة على المكتب أو الرف.",
      en: "An original shape, like a rippling zellige tile: red, sky-blue and black eight-pointed stars on white, two star medallions and a gold border.\n\nA graphic piece that stands out on a desk or shelf.",
    },
    materials: ceramic,
    care: ceramicCare,
    price: 8900,
    stock: 4,
    colors: ["red", "blue", "black", "white", "gold"],
    patterns: ["star-emblem", "star-8", "geometric"],
    images: ["/catalog/wave-mug-star.jpg"],
  },
];

export const collections = [
  {
    slug: "coffrets-a-offrir",
    name: { fr: "Coffrets à offrir", ar: "علب للإهداء", en: "Boxed gifts" },
    description: { fr: "Tasses et mugs présentés en coffret, prêts à offrir.", ar: "فناجين وأكواب في علب جاهزة للإهداء.", en: "Cups and mugs presented in gift boxes, ready to give." },
    featured: true,
    isGift: true,
    image: "/catalog/twin-mug-sets-display.jpg",
    products: ["DZ-GFT-003", "DZ-GFT-002", "DZ-GFT-001", "DZ-GFT-004", "DZ-CND-001"],
  },
  {
    slug: "etoile-et-rouge",
    name: { fr: "Étoile et rouge", ar: "النجمة والأحمر", en: "Star and red" },
    description: { fr: "Les pièces à l'emblème étoilé, en rouge et vert.", ar: "القطع بشعار النجمة بالأحمر والأخضر.", en: "Pieces bearing the star emblem, in red and green." },
    featured: true,
    isGift: false,
    image: "/catalog/wave-mug-star.jpg",
    products: ["DZ-MUG-002", "DZ-CUP-002", "DZ-SOU-001", "DZ-GFT-001", "DZ-GFT-004"],
  },
  {
    slug: "bleu-de-fes",
    name: { fr: "Bleu de Fès", ar: "أزرق فاس", en: "Fez blue" },
    description: { fr: "Rosaces et arcs dans le bleu profond des céramiques de Fès.", ar: "ورود وأقواس بالأزرق العميق لخزف فاس.", en: "Rosettes and arches in the deep blue of Fez ceramics." },
    featured: true,
    isGift: false,
    image: "/catalog/serving-paddle.jpg",
    products: ["DZ-SRV-001", "DZ-PLT-001", "DZ-GFT-002", "DZ-CUP-001"],
  },
  {
    slug: "souvenirs-du-maroc",
    name: { fr: "Souvenirs du Maroc", ar: "تذكارات من المغرب", en: "Souvenirs of Morocco" },
    description: { fr: "De petites pièces faciles à rapporter dans une valise.", ar: "قطع صغيرة سهلة الحمل في الحقيبة.", en: "Small pieces that are easy to pack in a suitcase." },
    featured: false,
    isGift: true,
    image: null,
    products: ["DZ-SOU-001", "DZ-MUG-001", "DZ-CUP-001", "DZ-CUP-002"],
  },
];

/** Delivery fees in MAD: placeholders, replace with your courier's rates. */
export const cities: [string, string, string, string, number, number, number][] = [
  ["Casablanca", "الدار البيضاء", "Casablanca", "Casablanca-Settat", 25, 1, 2],
  ["Rabat", "الرباط", "Rabat", "Rabat-Salé-Kénitra", 30, 1, 2],
  ["Salé", "سلا", "Salé", "Rabat-Salé-Kénitra", 30, 1, 2],
  ["Mohammedia", "المحمدية", "Mohammedia", "Casablanca-Settat", 25, 1, 2],
  ["Marrakech", "مراكش", "Marrakech", "Marrakech-Safi", 35, 1, 3],
  ["Fès", "فاس", "Fez", "Fès-Meknès", 35, 1, 3],
  ["Meknès", "مكناس", "Meknes", "Fès-Meknès", 35, 1, 3],
  ["Tanger", "طنجة", "Tangier", "Tanger-Tétouan-Al Hoceïma", 35, 1, 3],
  ["Tétouan", "تطوان", "Tetouan", "Tanger-Tétouan-Al Hoceïma", 40, 2, 3],
  ["Kénitra", "القنيطرة", "Kenitra", "Rabat-Salé-Kénitra", 30, 1, 3],
  ["Agadir", "أكادير", "Agadir", "Souss-Massa", 40, 2, 3],
  ["El Jadida", "الجديدة", "El Jadida", "Casablanca-Settat", 35, 1, 3],
  ["Safi", "آسفي", "Safi", "Marrakech-Safi", 40, 2, 3],
  ["Essaouira", "الصويرة", "Essaouira", "Marrakech-Safi", 40, 2, 4],
  ["Oujda", "وجدة", "Oujda", "Oriental", 40, 2, 4],
  ["Nador", "الناظور", "Nador", "Oriental", 45, 2, 4],
  ["Béni Mellal", "بني ملال", "Beni Mellal", "Béni Mellal-Khénifra", 40, 2, 3],
  ["Ouarzazate", "ورزازات", "Ouarzazate", "Drâa-Tafilalet", 45, 2, 4],
  ["Laâyoune", "العيون", "Laayoune", "Laâyoune-Sakia El Hamra", 60, 3, 5],
  ["Dakhla", "الداخلة", "Dakhla", "Dakhla-Oued Ed-Dahab", 70, 3, 6],
];

export const zones = [
  { name: { fr: "Europe", ar: "أوروبا", en: "Europe" }, countries: ["FR", "BE", "ES", "IT", "DE", "NL", "PT", "LU", "CH", "AT", "IE", "GB"], fee: 25000, perKgFee: 6000, freeOver: 200000, minDays: 5, maxDays: 10 },
  { name: { fr: "Amérique du Nord", ar: "أمريكا الشمالية", en: "North America" }, countries: ["US", "CA"], fee: 40000, perKgFee: 9000, freeOver: null, minDays: 7, maxDays: 14 },
  { name: { fr: "Pays du Golfe", ar: "دول الخليج", en: "Gulf countries" }, countries: ["AE", "SA", "QA", "KW", "BH", "OM"], fee: 35000, perKgFee: 8000, freeOver: null, minDays: 5, maxDays: 10 },
];

/** Approximate rates (1 MAD = x). Update them in Settings before relying on converted prices. */
export const currencies = [
  { code: "MAD", symbol: "DH", rateFromMad: 1, decimals: 2, sortOrder: 0 },
  { code: "EUR", symbol: "€", rateFromMad: 0.092, decimals: 2, sortOrder: 1 },
  { code: "USD", symbol: "$", rateFromMad: 0.1, decimals: 2, sortOrder: 2 },
  { code: "GBP", symbol: "£", rateFromMad: 0.079, decimals: 2, sortOrder: 3 },
];
