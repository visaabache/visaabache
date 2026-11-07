import { L } from "./types";

// Templates to be reviewed by a Moroccan legal professional before going live.
// Business identifiers (ICE, RC, address, CNDP number) are displayed from Admin → Settings.

export const legalPages: { slug: string; title: L; content: L }[] = [
  {
    slug: "privacy",
    title: L("Politique de confidentialité", "سياسة الخصوصية", "Privacy policy"),
    content: L(
      `## 1. Responsable du traitement
VISA ABACHE (ci-après « nous ») est responsable du traitement des données personnelles collectées sur ce site. Les coordonnées et identifiants légaux de l'entreprise figurent en bas de chaque page.

Nos traitements sont réalisés conformément à la **loi n° 09-08** relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, et font l'objet des formalités requises auprès de la **CNDP**. Lorsque le RGPD européen s'applique, nous respectons également ses exigences.

## 2. Données collectées
- **Identité et contact** : nom, prénom, e-mail, téléphone, ville.
- **Données du dossier** : date de naissance, nationalité, numéro et validité du passeport, informations de voyage, réponses au questionnaire.
- **Documents** : copies de passeport, pièces justificatives (financières, professionnelles, familiales) que vous choisissez de téléverser.
- **Données de paiement** : montants, références de transaction. Les données de carte bancaire sont saisies uniquement sur la page sécurisée de la passerelle de paiement et ne sont jamais stockées par nous.
- **Données techniques** : adresse IP, journaux de connexion et de sécurité, cookies (voir la Politique cookies).

## 3. Finalités et bases légales
- Fournir les services d'assistance demandés (exécution du contrat) ;
- Traiter vos documents d'identité (sur la base de votre **consentement explicite** recueilli lors de la demande) ;
- Facturation et obligations comptables (obligation légale) ;
- Sécurité du site, prévention de la fraude (intérêt légitime) ;
- Communications marketing uniquement si vous y avez consenti.

## 4. Destinataires
Vos données sont accessibles uniquement à l'équipe VISA ABACHE habilitée et à nos sous-traitants techniques (hébergement, stockage chiffré, envoi d'e-mails, paiement), liés par des obligations de confidentialité. **Nous ne transmettons pas vos données aux autorités consulaires** : c'est vous qui déposez votre demande auprès d'elles. Nous ne vendons jamais vos données.

## 5. Transferts hors du Maroc
Certains prestataires techniques peuvent héberger des données hors du Maroc. Ces transferts sont encadrés conformément à la loi 09-08 (autorisation ou déclaration auprès de la CNDP le cas échéant) et à des garanties contractuelles appropriées.

## 6. Sécurité
Connexion chiffrée (HTTPS), documents chiffrés au repos (AES-256), mots de passe hachés, accès restreints par rôle, journalisation des accès et sauvegardes régulières.

## 7. Durées de conservation
- Documents d'identité et pièces justificatives : supprimés après la clôture du dossier, selon le délai indiqué dans nos paramètres de conservation (par défaut 90 jours) ;
- Brouillons abandonnés : 30 jours ;
- Factures et pièces comptables : durée légale applicable ;
- Compte client : jusqu'à sa suppression ou après une longue période d'inactivité.

## 8. Vos droits
Conformément à la loi 09-08, vous disposez d'un droit d'**accès**, de **rectification**, d'**opposition** et de suppression. Vous pouvez télécharger vos données et demander la suppression de votre compte depuis votre espace, ou nous écrire à l'adresse de contact dédiée aux données personnelles. Vous pouvez également saisir la **CNDP** (www.cndp.ma).

## 9. Modifications
Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de la page.`,
      `## 1. المسؤول عن المعالجة
VISA ABACHE (يشار إليها بـ«نحن») مسؤولة عن معالجة المعطيات الشخصية المجمعة عبر هذا الموقع. تظهر معلومات الاتصال والمعرفات القانونية للمقاولة أسفل كل صفحة.

تتم معالجاتنا وفقاً **للقانون رقم 09-08** المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، وتخضع للإجراءات المطلوبة لدى **اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP)**. وعندما يكون النظام الأوروبي RGPD مطبقاً، نحترم متطلباته أيضاً.

## 2. المعطيات المجمعة
- **الهوية والاتصال**: الاسم، البريد الإلكتروني، الهاتف، المدينة.
- **معطيات الملف**: تاريخ الازدياد، الجنسية، رقم جواز السفر وصلاحيته، معلومات السفر، أجوبة الاستمارة.
- **الوثائق**: نسخ جواز السفر والوثائق الداعمة التي تختار رفعها.
- **معطيات الأداء**: المبالغ ومراجع المعاملات. تُدخل معطيات البطاقة البنكية فقط في الصفحة الآمنة لبوابة الأداء ولا نخزنها أبداً.
- **معطيات تقنية**: عنوان IP، سجلات الاتصال والأمان، ملفات تعريف الارتباط.

## 3. الأغراض والأسس القانونية
- تقديم خدمات المساعدة المطلوبة (تنفيذ العقد)؛
- معالجة وثائق الهوية (بناءً على **موافقتك الصريحة** عند الطلب)؛
- الفوترة والالتزامات المحاسبية (التزام قانوني)؛
- أمن الموقع ومكافحة الاحتيال (مصلحة مشروعة)؛
- التواصل التسويقي فقط إذا وافقت عليه.

## 4. المرسل إليهم
لا يطلع على معطياتك إلا فريق VISA ABACHE المخول ومقدمو الخدمات التقنية (الاستضافة، التخزين المشفر، إرسال البريد، الأداء) الملزمون بالسرية. **لا نرسل معطياتك إلى السلطات القنصلية**: أنت من يودع طلبك لديها. لا نبيع معطياتك أبداً.

## 5. النقل خارج المغرب
قد يستضيف بعض مقدمي الخدمات التقنية معطيات خارج المغرب. يتم تأطير هذا النقل وفقاً للقانون 09-08 (ترخيص أو تصريح لدى CNDP عند الاقتضاء) وبضمانات تعاقدية ملائمة.

## 6. الأمان
اتصال مشفر (HTTPS)، وثائق مشفرة (AES-256)، كلمات مرور مشفرة، ولوج محدود حسب الأدوار، تسجيل عمليات الولوج ونسخ احتياطية منتظمة.

## 7. مدة الاحتفاظ
- وثائق الهوية والوثائق الداعمة: تُحذف بعد إغلاق الملف وفق المدة المحددة في إعدادات الاحتفاظ (90 يوماً افتراضياً)؛
- المسودات المهجورة: 30 يوماً؛
- الفواتير والوثائق المحاسبية: المدة القانونية المطبقة؛
- حساب العميل: إلى حين حذفه أو بعد فترة طويلة من عدم النشاط.

## 8. حقوقك
وفقاً للقانون 09-08، لك الحق في **الولوج** و**التصحيح** و**التعرض** والحذف. يمكنك تحميل معطياتك وطلب حذف حسابك من حسابك، أو مراسلتنا عبر عنوان التواصل المخصص للمعطيات الشخصية. يمكنك أيضاً اللجوء إلى **CNDP** ‏(www.cndp.ma).

## 9. التعديلات
قد يتم تحديث هذه السياسة. يظهر تاريخ آخر تحديث أعلى الصفحة.`,
      `## 1. Data controller
VISA ABACHE ("we") is the controller of personal data collected on this website. The company's contact details and legal identifiers appear at the bottom of every page.

Our processing complies with Moroccan **Law No. 09-08** on the protection of individuals with regard to the processing of personal data and is subject to the required formalities with the **CNDP**. Where the EU GDPR applies, we also comply with its requirements.

## 2. Data we collect
- **Identity and contact**: name, email, phone, city.
- **File data**: date of birth, nationality, passport number and validity, travel information, questionnaire answers.
- **Documents**: passport copies and supporting documents you choose to upload.
- **Payment data**: amounts, transaction references. Card details are entered only on the payment gateway's secure page and are never stored by us.
- **Technical data**: IP address, connection and security logs, cookies (see the Cookie policy).

## 3. Purposes and legal bases
- Providing the assistance services you request (performance of contract);
- Processing your identity documents (based on your **explicit consent** collected with the request);
- Invoicing and accounting obligations (legal obligation);
- Website security and fraud prevention (legitimate interest);
- Marketing communications only if you consented.

## 4. Recipients
Your data is only accessible to authorised VISA ABACHE staff and our technical processors (hosting, encrypted storage, email delivery, payments), bound by confidentiality. **We do not send your data to consular authorities**: you lodge your application with them yourself. We never sell your data.

## 5. Transfers outside Morocco
Some technical providers may host data outside Morocco. Such transfers are carried out in accordance with Law 09-08 (CNDP authorisation or declaration where required) and appropriate contractual safeguards.

## 6. Security
Encrypted connection (HTTPS), documents encrypted at rest (AES-256), hashed passwords, role-based access, access logging and regular backups.

## 7. Retention periods
- Identity and supporting documents: deleted after the file is closed, within the period set in our retention settings (90 days by default);
- Abandoned drafts: 30 days;
- Invoices and accounting records: applicable legal period;
- Client account: until deleted, or after a long period of inactivity.

## 8. Your rights
Under Law 09-08 you have the right of **access**, **rectification**, **objection** and deletion. You can download your data and request account deletion from your dashboard, or write to our personal data contact address. You may also contact the **CNDP** (www.cndp.ma).

## 9. Changes
This policy may be updated. The last update date is shown at the top of the page.`,
    ),
  },
  {
    slug: "terms",
    title: L("Conditions générales de service", "الشروط العامة للخدمة", "Terms & conditions"),
    content: L(
      `## 1. Objet
Les présentes conditions régissent les services d'assistance proposés par VISA ABACHE : information, préparation et organisation de dossiers, aide aux formulaires, accompagnement pour les rendez-vous et services annexes (voyage, études).

## 2. Statut de VISA ABACHE
VISA ABACHE est une **entreprise indépendante**. Elle n'est **ni une ambassade, ni un consulat, ni un centre de visa, ni une autorité publique**, et n'agit pas en leur nom. VISA ABACHE ne délivre aucun visa ni document officiel et n'effectue pas les démarches réservées aux autorités ou au demandeur lui-même.

## 3. Absence de garantie de résultat
La décision d'accorder ou de refuser un visa relève **exclusivement** des autorités compétentes. VISA ABACHE est tenue d'une obligation de moyens et **ne garantit pas l'obtention d'un visa**, ni des délais de traitement ou la disponibilité des rendez-vous.

## 4. Obligations du client
Le client fournit des informations exactes, complètes et à jour, ainsi que des documents authentiques. Il reste seul responsable du contenu de sa demande et de son dépôt auprès des autorités. Toute fraude entraîne l'arrêt immédiat de la prestation.

## 5. Prix
Les prix sont indiqués en dirhams (MAD) et couvrent **uniquement les services d'assistance de VISA ABACHE**. Les frais officiels (frais de visa, frais de service des centres de visa), traductions, assurances et réservations sont réglés séparément aux organismes concernés.

## 6. Paiement
Le paiement s'effectue par virement, en espèces ou par carte bancaire lorsque ce moyen est proposé. Un paiement n'est considéré comme effectué qu'après confirmation par la banque/passerelle ou vérification par VISA ABACHE. Une facture est émise pour chaque prestation.

## 7. Annulation et remboursement
Voir la Politique de remboursement et d'annulation.

## 8. Données personnelles
Voir la Politique de confidentialité.

## 9. Responsabilité
VISA ABACHE ne saurait être tenue responsable des décisions des autorités, de modifications réglementaires, de retards des organismes officiels ou d'informations inexactes fournies par le client.

## 10. Droit applicable
Les présentes conditions sont soumises au droit marocain. En cas de litige, une solution amiable sera recherchée avant toute action devant les tribunaux compétents.`,
      `## 1. الموضوع
تنظم هذه الشروط خدمات المساعدة التي تقدمها VISA ABACHE: الإخبار، تحضير وتنظيم الملفات، المساعدة في الاستمارات، التوجيه بخصوص المواعيد والخدمات الملحقة (السفر، الدراسة).

## 2. صفة VISA ABACHE
VISA ABACHE **مقاولة مستقلة**. **ليست سفارة ولا قنصلية ولا مركز تأشيرات ولا سلطة عمومية**، ولا تتصرف باسمها. لا تصدر VISA ABACHE أي تأشيرة أو وثيقة رسمية ولا تقوم بالإجراءات المخصصة للسلطات أو لصاحب الطلب نفسه.

## 3. عدم ضمان النتيجة
قرار منح التأشيرة أو رفضها يعود **حصرياً** للسلطات المختصة. تلتزم VISA ABACHE ببذل العناية و**لا تضمن الحصول على التأشيرة**، ولا آجال المعالجة ولا توفر المواعيد.

## 4. التزامات العميل
يقدم العميل معلومات صحيحة وكاملة ومحينة ووثائق أصلية، ويبقى المسؤول الوحيد عن مضمون طلبه وإيداعه لدى السلطات. يؤدي أي غش إلى التوقف الفوري عن تقديم الخدمة.

## 5. الأسعار
الأسعار محددة بالدرهم وتغطي **خدمات المساعدة لـ VISA ABACHE فقط**. الرسوم الرسمية (رسوم التأشيرة ورسوم مراكز التأشيرات) والترجمة والتأمين والحجوزات تُدفع بشكل منفصل للجهات المعنية.

## 6. الأداء
يتم الأداء بالتحويل أو نقداً أو بالبطاقة البنكية عند توفرها. لا يُعتبر الأداء منجزاً إلا بعد تأكيده من البنك/البوابة أو التحقق منه من طرف VISA ABACHE. تُصدر فاتورة عن كل خدمة.

## 7. الإلغاء والاسترجاع
انظر سياسة الاسترجاع والإلغاء.

## 8. المعطيات الشخصية
انظر سياسة الخصوصية.

## 9. المسؤولية
لا تتحمل VISA ABACHE مسؤولية قرارات السلطات أو التغييرات التنظيمية أو تأخر الجهات الرسمية أو المعلومات غير الصحيحة المقدمة من العميل.

## 10. القانون المطبق
تخضع هذه الشروط للقانون المغربي. في حالة نزاع، يتم البحث عن حل ودي قبل أي لجوء إلى المحاكم المختصة.`,
      `## 1. Purpose
These terms govern the assistance services offered by VISA ABACHE: information, file preparation and organisation, form assistance, appointment guidance and related services (travel, studies).

## 2. Status of VISA ABACHE
VISA ABACHE is an **independent business**. It is **not an embassy, consulate, visa centre or public authority**, and does not act on their behalf. VISA ABACHE does not issue visas or official documents and does not carry out procedures reserved to the authorities or to the applicant.

## 3. No guarantee of outcome
The decision to grant or refuse a visa rests **exclusively** with the competent authorities. VISA ABACHE has an obligation of means and **does not guarantee that a visa will be issued**, nor processing times or appointment availability.

## 4. Client obligations
The client provides accurate, complete and up-to-date information and genuine documents, and remains solely responsible for the content of their application and its submission to the authorities. Any fraud results in immediate termination of the service.

## 5. Prices
Prices are in Moroccan dirhams (MAD) and cover **only VISA ABACHE's assistance services**. Official fees (visa fees, visa centre service charges), translations, insurance and bookings are paid separately to the relevant bodies.

## 6. Payment
Payment is made by bank transfer, cash or bank card where offered. A payment is only considered made after confirmation by the bank/gateway or verification by VISA ABACHE. An invoice is issued for each service.

## 7. Cancellation and refunds
See the Refund & cancellation policy.

## 8. Personal data
See the Privacy policy.

## 9. Liability
VISA ABACHE cannot be held liable for decisions of the authorities, regulatory changes, delays of official bodies or inaccurate information provided by the client.

## 10. Governing law
These terms are governed by Moroccan law. In case of dispute, an amicable solution will be sought before any action before the competent courts.`,
    ),
  },
  {
    slug: "refunds",
    title: L("Politique de remboursement et d'annulation", "سياسة الاسترجاع والإلغاء", "Refund & cancellation policy"),
    content: L(
      `## Annulation par le client
- **Avant le début du travail sur le dossier** : remboursement intégral des frais d'assistance versés.
- **Après le début du travail** (étude du dossier, check-list personnalisée, préparation) : remboursement au prorata du travail non réalisé, déduction faite des prestations déjà effectuées.
- **Après la livraison du dossier préparé** ou la tenue de la consultation : aucun remboursement.

## Refus de visa
Un refus de visa, décidé par les autorités, **ne donne pas lieu à remboursement** des frais d'assistance, les prestations ayant été réalisées. Nous pouvons vous accompagner pour une nouvelle demande ou un recours, selon conditions.

## Frais officiels et tiers
Les frais officiels, frais de centres de visa, traductions, assurances et réservations sont soumis aux conditions des organismes concernés et ne sont pas remboursables par VISA ABACHE.

## Procédure
Demandez l'annulation par écrit (espace client ou e-mail). Les remboursements sont effectués par le moyen de paiement initial ou par virement, dans un délai indicatif de 14 jours après acceptation.`,
      `## الإلغاء من طرف العميل
- **قبل بدء العمل على الملف**: استرجاع كامل لأتعاب المساعدة المؤداة.
- **بعد بدء العمل** (دراسة الملف، القائمة المخصصة، التحضير): استرجاع نسبي للعمل غير المنجز بعد خصم الخدمات المنجزة.
- **بعد تسليم الملف المحضر** أو إجراء الاستشارة: لا استرجاع.

## رفض التأشيرة
رفض التأشيرة الذي تقرره السلطات **لا يخول استرجاع** أتعاب المساعدة لكون الخدمات قد أنجزت. يمكننا مرافقتك في طلب جديد أو طعن حسب الشروط.

## الرسوم الرسمية والأطراف الأخرى
تخضع الرسوم الرسمية ورسوم مراكز التأشيرات والترجمة والتأمين والحجوزات لشروط الجهات المعنية ولا تسترجعها VISA ABACHE.

## المسطرة
اطلب الإلغاء كتابة (من حسابك أو عبر البريد الإلكتروني). يتم الاسترجاع بوسيلة الأداء الأصلية أو بالتحويل في أجل تقديري قدره 14 يوماً بعد القبول.`,
      `## Cancellation by the client
- **Before work on the file has started**: full refund of the assistance fees paid.
- **After work has started** (file review, personalised checklist, preparation): pro-rata refund of the work not performed, after deducting services already provided.
- **After delivery of the prepared file** or after the consultation has taken place: no refund.

## Visa refusal
A visa refusal decided by the authorities **does not entitle you to a refund** of assistance fees, as the services were performed. We can assist you with a new application or an appeal, subject to conditions.

## Official and third-party fees
Official fees, visa centre charges, translations, insurance and bookings are subject to the conditions of the relevant bodies and are not refundable by VISA ABACHE.

## Procedure
Request cancellation in writing (client dashboard or email). Refunds are made via the original payment method or bank transfer, within an indicative 14 days after acceptance.`,
    ),
  },
  {
    slug: "cookies",
    title: L("Politique cookies", "سياسة ملفات تعريف الارتباط", "Cookie policy"),
    content: L(
      `## Qu'est-ce qu'un cookie ?
Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site.

## Cookies utilisés
| Cookie | Finalité | Durée |
|---|---|---|
| va_session | Connexion sécurisée à votre espace (essentiel) | 14 jours max. |
| NEXT_LOCALE | Mémoriser votre langue (essentiel) | 1 an |
| va_consent | Mémoriser vos choix cookies (essentiel) | 6 mois |
| _ga, _ga_* | Mesure d'audience Google Analytics (**uniquement avec votre accord**) | jusqu'à 13 mois |

## Gérer vos choix
Vous pouvez modifier vos préférences à tout moment via le lien « Paramètres cookies » en bas de page. Refuser les cookies de mesure d'audience n'a aucun impact sur l'utilisation du site.`,
      `## ما هو ملف تعريف الارتباط؟
ملف صغير يُخزن على جهازك عند زيارة موقع.

## الملفات المستعملة
| الملف | الغرض | المدة |
|---|---|---|
| va_session | الاتصال الآمن بحسابك (ضروري) | 14 يوماً كحد أقصى |
| NEXT_LOCALE | حفظ لغتك (ضروري) | سنة |
| va_consent | حفظ اختياراتك (ضروري) | 6 أشهر |
| _ga, _ga_* | قياس الزيارات Google Analytics (**بموافقتك فقط**) | حتى 13 شهراً |

## إدارة اختياراتك
يمكنك تعديل تفضيلاتك في أي وقت عبر رابط «إعدادات ملفات الارتباط» أسفل الصفحة. رفض ملفات قياس الزيارات لا يؤثر على استعمال الموقع.`,
      `## What is a cookie?
A cookie is a small file stored on your device when you visit a website.

## Cookies we use
| Cookie | Purpose | Duration |
|---|---|---|
| va_session | Secure login to your dashboard (essential) | max. 14 days |
| NEXT_LOCALE | Remember your language (essential) | 1 year |
| va_consent | Remember your cookie choices (essential) | 6 months |
| _ga, _ga_* | Google Analytics audience measurement (**only with your consent**) | up to 13 months |

## Managing your choices
You can change your preferences at any time using the "Cookie settings" link at the bottom of the page. Refusing analytics cookies has no impact on using the website.`,
    ),
  },
  {
    slug: "disclaimer",
    title: L("Mentions légales et avertissement", "الإشعار القانوني والتنبيه", "Legal notice & disclaimer"),
    content: L(
      `## Éditeur
Le site est édité par VISA ABACHE, entreprise indépendante établie au Maroc. Raison sociale, adresse, ICE, RC et coordonnées : voir le pied de page et la page Contact.

## Avertissement important
- VISA ABACHE est une **entreprise indépendante d'assistance**. Elle n'est **ni une ambassade, ni un consulat, ni un centre de visa, ni une administration**, et n'a aucun lien officiel avec ces organismes.
- Les informations publiées sur ce site sont fournies à titre **général et indicatif**. Les exigences, frais et délais sont fixés par les autorités et peuvent changer à tout moment. **Seules les sources officielles font foi** ; nous indiquons leurs liens sur chaque page de destination.
- Les délais de traitement affichés sont **indicatifs**.
- **Aucun visa n'est garanti.**
- Les frais affichés pour nos services sont **distincts des frais officiels**.

## Propriété intellectuelle
Les contenus du site (textes, logo, design) sont protégés. Toute reproduction sans autorisation est interdite.

## Hébergement
Les informations sur l'hébergeur sont disponibles sur simple demande.`,
      `## الناشر
ينشر هذا الموقع VISA ABACHE، مقاولة مستقلة مقرها بالمغرب. الاسم القانوني والعنوان وICE وRC ومعلومات الاتصال: انظر أسفل الصفحة وصفحة الاتصال.

## تنبيه مهم
- VISA ABACHE **مقاولة مستقلة للمساعدة**. **ليست سفارة ولا قنصلية ولا مركز تأشيرات ولا إدارة**، ولا تربطها أي علاقة رسمية بهذه الجهات.
- المعلومات المنشورة في هذا الموقع **عامة وتقديرية**. تحدد السلطات المتطلبات والرسوم والآجال ويمكن أن تتغير في أي وقت. **المصادر الرسمية وحدها المعتمدة**؛ نضع روابطها في كل صفحة وجهة.
- آجال المعالجة المعروضة **تقديرية**.
- **لا نضمن أي تأشيرة.**
- أتعاب خدماتنا **منفصلة عن الرسوم الرسمية**.

## الملكية الفكرية
محتويات الموقع (النصوص، الشعار، التصميم) محمية. يمنع أي نسخ دون إذن.

## الاستضافة
معلومات جهة الاستضافة متوفرة عند الطلب.`,
      `## Publisher
This website is published by VISA ABACHE, an independent business established in Morocco. Legal name, address, ICE, RC and contact details: see the footer and the Contact page.

## Important disclaimer
- VISA ABACHE is an **independent assistance business**. It is **not an embassy, consulate, visa centre or government administration**, and has no official link with these bodies.
- Information on this website is provided for **general, indicative purposes**. Requirements, fees and timelines are set by the authorities and may change at any time. **Only official sources are authoritative**; we link to them on every destination page.
- Processing times shown are **indicative**.
- **No visa is guaranteed.**
- Fees shown for our services are **separate from official fees**.

## Intellectual property
Website content (texts, logo, design) is protected. Any reproduction without permission is prohibited.

## Hosting
Information about the hosting provider is available on request.`,
    ),
  },
];

