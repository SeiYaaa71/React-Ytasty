# Ytasty Crousty — Frontend

SPA React + TypeScript de la plateforme de restauration rapide **Ytasty Crousty** (Aix-en-Provence, Lyon, Paris).
Elle consomme l'API REST FastAPI du projet (dépôt backend séparé).

- **Front-office public** : choix du restaurant, carte filtrable, panier, commande sans compte, suivi de commande.
- **Back-office sécurisé (JWT)** : écran cuisine, gestion des produits et disponibilités, ouverture des restaurants, création de comptes, indicateur `GET /health`.

## Stack

| Besoin | Choix |
|---|---|
| Build | Vite (template `react-ts`) |
| UI | React 19, Material UI 6 (thème personnalisé), `@mui/icons-material` |
| Langage | TypeScript `strict` |
| HTTP | axios (instance unique, URL via `.env`, intercepteurs JWT / 401) |
| État global | Redux Toolkit (`auth`, `cart`, `restaurant`) |
| Routage | React Router 7 |
| Temps réel | socket.io-client |

## Lancer le projet

Prérequis : Node.js 20+ et l'API FastAPI lancée (par défaut sur `http://localhost:8000`).

```bash
npm install
cp .env.example .env      # puis adapter les URL si besoin
npm run dev               # http://localhost:5173
```

Autres scripts : `npm run build` (vérification TypeScript + build de production), `npm run preview`, `npm run typecheck`.

### Variables d'environnement

| Variable | Rôle | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API | `http://localhost:8000/api` |
| `VITE_SOCKET_URL` | Serveur Socket.io. Vide = temps réel désactivé (rafraîchissement périodique) | `http://localhost:8000` |

> Le backend doit autoriser l'origine `http://localhost:5173` (CORS), sinon le navigateur bloque les requêtes.

Compte de démonstration : **admin123 / Admin@123456**.

## Architecture

```
src/
├── api/
│   ├── client.ts          # instance axios (URL via .env, intercepteurs JWT / 401)
│   ├── services.ts        # appels API du back-office (auth, users, produits, commandes, restaurants)
│   └── errors.ts          # getErrorMessage() : messages d'erreur FastAPI lisibles
├── components/
│   ├── layout/            # Header, Layout
│   └── ui/                # ProductCard, ConfirmDialog, NotificationProvider (Snackbar global), RoleBadge…
├── constants/             # catégories, libellés/couleurs des statuts, rôles, délai d'alerte cuisine
├── features/
│   ├── auth/              # authSlice (login thunk, logout), ProtectedRoute, UserMenu
│   ├── cart/              # cartSlice, CartDrawer
│   ├── restaurant/        # restaurantSlice (restaurant actif)
│   └── backoffice/        # useRestaurantScope, RestaurantPicker, ProductFormDialog
├── pages/                 # pages publiques (Home, Catalog, ProductDetail, Cart, Checkout, OrderTracking, Login)
│   └── backoffice/        # BackOfficeLayout, KitchenDashboard, ProductsAdmin, RestaurantsAdmin, UsersAdmin
├── realtime/socket.ts     # client Socket.io + hooks useSocketEvent / useSocketStatus
├── store/                 # configureStore, hooks typés
├── theme/                 # thème MUI
├── types/
│   ├── api.ts             # ressources partagées (Restaurant, Product, Order…)
│   └── backoffice.ts      # types du back-office (Role, AuthUser, payloads…)
└── utils/                 # format (prix €, délais), décodage JWT, son de notification
```

### Authentification (authSlice)

- `loginUser` (thunk) appelle `POST /auth/login`, stocke `access_token` dans `localStorage` et reconstruit l'utilisateur (`role`, `restaurant_id`) en décodant le JWT.
- La session est restaurée au rechargement si le token n'est pas expiré.
- `logout` vide la session et le panier. Un 401 de l'API renvoie vers `/login` (intercepteur axios).

### Routes

