import { L } from "./types";

type VT = { code: string; name: L; description?: L };
type Link = { label: L; url: string; type: "GOVERNMENT" | "EMBASSY" | "CONSULATE" | "VISA_CENTER" | "OTHER" };
export type CountrySeed = {
  slug: string;
  iso: string;
  name: L;
  region: "EUROPE" | "NORTH_AMERICA" | "ASIA" | "OTHER";
  schengen?: boolean;
  popular?: boolean;
  visaTypes: VT[];
  links: Link[];
  seoKeyword?: L;
};

const vt = {
  tourism: { code: "tourism", name: L("Court séjour — Tourisme", "إقامة قصيرة — سياحة", "Short stay — Tourism") },
  business: { code: "business", name: L("Court séjour — Affaires", "إقامة قصيرة — أعمال", "Short stay — Business") },
  family: { code: "family", name: L("Visite familiale ou privée", "زيارة عائلية أو خاصة", "Family or private visit") },
  student: { code: "student", name: L("Études", "دراسة", "Studies") },
  work: { code: "work", name: L("Travail", "عمل", "Work") },
  visitor: { code: "tourism", name: L("Visiteur (tourisme / famille)", "زائر (سياحة / عائلة)", "Visitor (tourism / family)") },
};

const schengenTypes: VT[] = [vt.tourism, vt.business, vt.family, { ...vt.student, name: L("Long séjour — Études", "إقامة طويلة — دراسة", "Long stay — Studies") }];
const generic: VT[] = [vt.visitor, vt.business, vt.student];

const schengenLink: Link = {
  label: L("Commission européenne — Politique des visas Schengen", "المفوضية الأوروبية — سياسة تأشيرات شنغن", "European Commission — Schengen visa policy"),
  url: "https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en",
  type: "GOVERNMENT",
};

