import { L } from "./types";

export type ChecklistSeed = {
  title: L;
  description?: L;
  required?: boolean;
  visaTypeCodes?: string[];
  condition?: { question: string; op: "eq" | "neq" | "in" | "truthy"; value?: string | string[] };
};

// General documents usually requested. Wording deliberately says "usually requested":
// the authoritative list is always the one published by the competent authority.
const base: ChecklistSeed[] = [
  {
    title: L("Passeport en cours de validité", "جواز سفر ساري المفعول", "Valid passport"),
    description: L(
      "Vérifiez sur la source officielle la durée de validité restante et le nombre de pages vierges exigés. Joignez une copie des pages d'identité et des anciens visas.",
      "تحقق من المصدر الرسمي من مدة الصلاحية المتبقية وعدد الصفحات الفارغة المطلوبة. أرفق نسخة من صفحات الهوية والتأشيرات السابقة.",
      "Check the official source for the remaining validity and blank pages required. Include a copy of the identity pages and previous visas.",
    ),
  },
  {
    title: L("Photos d'identité récentes", "صور شخصية حديثة", "Recent passport photos"),
    description: L("Au format exigé par l'autorité concernée (dimensions, fond).", "بالمواصفات المطلوبة من الجهة المعنية (المقاس والخلفية).", "In the format required by the relevant authority (size, background)."),
  },
  {
    title: L("Formulaire de demande", "استمارة الطلب", "Application form"),
    description: L("Formulaire officiel rempli et signé (ou confirmation de la demande en ligne).", "الاستمارة الرسمية معبأة وموقعة (أو تأكيد الطلب عبر الإنترنت).", "Official form completed and signed (or online application confirmation)."),
  },
  { title: L("Carte nationale d'identité (CNIE)", "البطاقة الوطنية للتعريف", "National ID card (CNIE)"), description: L("Copie recto-verso.", "نسخة من الوجهين.", "Copy of both sides.") },
  {
    title: L("Relevés bancaires récents", "كشوفات حساب بنكي حديثة", "Recent bank statements"),
    description: L("Généralement les 3 à 6 derniers mois, cachetés par la banque.", "عادة آخر 3 إلى 6 أشهر، مختومة من البنك.", "Usually the last 3 to 6 months, stamped by the bank."),
  },
  {
    title: L("Réservation de voyage / itinéraire", "حجز السفر / برنامج الرحلة", "Travel booking / itinerary"),
    description: L("Réservation de vol aller-retour (sans achat obligatoire du billet sauf exigence contraire).", "حجز تذكرة ذهاب وإياب (دون إلزامية الشراء ما لم يُطلب ذلك).", "Return flight reservation (ticket purchase usually not required unless stated)."),
  },
  {
    title: L("Justificatif d'hébergement", "إثبات السكن", "Proof of accommodation"),
    description: L("Réservation d'hôtel ou attestation d'hébergement selon le cas.", "حجز فندقي أو شهادة إيواء حسب الحالة.", "Hotel booking or invitation/attestation of accommodation."),
  },
  // Employment situation
  {
    title: L("Attestation de travail", "شهادة العمل", "Employment certificate"),
    condition: { question: "employment", op: "eq", value: "employed" },
  },
  { title: L("Bulletins de paie (3 derniers mois)", "بيانات الأجور (آخر 3 أشهر)", "Payslips (last 3 months)"), condition: { question: "employment", op: "eq", value: "employed" } },
  { title: L("Attestation de congé signée par l'employeur", "شهادة العطلة موقعة من المشغل", "Leave approval signed by the employer"), condition: { question: "employment", op: "eq", value: "employed" } },
  { title: L("Relevé / attestation CNSS", "كشف / شهادة الضمان الاجتماعي CNSS", "CNSS (social security) statement"), required: false, condition: { question: "employment", op: "eq", value: "employed" } },
  { title: L("Registre de commerce (modèle J) / statuts", "السجل التجاري (نموذج J) / القانون الأساسي", "Commercial register extract / company statutes"), condition: { question: "employment", op: "eq", value: "self_employed" } },
  { title: L("Attestations fiscales / déclarations d'impôts", "شهادات ضريبية / التصريحات الضريبية", "Tax certificates / tax returns"), condition: { question: "employment", op: "eq", value: "self_employed" } },
  { title: L("Relevés bancaires professionnels", "كشوفات الحساب البنكي المهني", "Business bank statements"), required: false, condition: { question: "employment", op: "eq", value: "self_employed" } },
  { title: L("Attestation de scolarité / inscription", "شهادة التمدرس / التسجيل", "Certificate of enrolment"), condition: { question: "employment", op: "eq", value: "student" } },
  { title: L("Attestation de pension de retraite", "شهادة معاش التقاعد", "Pension certificate"), condition: { question: "employment", op: "eq", value: "retired" } },
  // Sponsor
  {
    title: L("Lettre de prise en charge + justificatifs du garant", "التزام بالتكفل + وثائق الكفيل", "Sponsorship letter + sponsor's documents"),
    description: L("Pièce d'identité, revenus et relevés bancaires du garant, lien de parenté.", "هوية الكفيل ومداخيله وكشوفاته البنكية وإثبات صلة القرابة.", "Sponsor's ID, income, bank statements and proof of relationship."),
    condition: { question: "sponsored", op: "eq", value: "yes" },
  },
  // Minors
  {
    title: L("Acte de naissance + autorisation parentale", "عقد الازدياد + الإذن الأبوي", "Birth certificate + parental authorisation"),
    description: L("Pour chaque mineur : autorisation légalisée du/des parent(s) et copie de leurs pièces d'identité.", "لكل قاصر: إذن مصادق عليه من الوالد(ين) ونسخة من بطاقات هويتهم.", "For each minor: certified parental consent and copies of the parents' IDs."),
    condition: { question: "minors", op: "eq", value: "yes" },
  },
  // Previous visas
  { title: L("Copies des visas précédents", "نسخ التأشيرات السابقة", "Copies of previous visas"), required: false, condition: { question: "previous_visas", op: "eq", value: "yes" } },
  // Business
  { title: L("Lettre d'invitation de l'entreprise d'accueil", "رسالة دعوة من الشركة المضيفة", "Invitation letter from the host company"), visaTypeCodes: ["business"] },
  { title: L("Ordre de mission de l'employeur", "أمر بمهمة من المشغل", "Employer's mission order"), visaTypeCodes: ["business"], required: false },
  // Family visit
  { title: L("Invitation / attestation d'accueil de l'hôte", "دعوة / شهادة استقبال من المضيف", "Invitation / host attestation"), visaTypeCodes: ["family"] },
  { title: L("Copie du titre de séjour ou de la pièce d'identité de l'hôte", "نسخة من بطاقة إقامة أو هوية المضيف", "Copy of the host's residence permit or ID"), visaTypeCodes: ["family"] },
  // Students
  { title: L("Lettre d'admission / pré-inscription", "رسالة القبول / التسجيل المسبق", "Admission / pre-enrolment letter"), visaTypeCodes: ["student"] },
  { title: L("Diplômes et relevés de notes", "الشهادات وكشوفات النقط", "Diplomas and transcripts"), visaTypeCodes: ["student"] },
  { title: L("Justificatif de ressources pour les études", "إثبات الموارد المالية للدراسة", "Proof of funds for studies"), visaTypeCodes: ["student"] },
  { title: L("Certificat de langue (si exigé)", "شهادة اللغة (إن طُلبت)", "Language certificate (if required)"), visaTypeCodes: ["student"], required: false },
  // Work
  { title: L("Contrat de travail / offre d'emploi", "عقد العمل / عرض العمل", "Employment contract / job offer"), visaTypeCodes: ["work"] },
  { title: L("Diplômes et expérience professionnelle", "الشهادات والخبرة المهنية", "Diplomas and work experience"), visaTypeCodes: ["work"] },
];