| URL | Accès | Page |
|---|---|---|
| `/`, `/carte`, `/produit/:id` | public | choix du restaurant, catalogue, fiche produit |
| `/panier`, `/commande`, `/confirmation` | public | panier, tunnel de commande |
| `/suivi`, `/suivi/:order_number` | public | suivi de commande |
| `/login` | public | connexion équipe |
| `/backoffice/cuisine` | staff, admin, direction | Kanban des commandes |
| `/backoffice/produits` | staff (disponibilité), admin (CRUD) | gestion de la carte |
| `/backoffice/restaurants` | admin | ouverture / fermeture |
| `/backoffice/utilisateurs` | admin | création de comptes |

`<ProtectedRoute roles={[...]}>` redirige vers `/login` si l'utilisateur n'est pas connecté et affiche « Accès refusé » si son rôle n'est pas autorisé.

## Écran cuisine

- Filtré automatiquement sur le restaurant de rattachement (staff) ; admin et direction choisissent le restaurant.
- Colonnes Kanban : En attente → Validée → En préparation → Prête, filtre par statut.
- Un clic fait avancer la commande (`PATCH /orders/{n}/status`) ; annulation avec confirmation (`POST /orders/{n}/cancel`).
- Alerte visuelle (bordure rouge pulsée + bandeau) pour les commandes en attente depuis plus de 10 minutes (`LATE_ORDER_MINUTES`).
- Nouvelle commande : carte mise en évidence, notification et son (désactivable).

## Temps réel (Socket.io)

Fonctionnalité choisie : **Option A — Écran cuisine live**.
Une nouvelle commande client apparaît instantanément sur l'écran du staff, avec une notification visuelle et sonore.

### Contrat d'évènements

| Sens | Évènement | Données | Room |
|---|---|---|---|
| client → serveur | `join` / `leave` | `{ room: 'restaurant:<id>' }` | — |
| serveur → client | `order:created` | `Order` | `restaurant:<id>` |
| serveur → client | `order:status_updated` | `Order` | `restaurant:<id>` |

Le token JWT est envoyé dans `auth.token` à la connexion.

### Fonctionnement côté front

- `realtime/socket.ts` crée une connexion unique (si `VITE_SOCKET_URL` est défini) et fournit `useSocketEvent(room, event, handler)`.
- `KitchenDashboard` rejoint la room de son restaurant : `order:created` ajoute la commande à la colonne « En attente », joue un son et affiche une notification ; `order:status_updated` synchronise les écrans cuisine entre eux.
- Sans connexion temps réel, l'écran repasse en rafraîchissement automatique toutes les 10 s : la démo fonctionne dans tous les cas.

### Côté backend (FastAPI + python-socketio)

```python
# pip install python-socketio
import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=["http://localhost:5173"])
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)   # lancer uvicorn sur cet `app`

@sio.event
async def join(sid, data):
    await sio.enter_room(sid, data["room"])

@sio.event
async def leave(sid, data):
    await sio.leave_room(sid, data["room"])

# Dans POST /orders, après l'insertion :
await sio.emit("order:created", order, room=f"restaurant:{order['restaurant_id']}")

# Dans PATCH /orders/{n}/status et POST /orders/{n}/cancel :
await sio.emit("order:status_updated", order, room=f"restaurant:{order['restaurant_id']}")
```

## Adapter au backend

Les routes et noms de champs du back-office sont centralisés dans `src/api/services.ts` et `src/types/`.
Points à vérifier avec l'API :

- contenu du JWT : le front lit `sub` (ou `username`), `role` et `restaurant_id` ;
- noms des champs produit (`image_url`…) et commande (`total_amount`, `price_at_time`…) ;
- valeurs des catégories en base (`src/constants/index.ts`).

## Livrable

Zip `nom1-nom2-nom3.zip` contenant `frontend.txt` (lien de ce dépôt), `backend.txt` (lien du dépôt API) et les slides.
