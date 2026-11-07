# Guide de l'administrateur — VISA ABACHE

Ce guide explique comment gérer la plateforme au quotidien, seul(e), en quelques minutes par dossier.
Accès : `https://votre-domaine/fr/admin` (connexion avec votre compte propriétaire).

---

## 1. Premier démarrage (une seule fois)

Le **tableau de bord** affiche une liste « Configuration ». Complétez chaque point :

1. **Paramètres → Identité de l'entreprise** : raison sociale, adresse, ICE, RC, IF, patente, n° CNDP, e-mail de contact données personnelles. Ces informations apparaissent sur les factures et les pages légales.
2. **Paramètres → WhatsApp** : votre numéro au format international (ex. `2126XXXXXXXX`). Le bouton WhatsApp et tous les messages pré-remplis l'utilisent.
3. **Paramètres → Paiements** : banque, bénéficiaire, RIB. Activez ou désactivez virement, espèces et carte (CMI).
4. **Formules** et **Services** : remplacez les prix d'exemple par vos vrais tarifs.
5. **Destinations** : pour chaque pays, vérifiez le contenu sur le site officiel, corrigez si besoin, puis cochez **« Marquer comme vérifié aujourd'hui »**. Tant que ce n'est pas fait, la page publique affiche un avertissement.
6. **Pages légales** : faites relire les textes par un professionnel et indiquez la version.
7. **Équipe & rôles** : changez votre mot de passe (via *Mon espace → Profil*) et ajoutez éventuellement un assistant.

## 2. La routine quotidienne (10–15 minutes)

1. **Tableau de bord** : les compteurs indiquent ce qui demande votre attention (nouvelles demandes, documents à vérifier, paiements à vérifier, échéances dépassées). Cliquez sur un compteur pour voir la liste filtrée.
2. **Demandes** et **Messagerie** : répondez aux messages (e-mail, WhatsApp ou réponse dans la messagerie).
3. **Paiements → À vérifier** : vérifiez sur votre relevé bancaire, puis confirmez. **Ne confirmez jamais un paiement non reçu.**

## 3. Traiter un dossier

Ouvrez **Dossiers** puis cliquez sur la référence (`VA-26-XXXXXX`). Tout se fait sur une seule page.

| Action | Où | Effet automatique |
|---|---|---|
| Changer le statut | « Changer le statut » (+ message facultatif) | Historique, e-mail et notification au client (si le statut est marqué ✉) |
| Demander des documents | « Demander des documents manquants », une ligne par document : `Titre \| description` | Statut « Documents requis », e-mail au client, relances automatiques |
| Vérifier un document | 👁 pour l'ouvrir, puis **Valider** ou **Refuser** (avec motif) | En cas de refus : le client est notifié et une nouvelle demande est créée |
| Partager un document | « Partager un document avec le client » (ex. formulaire pré-rempli à relire) | Le client le télécharge depuis son espace |
| Note interne | « Notes internes » | Visible uniquement par l'équipe |
| Échéance, priorité, responsable, formule | Bloc « Détails » | L'échéance apparaît dans le tableau de bord ; les dossiers prioritaires remontent en tête de liste |
| Facture | « Générer la facture » (créée automatiquement à la soumission si une formule est choisie) | Numérotation séquentielle, e-mail au client |
| Paiement espèces ou virement reçu | « Enregistrer un paiement » | Facture mise à jour, confirmation envoyée au client |
| Relancer par WhatsApp | Boutons verts en haut du dossier | Ouvre WhatsApp avec un message prêt à envoyer |
| Tout télécharger | « Tout télécharger (ZIP) » | Archive de tous les documents + fiche récapitulative |

Quand les documents demandés sont téléversés, le statut passe automatiquement à **« Documents reçus »**.

**Rappel important :** VISA ABACHE ne dépose jamais la demande à la place du client sur les sites gouvernementaux et ne prend aucune décision à sa place. Le client reste maître de sa demande.

## 4. Paiements et factures