const schengenExtra: ChecklistSeed[] = [
  {
    title: L("Assurance voyage médicale", "تأمين السفر الطبي", "Travel medical insurance"),
    description: L(
      "Couvrant tout l'espace Schengen pour toute la durée du séjour, avec la couverture minimale exigée par le Code des visas (vérifiez le montant sur la source officielle).",
      "تغطي كامل فضاء شنغن طوال مدة الإقامة، بالحد الأدنى للتغطية المطلوب في قانون التأشيرات (تحقق من المبلغ في المصدر الرسمي).",
      "Covering the whole Schengen area for the entire stay, with the minimum coverage required by the Visa Code (check the amount on the official source).",
    ),
    visaTypeCodes: ["tourism", "business", "family"],
  },
];

export function checklistFor(isSchengen: boolean, visaCodes: string[]): ChecklistSeed[] {
  const items = isSchengen ? [...base.slice(0, 7), ...schengenExtra, ...base.slice(7)] : base;
  // Only keep visa-type-specific items for visa types the country actually has.
  return items.filter((i) => !i.visaTypeCodes || i.visaTypeCodes.some((c) => visaCodes.includes(c)));
}

export const globalQuestions = [
  {
    key: "employment",
    type: "SELECT" as const,
    label: L("Quelle est votre situation professionnelle ?", "ما هي وضعيتك المهنية؟", "What is your employment situation?"),
    options: [
      { value: "employed", label: L("Salarié(e)", "أجير(ة)", "Employed") },
      { value: "self_employed", label: L("Indépendant(e) / chef d'entreprise", "مستقل(ة) / صاحب(ة) مقاولة", "Self-employed / business owner") },
      { value: "student", label: L("Étudiant(e)", "طالب(ة)", "Student") },
      { value: "retired", label: L("Retraité(e)", "متقاعد(ة)", "Retired") },
      { value: "unemployed", label: L("Sans activité", "بدون نشاط", "Not working") },
    ],
  },
  { key: "sponsored", type: "YES_NO" as const, label: L("Votre voyage est-il pris en charge par une autre personne ?", "هل يتكفل شخص آخر بمصاريف سفرك؟", "Is someone else sponsoring your trip?") },
  { key: "minors", type: "YES_NO" as const, label: L("Voyagez-vous avec des enfants mineurs ?", "هل تسافر مع أطفال قاصرين؟", "Are you travelling with minor children?") },
  { key: "previous_visas", type: "YES_NO" as const, label: L("Avez-vous déjà obtenu un visa pour cette destination ou l'espace Schengen ?", "هل سبق لك الحصول على تأشيرة لهذه الوجهة أو لفضاء شنغن؟", "Have you previously held a visa for this destination or the Schengen area?") },
  { key: "previous_refusal", type: "YES_NO" as const, label: L("Avez-vous déjà eu un refus de visa ?", "هل سبق أن رُفض طلب تأشيرتك؟", "Have you ever been refused a visa?") },
];
