import { L } from "./types";

export const statuses = [
  { key: "new_request", kind: "OPEN", color: "#2f4f85", initial: true, label: L("Nouvelle demande", "طلب جديد", "New Request"), description: L("Votre demande a été reçue et va être étudiée.", "تم استلام طلبك وستتم دراسته.", "Your request has been received and will be reviewed.") },
  { key: "under_review", kind: "OPEN", color: "#0e7490", label: L("En cours d'étude", "قيد الدراسة", "Under Review"), description: L("Votre conseiller étudie votre dossier.", "يدرس مستشارك ملفك.", "Your advisor is reviewing your file.") },
  { key: "documents_required", kind: "WAITING_CUSTOMER", color: "#d97706", label: L("Documents requis", "وثائق مطلوبة", "Documents Required"), description: L("Des documents sont nécessaires pour continuer.", "هناك وثائق ضرورية للمتابعة.", "Some documents are needed to continue.") },
  { key: "documents_received", kind: "OPEN", color: "#0891b2", label: L("Documents reçus", "تم استلام الوثائق", "Documents Received"), description: L("Nous avons bien reçu vos documents.", "توصلنا بوثائقك.", "We have received your documents.") },
  { key: "in_preparation", kind: "OPEN", color: "#7c3aed", label: L("En préparation", "قيد التحضير", "In Preparation"), description: L("Nous préparons votre dossier.", "نحضّر ملفك.", "We are preparing your file.") },
  { key: "ready_for_review", kind: "WAITING_CUSTOMER", color: "#c9a45c", label: L("Prêt pour votre relecture", "جاهز لمراجعتك", "Ready for Client Review"), description: L("Votre dossier est prêt : merci de le relire et de confirmer.", "ملفك جاهز: يرجى مراجعته وتأكيده.", "Your file is ready: please review and confirm.") },
  { key: "appointment_guidance", kind: "OPEN", color: "#2563eb", label: L("Accompagnement rendez-vous", "التوجيه للموعد", "Appointment Guidance"), description: L("Nous vous guidons pour votre rendez-vous officiel.", "نوجهك بخصوص موعدك الرسمي.", "We are guiding you for your official appointment.") },
  { key: "completed", kind: "COMPLETED", color: "#059669", label: L("Terminé", "مكتمل", "Completed"), description: L("Notre accompagnement pour ce dossier est terminé.", "انتهت مرافقتنا لهذا الملف.", "Our assistance for this file is complete.") },
  { key: "cancelled", kind: "CANCELLED", color: "#64748b", notify: true, label: L("Annulé", "ملغى", "Cancelled"), description: L("Ce dossier a été annulé.", "تم إلغاء هذا الملف.", "This file has been cancelled.") },
] as const;

type T = { subject: L; body: L; whatsapp?: L };

const sig = L("\n\nL'équipe {{businessName}}", "\n\nفريق {{businessName}}", "\n\nThe {{businessName}} team");
const s = (x: L): L => ({ fr: x.fr + sig.fr, ar: x.ar + sig.ar, en: x.en + sig.en });

