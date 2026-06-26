import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    dashboard: 'Dashboard',
    events: 'Events',
    projects: 'Projects',
    contacts: 'CRM',
    community: 'Community',
    souq: 'Souq',
    orders: 'Orders',
    website: 'Website',
    settings: 'Settings',
    upcoming_events: 'Upcoming Events',
    active_projects: 'Active Projects',
    new_members: 'New Members',
    pending_tasks: 'Pending Tasks',
    shop_sales: 'Shop Sales',
    recent_orders: 'Recent Orders',
    view_all: 'View All',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    status: 'Status',
    priority: 'Priority',
    assigned: 'Assigned',
    due_date: 'Due Date',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    type: 'Type',
    actions: 'Actions',
    total: 'Total',
    price: 'Price',
    stock: 'Stock',
    category: 'Category',
    no_data: 'No data yet',
    loading: 'Loading...',
    // Public site
    home: 'Home',
    our_essence: 'Our Essence',
    gallery: 'Gallery',
    videos: 'Videos',
    label: 'Label',
    contact: 'Contact',
    next_events: 'Next Events',
    past_events: 'Past Events',
    our_artists: 'Our Artists',
    join_us: 'Join Us',
    subscribe: 'Subscribe',
    newsletter: 'Our Newsletter',
    they_trust_us: 'They Trust Us',
  },
  fr: {
    dashboard: 'Tableau de bord',
    events: 'Événements',
    projects: 'Projets',
    contacts: 'CRM',
    community: 'Communauté',
    souq: 'Souq',
    orders: 'Commandes',
    website: 'Site web',
    settings: 'Paramètres',
    upcoming_events: 'Événements à venir',
    active_projects: 'Projets actifs',
    new_members: 'Nouveaux membres',
    pending_tasks: 'Tâches en attente',
    shop_sales: 'Ventes',
    recent_orders: 'Commandes récentes',
    view_all: 'Voir tout',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    search: 'Rechercher...',
    status: 'Statut',
    priority: 'Priorité',
    assigned: 'Assigné',
    due_date: 'Échéance',
    name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    type: 'Type',
    actions: 'Actions',
    total: 'Total',
    price: 'Prix',
    stock: 'Stock',
    category: 'Catégorie',
    no_data: 'Aucune donnée',
    loading: 'Chargement...',
    // Public site
    home: 'Accueil',
    our_essence: 'Notre Essence',
    gallery: 'Galerie',
    videos: 'Vidéos',
    label: 'Label',
    contact: 'Contact',
    next_events: 'Prochains événements',
    past_events: 'Événements passés',
    our_artists: 'Nos Artistes',
    join_us: 'Rejoignez-nous',
    subscribe: "S'abonner",
    newsletter: 'Notre Newsletter',
    they_trust_us: 'Ils nous font confiance',
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('fr');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: 'fr', setLang: () => {}, t: (k) => k };
  return ctx;
}