export const countries: CountrySeed[] = [
  // ───────── Europe
  {
    slug: "france", iso: "FR", region: "EUROPE", schengen: true, popular: true, name: L("France", "فرنسا", "France"), visaTypes: schengenTypes,
    links: [
      { label: L("France-Visas (site officiel)", "France-Visas (الموقع الرسمي)", "France-Visas (official website)"), url: "https://france-visas.gouv.fr", type: "GOVERNMENT" },
      { label: L("Ambassade de France au Maroc", "سفارة فرنسا بالمغرب", "Embassy of France in Morocco"), url: "https://ma.ambafrance.org", type: "EMBASSY" },
      schengenLink,
    ],
    seoKeyword: L("Visa France Maroc", "مساعدة فيزا فرنسا", "France visa from Morocco"),
  },
  {
    slug: "spain", iso: "ES", region: "EUROPE", schengen: true, popular: true, name: L("Espagne", "إسبانيا", "Spain"), visaTypes: schengenTypes,
    links: [
      { label: L("Ministère espagnol des Affaires étrangères — Visas", "وزارة الخارجية الإسبانية — التأشيرات", "Spanish Ministry of Foreign Affairs — Visas"), url: "https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Visados.aspx", type: "GOVERNMENT" },
      schengenLink,
    ],
    seoKeyword: L("Visa Espagne Maroc", "فيزا إسبانيا المغرب", "Spain visa from Morocco"),
  },
  {
    slug: "italy", iso: "IT", region: "EUROPE", schengen: true, popular: true, name: L("Italie", "إيطاليا", "Italy"), visaTypes: schengenTypes,
    links: [
      { label: L("Visto per l'Italia (site officiel)", "Visto per l'Italia (الموقع الرسمي)", "Visto per l'Italia (official website)"), url: "https://vistoperitalia.esteri.it", type: "GOVERNMENT" },
      { label: L("Ambassade d'Italie à Rabat", "سفارة إيطاليا بالرباط", "Embassy of Italy in Rabat"), url: "https://ambrabat.esteri.it", type: "EMBASSY" },
      schengenLink,
    ],
    seoKeyword: L("Visa Italie Maroc", "فيزا إيطاليا المغرب", "Italy visa from Morocco"),
  },
  {
    slug: "germany", iso: "DE", region: "EUROPE", schengen: true, popular: true, name: L("Allemagne", "ألمانيا", "Germany"), visaTypes: [...schengenTypes, vt.work],
    links: [
      { label: L("Ambassade d'Allemagne à Rabat", "سفارة ألمانيا بالرباط", "German Embassy in Rabat"), url: "https://rabat.diplo.de", type: "EMBASSY" },
      { label: L("Make it in Germany (portail officiel)", "Make it in Germany (البوابة الرسمية)", "Make it in Germany (official portal)"), url: "https://www.make-it-in-germany.com", type: "GOVERNMENT" },
      schengenLink,
    ],
  },
  {
    slug: "netherlands", iso: "NL", region: "EUROPE", schengen: true, name: L("Pays-Bas", "هولندا", "Netherlands"), visaTypes: schengenTypes,
    links: [{ label: L("Netherlands Worldwide", "Netherlands Worldwide", "Netherlands Worldwide"), url: "https://www.netherlandsworldwide.nl", type: "GOVERNMENT" }, schengenLink],
  },
  {
    slug: "belgium", iso: "BE", region: "EUROPE", schengen: true, name: L("Belgique", "بلجيكا", "Belgium"), visaTypes: schengenTypes,
    links: [
      { label: L("Office des Étrangers — Visas", "مكتب الأجانب — التأشيرات", "Immigration Office — Visas"), url: "https://dofi.ibz.be", type: "GOVERNMENT" },
      { label: L("Ambassade de Belgique au Maroc", "سفارة بلجيكا بالمغرب", "Embassy of Belgium in Morocco"), url: "https://morocco.diplomatie.belgium.be", type: "EMBASSY" },
      schengenLink,
    ],
  },
  {
    slug: "portugal", iso: "PT", region: "EUROPE", schengen: true, name: L("Portugal", "البرتغال", "Portugal"), visaTypes: schengenTypes,
    links: [{ label: L("Portail des visas du Portugal", "بوابة تأشيرات البرتغال", "Portugal visa portal"), url: "https://vistos.mne.gov.pt", type: "GOVERNMENT" }, schengenLink],
  },
  {
    slug: "poland", iso: "PL", region: "EUROPE", schengen: true, name: L("Pologne", "بولندا", "Poland"), visaTypes: [...schengenTypes, vt.work],
    links: [{ label: L("Ambassade de Pologne au Maroc", "سفارة بولندا بالمغرب", "Embassy of Poland in Morocco"), url: "https://www.gov.pl/web/maroko", type: "EMBASSY" }, schengenLink],
  },
  {
    slug: "switzerland", iso: "CH", region: "EUROPE", schengen: true, name: L("Suisse", "سويسرا", "Switzerland"), visaTypes: schengenTypes,
    links: [
      { label: L("Secrétariat d'État aux migrations (SEM)", "كتابة الدولة للهجرة (SEM)", "State Secretariat for Migration (SEM)"), url: "https://www.sem.admin.ch", type: "GOVERNMENT" },
      { label: L("Ambassade de Suisse à Rabat", "سفارة سويسرا بالرباط", "Embassy of Switzerland in Rabat"), url: "https://www.eda.admin.ch/rabat", type: "EMBASSY" },
    ],
  },
  {
    slug: "schengen-other", iso: "EU", region: "EUROPE", schengen: true, name: L("Autres pays Schengen", "دول شنغن الأخرى", "Other Schengen countries"), visaTypes: schengenTypes,
    links: [schengenLink],
    seoKeyword: L("Visa Schengen Maroc", "فيزا شنغن المغرب", "Schengen visa from Morocco"),
  },
  // ───────── North America
  {
    slug: "united-states", iso: "US", region: "NORTH_AMERICA", popular: true, name: L("États-Unis", "الولايات المتحدة", "United States"),
    visaTypes: [
      { code: "tourism", name: L("Visiteur B1/B2 (affaires / tourisme)", "زائر B1/B2 (أعمال / سياحة)", "Visitor B1/B2 (business / tourism)") },
      { code: "student", name: L("Étudiant F-1 / M-1", "طالب F-1 / M-1", "Student F-1 / M-1") },
      { code: "exchange", name: L("Échange J-1", "تبادل J-1", "Exchange visitor J-1") },
    ],
    links: [
      { label: L("U.S. Department of State — Visas", "وزارة الخارجية الأمريكية — التأشيرات", "U.S. Department of State — Visas"), url: "https://travel.state.gov/content/travel/en/us-visas.html", type: "GOVERNMENT" },
      { label: L("Ambassade et consulat des États-Unis au Maroc", "سفارة وقنصلية الولايات المتحدة بالمغرب", "U.S. Embassy & Consulate in Morocco"), url: "https://ma.usembassy.gov", type: "EMBASSY" },
    ],
    seoKeyword: L("Visa USA Maroc", "فيزا أمريكا المغرب", "US visa from Morocco"),
  },
  {
    slug: "canada", iso: "CA", region: "NORTH_AMERICA", popular: true, name: L("Canada", "كندا", "Canada"),
    visaTypes: [
      { code: "tourism", name: L("Visa de visiteur (VRT)", "تأشيرة زائر (TRV)", "Visitor visa (TRV)") },
      { code: "student", name: L("Permis d'études", "تصريح الدراسة", "Study permit") },
      { code: "work", name: L("Permis de travail", "تصريح العمل", "Work permit") },
    ],
    links: [
      { label: L("IRCC — Immigration et citoyenneté Canada", "IRCC — الهجرة والمواطنة الكندية", "IRCC — Immigration, Refugees and Citizenship Canada"), url: "https://www.canada.ca/en/immigration-refugees-citizenship.html", type: "GOVERNMENT" },
      { label: L("Ambassade du Canada au Maroc", "سفارة كندا بالمغرب", "Embassy of Canada to Morocco"), url: "https://www.international.gc.ca/country-pays/morocco-maroc/rabat.aspx", type: "EMBASSY" },
    ],
    seoKeyword: L("Visa Canada Maroc", "فيزا كندا المغرب", "Canada visa from Morocco"),
  },
  // ───────── Asia & Middle East
  { slug: "china", iso: "CN", region: "ASIA", name: L("Chine", "الصين", "China"), visaTypes: generic, links: [{ label: L("Centre de demande de visa pour la Chine", "مركز طلبات التأشيرة للصين", "Chinese Visa Application Service Center"), url: "https://www.visaforchina.cn", type: "VISA_CENTER" }] },
  { slug: "japan", iso: "JP", region: "ASIA", name: L("Japon", "اليابان", "Japan"), visaTypes: generic, links: [{ label: L("Ministère japonais des Affaires étrangères — Visas", "وزارة الخارجية اليابانية — التأشيرات", "Ministry of Foreign Affairs of Japan — Visas"), url: "https://www.mofa.go.jp/j_info/visit/visa/index.html", type: "GOVERNMENT" }] },
  { slug: "south-korea", iso: "KR", region: "ASIA", name: L("Corée du Sud", "كوريا الجنوبية", "South Korea"), visaTypes: generic, links: [{ label: L("Korea Visa Portal", "بوابة التأشيرات الكورية", "Korea Visa Portal"), url: "https://www.visa.go.kr", type: "GOVERNMENT" }] },
  { slug: "thailand", iso: "TH", region: "ASIA", name: L("Thaïlande", "تايلاند", "Thailand"), visaTypes: generic, links: [{ label: L("Thai e-Visa (officiel)", "التأشيرة الإلكترونية لتايلاند (رسمي)", "Thai e-Visa (official)"), url: "https://www.thaievisa.go.th", type: "GOVERNMENT" }] },
  { slug: "malaysia", iso: "MY", region: "ASIA", name: L("Malaisie", "ماليزيا", "Malaysia"), visaTypes: generic, links: [{ label: L("Département de l'immigration de Malaisie", "مديرية الهجرة الماليزية", "Immigration Department of Malaysia"), url: "https://www.imi.gov.my", type: "GOVERNMENT" }] },
  { slug: "india", iso: "IN", region: "ASIA", name: L("Inde", "الهند", "India"), visaTypes: generic, links: [{ label: L("Indian Visa Online (officiel)", "التأشيرة الهندية عبر الإنترنت (رسمي)", "Indian Visa Online (official)"), url: "https://indianvisaonline.gov.in", type: "GOVERNMENT" }] },
  { slug: "saudi-arabia", iso: "SA", region: "ASIA", name: L("Arabie saoudite", "المملكة العربية السعودية", "Saudi Arabia"), visaTypes: generic, links: [{ label: L("Plateforme unifiée des visas (MOFA)", "المنصة الموحدة للتأشيرات (وزارة الخارجية)", "Unified visa platform (MOFA)"), url: "https://visa.mofa.gov.sa", type: "GOVERNMENT" }] },
  { slug: "united-arab-emirates", iso: "AE", region: "ASIA", name: L("Émirats arabes unis", "الإمارات العربية المتحدة", "United Arab Emirates"), visaTypes: generic, links: [{ label: L("ICP — Autorité fédérale de l'identité", "الهيئة الاتحادية للهوية والجنسية ICP", "ICP — Federal Authority for Identity"), url: "https://icp.gov.ae", type: "GOVERNMENT" }, { label: L("Portail officiel des EAU", "البوابة الرسمية للإمارات", "UAE official portal"), url: "https://u.ae", type: "GOVERNMENT" }] },
  // ───────── Other
  {
    slug: "united-kingdom", iso: "GB", region: "OTHER", popular: true, name: L("Royaume-Uni", "المملكة المتحدة", "United Kingdom"),
    visaTypes: [
      { code: "tourism", name: L("Standard Visitor", "زائر عادي (Standard Visitor)", "Standard Visitor") },
      { code: "student", name: L("Student visa", "تأشيرة طالب", "Student visa") },
      { code: "work", name: L("Skilled Worker", "عامل مؤهل (Skilled Worker)", "Skilled Worker") },
    ],
    links: [{ label: L("GOV.UK — Visas et immigration", "GOV.UK — التأشيرات والهجرة", "GOV.UK — Visas and immigration"), url: "https://www.gov.uk/browse/visas-immigration", type: "GOVERNMENT" }],
  },
  { slug: "turkey", iso: "TR", region: "OTHER", popular: true, name: L("Turquie", "تركيا", "Turkey"), visaTypes: generic, links: [{ label: L("e-Visa officiel de la Turquie", "التأشيرة الإلكترونية الرسمية لتركيا", "Official Turkish e-Visa"), url: "https://www.evisa.gov.tr", type: "GOVERNMENT" }] },
  { slug: "australia", iso: "AU", region: "OTHER", name: L("Australie", "أستراليا", "Australia"), visaTypes: [vt.visitor, vt.student, vt.work], links: [{ label: L("Department of Home Affairs — Immigration", "وزارة الشؤون الداخلية — الهجرة", "Department of Home Affairs — Immigration"), url: "https://immi.homeaffairs.gov.au", type: "GOVERNMENT" }] },
  { slug: "russia", iso: "RU", region: "OTHER", name: L("Russie", "روسيا", "Russia"), visaTypes: generic, links: [{ label: L("Ministère russe des Affaires étrangères — Visas", "وزارة الخارجية الروسية — التأشيرات", "Russian Ministry of Foreign Affairs — Visas"), url: "https://visa.kdmid.ru", type: "GOVERNMENT" }] },
  { slug: "egypt", iso: "EG", region: "OTHER", name: L("Égypte", "مصر", "Egypt"), visaTypes: generic, links: [{ label: L("Portail e-Visa de l'Égypte", "بوابة التأشيرة الإلكترونية لمصر", "Egypt e-Visa portal"), url: "https://visa2egypt.gov.eg", type: "GOVERNMENT" }] },
  { slug: "south-africa", iso: "ZA", region: "OTHER", name: L("Afrique du Sud", "جنوب إفريقيا", "South Africa"), visaTypes: generic, links: [{ label: L("Department of Home Affairs", "وزارة الشؤون الداخلية", "Department of Home Affairs"), url: "https://www.dha.gov.za", type: "GOVERNMENT" }] },
];