export const templates: Record<string, T> = {
  welcome: {
    subject: L("Bienvenue chez {{businessName}}", "مرحباً بك في {{businessName}}", "Welcome to {{businessName}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nVotre compte a bien été créé. Depuis votre espace, vous pouvez démarrer une demande, téléverser vos documents en sécurité et suivre l'avancement de vos dossiers.\n\n{{link}}",
      "مرحباً {{firstName}}،\n\nتم إنشاء حسابك بنجاح. من حسابك يمكنك بدء طلب ورفع وثائقك بأمان وتتبع تقدم ملفاتك.\n\n{{link}}",
      "Hello {{firstName}},\n\nYour account has been created. From your dashboard you can start an application, upload documents securely and track your files.\n\n{{link}}",
    )),
  },
  password_reset: {
    subject: L("Réinitialisation de votre mot de passe", "إعادة تعيين كلمة المرور", "Reset your password"),
    body: s(L(
      "Bonjour {{firstName}},\n\nPour choisir un nouveau mot de passe, utilisez ce lien (valable 1 heure) :\n{{link}}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.",
      "مرحباً {{firstName}}،\n\nلاختيار كلمة مرور جديدة، استعمل هذا الرابط (صالح لمدة ساعة):\n{{link}}\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة.",
      "Hello {{firstName}},\n\nTo choose a new password, use this link (valid for 1 hour):\n{{link}}\n\nIf you did not request this, please ignore this message.",
    )),
  },
  application_received: {
    subject: L("Demande reçue — {{reference}}", "تم استلام طلبك — {{reference}}", "Application received — {{reference}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nNous avons bien reçu votre demande d'assistance pour {{destination}}.\nVotre référence : {{reference}}\n\nVotre conseiller va étudier votre dossier et reviendra vers vous rapidement. Suivez votre dossier ici :\n{{link}}\n\nRappel : VISA ABACHE est un prestataire indépendant ; la décision de visa appartient exclusivement aux autorités.",
      "مرحباً {{firstName}}،\n\nتوصلنا بطلب المساعدة الخاص بك لوجهة {{destination}}.\nالمرجع: {{reference}}\n\nسيدرس مستشارك ملفك ويتواصل معك قريباً. تتبع ملفك هنا:\n{{link}}\n\nتذكير: VISA ABACHE مقدم خدمات مستقل؛ قرار التأشيرة يعود للسلطات حصرياً.",
      "Hello {{firstName}},\n\nWe have received your assistance request for {{destination}}.\nYour reference: {{reference}}\n\nYour advisor will review your file and get back to you shortly. Track your file here:\n{{link}}\n\nReminder: VISA ABACHE is an independent provider; the visa decision belongs exclusively to the authorities.",
    )),
    whatsapp: L("Bonjour {{firstName}}, votre demande {{reference}} a bien été reçue par {{businessName}}. Suivi : {{link}}", "مرحباً {{firstName}}، تم استلام طلبك {{reference}} من طرف {{businessName}}. التتبع: {{link}}", "Hello {{firstName}}, your request {{reference}} has been received by {{businessName}}. Track: {{link}}"),
  },
  application_status_changed: {
    subject: L("Dossier {{reference}} : {{status}}", "الملف {{reference}}: {{status}}", "File {{reference}}: {{status}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nLe statut de votre dossier {{reference}} est maintenant : {{status}}.\n{{statusDescription}}\n\n{{note}}\n\nDétails : {{link}}",
      "مرحباً {{firstName}}،\n\nأصبحت حالة ملفك {{reference}}: {{status}}.\n{{statusDescription}}\n\n{{note}}\n\nالتفاصيل: {{link}}",
      "Hello {{firstName}},\n\nThe status of your file {{reference}} is now: {{status}}.\n{{statusDescription}}\n\n{{note}}\n\nDetails: {{link}}",
    )),
    whatsapp: L("Bonjour {{firstName}}, dossier {{reference}} : {{status}}. {{note}} Détails : {{link}}", "مرحباً {{firstName}}، الملف {{reference}}: {{status}}. {{note}} التفاصيل: {{link}}", "Hello {{firstName}}, file {{reference}}: {{status}}. {{note}} Details: {{link}}"),
  },
  documents_requested: {
    subject: L("Documents à fournir — {{reference}}", "وثائق مطلوبة — {{reference}}", "Documents needed — {{reference}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nPour avancer sur votre dossier {{reference}}, merci de téléverser les documents suivants :\n{{documents}}\n\n{{note}}\n\nTéléverser : {{link}}",
      "مرحباً {{firstName}}،\n\nللمضي في ملفك {{reference}}، يرجى رفع الوثائق التالية:\n{{documents}}\n\n{{note}}\n\nالرفع: {{link}}",
      "Hello {{firstName}},\n\nTo move forward with your file {{reference}}, please upload the following documents:\n{{documents}}\n\n{{note}}\n\nUpload: {{link}}",
    )),
    whatsapp: L("Bonjour {{firstName}}, pour votre dossier {{reference}}, merci de nous transmettre :\n{{documents}}\nTéléverser : {{link}}", "مرحباً {{firstName}}، بخصوص ملفك {{reference}}، يرجى إرسال:\n{{documents}}\nالرفع: {{link}}", "Hello {{firstName}}, for your file {{reference}}, please send us:\n{{documents}}\nUpload: {{link}}"),
  },
  documents_reminder: {
    subject: L("Rappel : documents en attente — {{reference}}", "تذكير: وثائق في الانتظار — {{reference}}", "Reminder: documents pending — {{reference}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nNous attendons encore les documents suivants pour votre dossier {{reference}} :\n{{documents}}\n\nTéléverser : {{link}}",
      "مرحباً {{firstName}}،\n\nما زلنا ننتظر الوثائق التالية لملفك {{reference}}:\n{{documents}}\n\nالرفع: {{link}}",
      "Hello {{firstName}},\n\nWe are still waiting for the following documents for your file {{reference}}:\n{{documents}}\n\nUpload: {{link}}",
    )),
    whatsapp: L("Rappel {{businessName}} : documents en attente pour {{reference}} :\n{{documents}}\n{{link}}", "تذكير من {{businessName}}: وثائق في الانتظار للملف {{reference}}:\n{{documents}}\n{{link}}", "{{businessName}} reminder: documents pending for {{reference}}:\n{{documents}}\n{{link}}"),
  },
  document_rejected: {
    subject: L("Document à remplacer — {{reference}}", "وثيقة يجب استبدالها — {{reference}}", "Document to replace — {{reference}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nLe document « {{document}} » de votre dossier {{reference}} doit être remplacé.\nMotif : {{note}}\n\nTéléverser une nouvelle version : {{link}}",
      "مرحباً {{firstName}}،\n\nيجب استبدال الوثيقة «{{document}}» في ملفك {{reference}}.\nالسبب: {{note}}\n\nرفع نسخة جديدة: {{link}}",
      "Hello {{firstName}},\n\nThe document \"{{document}}\" in your file {{reference}} needs to be replaced.\nReason: {{note}}\n\nUpload a new version: {{link}}",
    )),
  },
  invoice_issued: {
    subject: L("Facture {{invoiceNumber}}", "الفاتورة {{invoiceNumber}}", "Invoice {{invoiceNumber}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nVotre facture {{invoiceNumber}} d'un montant de {{amount}} est disponible dans votre espace :\n{{link}}\n\nCe montant correspond à nos frais d'assistance uniquement (hors frais officiels).",
      "مرحباً {{firstName}}،\n\nفاتورتك {{invoiceNumber}} بمبلغ {{amount}} متاحة في حسابك:\n{{link}}\n\nيمثل هذا المبلغ أتعاب المساعدة فقط (دون الرسوم الرسمية).",
      "Hello {{firstName}},\n\nYour invoice {{invoiceNumber}} for {{amount}} is available in your dashboard:\n{{link}}\n\nThis amount covers our assistance fees only (excluding official fees).",
    )),
  },
  payment_confirmed: {
    subject: L("Paiement confirmé — {{amount}}", "تم تأكيد الأداء — {{amount}}", "Payment confirmed — {{amount}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nNous confirmons la réception de votre paiement de {{amount}} (réf. {{paymentReference}}, facture {{invoiceNumber}}).\n\nMerci pour votre confiance.\n{{link}}",
      "مرحباً {{firstName}}،\n\nنؤكد توصلنا بأدائك بمبلغ {{amount}} (المرجع {{paymentReference}}، الفاتورة {{invoiceNumber}}).\n\nشكراً على ثقتك.\n{{link}}",
      "Hello {{firstName}},\n\nWe confirm receipt of your payment of {{amount}} (ref. {{paymentReference}}, invoice {{invoiceNumber}}).\n\nThank you for your trust.\n{{link}}",
    )),
    whatsapp: L("{{businessName}} : paiement de {{amount}} confirmé (réf. {{paymentReference}}). Merci !", "{{businessName}}: تم تأكيد أداء {{amount}} (المرجع {{paymentReference}}). شكراً!", "{{businessName}}: payment of {{amount}} confirmed (ref. {{paymentReference}}). Thank you!"),
  },
  payment_reminder: {
    subject: L("Rappel de paiement — facture {{invoiceNumber}}", "تذكير بالأداء — الفاتورة {{invoiceNumber}}", "Payment reminder — invoice {{invoiceNumber}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nSauf erreur de notre part, la facture {{invoiceNumber}} présente un solde de {{amount}}.\nVous pouvez la régler depuis votre espace : {{link}}\n\nSi vous avez déjà effectué le paiement, merci d'ignorer ce message.",
      "مرحباً {{firstName}}،\n\nما لم نكن مخطئين، تتضمن الفاتورة {{invoiceNumber}} رصيداً متبقياً قدره {{amount}}.\nيمكنك أداؤها من حسابك: {{link}}\n\nإذا سبق لك الأداء، يرجى تجاهل هذه الرسالة.",
      "Hello {{firstName}},\n\nAccording to our records, invoice {{invoiceNumber}} has an outstanding balance of {{amount}}.\nYou can pay it from your dashboard: {{link}}\n\nIf you have already paid, please ignore this message.",
    )),
    whatsapp: L("Bonjour {{firstName}}, rappel : solde de {{amount}} sur la facture {{invoiceNumber}}. {{link}}", "مرحباً {{firstName}}، تذكير: رصيد {{amount}} على الفاتورة {{invoiceNumber}}. {{link}}", "Hello {{firstName}}, reminder: balance of {{amount}} on invoice {{invoiceNumber}}. {{link}}"),
  },
  refund_processed: {
    subject: L("Remboursement effectué — {{amount}}", "تم الاسترجاع — {{amount}}", "Refund processed — {{amount}}"),
    body: s(L(
      "Bonjour {{firstName}},\n\nUn remboursement de {{amount}} a été enregistré pour le paiement {{paymentReference}}. Le délai de réception dépend de votre banque.\n{{link}}",
      "مرحباً {{firstName}}،\n\nتم تسجيل استرجاع مبلغ {{amount}} عن الأداء {{paymentReference}}. تختلف مدة التوصل حسب بنكك.\n{{link}}",
      "Hello {{firstName}},\n\nA refund of {{amount}} has been recorded for payment {{paymentReference}}. The time to receive it depends on your bank.\n{{link}}",
    )),
  },
  ticket_reply: {
    subject: L("Nouvelle réponse de votre conseiller", "رد جديد من مستشارك", "New reply from your advisor"),
    body: s(L("Bonjour {{firstName}},\n\nVotre conseiller a répondu à votre message « {{subject}} ».\n\n{{link}}", "مرحباً {{firstName}}،\n\nرد مستشارك على رسالتك «{{subject}}».\n\n{{link}}", "Hello {{firstName}},\n\nYour advisor replied to your message \"{{subject}}\".\n\n{{link}}")),
  },
  inquiry_received: {
    subject: L("Nous avons bien reçu votre demande", "توصلنا بطلبك", "We have received your request"),
    body: s(L(
      "Bonjour {{firstName}},\n\nMerci pour votre message concernant « {{subject}} ». Nous vous répondrons rapidement, généralement sous un jour ouvré.\n\nPour toute urgence, contactez-nous sur WhatsApp : {{businessPhone}}",
      "مرحباً {{firstName}}،\n\nشكراً على رسالتك بخصوص «{{subject}}». سنرد عليك قريباً، عادة خلال يوم عمل.\n\nللحالات المستعجلة، تواصل معنا عبر واتساب: {{businessPhone}}",
      "Hello {{firstName}},\n\nThank you for your message about \"{{subject}}\". We will reply shortly, usually within one business day.\n\nFor anything urgent, contact us on WhatsApp: {{businessPhone}}",
    )),
  },
  admin_new_application: {
    subject: L("Nouveau dossier {{reference}} — {{destination}}", "ملف جديد {{reference}} — {{destination}}", "New application {{reference}} — {{destination}}"),
    body: L("Nouveau dossier soumis par {{customer}} ({{destination}}, formule : {{package}}).\n\n{{link}}", "ملف جديد من {{customer}} ({{destination}}، الباقة: {{package}}).\n\n{{link}}", "New application from {{customer}} ({{destination}}, package: {{package}}).\n\n{{link}}"),
  },
  admin_new_inquiry: {
    subject: L("Nouvelle demande : {{subject}}", "طلب جديد: {{subject}}", "New inquiry: {{subject}}"),
    body: L("{{customer}} a envoyé une demande ({{subject}}).\n\n{{message}}\n\n{{link}}", "أرسل {{customer}} طلباً ({{subject}}).\n\n{{message}}\n\n{{link}}", "{{customer}} sent an inquiry ({{subject}}).\n\n{{message}}\n\n{{link}}"),
  },
  admin_payment_declared: {
    subject: L("Virement à vérifier — {{amount}}", "تحويل للتحقق — {{amount}}", "Transfer to verify — {{amount}}"),
    body: L("{{customer}} a déclaré un virement de {{amount}} (réf. {{paymentReference}}). Vérifiez la réception avant de confirmer.\n\n{{link}}", "صرح {{customer}} بتحويل {{amount}} (المرجع {{paymentReference}}). تحقق من التوصل قبل التأكيد.\n\n{{link}}", "{{customer}} declared a transfer of {{amount}} (ref. {{paymentReference}}). Check receipt before confirming.\n\n{{link}}"),
  },
};
