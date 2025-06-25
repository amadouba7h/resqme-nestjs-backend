#!/bin/bash

# Script de diagnostic de connectivité pour ResQme Backend
echo "🔍 Diagnostic de connectivité ResQme Backend"
echo "============================================="

# Variables
VPS_IP=${1:-"VOTRE_IP_VPS"}
PORT=${2:-3000}

if [ "$VPS_IP" = "VOTRE_IP_VPS" ]; then
    echo "❌ Veuillez fournir l'IP de votre VPS:"
    echo "Usage: ./test-connectivity.sh <IP_VPS> [PORT]"
    echo "Exemple: ./test-connectivity.sh 192.168.1.100 3000"
    exit 1
fi

echo "📍 Test de connectivité vers: $VPS_IP:$PORT"
echo ""

# 1. Test de ping
echo "1️⃣ Test de ping..."
if ping -c 3 $VPS_IP > /dev/null 2>&1; then
    echo "✅ Ping réussi vers $VPS_IP"
else
    echo "❌ Ping échoué vers $VPS_IP"
    echo "   Vérifiez que le VPS est accessible"
fi
echo ""

# 2. Test de port TCP
echo "2️⃣ Test de port TCP $PORT..."
if nc -z -w5 $VPS_IP $PORT 2>/dev/null; then
    echo "✅ Port $PORT ouvert sur $VPS_IP"
else
    echo "❌ Port $PORT fermé ou inaccessible sur $VPS_IP"
    echo "   Vérifiez le firewall et que Docker expose le port"
fi
echo ""

# 3. Test HTTP
echo "3️⃣ Test HTTP..."
HTTP_URL="http://$VPS_IP:$PORT"
if curl -s --connect-timeout 10 "$HTTP_URL" > /dev/null; then
    echo "✅ Serveur HTTP répond sur $HTTP_URL"
else
    echo "❌ Serveur HTTP ne répond pas sur $HTTP_URL"
fi
echo ""

# 4. Test API Health
echo "4️⃣ Test API Health..."
API_URL="http://$VPS_IP:$PORT/api"
HEALTH_RESPONSE=$(curl -s --connect-timeout 10 "$API_URL" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ API accessible sur $API_URL"
    echo "   Réponse: $HEALTH_RESPONSE"
else
    echo "❌ API inaccessible sur $API_URL"
fi
echo ""

# 5. Test HTTPS (si applicable)
echo "5️⃣ Test HTTPS..."
HTTPS_URL="https://$VPS_IP:$PORT"
if curl -s --connect-timeout 10 -k "$HTTPS_URL" > /dev/null 2>&1; then
    echo "✅ HTTPS disponible sur $HTTPS_URL"
else
    echo "ℹ️  HTTPS non configuré (normal pour HTTP simple)"
fi
echo ""

# 6. Commandes de diagnostic VPS
echo "6️⃣ Commandes à exécuter sur le VPS:"
echo "=================================="
echo "# Vérifier les conteneurs Docker:"
echo "docker ps"
echo ""
echo "# Vérifier les logs du backend:"
echo "docker logs resqme-nestjs-backend"
echo ""
echo "# Vérifier les ports ouverts:"
echo "netstat -tulpn | grep :$PORT"
echo ""
echo "# Vérifier le firewall:"
echo "sudo ufw status"
echo ""
echo "# Tester depuis le VPS:"
echo "curl http://localhost:$PORT/api"
echo ""

# 7. Configuration Flutter recommandée
echo "7️⃣ Configuration Flutter recommandée:"
echo "====================================="
echo "Dans votre app Flutter, utilisez:"
echo "const String baseUrl = 'http://$VPS_IP:$PORT/api';"
echo ""
echo "Pour les requêtes HTTP, ajoutez les headers:"
echo "headers: {"
echo "  'Content-Type': 'application/json',"
echo "  'Accept': 'application/json',"
echo "}"
echo ""

echo "🏁 Diagnostic terminé!"
