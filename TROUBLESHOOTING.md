# 🔧 Guide de Troubleshooting - ResQme Backend

## 🚨 Problème : App Flutter ne peut pas contacter le serveur VPS

### 1. 🔍 Diagnostic rapide

Utilisez le script de diagnostic :
```bash
./scripts/test-connectivity.sh VOTRE_IP_VPS 3000
```

### 2. ✅ Vérifications sur le VPS

#### A. Vérifier que les conteneurs sont en marche
```bash
docker ps
# Vous devriez voir : resqme-nestjs-backend, resqme-postgres, resqme-redis
```

#### B. Vérifier les logs du backend
```bash
docker logs resqme-nestjs-backend
# Recherchez : "🚀 Server running on http://0.0.0.0:3000"
```

#### C. Tester depuis le VPS
```bash
curl http://localhost:3000/api/health
# Devrait retourner : {"status":"ok",...}
```

#### D. Vérifier les ports ouverts
```bash
netstat -tulpn | grep :3000
# Devrait montrer : 0.0.0.0:3000
```

### 3. 🔥 Problèmes courants et solutions

#### Problème 1: Port non accessible depuis l'extérieur
**Symptômes :** Le serveur répond en local mais pas depuis l'extérieur

**Solutions :**
```bash
# Vérifier le firewall
sudo ufw status

# Ouvrir le port 3000
sudo ufw allow 3000

# Ou désactiver temporairement pour tester
sudo ufw disable
```

#### Problème 2: Docker n'expose pas le port correctement
**Symptômes :** `docker ps` ne montre pas `0.0.0.0:3000->3000/tcp`

**Solutions :**
```bash
# Vérifier docker-compose.yml
cat docker-compose.yml | grep -A5 ports

# Redémarrer les conteneurs
docker-compose down
docker-compose up -d
```

#### Problème 3: Backend ne démarre pas
**Symptômes :** Container s'arrête immédiatement

**Solutions :**
```bash
# Vérifier les logs d'erreur
docker logs resqme-nestjs-backend

# Vérifier les variables d'environnement
docker exec resqme-nestjs-backend env | grep DATABASE

# Redémarrer avec logs en temps réel
docker-compose up
```

#### Problème 4: Base de données non accessible
**Symptômes :** Erreur de connexion DB dans les logs

**Solutions :**
```bash
# Vérifier que PostgreSQL est en marche
docker logs resqme-postgres

# Tester la connexion DB
docker exec resqme-nestjs-backend npm run typeorm:show-migrations
```

### 4. 📱 Configuration Flutter

#### Configuration recommandée dans Flutter :
```dart
class ApiConfig {
  static const String baseUrl = 'http://VOTRE_IP_VPS:3000/api';
  
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
```

#### Test de connectivité Flutter :
```dart
Future<bool> testConnection() async {
  try {
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}/health'),
      headers: ApiConfig.headers,
    );
    return response.statusCode == 200;
  } catch (e) {
    print('Connection error: $e');
    return false;
  }
}
```

### 5. 🌐 Problèmes réseau spécifiques

#### A. VPS derrière NAT/Proxy
Si votre VPS est derrière un proxy ou NAT :
```bash
# Vérifier l'IP publique réelle
curl ifconfig.me

# Configurer le proxy/NAT pour rediriger le port 3000
```

#### B. Fournisseur cloud avec Security Groups
Pour AWS, GCP, Azure, etc. :
- Ouvrir le port 3000 dans les Security Groups
- Vérifier les règles de pare-feu du cloud provider

#### C. HTTPS/SSL requis
Si votre app Flutter exige HTTPS :
```bash
# Option 1: Utiliser un reverse proxy (Nginx)
# Option 2: Configurer SSL dans NestJS
# Option 3: Utiliser un service comme Cloudflare
```

### 6. 🔧 Commandes de réparation rapide

#### Redémarrage complet :
```bash
cd /var/www/resqme
docker-compose down --remove-orphans
docker system prune -f
docker-compose pull
docker-compose up -d
```

#### Reset complet (⚠️ ATTENTION : Supprime les données) :
```bash
cd /var/www/resqme
docker-compose down -v  # Supprime aussi les volumes
docker system prune -af
docker-compose up -d
```

### 7. 📞 Endpoints de test

Une fois le serveur accessible, testez ces endpoints :

```bash
# Health check
curl http://VOTRE_IP:3000/api/health

# Ping simple
curl http://VOTRE_IP:3000/api/health/ping

# Documentation API
# Ouvrez dans un navigateur : http://VOTRE_IP:3000/api
```

### 8. 📊 Monitoring continu

#### Script de monitoring :
```bash
#!/bin/bash
while true; do
  if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "$(date): ✅ Server OK"
  else
    echo "$(date): ❌ Server DOWN"
    docker-compose restart app
  fi
  sleep 60
done
```

### 9. 🆘 Support et logs

#### Collecter les informations pour le support :
```bash
# Informations système
uname -a
docker --version
docker-compose --version

# État des conteneurs
docker ps -a

# Logs récents
docker logs resqme-nestjs-backend --tail 50

# Configuration réseau
ip addr show
netstat -tulpn | grep :3000
```

---

## 📞 Contacts et ressources

- **Documentation API :** `http://VOTRE_IP:3000/api`
- **Health Check :** `http://VOTRE_IP:3000/api/health`
- **Logs en temps réel :** `docker logs -f resqme-nestjs-backend`

---

*Ce guide couvre les problèmes les plus courants. Si le problème persiste, collectez les logs et informations système mentionnées ci-dessus.*
