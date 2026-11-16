/**
 * Legal and help page TEMPLATES. Have them reviewed by a Moroccan legal professional before going live.
 * {store}, {email}, {phone}, {address}, {legalName}, {ice} are replaced with values from Admin → Settings.
 */
type T = { fr: string; ar: string; en: string };

export const pages: { slug: string; title: T; body: T }[] = [
  {
    slug: "shipping",
    title: { fr: "Livraison", ar: "التوصيل", en: "Delivery" },
    body: {
      fr: `## Au Maroc
Nous livrons dans toutes les villes du Maroc. Les frais dépendent de la ville et sont affichés avant la validation de la commande. La livraison est offerte au-delà du montant indiqué dans le panier.

Les délais indiqués courent à partir de la confirmation de la commande. Nous vous appelons ou vous écrivons pour confirmer l'adresse et le créneau.

## Paiement à la livraison
Vous réglez en espèces au livreur à la réception. Merci de préparer l'appoint si possible.

## International
Nous expédions vers les pays listés au moment de la commande. Les frais dépendent du pays et du poids du colis. Les droits de douane et taxes éventuels du pays de destination sont à la charge du destinataire.

## Suivi
Dès l'expédition, vous recevez un numéro de suivi. Vous pouvez aussi suivre votre commande depuis la page « Suivre une commande ».`,
      ar: `## داخل المغرب
نوصل إلى جميع المدن المغربية. تختلف الرسوم حسب المدينة وتظهر قبل تأكيد الطلب. ويكون التوصيل مجانياً فوق المبلغ المبيّن في السلة.

تُحتسب المدد المذكورة ابتداءً من تأكيد الطلب. سنتصل بك أو نراسلك لتأكيد العنوان والموعد.

## الدفع عند الاستلام
تدفع نقداً لعامل التوصيل عند الاستلام. المرجو تحضير المبلغ المضبوط إن أمكن.

## الشحن الدولي
نشحن إلى البلدان المعروضة عند الطلب. تختلف الرسوم حسب البلد ووزن الطرد. وتبقى الرسوم الجمركية والضرائب المحتملة في بلد الوصول على عاتق المستلم.

## التتبع
عند الشحن تتوصل برقم التتبع. ويمكنك أيضاً تتبع طلبك من صفحة «تتبع طلب».`,
      en: `## In Morocco
We deliver to every city in Morocco. Fees depend on the city and are shown before you confirm your order. Delivery is free above the amount shown in the cart.

Delivery times start when the order is confirmed. We call or message you to confirm the address and time.

## Cash on delivery
You pay the courier in cash when the parcel arrives. Please have the exact amount ready if you can.

## International
We ship to the countries listed at checkout. Fees depend on the country and parcel weight. Any customs duties and taxes in the destination country are paid by the recipient.

## Tracking
Once shipped, you receive a tracking number. You can also follow your order from the “Track an order” page.`,
    },
  },
  {
    slug: "returns",
    title: { fr: "Retours et remboursements", ar: "الإرجاع والاسترجاع", en: "Returns and refunds" },
    body: {
      fr: `## Droit de rétractation
Conformément à la loi n° 31-08 édictant des mesures de protection du consommateur, vous disposez de 7 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à vous justifier.

## Comment retourner un article
- Contactez-nous à {email} ou au {phone} en indiquant votre numéro de commande.
- Renvoyez l'article dans son état d'origine et, si possible, dans son emballage.
- Les frais de retour sont à votre charge, sauf article défectueux ou erreur de notre part.

## Article cassé ou défectueux
La céramique est fragile. Si un article arrive endommagé, envoyez-nous une photo dans les 48 heures suivant la réception : nous le remplaçons ou le remboursons.

## Remboursement
Le remboursement est effectué au plus tard dans les 30 jours suivant la réception du retour, par le même moyen de paiement ou par virement pour les paiements à la livraison.

Les articles personnalisés ne peuvent pas être retournés, sauf défaut.`,
      ar: `## حق التراجع
طبقاً للقانون رقم 31.08 القاضي بتحديد تدابير لحماية المستهلك، لديك أجل 7 أيام ابتداءً من استلام طلبك لممارسة حق التراجع دون الحاجة إلى تبرير.

## كيفية إرجاع منتج
- تواصل معنا عبر {email} أو على الرقم {phone} مع ذكر رقم الطلب.
- أعد المنتج في حالته الأصلية، وفي غلافه إن أمكن.
- مصاريف الإرجاع على عاتقك، إلا في حالة منتج معيب أو خطأ من جهتنا.

## منتج مكسور أو معيب
الخزف هش. إذا وصلك منتج متضرر، أرسل لنا صورة خلال 48 ساعة من الاستلام: سنستبدله أو نرد ثمنه.

## الاسترجاع
يتم رد المبلغ في أجل أقصاه 30 يوماً من توصلنا بالمنتج المُرجَع، بنفس وسيلة الأداء أو بتحويل بنكي بالنسبة للدفع عند الاستلام.

لا يمكن إرجاع المنتجات المخصصة إلا في حالة وجود عيب.`,
      en: `## Right of withdrawal
Under Moroccan Law No. 31-08 on consumer protection, you have 7 days from receiving your order to withdraw from the purchase, without giving a reason.

## How to return an item
- Contact us at {email} or {phone} with your order number.
- Send the item back in its original condition and, if possible, in its packaging.
- Return shipping is at your expense unless the item is faulty or we made a mistake.

## Broken or faulty items
Ceramics are fragile. If an item arrives damaged, send us a photo within 48 hours of delivery: we will replace or refund it.

## Refunds
Refunds are made within 30 days of receiving the return, using the original payment method, or by bank transfer for cash-on-delivery orders.

Personalised items cannot be returned unless faulty.`,
    },
  },
  {
    slug: "terms",
    title: { fr: "Conditions générales de vente", ar: "الشروط العامة للبيع", en: "Terms of sale" },
    body: {
      fr: `## Vendeur
{legalName}, {address}. ICE : {ice}. Contact : {email}, {phone}.

## Produits
Les produits sont décrits avec la plus grande exactitude possible. Chaque fiche indique la fabrication de la pièce (motif inspiré du zellige, réalisé par des artisans ou fait main vérifié). Les couleurs peuvent légèrement varier selon l'écran.

## Prix
Les prix sont indiqués en dirhams marocains (MAD), toutes taxes comprises. Les conversions dans d'autres devises sont données à titre indicatif. Les frais de livraison sont indiqués avant la validation de la commande.

## Commande
La commande est ferme après validation. Pour le paiement à la livraison, nous pouvons vous contacter pour la confirmer. Nous nous réservons le droit d'annuler une commande en cas de rupture de stock ; vous en êtes alors informé et remboursé le cas échéant.

## Paiement
Paiement à la livraison, par carte bancaire via une plateforme sécurisée, ou par virement bancaire. Les données de carte ne sont jamais conservées par {store}.

## Livraison, rétractation et retours
Voir les pages Livraison et Retours.

## Litiges
Les présentes conditions sont soumises au droit marocain. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.`,
      ar: `## البائع
{legalName}، {address}. التعريف الموحد للمقاولة: {ice}. التواصل: {email}، {phone}.

## المنتجات
توصف المنتجات بأكبر قدر ممكن من الدقة. وتبيّن كل صفحة طريقة صنع القطعة (زخرفة مستوحاة من الزليج، أو من صنع حرفيين، أو مصنوعة يدوياً بعد التحقق). قد تختلف الألوان قليلاً حسب الشاشة.

## الأسعار
الأسعار معروضة بالدرهم المغربي شاملة لجميع الضرائب. والتحويل إلى عملات أخرى للاستئناس فقط. وتظهر رسوم التوصيل قبل تأكيد الطلب.

## الطلب
يصبح الطلب نهائياً بعد تأكيده. وبالنسبة للدفع عند الاستلام قد نتصل بك لتأكيده. ونحتفظ بحق إلغاء الطلب في حالة نفاد المخزون، مع إخبارك ورد المبلغ عند الاقتضاء.

## الأداء
الدفع عند الاستلام، أو بالبطاقة البنكية عبر منصة آمنة، أو بالتحويل البنكي. لا يحتفظ {store} أبداً بمعطيات البطاقة.

## التوصيل والتراجع والإرجاع
انظر صفحتي التوصيل والإرجاع.

## النزاعات
تخضع هذه الشروط للقانون المغربي. وفي حالة نزاع يتم البحث عن حل ودي قبل أي إجراء قضائي.`,
      en: `## Seller
{legalName}, {address}. ICE: {ice}. Contact: {email}, {phone}.

## Products
Products are described as accurately as possible. Each product page states how the piece is made (zellige-inspired design, made by artisans, or verified handmade). Colours may vary slightly between screens.

## Prices
Prices are in Moroccan dirhams (MAD), all taxes included. Conversions into other currencies are for information only. Delivery fees are shown before you confirm your order.

## Orders
An order is binding once confirmed. For cash on delivery we may contact you to confirm it. We may cancel an order if an item is out of stock; you will be informed and refunded where applicable.

## Payment
Cash on delivery, card payment through a secure provider, or bank transfer. {store} never stores card details.

## Delivery, withdrawal and returns
See the Delivery and Returns pages.

## Disputes
These terms are governed by Moroccan law. In case of dispute, an amicable solution will be sought before any legal action.`,
    },
  },
  {
    slug: "privacy",
    title: { fr: "Politique de confidentialité", ar: "سياسة الخصوصية", en: "Privacy policy" },
    body: {
      fr: `## Responsable du traitement
{legalName}, {address}. Contact : {email}.

## Données collectées
Nom, e-mail, téléphone, adresse de livraison et contenu de vos commandes ; e-mail pour la newsletter si vous vous inscrivez ; avis que vous publiez.

## Finalités
Traiter et livrer vos commandes, vous contacter à leur sujet, gérer votre compte, et vous envoyer la newsletter si vous l'avez demandée.

## Destinataires
Nos services, le transporteur chargé de la livraison et le prestataire de paiement. Vos données ne sont jamais vendues.

## Conservation
Les données de commande sont conservées pendant la durée requise par les obligations comptables et légales.

## Vos droits
Conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et d'opposition. Écrivez-nous à {email}. Ce traitement fait l'objet d'une déclaration auprès de la CNDP.

## Cookies
Le site utilise uniquement les cookies nécessaires (session, langue, devise). Le panier et les favoris sont conservés dans votre navigateur.`,
      ar: `## المسؤول عن المعالجة
{legalName}، {address}. التواصل: {email}.

## المعطيات المجمّعة
الاسم والبريد الإلكتروني والهاتف وعنوان التوصيل ومحتوى طلباتك؛ والبريد الإلكتروني للنشرة إذا اشتركت فيها؛ والتقييمات التي تنشرها.

## الأغراض
معالجة طلباتك وتوصيلها، والتواصل معك بشأنها، وتدبير حسابك، وإرسال النشرة إذا طلبتها.

## المستفيدون
مصالحنا، وشركة التوصيل المكلفة، ومزوّد خدمة الأداء. لا نبيع معطياتك أبداً.

## مدة الحفظ
تُحفظ معطيات الطلبات طوال المدة التي تفرضها الالتزامات المحاسبية والقانونية.

## حقوقك
طبقاً للقانون رقم 09.08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، لك حق الولوج والتصحيح والتعرض. راسلنا على {email}. وتخضع هذه المعالجة لتصريح لدى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي.

## ملفات تعريف الارتباط
يستعمل الموقع فقط الملفات الضرورية (الجلسة، اللغة، العملة). وتُحفظ السلة والمفضلة في متصفحك.`,
      en: `## Data controller
{legalName}, {address}. Contact: {email}.

## Data we collect
Name, email, phone, delivery address and the content of your orders; your email for the newsletter if you subscribe; reviews you publish.

## Purposes
To process and deliver your orders, contact you about them, manage your account, and send the newsletter if you asked for it.

## Recipients
Our team, the courier delivering your order and the payment provider. Your data is never sold.

## Retention
Order data is kept for as long as accounting and legal obligations require.

## Your rights
Under Moroccan Law No. 09-08 on the protection of individuals with regard to the processing of personal data, you have the right to access, correct and object. Write to {email}. This processing is declared to the CNDP.

## Cookies
The site only uses necessary cookies (session, language, currency). Your cart and wishlist are stored in your browser.`,
    },
  },
  {
    slug: "legal",
    title: { fr: "Mentions légales", ar: "إشعار قانوني", en: "Legal notice" },
    body: {
      fr: `## Éditeur
{legalName}, {address}. ICE : {ice}. E-mail : {email}. Téléphone : {phone}.

## Propriété intellectuelle
Les textes, photographies et éléments graphiques du site appartiennent à {store} ou sont utilisés avec autorisation. Toute reproduction sans accord est interdite.`,
      ar: `## الناشر
{legalName}، {address}. التعريف الموحد للمقاولة: {ice}. البريد الإلكتروني: {email}. الهاتف: {phone}.

## الملكية الفكرية
النصوص والصور والعناصر البصرية في الموقع ملك لـ {store} أو مستعملة بإذن. ويُمنع أي نسخ دون موافقة.`,
      en: `## Publisher
{legalName}, {address}. ICE: {ice}. Email: {email}. Phone: {phone}.

## Intellectual property
The texts, photographs and graphics on this site belong to {store} or are used with permission. Reproduction without consent is prohibited.`,
    },
  },
  {
    slug: "contact",
    title: { fr: "Contact", ar: "اتصل بنا", en: "Contact" },
    body: {
      fr: `Une question sur un produit, une commande ou un cadeau personnalisé ? Nous répondons avec plaisir.

- E-mail : {email}
- Téléphone et WhatsApp : {phone}
- Adresse : {address}

Pour une commande, indiquez votre numéro de commande : nous vous répondrons plus vite.`,
      ar: `هل لديك سؤال عن منتج أو طلب أو هدية مخصصة؟ يسعدنا الرد عليك.

- البريد الإلكتروني: {email}
- الهاتف وواتساب: {phone}
- العنوان: {address}

بالنسبة للطلبات، اذكر رقم الطلب لنجيبك بسرعة أكبر.`,
      en: `A question about a product, an order or a personalised gift? We are happy to help.

- Email: {email}
- Phone and WhatsApp: {phone}
- Address: {address}

For an order, include your order number so we can answer faster.`,
    },
  },
];
