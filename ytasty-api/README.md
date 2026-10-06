# Ytasty Crousty — API

API REST FastAPI pour la plateforme de restauration rapide multi-établissements
(Aix-en-Provence, Lyon, Paris).

## Démarrage

### Avec Docker (PostgreSQL)

```bash
cp .env.example .env     # renseigner JWT_SECRET_KEY
docker compose up --build
```

L'API écoute sur `http://localhost:8000`. Le conteneur crée les tables et
insère les données initiales au démarrage.

### En local sans Docker (SQLite)

```bash
python -m venv .venv && source .venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy pyjwt "pwdlib[argon2]" "pydantic[email]"
python seed.py
PYTHONPATH=src uvicorn ytasty.main:app --reload --port 8000
```

Sans `DATABASE_URL`, l'API crée un fichier `ytasty.db` en SQLite. C'est le mode
le plus rapide pour développer le frontend.

Documentation interactive : `http://localhost:8000/docs`

## Comptes créés par `seed.py`

| Identifiant | Mot de passe | Rôle | Établissement |
| --- | --- | --- | --- |
| `admin123` | `Admin@123456` | admin | tous |
| `direction` | `Direction@123` | direction | tous |
| `staffaix` | `Staff@123456` | staff | Aix-en-Provence |
| `stafflyon` | `Staff@123456` | staff | Lyon |

## Contrat d'API

| Méthode & route | Accès | Description |
| --- | --- | --- |
| `GET /health` | public | disponibilité de l'API |
| `POST /auth/login` | public | connexion, renvoie le JWT et l'utilisateur |
| `GET /auth/me` | authentifié | revalide une session restaurée |
| `POST /users` | admin | création d'un compte staff, admin ou direction |
| `GET /restaurants` | public | liste des établissements |
| `GET /restaurants/{id}` | public | fiche d'un établissement |
| `PATCH /restaurants/{id}` | admin | modification d'un établissement |
| `PATCH /restaurants/{id}/availability` | admin | ouverture / fermeture |
| `GET /products` | public | liste filtrable : `restaurant_id`, `category`, `q`, `is_available` |
| `GET /products/{id}` | public | fiche d'un produit |
| `POST /products` | admin, staff | création (staff limité à son établissement) |
| `PATCH /products/{id}` | admin, staff | modification |
| `DELETE /products/{id}` | admin, staff | suppression |
| `PATCH /products/{id}/availability` | admin, staff | bascule rupture / disponible |
| `POST /orders` | public | création d'une commande client |
| `GET /orders/{order_number}` | public | suivi par numéro |
| `GET /restaurants/{id}/orders` | authentifié | commandes d'un établissement |
| `PATCH /orders/{order_number}/status` | authentifié | avancement de la préparation |
| `POST /orders/{order_number}/cancel` | authentifié | annulation |

### Forme des données

Les identifiants sont des entiers. Un produit expose son visuel sous le nom
`image`. Une commande est renvoyée **à plat**, même si la base stocke le client
dans une colonne JSON :

```json
{
  "id": 1,
  "order_number": "YCMLMJNT",
  "restaurant_id": 1,
  "status": "pending",
  "pickup_mode": "onsite",
  "customer_name": "Marie Dupont",
  "customer_email": "marie@example.fr",
  "items": [
    { "product_id": 1, "product_name": "Le Crousty Signature", "quantity": 2, "unit_price": 12.9 }
  ],
  "total_amount": 25.8,
  "created_at": "2026-10-06T08:12:03"
}
```

Le corps de `POST /orders` imbrique le client et n'envoie **aucun prix** : le
total est calculé côté serveur à partir des tarifs en base.

```json
{
  "restaurant_id": 1,
  "pickup_mode": "onsite",
  "customer": { "name": "Marie Dupont", "email": "marie@example.fr" },
  "items": [{ "product_id": 1, "quantity": 2 }]
}
```

`pickup_mode` vaut `onsite` ou `takeaway`. Les statuts sont `pending`,
`validated`, `preparing`, `ready`, `collected` et `cancelled`.

## Règles métier appliquées

- Le prix d'une ligne est figé à la commande : un changement de tarif ensuite
  ne modifie pas une commande déjà passée.
- Une commande est refusée si l'établissement est fermé, si un produit est
  indisponible, ou s'il n'appartient pas à l'établissement choisi.
- Un statut ne peut qu'avancer dans l'ordre de préparation, jamais reculer.
- Une commande récupérée ou annulée ne change plus de statut.
- Un équipier n'accède qu'aux commandes et aux produits de son établissement ;
  l'admin et la direction accèdent à tous.
- Un produit présent dans des commandes ne peut pas être supprimé, seulement
  rendu indisponible.

## Erreurs

Toutes les erreurs métier sortent au format FastAPI, ce qui donne un seul
format à traiter côté frontend :

```json
{ "detail": "Cet etablissement est ferme et n'accepte pas de commande" }
```

| Code | Signification |
| --- | --- |
| 400 | règle métier non respectée |
| 401 | authentification absente, invalide ou expirée |
| 403 | rôle insuffisant |
| 404 | ressource inexistante |
| 409 | conflit, par exemple un identifiant déjà pris |
| 422 | validation Pydantic, `detail` est alors une liste |

## CORS

`CORS_ORIGINS` liste les origines autorisées, séparées par des virgules. La
valeur par défaut couvre le serveur de développement Vite
(`http://localhost:5173`). Sans cette configuration, le navigateur bloque tous
les appels du frontend.
