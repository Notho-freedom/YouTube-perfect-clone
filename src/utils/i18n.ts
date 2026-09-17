import type { AppLocale } from './format';

/**
 * Interface copy, keyed by its English string.
 *
 * Keying off English rather than an abstract id keeps call sites readable —
 * `t('Watch later')` — and means an untranslated string degrades to English
 * instead of rendering a raw key. Only chrome that YouTube itself localises is
 * listed here; video titles, channel names and API-derived topics stay in
 * whatever language their author wrote them.
 */
const FR: Record<string, string> = {
  // Guide — primary
  Home: 'Accueil',
  Shorts: 'Shorts',
  Subscriptions: 'Abonnements',
  You: 'Vous',
  History: 'Historique',

  // Guide — You
  'Your channel': 'Votre chaîne',
  Playlists: 'Playlists',
  'Watch later': 'À regarder plus tard',
  'Liked videos': 'Vidéos "J\'aime"',
  'Your videos': 'Vos vidéos',

  // Guide — Explore
  Explore: 'Explorer',
  Trending: 'Tendances',
  Music: 'Musique',
  Live: 'Direct',
  Gaming: 'Jeux vidéo',
  News: 'Actualités',
  Sport: 'Sport',
  Courses: 'Cours',
  'Fashion & beauty': 'Mode et beauté',
  Podcasts: 'Podcasts',

  // Guide — More
  'More from YouTube': 'Autres contenus YouTube',
  'YouTube Music': 'YouTube Music',
  'YouTube Kids': 'YouTube Kids',
  Settings: 'Paramètres',
  'Report history': 'Signalements',
  Help: 'Aide',
  'Send feedback': 'Envoyer des commentaires',

  // Guide — misc
  'Show more': 'Plus',
  'Show fewer': 'Moins',
  'Sign in': 'Se connecter',
  'Sign in to like videos, comment, and subscribe.':
  'Connectez-vous pour aimer des vidéos, commenter et vous abonner.',
  'Grant YouTube access to load your subscriptions.':
  'Autorisez l’accès à YouTube pour charger vos abonnements.',
  'New videos': 'Nouvelles vidéos',
  Library: 'Bibliothèque',
  Upgrade: 'Passer à Premium',
  'New playlist': 'Nouvelle playlist',
  'Liked music': 'Musique que j’aime',
  Playlist: 'Playlist',
  'Auto playlist': 'Playlist automatique',
  songs: 'titres',

  // Masthead
  Search: 'Rechercher',
  'Search with your voice': 'Rechercher avec votre voix',
  Create: 'Créer',
  Notifications: 'Notifications',
  'Keyboard shortcuts': 'Raccourcis clavier',
  Menu: 'Menu',

  // Watch page
  All: 'Tout',
  Filters: 'Filtres',
  'Keep watching': 'Reprendre la lecture',
  'Up next': 'À suivre',
  Autoplay: 'Lecture automatique',
  Comments: 'Commentaires',
  'Add a comment...': 'Ajouter un commentaire...',
  Replies: 'Réponses',
  'Top comments': 'Commentaires les plus pertinents',
  Newest: 'Plus récents',
  Share: 'Partager',
  Save: 'Enregistrer',
  Subscribe: 'S’abonner',
  Subscribed: 'Abonné',
  Download: 'Télécharger',
  'Add to queue': 'Ajouter à la file d’attente',
  'Save to Watch later': 'Enregistrer dans À regarder plus tard',
  'Save to playlist': 'Enregistrer dans une playlist',
  'Not interested': 'Pas intéressé',
  "Don't recommend channel": 'Ne plus recommander cette chaîne',
  Report: 'Signaler',
  'Play all': 'Tout lire',
  Shuffle: 'Aléatoire',

  // Empty states
  'No results found': 'Aucun résultat',
  'Something went wrong': 'Une erreur est survenue',
  'No videos to show right now': 'Aucune vidéo à afficher pour le moment',
  'Try again': 'Réessayer',
  'Show all': 'Tout afficher'
};

const TABLES: Record<AppLocale, Record<string, string>> = { en: {}, fr: FR };

export function translate(text: string, locale: AppLocale): string {
  if (locale === 'en') return text;
  return TABLES[locale]?.[text] ?? text;
}