// Generic, deliberately non-specific texts. The owner must review every destination against official sources
// ("lastVerifiedAt" stays empty until then and the site shows a verification warning).
export const schengenTexts = {
  summary: L(
    "Assistance pour votre demande de visa de court séjour (Schengen) ou de long séjour : check-list personnalisée, préparation du dossier, formulaire et accompagnement pour le rendez-vous.",
    "مساعدة في طلب تأشيرة الإقامة القصيرة (شنغن) أو الطويلة: قائمة وثائق مخصصة، تحضير الملف والاستمارة والتوجيه بخصوص الموعد.",
    "Assistance with your short-stay (Schengen) or long-stay visa application: personalised checklist, file preparation, form and appointment guidance.",
  ),
  eligibility: L(
    "Les ressortissants marocains ont généralement besoin d'un visa pour entrer dans l'espace Schengen. Le visa de court séjour (type C) couvre les séjours de **90 jours maximum sur toute période de 180 jours**.\n\nVous devez notamment pouvoir justifier :\n- l'objet et les conditions du séjour ;\n- des moyens de subsistance suffisants ;\n- votre intention de quitter l'espace Schengen avant l'expiration du visa ;\n- une assurance voyage médicale valide.\n\nLa demande est déposée auprès du consulat du pays de destination principale (ou de première entrée si aucune destination principale).",
    "يحتاج المواطنون المغاربة عموماً إلى تأشيرة لدخول فضاء شنغن. تغطي تأشيرة الإقامة القصيرة (نوع C) الإقامات التي لا تتجاوز **90 يوماً خلال أي فترة 180 يوماً**.\n\nيجب عليك على الخصوص إثبات:\n- الغرض من الإقامة وظروفها؛\n- توفر موارد مالية كافية؛\n- نيتك مغادرة فضاء شنغن قبل انتهاء التأشيرة؛\n- تأمين سفر طبي ساري المفعول.\n\nيُقدَّم الطلب لدى قنصلية بلد الوجهة الرئيسية (أو بلد الدخول الأول في غياب وجهة رئيسية).",
    "Moroccan nationals generally need a visa to enter the Schengen area. The short-stay visa (type C) covers stays of **up to 90 days in any 180-day period**.\n\nYou will notably need to demonstrate:\n- the purpose and conditions of your stay;\n- sufficient means of subsistence;\n- your intention to leave the Schengen area before the visa expires;\n- valid travel medical insurance.\n\nThe application is lodged with the consulate of the main destination country (or the country of first entry if there is no main destination).",
  ),
  procedure: L(
    "1. **Vérifier** les exigences sur le site officiel du pays de destination.\n2. **Remplir** le formulaire de demande (en ligne lorsque disponible).\n3. **Prendre rendez-vous** auprès du consulat ou du prestataire de services officiel désigné.\n4. **Déposer** le dossier, payer les frais officiels et donner vos données biométriques.\n5. **Suivre** la demande et récupérer votre passeport.\n\nVISA ABACHE vous accompagne à chaque étape ; le dépôt et la décision relèvent exclusivement du consulat.",
    "1. **التحقق** من المتطلبات على الموقع الرسمي لبلد الوجهة.\n2. **ملء** استمارة الطلب (عبر الإنترنت عند توفرها).\n3. **حجز موعد** لدى القنصلية أو مقدم الخدمات الرسمي المعتمد.\n4. **إيداع** الملف وأداء الرسوم الرسمية وأخذ البصمات.\n5. **تتبع** الطلب واستلام جواز السفر.\n\nترافقك VISA ABACHE في كل مرحلة؛ أما الإيداع والقرار فهما من اختصاص القنصلية حصرياً.",
    "1. **Check** the requirements on the destination country's official website.\n2. **Complete** the application form (online where available).\n3. **Book an appointment** with the consulate or its designated official service provider.\n4. **Lodge** the file, pay the official fees and provide biometrics.\n5. **Track** the application and collect your passport.\n\nVISA ABACHE supports you at each step; lodging and the decision are exclusively the consulate's.",
  ),
  appointment: L(
    "Les rendez-vous sont pris exclusivement via le canal officiel indiqué par le consulat (souvent un prestataire externe agréé). Selon le Code des visas, la demande peut en principe être déposée jusqu'à 6 mois avant le voyage et au plus tard 15 jours avant. **VISA ABACHE ne vend pas de rendez-vous** : nous vous guidons pour utiliser le système officiel.",
    "تُحجز المواعيد حصرياً عبر القناة الرسمية التي تحددها القنصلية (غالباً مقدم خدمات خارجي معتمد). وفقاً لقانون التأشيرات، يمكن مبدئياً تقديم الطلب قبل 6 أشهر من السفر وعلى أبعد تقدير 15 يوماً قبله. **VISA ABACHE لا تبيع المواعيد**: نوجهك لاستعمال النظام الرسمي.",
    "Appointments are booked exclusively through the official channel indicated by the consulate (often an approved external provider). Under the Visa Code, applications can in principle be lodged up to 6 months before travel and no later than 15 days before. **VISA ABACHE does not sell appointments**: we guide you to use the official system.",
  ),
  processing: L(
    "En règle générale, le Code des visas prévoit une décision dans un délai de 15 jours calendaires, pouvant être prolongé dans certains cas. Les délais réels varient selon la saison.",
    "كقاعدة عامة، ينص قانون التأشيرات على اتخاذ القرار داخل أجل 15 يوماً، قابل للتمديد في بعض الحالات. تختلف المدد الفعلية حسب الموسم.",
    "As a general rule, the Visa Code provides for a decision within 15 calendar days, which may be extended in some cases. Actual times vary by season.",
  ),
  fees: L(
    "Les frais de visa officiels et les éventuels frais de service du prestataire officiel sont fixés par les autorités. Consultez le montant à jour sur le site officiel du consulat.",
    "تحدد السلطات رسوم التأشيرة الرسمية ورسوم خدمات مقدم الخدمات الرسمي إن وجدت. اطلع على المبلغ المحيَّن على الموقع الرسمي للقنصلية.",
    "Official visa fees and any service charges of the official provider are set by the authorities. Check the current amount on the consulate's official website.",
  ),
};

