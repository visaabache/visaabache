import { L } from "./types";

type Cat = "VISA" | "ADMINISTRATIVE" | "TRAVEL" | "STUDY";
export type ServiceSeed = {
  slug: string;
  category: Cat;
  icon: string;
  name: L;
  short: L;
  features: { fr: string[]; ar: string[]; en: string[] };
  priceType: "FIXED" | "FROM" | "QUOTE";
  price?: number;
  featured?: boolean;
  disclaimer?: L;
};

// Example prices only — the owner sets real prices in Admin → Services.
export const services: ServiceSeed[] = [
  {
    slug: "visa-application-assistance", category: "VISA", icon: "stamp", featured: true, priceType: "FROM", price: 750,
    name: L("Assistance demande de visa", "المساعدة في طلب التأشيرة", "Visa application assistance"),
    short: L("Check-list personnalisée, vérification des documents, préparation complète du dossier et accompagnement jusqu'au rendez-vous.", "قائمة وثائق مخصصة، مراجعة الوثائق، تحضير كامل للملف ومرافقة حتى الموعد.", "Personalised checklist, document review, complete file preparation and support until your appointment."),
    features: {
      fr: ["Check-list adaptée à votre profil", "Vérification de chaque document", "Aide au formulaire officiel", "Préparation pour le rendez-vous", "Suivi en ligne et sur WhatsApp"],
      ar: ["قائمة وثائق حسب وضعيتك", "مراجعة كل وثيقة", "المساعدة في الاستمارة الرسمية", "التحضير للموعد", "تتبع عبر الإنترنت وواتساب"],
      en: ["Checklist tailored to your profile", "Review of every document", "Help with the official form", "Appointment preparation", "Online and WhatsApp follow-up"],
    },
  },
  {
    slug: "visa-consultation", category: "VISA", icon: "users", priceType: "FIXED", price: 250,
    name: L("Consultation visa", "استشارة التأشيرة", "Visa consultation"),
    short: L("Un échange de 30 à 45 minutes pour analyser votre situation, vos options et les points d'attention de votre dossier.", "جلسة من 30 إلى 45 دقيقة لتحليل وضعيتك وخياراتك ونقاط الانتباه في ملفك.", "A 30–45 minute session to review your situation, options and the key points of your file."),
    features: { fr: ["Analyse de profil", "Liste des documents à prévoir", "Réponses à vos questions"], ar: ["تحليل الوضعية", "لائحة الوثائق المطلوبة", "أجوبة عن أسئلتك"], en: ["Profile analysis", "List of documents to plan", "Answers to your questions"] },
  },
  // Administrative
  {
    slug: "administrative-forms", category: "ADMINISTRATIVE", icon: "clipboard", priceType: "FROM", price: 100,
    name: L("Aide aux formulaires administratifs", "المساعدة في ملء الاستمارات الإدارية", "Administrative form assistance"),
    short: L("Nous vous aidons à remplir correctement vos formulaires administratifs, sur la base des informations que vous fournissez.", "نساعدك على ملء استماراتك الإدارية بشكل صحيح بناءً على المعلومات التي تقدمها.", "We help you complete administrative forms correctly, based on the information you provide."),
    features: { fr: ["Relecture et vérification", "Explications claires", "Version PDF prête à imprimer"], ar: ["مراجعة وتدقيق", "شروحات واضحة", "نسخة PDF جاهزة للطباعة"], en: ["Proofreading and checks", "Clear explanations", "Print-ready PDF"] },
  },
  {
    slug: "document-preparation", category: "ADMINISTRATIVE", icon: "file-check", priceType: "FROM", price: 150,
    name: L("Préparation et organisation des documents", "تحضير وتنظيم الوثائق", "Document preparation & organisation"),
    short: L("Classement, mise en ordre et contrôle de cohérence de vos pièces pour un dossier clair et complet.", "ترتيب وتنظيم ومراقبة انسجام وثائقك لملف واضح وكامل.", "Sorting, ordering and consistency checks of your documents for a clear and complete file."),
    features: { fr: ["Ordre logique des pièces", "Repérage des manques", "Sommaire du dossier"], ar: ["ترتيب منطقي للوثائق", "رصد النواقص", "فهرس الملف"], en: ["Logical order", "Gap detection", "File index"] },
  },
  {
    slug: "translation-coordination", category: "ADMINISTRATIVE", icon: "languages", priceType: "QUOTE",
    name: L("Coordination des traductions", "تنسيق الترجمات", "Translation coordination"),
    short: L("Mise en relation et suivi avec des traducteurs agréés (assermentés) — la traduction officielle est réalisée par le traducteur.", "الربط والتتبع مع مترجمين محلفين معتمدين — الترجمة الرسمية ينجزها المترجم.", "Coordination with sworn translators — the official translation is carried out by the translator."),
    features: { fr: ["Devis du traducteur", "Envoi et suivi des documents", "Contrôle à réception"], ar: ["عرض سعر المترجم", "إرسال الوثائق وتتبعها", "مراجعة عند الاستلام"], en: ["Translator's quote", "Sending and tracking documents", "Check on delivery"] },
    disclaimer: L("Les traductions officielles sont réalisées et facturées par des traducteurs agréés indépendants.", "الترجمات الرسمية ينجزها ويفوترها مترجمون محلفون مستقلون.", "Official translations are performed and invoiced by independent sworn translators."),
  },
  {
    slug: "appointment-guidance", category: "ADMINISTRATIVE", icon: "calendar", priceType: "FROM", price: 100,
    name: L("Accompagnement prise de rendez-vous", "التوجيه لحجز المواعيد", "Appointment guidance"),
    short: L("Nous vous guidons pas à pas pour utiliser les plateformes officielles de prise de rendez-vous. Nous ne vendons pas de rendez-vous.", "نوجهك خطوة بخطوة لاستعمال المنصات الرسمية لحجز المواعيد. لا نبيع المواعيد.", "Step-by-step guidance to use the official booking platforms. We do not sell appointments."),
    features: { fr: ["Création de compte sur la plateforme officielle", "Explications du parcours", "Préparation du jour J"], ar: ["إنشاء حساب على المنصة الرسمية", "شرح المراحل", "التحضير ليوم الموعد"], en: ["Account set-up on the official platform", "Process walkthrough", "Appointment-day preparation"] },
  },
  {
    slug: "document-scanning-pdf", category: "ADMINISTRATIVE", icon: "scan", priceType: "FROM", price: 50,
    name: L("Numérisation et préparation PDF", "رقمنة الوثائق وتحضير PDF", "Document scanning & PDF preparation"),
    short: L("Numérisation de qualité, compression et fusion en PDF au format exigé par les plateformes en ligne.", "رقمنة عالية الجودة وضغط ودمج ملفات PDF بالصيغة المطلوبة في المنصات الإلكترونية.", "Quality scanning, compression and merging into PDFs in the format required by online platforms."),
    features: { fr: ["Numérisation lisible", "Compression à la taille demandée", "Fusion et renommage"], ar: ["رقمنة واضحة", "ضغط بالحجم المطلوب", "دمج وإعادة تسمية"], en: ["Legible scans", "Compression to required size", "Merging and naming"] },
  },
  {
    slug: "online-procedures", category: "ADMINISTRATIVE", icon: "globe", priceType: "FROM", price: 150,
    name: L("Assistance aux démarches en ligne", "المساعدة في الإجراءات عبر الإنترنت", "Online procedures assistance"),
    short: L("Accompagnement pour vos démarches sur les portails officiels, que vous effectuez vous-même avec notre aide.", "مرافقة في إجراءاتك على البوابات الرسمية، تقوم بها بنفسك بمساعدتنا.", "Support for procedures on official portals, which you complete yourself with our help."),
    features: { fr: ["Explications étape par étape", "Vérification avant envoi", "Conservation des confirmations"], ar: ["شرح خطوة بخطوة", "مراجعة قبل الإرسال", "حفظ التأكيدات"], en: ["Step-by-step guidance", "Review before submission", "Keeping confirmations"] },
  },
  {
    slug: "application-follow-up", category: "ADMINISTRATIVE", icon: "file-search", priceType: "FROM", price: 100,
    name: L("Suivi de dossier", "تتبع الملف", "Application follow-up"),
    short: L("Suivi de l'avancement de vos démarches et rappels des prochaines étapes.", "تتبع تقدم إجراءاتك والتذكير بالمراحل القادمة.", "Tracking your procedures and reminders of next steps."),
    features: { fr: ["Points d'étape réguliers", "Rappels WhatsApp", "Conseils en cas de demande complémentaire"], ar: ["مستجدات منتظمة", "تذكيرات عبر واتساب", "نصائح عند طلب وثائق إضافية"], en: ["Regular updates", "WhatsApp reminders", "Advice if more documents are requested"] },
  },
  // Travel
  {
    slug: "flight-reservation", category: "TRAVEL", icon: "plane", priceType: "FROM", price: 100,
    name: L("Réservation de vols et billets", "حجز تذاكر الطيران", "Flight reservations & tickets"),
    short: L("Recherche et réservation de vols, ou réservation pour dossier de visa lorsque cela est accepté.", "البحث عن رحلات وحجزها، أو حجز لملف التأشيرة عندما يكون مقبولاً.", "Flight search and booking, or itinerary reservation for visa files where accepted."),
    features: { fr: ["Comparaison d'options", "Réservation ou achat", "Envoi des confirmations"], ar: ["مقارنة الخيارات", "الحجز أو الشراء", "إرسال التأكيدات"], en: ["Option comparison", "Reservation or purchase", "Confirmations sent"] },
  },
  {
    slug: "hotel-reservation", category: "TRAVEL", icon: "hotel", priceType: "FROM", price: 80,
    name: L("Réservations d'hôtel", "حجز الفنادق", "Hotel reservations"),
    short: L("Réservations d'hébergement adaptées à votre budget et à votre itinéraire.", "حجوزات إقامة تناسب ميزانيتك وبرنامج رحلتك.", "Accommodation bookings matching your budget and itinerary."),
    features: { fr: ["Options annulables", "Confirmation nominative", "Adapté au dossier visa"], ar: ["خيارات قابلة للإلغاء", "تأكيد باسمك", "مناسب لملف التأشيرة"], en: ["Cancellable options", "Named confirmation", "Visa-file friendly"] },
  },
  {
    slug: "travel-insurance", category: "TRAVEL", icon: "shield", priceType: "QUOTE",
    name: L("Assurance voyage (partenaires agréés)", "تأمين السفر (شركاء معتمدون)", "Travel insurance (authorised partners)"),
    short: L("Mise en relation avec des assureurs et intermédiaires agréés. Le contrat est conclu directement avec l'assureur.", "الربط مع شركات تأمين ووسطاء معتمدين. يُبرم العقد مباشرة مع شركة التأمين.", "Introduction to licensed insurers and intermediaries. The policy is concluded directly with the insurer."),
    features: { fr: ["Couverture adaptée à la destination", "Attestation pour le dossier", "Partenaires agréés"], ar: ["تغطية مناسبة للوجهة", "شهادة للملف", "شركاء معتمدون"], en: ["Destination-appropriate cover", "Certificate for your file", "Licensed partners"] },
    disclaimer: L("VISA ABACHE n'est pas un assureur. Les contrats d'assurance sont émis par des compagnies et intermédiaires agréés.", "VISA ABACHE ليست شركة تأمين. تصدر عقود التأمين عن شركات ووسطاء معتمدين.", "VISA ABACHE is not an insurer. Policies are issued by licensed companies and intermediaries."),
  },
  {
    slug: "airport-transfers", category: "TRAVEL", icon: "car", priceType: "QUOTE",
    name: L("Transferts aéroport", "النقل من وإلى المطار", "Airport transfers"),
    short: L("Organisation de transferts à l'arrivée ou au départ avec des partenaires de transport.", "تنظيم التنقل عند الوصول أو المغادرة مع شركاء النقل.", "Arrival or departure transfers with transport partners."),
    features: { fr: ["Prise en charge à l'arrivée", "Tarif annoncé à l'avance"], ar: ["الاستقبال عند الوصول", "سعر محدد مسبقاً"], en: ["Meet & greet", "Price agreed in advance"] },
  },
  {
    slug: "esim", category: "TRAVEL", icon: "wifi", priceType: "FROM", price: 120,
    name: L("Services eSIM", "خدمات eSIM", "eSIM services"),
    short: L("Forfaits data internationaux eSIM pour rester connecté dès l'atterrissage.", "باقات إنترنت دولية eSIM للبقاء متصلاً منذ الوصول.", "International eSIM data plans to stay connected from landing."),
    features: { fr: ["Activation guidée", "Compatibilité vérifiée"], ar: ["تفعيل موجه", "التحقق من التوافق"], en: ["Guided activation", "Compatibility check"] },
  },
  {
    slug: "travel-assistance", category: "TRAVEL", icon: "map", priceType: "QUOTE",
    name: L("Assistance voyage internationale", "المساعدة في السفر الدولي", "International travel assistance"),
    short: L("Préparation de votre voyage : itinéraire, conseils pratiques et checklist départ.", "تحضير رحلتك: البرنامج والنصائح العملية وقائمة ما قبل السفر.", "Trip preparation: itinerary, practical tips and departure checklist."),
    features: { fr: ["Itinéraire personnalisé", "Checklist départ", "Contact WhatsApp pendant le voyage"], ar: ["برنامج مخصص", "قائمة ما قبل السفر", "تواصل عبر واتساب أثناء السفر"], en: ["Personalised itinerary", "Departure checklist", "WhatsApp contact while travelling"] },
  },
  // Study
  {
    slug: "university-application", category: "STUDY", icon: "graduation", featured: true, priceType: "FROM", price: 1500,
    name: L("Candidature universitaire", "الترشح للجامعات", "University application assistance"),
    short: L("Choix des programmes, préparation des pièces et accompagnement de vos candidatures en ligne.", "اختيار البرامج وتحضير الوثائق ومرافقة ترشيحاتك عبر الإنترنت.", "Programme selection, document preparation and support for your online applications."),
    features: { fr: ["Sélection de programmes", "Lettre de motivation (relecture)", "Suivi des réponses"], ar: ["اختيار البرامج", "مراجعة رسالة التحفيز", "تتبع الأجوبة"], en: ["Programme shortlist", "Motivation letter review", "Tracking responses"] },
    disclaimer: L("Les décisions d'admission relèvent exclusivement des établissements.", "قرارات القبول من اختصاص المؤسسات حصرياً.", "Admission decisions are made exclusively by the institutions."),
  },
  {
    slug: "student-visa-preparation", category: "STUDY", icon: "stamp", priceType: "FROM", price: 1200,
    name: L("Préparation visa étudiant", "تحضير تأشيرة الطالب", "Student visa preparation"),
    short: L("Préparation complète du dossier de visa étudiant selon les exigences officielles du pays d'études.", "تحضير كامل لملف تأشيرة الطالب حسب المتطلبات الرسمية لبلد الدراسة.", "Complete student visa file preparation according to the study country's official requirements."),
    features: { fr: ["Check-list étudiant", "Justificatifs financiers", "Préparation à l'entretien"], ar: ["قائمة وثائق الطالب", "الإثباتات المالية", "التحضير للمقابلة"], en: ["Student checklist", "Financial evidence", "Interview preparation"] },
  },
  {
    slug: "university-documents", category: "STUDY", icon: "book-open", priceType: "FROM", price: 300,
    name: L("Accompagnement documents universitaires", "التوجيه بخصوص الوثائق الجامعية", "University document guidance"),
    short: L("Conseils sur les diplômes, relevés, équivalences et légalisations à prévoir.", "نصائح حول الشهادات وكشوف النقط والمعادلات والتصديقات المطلوبة.", "Guidance on diplomas, transcripts, equivalences and legalisations to plan."),
    features: { fr: ["Liste des pièces", "Ordre des démarches", "Coordination traductions"], ar: ["لائحة الوثائق", "ترتيب الإجراءات", "تنسيق الترجمات"], en: ["Document list", "Order of steps", "Translation coordination"] },
  },
  {
    slug: "student-accommodation", category: "STUDY", icon: "home", priceType: "QUOTE",
    name: L("Aide au logement étudiant", "المساعدة في السكن الطلابي", "Student accommodation assistance"),
    short: L("Recherche de solutions de logement et vérification des offres avant réservation.", "البحث عن حلول السكن والتحقق من العروض قبل الحجز.", "Finding housing options and checking offers before booking."),
    features: { fr: ["Résidences et colocations", "Vigilance anti-arnaque", "Attestation de logement"], ar: ["الإقامات والسكن المشترك", "الحذر من الاحتيال", "شهادة السكن"], en: ["Residences and flat-shares", "Scam awareness", "Accommodation certificate"] },
  },
  {
    slug: "student-arrival", category: "STUDY", icon: "plane-landing", priceType: "QUOTE",
    name: L("Vol et accueil à l'arrivée", "الرحلة والاستقبال عند الوصول", "Flight & arrival assistance"),
    short: L("Organisation du vol, du transfert et checklist des premières démarches à l'arrivée.", "تنظيم الرحلة والتنقل وقائمة الإجراءات الأولى عند الوصول.", "Flight, transfer and checklist of first steps on arrival."),
    features: { fr: ["Réservation du vol", "Transfert", "Premières démarches"], ar: ["حجز الرحلة", "التنقل", "الإجراءات الأولى"], en: ["Flight booking", "Transfer", "First formalities"] },
  },
];

