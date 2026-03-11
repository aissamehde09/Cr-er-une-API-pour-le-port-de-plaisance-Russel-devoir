# API Russell Marina

API Express + MongoDB avec un tableau de bord simple pour les catways, les reservations et les utilisateurs.

## Installation

1. Installer les dependances :

```bash
npm install
```

2. Configurer l'environnement (voir **Environnement** ci-dessous) :

Creer un fichier `.env` a la racine du projet et renseigner les valeurs requises.

3. Initialiser un compte admin :

```bash
npm run seed:admin
```

4. Demarrer le serveur :

```bash
npm run dev
```

## Environnement

Creer `.env` avec les cles suivantes :

```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/russell_marina
JWT_SECRET=replace_me
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@russell.local
ADMIN_PASSWORD=admin123
```

Notes :
- `seed:admin` utilise les valeurs `ADMIN_*` pour creer ou mettre a jour le compte admin.
- L'API accepte soit un token Bearer, soit le cookie HTTP-only `token`.

## Connexion MongoDB

Local (par defaut) :

```
MONGO_URI=mongodb://127.0.0.1:27017/russell_marina
```

Atlas (exemple) :

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/russell_marina?retryWrites=true&w=majority
```

Notes :
- Encoder les caracteres speciaux du mot de passe (par exemple `@` devient `%40`).
- Verifier que l'utilisateur Atlas a le droit `readWrite` sur la base cible.

## Importer des donnees d'exemple

Si vous avez les fichiers JSON fournis, placez-les dans `data/` et executez :

```bash
mongoimport --jsonArray --db russell_marina --collection catways --file data/catways.json
mongoimport --jsonArray --db russell_marina --collection reservations --file data/reservations.json
```

## UI

- Accueil : `GET /`
- Tableau de bord : `GET /ui/dashboard`
- CRUD catways : `GET /ui/catways`
- CRUD reservations : `GET /ui/reservations`
- CRUD utilisateurs : `GET /ui/users`
- Docs API : `GET /docs`

## API

Authentification requise pour toutes les routes sauf `/`, `/login`, `/docs`.
Vous pouvez vous authentifier avec :
- l'entete `Authorization: Bearer <token>`
- ou le cookie HTTP-only `token` defini apres login

- `POST /login`
- `GET /logout`
- `GET /users`
- `GET /users/:email`
- `POST /users`
- `PUT /users/:email`
- `DELETE /users/:email`
- `GET /reservations`
- `GET /catways`
- `GET /catways/:id`
- `POST /catways`
- `PUT /catways/:id`
- `DELETE /catways/:id`
- `GET /catways/:id/reservations`
- `GET /catways/:id/reservations/:idReservation`
- `POST /catways/:id/reservations`
- `PUT /catways/:id/reservations/:idReservation`
- `PUT /catways/:id/reservations` (avec `reservationId` dans le body)
- `DELETE /catways/:id/reservations/:idReservation`

Alias :
- `GET /catway` et les routes imbriquees sont mappees sur les memes handlers que `/catways`.

## Health check

- `GET /health` renvoie l'etat de connexion et des metadonnees DB.

## Notes

- Les mots de passe sont hashes avec bcrypt.
- Le JWT est stocke dans un cookie HTTP-only.
- Supprimer un catway supprime aussi ses reservations.