export const genericTexts = {
  summary: L(
    "Accompagnement pour préparer votre demande : vérification des exigences officielles, check-list personnalisée, préparation du dossier et des formulaires, conseils pour le rendez-vous.",
    "مرافقة لتحضير طلبك: التحقق من المتطلبات الرسمية، قائمة وثائق مخصصة، تحضير الملف والاستمارات، ونصائح للموعد.",
    "Support to prepare your application: checking official requirements, personalised checklist, file and form preparation, appointment advice.",
  ),
  eligibility: L(
    "Les conditions d'entrée dépendent de votre nationalité, de l'objet et de la durée du voyage, et peuvent changer. **Vérifiez sur la source officielle si un visa (ou une autorisation électronique) est requis dans votre situation.** Votre conseiller confirmera les exigences à jour lors de l'étude de votre dossier.",
    "تختلف شروط الدخول حسب جنسيتك والغرض من السفر ومدته، وقد تتغير. **تحقق من المصدر الرسمي مما إذا كانت التأشيرة (أو ترخيص إلكتروني) مطلوبة في وضعيتك.** سيؤكد لك مستشارك المتطلبات المحيّنة عند دراسة ملفك.",
    "Entry conditions depend on your nationality, the purpose and length of your trip, and may change. **Check the official source to confirm whether a visa (or electronic authorisation) is required in your situation.** Your advisor will confirm the current requirements when reviewing your file.",
  ),
  procedure: L(
    "1. **Vérifier** les exigences sur le site officiel.\n2. **Préparer** les documents selon votre check-list.\n3. **Remplir** le formulaire ou la demande en ligne officielle.\n4. **Rendez-vous / dépôt** selon la procédure indiquée par l'autorité.\n5. **Suivi** jusqu'à la décision.",
    "1. **التحقق** من المتطلبات على الموقع الرسمي.\n2. **تحضير** الوثائق حسب قائمتك.\n3. **ملء** الاستمارة أو الطلب الرسمي عبر الإنترنت.\n4. **الموعد / الإيداع** حسب المسطرة التي تحددها السلطة.\n5. **التتبع** حتى صدور القرار.",
    "1. **Check** the requirements on the official website.\n2. **Prepare** the documents according to your checklist.\n3. **Complete** the official form or online application.\n4. **Appointment / submission** following the authority's procedure.\n5. **Follow-up** until the decision.",
  ),
  appointment: L(
    "Lorsque la procédure exige un rendez-vous, il est pris via le canal officiel. VISA ABACHE vous guide mais ne vend pas de rendez-vous.",
    "عندما تتطلب المسطرة موعداً، يُحجز عبر القناة الرسمية. توجهك VISA ABACHE لكنها لا تبيع المواعيد.",
    "When the procedure requires an appointment, it is booked through the official channel. VISA ABACHE guides you but does not sell appointments.",
  ),
  fees: L(
    "Les frais officiels sont fixés par l'autorité compétente — consultez le montant à jour sur la source officielle.",
    "تحدد السلطة المختصة الرسوم الرسمية — اطلع على المبلغ المحيَّن في المصدر الرسمي.",
    "Official fees are set by the competent authority — check the current amount on the official source.",
  ),
};
