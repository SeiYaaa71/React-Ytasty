# Ytasty Crousty — Frontend

Single Page Application React 19 / TypeScript qui consomme l'API FastAPI
Ytasty Crousty.

## Démarrage

Lancer d'abord le backend (voir son README), puis :

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

| Variable | Valeur par défaut | Rôle |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | base de l'instance axios, **sans** préfixe `/api` |
| `VITE_SOCKET_URL` | vide | serveur Socket.io ; vide désactive le temps réel |

## Contrat consommé

Les types de `src/types/api.ts` reflètent exactement ce que renvoie le backend.
Trois points sur lesquels se tromper coûte cher :

- les identifiants sont des **entiers**, pas des chaînes ;
- un produit expose son visuel sous le nom **`image`**, pas `image_url` ;
- le mode de retrait vaut **`onsite`** ou `takeaway`.

`POST /orders` imbrique le client et n'envoie aucun prix :

```ts
{
  restaurant_id: 1,
  pickup_mode: 'onsite',
  customer: { name: 'Marie Dupont', email: 'marie@example.fr' },
  items: [{ product_id: 1, quantity: 2 }],
}
```

Le backend renvoie la commande à plat (`customer_name`, `customer_email`,
`total_amount`, et `items[].product_name` / `items[].unit_price`).

Si une route ou un nom de champ change côté backend, `src/api/services.ts` est
le seul fichier à adapter.

## Authentification

`src/api/client.ts` injecte le `Bearer` dans chaque requête et gère les 401 :
purge du token puis redirection vers `/login?expired=1`. Un 401 sur
`/auth/login` est laissé au formulaire, sinon une mauvaise saisie de mot de
passe déclencherait une boucle de redirection.

La session est reconstruite au rechargement depuis l'utilisateur renvoyé par
`/auth/login`, avec repli sur le décodage du JWT. Ce décodage ne sert qu'à
l'affichage : les permissions réelles sont vérifiées par le backend à chaque
appel, et `<ProtectedRoute />` n'est qu'un confort d'interface.

## Comptes de démonstration

| Identifiant | Mot de passe | Rôle |
| --- | --- | --- |
| `admin123` | `Admin@123456` | admin |
| `staffaix` | `Staff@123456` | staff Aix |
| `stafflyon` | `Staff@123456` | staff Lyon |

## Routes

| Chemin | Accès |
| --- | --- |
| `/` | accueil, choix de l'établissement |
| `/carte` | catalogue filtrable |
| `/produit/:id` | fiche produit |
| `/panier`, `/commande`, `/confirmation` | tunnel de commande |
| `/suivi`, `/suivi/:order_number` | suivi client |
| `/login` | connexion de l'équipe |
| `/backoffice/cuisine` | staff, admin, direction |
| `/backoffice/produits` | staff, admin |
| `/backoffice/restaurants`, `/backoffice/utilisateurs` | admin |

## Socket.io

Le contrat est décrit dans `src/realtime/socket.ts`. Tant que
`VITE_SOCKET_URL` est vide, les écrans fonctionnent avec leur rafraîchissement
périodique : le temps réel est un confort, pas une dépendance.
