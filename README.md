# Guide d'Installation pour Codenames Multijoueur

Ce guide vous aidera à installer et à lancer le jeu Codenames Multijoueur avec les règles officielles sur votre réseau local.

## Prérequis

- [Node.js](https://nodejs.org/) (version 14 ou supérieure)
- npm (installé automatiquement avec Node.js)
- Un éditeur de texte (comme VSCode, Sublime Text, etc.)

## Étapes d'installation

1. **Créez un dossier pour votre projet**

   Ouvrez un terminal et créez un nouveau dossier pour le projet :

   ```bash
   mkdir codenames-multiplayer
   cd codenames-multiplayer
   ```

2. **Créez le fichier package.json**

   Créez un fichier `package.json` avec le contenu suivant :

   ```json
   {
     "name": "codenames-multiplayer",
     "version": "1.0.0",
     "description": "Jeu Codenames multijoueur avec règles officielles",
     "main": "server.js",
     "scripts": {
       "start": "node server.js",
       "dev": "nodemon server.js"
     },
     "keywords": [
       "codenames",
       "jeu",
       "multijoueur",
       "socket.io"
     ],
     "author": "",
     "license": "MIT",
     "dependencies": {
       "express": "^4.18.2",
       "socket.io": "^4.7.2"
     },
     "devDependencies": {
       "nodemon": "^3.0.1"
     }
   }
   ```

3. **Installez les dépendances**

   Toujours dans le terminal, exécutez :

   ```bash
   npm install
   ```

4. **Créez la structure des dossiers**

   ```bash
   mkdir public
   ```

5. **Créez les fichiers principaux**

   - Créez un fichier `server.js` à la racine du projet avec le contenu du fichier "Server.js avec règles officielles"
   - Créez un fichier `public/index.html` avec le contenu du fichier "HTML pour Codenames avec règles officielles"
   - Créez un fichier `public/styles.css` avec le contenu du fichier "CSS pour Codenames avec règles officielles"
   - Créez un fichier `public/script.js` avec le contenu du fichier "Script.js avec règles officielles"

6. **Lancez le serveur**

   ```bash
   npm start
   ```

   Vous devriez voir des messages comme :
   ```
   Serveur démarré sur le port 3000
   Pour jouer localement: http://localhost:3000
   Pour jouer en réseau local: http://VOTRE_IP_LOCALE:3000
   ```

## Comment trouver votre adresse IP locale

### Sur Windows

1. Ouvrez l'invite de commandes (cmd)
2. Tapez `ipconfig` et appuyez sur Entrée
3. Recherchez l'adresse IPv4 dans la section de votre connexion active (Ethernet ou Wi-Fi)

### Sur Mac

1. Allez dans Préférences Système > Réseau
2. Sélectionnez votre connexion active (Wi-Fi ou Ethernet)
3. L'adresse IP sera affichée sur le panneau de droite

### Sur Linux

1. Ouvrez un terminal
2. Tapez `ip addr` ou `ifconfig` et appuyez sur Entrée
3. Recherchez votre adresse IP (format 192.168.x.x ou 10.0.x.x)

## Comment jouer avec vos amis

1. Assurez-vous que tous les joueurs sont connectés au même réseau Wi-Fi
2. Communiquez-leur l'URL du jeu : `http://VOTRE_IP_LOCALE:3000`
3. Chaque joueur se connecte via son navigateur (fonctionne sur mobile et ordinateur)
4. Les joueurs choisissent leur équipe et leur rôle

## Règles du jeu (rappel)

1. Les joueurs se répartissent en deux équipes : Rouge et Bleue
2. Chaque équipe a un Maître-Espion qui connaît la couleur de toutes les cartes
3. À son tour, le Maître-Espion donne un indice (un mot + un nombre)
4. Les agents peuvent deviner autant de cartes que le nombre indiqué, plus une carte supplémentaire (optionnel)
5. Si une carte adverse ou neutre est révélée, le tour passe à l'autre équipe
6. Si la carte noire est révélée, l'équipe perd immédiatement
7. L'équipe qui découvre toutes ses cartes en premier gagne

## Fonctionnalités spéciales

- **Nouveaux mots** : Génère une nouvelle grille de mots tout en conservant les positions des équipes
- **Nouvelles positions** : Génère une nouvelle distribution des équipes avec les mêmes mots

## Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez que tous les joueurs sont sur le même réseau Wi-Fi
2. Assurez-vous que le pare-feu de votre ordinateur ne bloque pas le port 3000
3. Redémarrez le serveur (`Ctrl+C` puis `npm start`)
4. Rafraîchissez les pages des navigateurs (`Ctrl+F5` ou `Cmd+Shift+R` sur Mac)

En cas de problème persistant, vérifiez les logs dans le terminal où tourne le serveur pour identifier d'éventuelles erreurs.