# SOS App Backend

Backend NestJS pour une application mobile de gestion d'alertes SOS.

## Fonctionnalités

- Authentification JWT
- Gestion des utilisateurs et contacts de confiance
- Système d'alertes SOS avec géolocalisation en temps réel
- Notifications push (FCM) et email
- WebSocket pour le suivi en temps réel
- API RESTful documentée avec Swagger
- Support de PostGIS pour les requêtes géospatiales
- Soft delete pour toutes les entités
- Gestion des contacts de confiance avec notifications automatiques

## Prérequis

### Système

- Node.js (v18 ou supérieur)
- PostgreSQL (v14 ou supérieur)
- PostGIS (v3 ou supérieur)

### Services externes

- Firebase Project (pour les notifications push)
- Compte Google (pour l'envoi d'emails)

### Installation des prérequis

#### macOS

```bash
# Installer Node.js via Homebrew
brew install node@18

# Installer PostgreSQL et PostGIS
brew install postgresql@14
brew install postgis

# Démarrer PostgreSQL
brew services start postgresql@14
```

#### Ubuntu/Debian

```bash
# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL et PostGIS
sudo apt-get install postgresql-14 postgresql-14-postgis-3
```

#### Windows

- Installer Node.js depuis [nodejs.org](https://nodejs.org/)
- Installer PostgreSQL depuis [postgresql.org](https://www.postgresql.org/download/windows/)
- Installer PostGIS via le stack builder PostgreSQL

## Installation

1. Cloner le repository :

```bash
git clone https://github.com/amadouba7h/resqme-nestjs-backend.git
cd resqme-nestjs-backend
```

2. Installer les dépendances :

```bash
npm install
```

3. Configurer les variables d'environnement :

```bash
cp .env.example .env
```

Modifier le fichier `.env` avec vos configurations :

```env
# Base de données
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=resqme

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Nodemailer
SMTP_FROM=your_smtp_from
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Application
PORT=3000
NODE_ENV=development
```

4. Créer la base de données PostgreSQL :

```bash
createdb resqme
```

5. Lancer les migrations :

```bash
# Générer une migration
npm run migration:generate src/migrations/NomMigration

# Exécuter les migrations
npm run migration:run

# Annuler la dernière migration
npm run migration:revert
```

6. Démarrer le serveur :

```bash
# Développement
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Scripts disponibles

- `npm run build` - Compiler le projet
- `npm run format` - Formater le code avec Prettier
- `npm run start` - Démarrer le serveur
- `npm run start:dev` - Démarrer le serveur en mode développement
- `npm run start:debug` - Démarrer le serveur en mode debug
- `npm run start:prod` - Démarrer le serveur en mode production
- `npm run lint` - Linter le code
- `npm run test` - Exécuter les tests unitaires
- `npm run test:watch` - Exécuter les tests en mode watch
- `npm run test:cov` - Générer la couverture de tests
- `npm run test:debug` - Exécuter les tests en mode debug
- `npm run test:e2e` - Exécuter les tests end-to-end

## Dépendances principales

### Production

- `@nestjs/common` - Framework NestJS
- `@nestjs/config` - Gestion de la configuration
- `@nestjs/jwt` - Support JWT
- `@nestjs/passport` - Authentification
- `@nestjs/swagger` - Documentation API
- `@nestjs/typeorm` - ORM TypeORM
- `@nestjs/websockets` - Support WebSocket
- `bcrypt` - Hachage des mots de passe
- `class-validator` - Validation des données
- `firebase-admin` - Notifications push
- `helmet` - Sécurité HTTP
- `nodemailer` - Envoi d'emails
- `pg` - Client PostgreSQL
- `rate-limiter-flexible` - Rate limiting
- `socket.io` - WebSocket

### Développement

- `@nestjs/cli` - CLI NestJS
- `@nestjs/testing` - Tests
- `eslint` - Linting
- `jest` - Framework de test
- `prettier` - Formatage de code
- `typescript` - TypeScript

## Structure du Projet

```
src/
├── auth/                 # Module d'authentification
│   ├── dto/             # Data Transfer Objects
│   ├── guards/          # Guards d'authentification
│   └── strategies/      # Stratégies d'authentification
├── users/               # Module de gestion des utilisateurs
│   ├── dto/             # DTOs pour les utilisateurs
│   ├── entities/        # Entités utilisateur et contacts
│   └── services/        # Services de gestion des utilisateurs
├── sos/                 # Module de gestion des alertes SOS
│   ├── dto/             # DTOs pour les alertes
│   ├── entities/        # Entités alertes et localisations
│   └── services/        # Services de gestion des alertes
├── notifications/       # Module de notifications
│   ├── dto/             # DTOs pour les notifications
│   └── services/        # Services d'envoi de notifications
├── admin/              # Module d'administration
├── common/             # Code partagé
│   ├── decorators/     # Décorateurs personnalisés
│   ├── filters/        # Filtres d'exception
│   ├── guards/         # Guards communs
│   ├── interceptors/   # Intercepteurs
│   └── pipes/          # Pipes de validation
├── config/             # Configuration
└── main.ts             # Point d'entrée de l'application
```

## API Documentation

La documentation Swagger est disponible à l'URL : `http://localhost:3000/api`

### Endpoints principaux

#### Authentification

- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchir le token
- `GET /auth/profile` - Profil utilisateur

#### Utilisateurs

- `GET /users/profile` - Obtenir le profil
- `PATCH /users/profile` - Mettre à jour le profil
- `PATCH /users/password` - Changer le mot de passe
- `PATCH /users/fcm-token` - Mettre à jour le token FCM

#### Contacts de confiance

- `GET /users/trusted-contacts` - Liste des contacts
- `POST /users/trusted-contacts` - Ajouter des contacts
- `PATCH /users/trusted-contacts/:id` - Mettre à jour un contact
- `DELETE /users/trusted-contacts/:id` - Supprimer un contact

#### Alertes SOS

- `POST /sos/alerts` - Créer une alerte
- `PATCH /sos/alerts/:id/location` - Mettre à jour la position
- `PATCH /sos/alerts/:id/resolve` - Résoudre une alerte
- `GET /sos/alerts/active` - Obtenir l'alerte active

## WebSocket

Le serveur WebSocket est disponible sur le même port que l'API REST. Les événements disponibles sont :

- `subscribeToAlert`: S'abonner aux mises à jour d'une alerte
- `unsubscribeFromAlert`: Se désabonner des mises à jour d'une alerte
- `locationUpdate`: Événement de mise à jour de position

### Exemple d'utilisation

```javascript
const socket = io('http://localhost:3000');

// S'abonner à une alerte
socket.emit('subscribeToAlert', { alertId: 'alert-uuid' });

// Écouter les mises à jour
socket.on('locationUpdate', (data) => {
  console.log('Nouvelle position:', data);
});
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de tests
npm run test:cov
```

## Sécurité

- Authentification JWT avec refresh tokens
- Rate limiting par IP et par utilisateur
- Validation des données avec class-validator
- Protection CORS configurée
- Helmet pour les en-têtes HTTP sécurisés
- Validation des numéros de téléphone
- Hachage des mots de passe avec bcrypt
- Soft delete pour toutes les entités

## Déploiement

1. Construire l'application :

```bash
npm run build
```

2. Configurer les variables d'environnement de production

3. Démarrer le serveur :

```bash
npm run start:prod
```

### Docker

Un `Dockerfile` est fourni pour le déploiement en conteneur :

```bash
# Construire l'image
docker build -t resqme-nestjs-backend .

# Lancer le conteneur
docker run -p 3000:3000 --env-file .env resqme-nestjs-backend
```

## Déploiement avec Docker

### Prérequis

- Docker
- Docker Compose

### Configuration

1. Créer un fichier `.env` à la racine du projet avec les variables d'environnement nécessaires :

```env
# Base de données
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=resqme

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Nodemailer
SMTP_FROM=your_smtp_from
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Démarrage

1. Construire et démarrer les conteneurs :

```bash
docker-compose up -d
```

2. Vérifier que les conteneurs sont en cours d'exécution :

```bash
docker-compose ps
```

3. Voir les logs :

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f app
docker-compose logs -f postgres
```

### Commandes utiles

```bash
# Arrêter les conteneurs
docker-compose down

# Reconstruire et redémarrer
docker-compose up -d --build

# Supprimer les volumes (attention : supprime les données)
docker-compose down -v

# Exécuter une commande dans le conteneur
docker-compose exec app npm run migration:run
```

### Structure Docker

- **Dockerfile** : Configuration multi-stage pour optimiser la taille de l'image

  - Stage de build : Compilation de l'application
  - Stage de production : Image finale optimisée

- **docker-compose.yml** : Configuration des services
  - `app` : Application NestJS
  - `postgres` : Base de données PostgreSQL avec PostGIS
  - Réseau dédié pour la communication entre les services
  - Volume persistant pour les données PostgreSQL

### Volumes

- `postgres_data` : Stockage persistant des données PostgreSQL

### Réseaux

- `sos-network` : Réseau bridge pour la communication entre les conteneurs

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commiter vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de code

- Utiliser ESLint et Prettier
- Suivre les conventions de nommage NestJS
- Documenter le code avec JSDoc
- Écrire des tests unitaires et e2e
- Maintenir la couverture de code > 80%

## Licence

MIT

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
