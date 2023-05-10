export const i18n = {
  message_content: {
    prefix: '📆 <u>Événement</u>',
    created_by: 'Créé par',
    rsvps: 'participant(s)',
    post_scriptum: '<i>Merci de signaler votre participation pour faciliter l\'organisation</i>',
  },
  buttons: {
    rsvp:        '👍    Je participe',
    cancel_rsvp: '↩  Je ne participe plus',
  },
  errors: {
    generic: 'Une erreur est survenue.',
    not_alow: 'Vous n\'êtes pas autorisé à cette commande.',
    id_not_found: 'Cet événement n\'a pas été trouvé. L\'id est-il correct ?\n/listall pour consulter la liste complète des événements.',
    date_not_found: 'La date n\'est pas détectée.\nUsage : /date -id- -date(dd/MM/YYYY)-. Exemple: /date 2 25/12/2023>',
  },
  message_list_content: {
    header: '<u>Liste des événements</u>',
    prefix: '➡ ',
    separator: '➖➖➖',
  },
  help: {
    header: '👀 <u>Liste des commandes disponibles</u> : ',
    event: '<b>/event</b> suivi de la description avec une date au format dd/MM/AAAA ou dd/MM pour créer un événement.\nExemple: /event Réunion le 15/5/2023 à 10h à Ste-Colombe',
    list: '<b>/list</b> pour obtenir la liste des événements sur ce groupe ce sujet',
    help: '<b>/help</b> pour obtenir de cette aide',
    listall: '<b>/listall</b> (réservé aux administrateurs) pour obtenir la liste des événements tout groupe tout sujet',
    date: '<b>/date</b> (réservé aux administrateurs) suivi de l\'ID de l\'événement et la date dd/MM/AAAA ou dd/MM pour ajouter ou modifier la date d\'un événement\nExemple: /date 5 15/5/2023',
    delete: '<b>/delete</b> (réservé aux administrateurs) suivi de l\'ID de l\'événement pour supprimer un événement\nExemple: /delete 5',
    cmd: '<b>/cmd</b> (réservé aux administrateurs) suivi de l\'ID de l\'événement pour obtenir la commande de modification de l\'événement\nExemple: /cmd 5',
    update: '<b>/update</b> (réservé aux administrateurs) suivi de l\'ID de l\'événement et la nouvelle description pour modifier un événement.\nExemple: /update 5 Réunion le 15/5/2023 à 9h30 à Ste-Colombe',
  },
};