- **Carte (CMI)** : le paiement est confirmé uniquement par le retour sécurisé de la banque. Rien à faire de votre côté.
- **Virement** : le client téléverse son justificatif. Le paiement apparaît dans *Paiements → À vérifier*. Vérifiez sur votre relevé, puis **Confirmer** (avec la référence du relevé) ou **Rejeter**.
- **Espèces** : enregistrez le paiement depuis le dossier ou la facture.
- **Remboursement** : *Paiements* → paiement confirmé → « Rembourser » (montant, motif, référence).
- **Facture libre** (service hors visa) : *Factures → Nouvelle facture* (e-mail du client requis).
- **Rapports** : *Rapports* affiche le facturé, l'encaissé, les remboursements et le net par mois, avec export CSV pour votre comptable.

## 5. Contenu du site

- **Destinations** : modifiez textes, types de visa, liens officiels et FAQ.
  - **Check-list** : chaque document peut être limité à certains types de visa (codes séparés par des virgules) et/ou à une **condition** sur les réponses du client (ex. question `employment` = `employed` → « Attestation de travail »). C'est ce qui génère la check-list personnalisée.
  - **Questions du formulaire** : questions propres à la destination. Les questions communes à toutes les destinations se trouvent sous *Destinations → Questions du formulaire*.
  - « Copier la check-list depuis… » réutilise la liste d'un autre pays.
  - **Frais officiels** : indiquez ce que publie l'autorité (ou un renvoi vers le site officiel). Ne les mélangez jamais avec vos frais d'assistance.
- **Services** et **Formules** : descriptions, prix (fixe, « à partir de », sur devis), activation, mise en avant, promotions (ancien prix + date de fin).
- **Blog** : rédigez en markdown (`## Titre`, `**gras**`, listes `-`). Remplissez au moins le français ; les autres langues reprennent le français si elles sont vides.
- **FAQ**, **Bannières** (bandeau promotionnel en haut du site), **Codes promo** (pourcentage ou montant, dates, nombre d'utilisations).
- **Avis clients** : les clients dont le dossier est terminé peuvent laisser un avis depuis leur espace. Vous le **vérifiez** puis le **publiez** (uniquement s'il a donné son accord). N'inventez et ne modifiez jamais un avis.

## 6. Notifications

*Modèles de notification* : chaque message existe en FR / AR / EN, par e-mail et (pour certains) WhatsApp. Variables disponibles : `{{firstName}}`, `{{reference}}`, `{{status}}`, `{{documents}}`, `{{amount}}`, `{{invoiceNumber}}`, `{{link}}`…
*Paramètres → Notifications* : délai et nombre maximum de relances, e-mail admin.

## 7. Automatisations

Toutes les heures, la plateforme :
- relance les clients qui n'ont pas envoyé les documents demandés ;
- relance les factures impayées ;
- archive les dossiers terminés ou annulés après le délai choisi ;
- supprime les documents des dossiers clos selon la politique de conservation (les justificatifs de paiement sont conservés) ;
- supprime les brouillons abandonnés et les sessions expirées.

*Automatisations* affiche l'historique et permet un lancement manuel.

## 8. Protection des données (loi 09-08)

- **Demandes des personnes** (*Protection des données*) : un client peut télécharger ses données lui-même et demander la suppression de son compte. Traitez la demande, puis utilisez **« Anonymiser »** dans la fiche client si la suppression est acceptée (les factures sont conservées pour les obligations comptables).
- **Consentements** : chaque acceptation (conditions, traitement des documents, WhatsApp, marketing) est horodatée.
- **Journal d'audit** : chaque consultation de document, export, changement de statut, paiement ou modification de paramètre est tracé.
- Ne téléchargez les documents des clients sur votre ordinateur qu'en cas de nécessité, et supprimez-les ensuite.

## 9. Équipe

| Rôle | Peut faire |
|---|---|
| Assistant | Dossiers, clients (lecture), demandes, messagerie |
| Administrateur | Tout, sauf la gestion de l'équipe |
| Propriétaire | Tout |

Pour ajouter un membre : *Équipe & rôles → Ajouter un membre* (mot de passe provisoire à lui transmettre ; il le change ensuite dans *Mon espace → Profil*).

## 10. En cas de problème

- **Mot de passe oublié** : lien « Mot de passe oublié ? » sur la page de connexion. En dernier recours, un développeur peut lancer `npm run admin:create -- votre@email.ma`.
- **Les e-mails ne partent pas** : vérifiez *Automatisations → Dernières notifications envoyées* (statut et erreur) et la configuration e-mail de l'hébergement.
- **Trop de tentatives de connexion** : attendez 15 minutes (protection anti-piratage).
