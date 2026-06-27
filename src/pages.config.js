/**
 * pages.config.js - Page routing configuration
 *
 * Pages are lazy-loaded via React.lazy() so each page becomes its own chunk,
 * downloaded on demand. This keeps the initial bundle small (public visitors
 * don't download the back-office code, and vice-versa).
 *
 * THE ONLY EDITABLE VALUE: mainPage — controls the landing page.
 * Rendering these pages requires a <Suspense> boundary (see App.jsx).
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const CRM = lazy(() => import('./pages/CRM'));
const Community = lazy(() => import('./pages/Community'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Content = lazy(() => import('./pages/Content'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Events = lazy(() => import('./pages/Events'));
const FixTags = lazy(() => import('./pages/FixTags'));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const ImportAudience = lazy(() => import('./pages/ImportAudience'));
const JoinCommunity = lazy(() => import('./pages/JoinCommunity'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
const MyAccount = lazy(() => import('./pages/MyAccount'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Orders = lazy(() => import('./pages/Orders'));
const PersonDetail = lazy(() => import('./pages/PersonDetail'));
const PostLogin = lazy(() => import('./pages/PostLogin'));
const Products = lazy(() => import('./pages/Products'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const PublicAbout = lazy(() => import('./pages/PublicAbout'));
const PublicContact = lazy(() => import('./pages/PublicContact'));
const PublicEvents = lazy(() => import('./pages/PublicEvents'));
const PublicGallery = lazy(() => import('./pages/PublicGallery'));
const PublicHome = lazy(() => import('./pages/PublicHome'));
const PublicSouq = lazy(() => import('./pages/PublicSouq'));
const PublicWatch = lazy(() => import('./pages/PublicWatch'));
const Ticketing = lazy(() => import('./pages/Ticketing'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const WebsiteManager = lazy(() => import('./pages/WebsiteManager'));


export const PAGES = {
    "CRM": CRM,
    "Community": Community,
    "Contacts": Contacts,
    "Content": Content,
    "Dashboard": Dashboard,
    "EventDetail": EventDetail,
    "Events": Events,
    "FixTags": FixTags,
    "GlobalSearch": GlobalSearch,
    "ImportAudience": ImportAudience,
    "JoinCommunity": JoinCommunity,
    "MediaLibrary": MediaLibrary,
    "MyAccount": MyAccount,
    "MyOrders": MyOrders,
    "Orders": Orders,
    "PersonDetail": PersonDetail,
    "PostLogin": PostLogin,
    "Products": Products,
    "ProjectDetail": ProjectDetail,
    "Projects": Projects,
    "PublicAbout": PublicAbout,
    "PublicContact": PublicContact,
    "PublicEvents": PublicEvents,
    "PublicGallery": PublicGallery,
    "PublicHome": PublicHome,
    "PublicSouq": PublicSouq,
    "PublicWatch": PublicWatch,
    "Ticketing": Ticketing,
    "UserManagement": UserManagement,
    "WebsiteManager": WebsiteManager,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