export const articles = [
  {
    slug: "frais-officiels-vs-frais-assistance",
    category: "VISA_INFO" as const,
    title: L("Frais officiels et frais d'assistance : bien faire la différence", "الرسوم الرسمية وأتعاب المساعدة: كيف تميز بينهما", "Official fees vs. assistance fees: knowing the difference"),
    excerpt: L(
      "Lorsque vous préparez une demande de visa, plusieurs types de frais coexistent. Voici comment les distinguer pour éviter toute mauvaise surprise.",
      "عند تحضير طلب التأشيرة، توجد عدة أنواع من الرسوم. إليك كيف تميز بينها لتجنب المفاجآت.",
      "When preparing a visa application, several kinds of fees exist side by side. Here is how to tell them apart and avoid surprises.",
    ),
    content: L(
      `Lorsque vous préparez une demande de visa, il est essentiel de distinguer trois catégories de frais.

## 1. Les frais officiels
Ce sont les frais de visa fixés par l'État de destination. Ils sont payés au consulat ou à son prestataire officiel, et leur montant est publié sur le site officiel. Ils ne sont généralement pas remboursables, même en cas de refus.

## 2. Les frais de service des centres de visa
De nombreux consulats confient la réception des dossiers à des prestataires externes. Ceux-ci facturent des frais de service, également publiés officiellement.

## 3. Les frais d'assistance
Ce sont les honoraires d'un prestataire indépendant comme VISA ABACHE, pour l'aide à la préparation du dossier. Ils sont **toujours distincts** des deux catégories précédentes.

## Nos conseils
- Vérifiez toujours les montants officiels sur le site du consulat.
- Méfiez-vous de toute offre qui « garantit » un visa ou « vend » un rendez-vous.
- Demandez une facture détaillée pour chaque paiement.`,
      `عند تحضير طلب التأشيرة، من الضروري التمييز بين ثلاثة أنواع من الرسوم.

## 1. الرسوم الرسمية
هي رسوم التأشيرة التي تحددها دولة الوجهة. تُدفع للقنصلية أو لمقدم خدماتها الرسمي، ومبلغها منشور على الموقع الرسمي. لا تُسترجع عادة حتى في حالة الرفض.

## 2. رسوم خدمات مراكز التأشيرات
تعهد عدة قنصليات باستقبال الملفات إلى مقدمي خدمات خارجيين يفرضون رسوم خدمة منشورة رسمياً كذلك.

## 3. أتعاب المساعدة
هي أتعاب مقدم خدمات مستقل مثل VISA ABACHE مقابل المساعدة في تحضير الملف، وهي **دائماً منفصلة** عن النوعين السابقين.

## نصائحنا
- تحقق دائماً من المبالغ الرسمية على موقع القنصلية.
- احذر من أي عرض «يضمن» التأشيرة أو «يبيع» الموعد.
- اطلب فاتورة مفصلة عن كل أداء.`,
      `When preparing a visa application, it is essential to distinguish three categories of fees.

## 1. Official fees
These are visa fees set by the destination state. They are paid to the consulate or its official provider, and the amount is published on the official website. They are generally non-refundable, even if the visa is refused.

## 2. Visa centre service charges
Many consulates outsource the reception of applications to external providers, who charge service fees that are also officially published.

## 3. Assistance fees
These are the fees of an independent provider such as VISA ABACHE for help preparing your file. They are **always separate** from the two previous categories.

## Our advice
- Always check official amounts on the consulate's website.
- Be wary of any offer that "guarantees" a visa or "sells" an appointment.
- Ask for a detailed invoice for every payment.`,
    ),
  },
  {
    slug: "preparer-un-dossier-visa-complet",
    category: "ADMIN_PROCEDURES" as const,
    title: L("7 conseils pour préparer un dossier de visa clair et complet", "7 نصائح لتحضير ملف تأشيرة واضح وكامل", "7 tips to prepare a clear and complete visa file"),
    excerpt: L(
      "Un dossier bien organisé facilite le travail de l'agent qui l'examine. Nos conseils pratiques, valables pour la plupart des destinations.",
      "الملف المنظم يسهل عمل الموظف الذي يدرسه. نصائح عملية صالحة لأغلب الوجهات.",
      "A well-organised file makes the reviewing officer's job easier. Practical tips valid for most destinations.",
    ),
    content: L(
      `1. **Partez de la liste officielle** publiée par le consulat — c'est la seule qui fait foi.
2. **Vérifiez votre passeport** : validité restante et pages vierges selon les exigences de la destination.
3. **Soyez cohérent** : dates de voyage, réservations, congés et justificatifs financiers doivent concorder.
4. **Classez les pièces** dans l'ordre de la liste officielle et ajoutez un sommaire.
5. **Préparez des copies lisibles** et, si nécessaire, des traductions par un traducteur agréé.
6. **N'attendez pas la dernière minute** : les délais de rendez-vous peuvent être longs en haute saison.
7. **Ne fournissez jamais de faux documents** : c'est une fraude aux conséquences graves.`,
      `1. **انطلق من القائمة الرسمية** المنشورة من طرف القنصلية — فهي الوحيدة المعتمدة.
2. **تحقق من جواز سفرك**: الصلاحية المتبقية والصفحات الفارغة حسب متطلبات الوجهة.
3. **كن منسجماً**: يجب أن تتطابق تواريخ السفر والحجوزات والعطلة والإثباتات المالية.
4. **رتب الوثائق** حسب ترتيب القائمة الرسمية وأضف فهرساً.
5. **حضّر نسخاً واضحة** وترجمات لدى مترجم محلف عند الحاجة.
6. **لا تنتظر اللحظة الأخيرة**: قد تطول آجال المواعيد في فترات الذروة.
7. **لا تقدم أبداً وثائق مزورة**: إنه غش ذو عواقب خطيرة.`,
      `1. **Start from the official list** published by the consulate — it is the only authoritative one.
2. **Check your passport**: remaining validity and blank pages as required by the destination.
3. **Be consistent**: travel dates, bookings, leave and financial evidence must match.
4. **Order your documents** following the official list and add an index.
5. **Prepare legible copies** and, if needed, translations by a sworn translator.
6. **Don't wait until the last minute**: appointment lead times can be long in peak season.
7. **Never provide false documents**: it is fraud with serious consequences.`,
    ),
  },
];