export const packages = [
  {
    slug: "basic-consultation", price: 250, sortOrder: 1,
    name: L("Consultation essentielle", "الاستشارة الأساسية", "Basic Consultation"),
    description: L("Pour comprendre les exigences et organiser votre dossier vous-même.", "لفهم المتطلبات وتنظيم ملفك بنفسك.", "To understand the requirements and organise your file yourself."),
    features: {
      fr: ["Analyse de votre situation", "Check-list personnalisée", "Liens officiels et conseils", "Réponses par e-mail / WhatsApp (7 jours)"],
      ar: ["تحليل وضعيتك", "قائمة وثائق مخصصة", "الروابط الرسمية والنصائح", "أجوبة عبر البريد / واتساب (7 أيام)"],
      en: ["Analysis of your situation", "Personalised checklist", "Official links and advice", "Email / WhatsApp answers (7 days)"],
    },
  },
  {
    slug: "standard-visa-assistance", price: 750, sortOrder: 2, highlighted: true,
    name: L("Assistance visa standard", "المساعدة القياسية للتأشيرة", "Standard Visa Assistance"),
    description: L("Nous préparons votre dossier complet avec vous.", "نحضّر معك ملفك الكامل.", "We prepare your complete file with you."),
    features: {
      fr: ["Tout le contenu Essentiel", "Vérification de chaque document", "Aide au formulaire officiel", "Organisation du dossier (PDF)", "Accompagnement prise de rendez-vous", "Suivi jusqu'au dépôt"],
      ar: ["كل محتوى الباقة الأساسية", "مراجعة كل وثيقة", "المساعدة في الاستمارة الرسمية", "تنظيم الملف (PDF)", "التوجيه لحجز الموعد", "التتبع حتى الإيداع"],
      en: ["Everything in Basic", "Review of every document", "Help with the official form", "File organisation (PDF)", "Appointment booking guidance", "Follow-up until submission"],
    },
  },
  {
    slug: "premium-application-support", price: 1500, sortOrder: 3,
    name: L("Accompagnement premium", "المرافقة المميزة", "Premium Application Support"),
    description: L("Un accompagnement prioritaire de bout en bout.", "مرافقة ذات أولوية من البداية إلى النهاية.", "Priority end-to-end support."),
    features: {
      fr: ["Tout le contenu Standard", "Traitement prioritaire", "Préparation à l'entretien", "Réservations vol & hôtel pour le dossier", "Coordination traductions", "Conseiller dédié sur WhatsApp"],
      ar: ["كل محتوى الباقة القياسية", "معالجة ذات أولوية", "التحضير للمقابلة", "حجوزات الطيران والفندق للملف", "تنسيق الترجمات", "مستشار مخصص عبر واتساب"],
      en: ["Everything in Standard", "Priority handling", "Interview preparation", "Flight & hotel bookings for the file", "Translation coordination", "Dedicated WhatsApp advisor"],
    },
  },
];

