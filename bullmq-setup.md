# Configuration BullMQ pour le Système de Notifications

## Installation des Dépendances

Pour utiliser BullMQ avec NestJS, installez les packages suivants :

```bash
npm install --save @nestjs/bullmq bullmq
```

## Configuration Redis

BullMQ nécessite Redis comme broker de messages. Ajoutez les variables d'environnement suivantes à votre fichier `.env` :

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Optionnel
```

### Installation de Redis

#### Sur macOS (avec Homebrew)
```bash
brew install redis
brew services start redis
```

#### Sur Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Avec Docker
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

## Architecture du Système de Queue

### 1. Types de Jobs

Le système gère 5 types de jobs de notification :

- **sos-alert** : Notifications d'alerte SOS (priorité 1 - la plus haute)
- **sos-resolved** : Notifications de résolution d'alerte (priorité 2)
- **sms** : Envoi de SMS (priorité 3)
- **email** : Envoi d'emails (priorité 4)
- **push-notification** : Notifications push individuelles (priorité 5)

### 2. Avantages de l'Implémentation

- **Performance améliorée** : Les alertes sont créées/résolues immédiatement sans attendre l'envoi des notifications
- **Fiabilité** : Retry automatique en cas d'échec avec backoff exponentiel
- **Traçabilité** : Logs détaillés et monitoring des jobs
- **Scalabilité** : Possibilité d'ajouter plusieurs workers
- **Flexibilité** : Gestion des priorités et configuration fine des tentatives

### 3. Configuration des Jobs

#### Alertes SOS (Haute Priorité)
```typescript
{
  priority: 1,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
}
```

#### Notifications Standard
```typescript
{
  priority: 4-5,
  attempts: 2,
  backoff: {
    type: 'fixed',
    delay: 1000,
  },
}
```

## Utilisation

### Dans le Service SOS

```typescript
// Avant (synchrone)
await this.notificationsService.sendSosAlertEmail(...);

// Après (asynchrone avec queue)
await this.notificationQueueService.addSosAlertJob(
  savedAlert,
  userName,
  contacts,
  savedLocation,
);
```

### Méthodes Utilitaires

Le `NotificationQueueService` fournit des méthodes pour gérer la queue :

```typescript
// Statistiques de la queue
const stats = await notificationQueueService.getQueueStats();

// Pause/Reprise
await notificationQueueService.pauseQueue();
await notificationQueueService.resumeQueue();

// Nettoyage
await notificationQueueService.clearQueue();
await notificationQueueService.cleanQueue();

// Gestion des échecs
const failedJobs = await notificationQueueService.getFailedJobs();
await notificationQueueService.retryFailedJobs();
```

## Monitoring

### Interface Web Bull Dashboard (Optionnel)

Pour monitorer les queues via une interface web :

```bash
npm install --save @bull-board/api @bull-board/express
```

### Logs

Tous les jobs sont loggés avec des informations détaillées :
- Début et fin de traitement
- Erreurs avec stack trace
- Progression des jobs
- Statistiques de performance

## Tests

Pour tester le système :

1. Démarrez Redis
2. Lancez l'application NestJS
3. Créez une alerte SOS
4. Vérifiez les logs pour voir le traitement des jobs
5. Utilisez les méthodes utilitaires pour monitorer la queue

## Dépannage

### Erreurs Communes

1. **Redis non accessible** : Vérifiez que Redis est démarré et accessible
2. **Jobs bloqués** : Utilisez `clearQueue()` pour vider la queue
3. **Échecs répétés** : Vérifiez les logs et utilisez `retryFailedJobs()`

### Variables d'Environnement Requises

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# SMTP (pour les emails)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourapp.com

# Firebase (pour les push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```