export const generalFaqs = [
  {
    q: L("VISA ABACHE est-il une ambassade ou un centre de visa ?", "هل VISA ABACHE سفارة أو مركز تأشيرات؟", "Is VISA ABACHE an embassy or visa centre?"),
    a: L(
      "Non. VISA ABACHE est une entreprise indépendante d'assistance. Nous ne sommes affiliés à aucune ambassade, consulat, centre de visa ou autorité publique. Les décisions sont prises exclusivement par les autorités compétentes.",
      "لا. VISA ABACHE مقاولة مستقلة لتقديم المساعدة. لسنا تابعين لأي سفارة أو قنصلية أو مركز تأشيرات أو سلطة عمومية. القرارات تتخذها السلطات المختصة حصرياً.",
      "No. VISA ABACHE is an independent assistance business. We are not affiliated with any embassy, consulate, visa centre or public authority. Decisions are made exclusively by the competent authorities.",
    ),
    home: true,
  },
  {
    q: L("Pouvez-vous garantir l'obtention de mon visa ?", "هل يمكنكم ضمان حصولي على التأشيرة؟", "Can you guarantee my visa will be approved?"),
    a: L(
      "Non, personne ne peut garantir un visa. Notre rôle est de vous aider à présenter un dossier complet, cohérent et conforme aux exigences officielles.",
      "لا، لا أحد يمكنه ضمان التأشيرة. دورنا هو مساعدتك على تقديم ملف كامل ومنسجم ومطابق للمتطلبات الرسمية.",
      "No, nobody can guarantee a visa. Our role is to help you present a complete, consistent file that meets the official requirements.",
    ),
    home: true,
  },
  {
    q: L("Vos tarifs incluent-ils les frais de visa ?", "هل تشمل أسعاركم رسوم التأشيرة؟", "Do your prices include visa fees?"),
    a: L(
      "Non. Nos tarifs couvrent uniquement nos services d'assistance. Les frais officiels (consulat, centre de visa) sont payés directement aux organismes concernés.",
      "لا. أسعارنا تغطي خدمات المساعدة فقط. الرسوم الرسمية (القنصلية، مركز التأشيرات) تُدفع مباشرة للجهات المعنية.",
      "No. Our prices cover our assistance services only. Official fees (consulate, visa centre) are paid directly to the relevant bodies.",
    ),
    home: true,
  },
  {
    q: L("Mes documents sont-ils en sécurité ?", "هل وثائقي في أمان؟", "Are my documents safe?"),
    a: L(
      "Oui. Les fichiers sont transmis via une connexion chiffrée, stockés chiffrés et accessibles uniquement à votre conseiller. Ils sont supprimés selon notre politique de conservation.",
      "نعم. تُرسل الملفات عبر اتصال مشفر، وتُخزن مشفرة، ولا يطلع عليها إلا مستشارك. ويتم حذفها وفق سياسة الاحتفاظ لدينا.",
      "Yes. Files are sent over an encrypted connection, stored encrypted and only accessible to your advisor. They are deleted according to our retention policy.",
    ),
    home: true,
  },
  {
    q: L("Vendez-vous des rendez-vous ?", "هل تبيعون المواعيد؟", "Do you sell appointments?"),
    a: L(
      "Non. Les rendez-vous se prennent exclusivement via les canaux officiels. Nous vous accompagnons pour utiliser ces plateformes.",
      "لا. تُحجز المواعيد حصرياً عبر القنوات الرسمية. نرافقك لاستعمال هذه المنصات.",
      "No. Appointments are booked exclusively through official channels. We help you use those platforms.",
    ),
    home: true,
  },
  {
    q: L("Comment suivre mon dossier ?", "كيف أتتبع ملفي؟", "How do I track my application?"),
    a: L(
      "Depuis votre espace client, ou via la page « Suivre mon dossier » avec votre référence et votre e-mail. Vous recevez aussi des notifications à chaque étape.",
      "من حسابك، أو عبر صفحة «تتبع ملفي» باستعمال المرجع وبريدك الإلكتروني. كما تتوصل بإشعارات في كل مرحلة.",
      "From your client dashboard, or via the 'Track my application' page with your reference and email. You also receive notifications at each step.",
    ),
    home: false,
  },
  {
    q: L("Quels moyens de paiement acceptez-vous ?", "ما هي وسائل الأداء المقبولة؟", "Which payment methods do you accept?"),
    a: L(
      "Virement bancaire, espèces à notre bureau et, lorsque activé, paiement par carte bancaire via une passerelle marocaine sécurisée. Une facture est générée automatiquement.",
      "التحويل البنكي، والأداء نقداً بمكتبنا، والأداء بالبطاقة البنكية عبر بوابة مغربية آمنة عند تفعيلها. تُنشأ الفاتورة تلقائياً.",
      "Bank transfer, cash at our office and, when enabled, bank card payment through a secure Moroccan gateway. An invoice is generated automatically.",
    ),
    home: false,
  },
];
