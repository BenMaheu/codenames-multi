const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Port d'écoute du serveur
const PORT = process.env.PORT || 3000;

// État du jeu global
let gameState = {
  cards: [],
  currentTeam: 'red',
  redCardsLeft: 0,
  blueCardsLeft: 0,
  gameOver: false,
  players: {
    red: {
      spymaster: null,
      agents: []
    },
    blue: {
      spymaster: null,
      agents: []
    },
    spectators: []
  }
};

// Liste de mots pour les cartes
const words = [
  "POMME", "PARIS", "CHIEN", "CHAT", "LIVRE", 
  "ÉCOLE", "VOITURE", "AVION", "LUNE", "SOLEIL", 
  "MAISON", "ARBRE", "FLEUR", "TÉLÉPHONE", "ORDINATEUR", 
  "MONTAGNE", "RIVIÈRE", "OCÉAN", "RESTAURANT", "CINÉMA", 
  "MUSIQUE", "DANSE", "JARDIN", "CUISINE", "CHAMBRE",
  "TABLE", "CHAISE", "PORTE", "FENÊTRE", "PLAGE",
  "FORÊT", "BATEAU", "TRAIN", "VÉLO", "HÔTEL",
  "CAFÉ", "JOURNAL", "STYLO", "CRAYON", "PEINTURE",
  "HORLOGE", "MONTRE", "BOÎTE", "CLAVIER", "SOURIS",
  "CAMÉRA", "GUITARE", "PIANO", "FOOTBALL", "TENNIS",
  "BASKET", "NATATION", "NEIGE", "PLUIE", "VENT",
  "ÉTOILE", "PLANÈTE", "GALAXIE", "STATUE", "PEINTURE",
  "FILM", "CHANSON", "POÈME", "ROMAN", "HISTOIRE",
  "CLÉ", "PORTE", "SERRURE", "BIJOU", "DIAMANT",
  "OR", "ARGENT", "CUIVRE", "FER", "VERRE",
  "PLASTIQUE", "PAPIER", "CARTON", "TISSU", "CUIR",
  "BOIS", "PIERRE", "BRIQUE", "CIMENT", "SABLE",
  "SEL", "SUCRE", "CAFÉ", "THÉ", "EAU",
  "LAIT", "JUS", "VIN", "BIÈRE", "PAIN",
  "FROMAGE", "BEURRE", "ŒUFS", "VIANDE", "POISSON",
  "LÉGUME", "FRUIT", "DESSERT", "GÂTEAU", "CRÈME"
];

// Initialiser une nouvelle partie
function initGame() {
  // Réinitialiser l'état du jeu
  gameState.cards = [];
  gameState.currentTeam = Math.random() < 0.5 ? 'red' : 'blue';
  gameState.redCardsLeft = 8 + (gameState.currentTeam === 'red' ? 1 : 0);
  gameState.blueCardsLeft = 8 + (gameState.currentTeam === 'blue' ? 1 : 0);
  gameState.gameOver = false;
  
  // Conserver les joueurs
  
  // Créer les cartes du jeu
  createCards();

  console.log(`Nouvelle partie initialisée avec ${gameState.cards.length} cartes.`);
  console.log(`L'équipe ${gameState.currentTeam} commence avec ${gameState.currentTeam === 'red' ? gameState.redCardsLeft : gameState.blueCardsLeft} cartes.`);
}

// Créer les cartes du jeu
function createCards() {
  // Mélanger les mots et prendre les 25 premiers
  const shuffledWords = shuffleArray([...words]).slice(0, 25);
  
  // Créer la distribution des équipes
  const teamDistribution = [];
  const firstTeamCount = gameState.currentTeam === 'red' ? 9 : 8;
  const secondTeamCount = gameState.currentTeam === 'blue' ? 9 : 8;

  
  // Équipe qui commence (9 cartes)
  for (let i = 0; i < firstTeamCount; i++) {
    teamDistribution.push(gameState.currentTeam);
  }
  
  // Autre équipe (8 cartes)
  const otherTeam = gameState.currentTeam === 'red' ? 'blue' : 'red';
  for (let i = 0; i < secondTeamCount; i++) {
    teamDistribution.push(otherTeam);
  }
  
  // Carte noire (1 carte)
  teamDistribution.push('black');
  
  // Cartes neutres (7 cartes)
  for (let i = 0; i < 7; i++) {
    teamDistribution.push('neutral');
  }
  
  // Mélanger la distribution
  const shuffledDistribution = shuffleArray(teamDistribution);

  
  // Créer les 25 cartes avec mots et équipes
  gameState.cards = [];
  for (let i = 0; i < 25; i++) {
    gameState.cards.push({
      word: shuffledWords[i],
      team: shuffledDistribution[i],
      revealed: false
    });
  }
  // Vérifier la distribution
  console.log(`${gameState.cards.length} cartes créées`);
  const distribution = {
    red: 0,
    blue: 0,
    black: 0,
    neutral: 0
  };
  gameState.cards.forEach(card => {
    distribution[card.team]++;
  });
  
  console.log('Distribution des cartes:', distribution);
}

// Mélanger un tableau (algo de Fisher-Yates)
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Connexion d'un client
io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté: ' + socket.id);
  
  // Envoyer l'état actuel du jeu au nouveau joueur
  socket.emit('gameState', {
    ...gameState,
    clientId: socket.id
  });
  
  // Informer le nouveau joueur de l'état actuel des joueurs
  socket.emit('playersUpdate', gameState.players);
  
  // Rejoindre une équipe
  socket.on('joinTeam', ({ team, role, nickname }) => {
    console.log(`Joueur ${socket.id} (${nickname}) rejoint l'équipe ${team} en tant que ${role}`);

    const prevTeam = findPlayerTeam(socket.id);
    
    // Retirer le joueur de son équipe précédente si nécessaire
    if (prevTeam) {
      removePlayerFromTeam(socket.id, prevTeam);
    }
    
    // Ajouter le joueur à la nouvelle équipe
    if (team === 'red' || team === 'blue') {
      if (role === 'spymaster') {
        // Si un maître-espion existe déjà, le faire devenir agent
        const currentSpymaster = gameState.players[team].spymaster;
        if (currentSpymaster) {
          gameState.players[team].agents.push(currentSpymaster);
          
          // Informer l'ancien maître-espion de son changement de rôle
          io.to(currentSpymaster.id).emit('roleChanged', {
            team: team,
            role: 'agent'
          });
        }
        
        gameState.players[team].spymaster = {
          id: socket.id,
          nickname: nickname || `Joueur ${socket.id.slice(0, 4)}`
        };
      } else {
        gameState.players[team].agents.push({
          id: socket.id,
          nickname: nickname || `Joueur ${socket.id.slice(0, 4)}`
        });
      }
    } else {
      // Spectateur
      gameState.players.spectators.push({
        id: socket.id,
        nickname: nickname || `Spectateur ${socket.id.slice(0, 4)}`
      });
    }
    
    console.log('État des joueurs après ajout:', JSON.stringify(gameState.players, null, 2));

    // Informer tous les joueurs de la mise à jour
    io.emit('playersUpdate', gameState.players);
    
    // Informer le joueur de son équipe et rôle    
    socket.emit('teamJoined', {
      team: team,
      role: role
    });
  });
  
  // Clic sur une carte
  socket.on('cardClick', (cardIndex) => {
    console.log(`Joueur ${socket.id} a cliqué sur la carte ${cardIndex}`);
    
    // Vérifier si le jeu est terminé
    if (gameState.gameOver) {
      console.log('Clic ignoré: la partie est terminée');
      return;
    }
    
    // Vérifier si la carte existe
    if (!gameState.cards[cardIndex]) {
      console.error(`Erreur: la carte ${cardIndex} n'existe pas`);
      return;
    }
    
    // Vérifier si la carte est déjà révélée
    if (gameState.cards[cardIndex].revealed) {
      console.log('Clic ignoré: la carte est déjà révélée');
      return;
    }
    
    // Vérifier si le joueur est un agent de l'équipe actuelle
    const playerInfo = getPlayerInfo(socket.id);
    if (!playerInfo) {
      console.log('Clic ignoré: joueur non trouvé');
      return;
    }
    
    if (playerInfo.role === 'spymaster') {
      console.log('Clic ignoré: les maîtres-espions ne peuvent pas cliquer sur les cartes');
      return;
    }
    
    if (playerInfo.team !== gameState.currentTeam) {
      console.log(`Clic ignoré: ce n'est pas le tour de l'équipe ${playerInfo.team}`);
      return;
    }
    
    // Révéler la carte
    const card = gameState.cards[cardIndex];
    card.revealed = true;
    
    console.log(`Carte ${cardIndex} révélée: équipe ${card.team}, mot "${card.word}"`);
    
    // Mettre à jour le compteur de cartes restantes
    if (card.team === 'red') {
      gameState.redCardsLeft--;
      console.log(`Cartes rouges restantes: ${gameState.redCardsLeft}`);
    } else if (card.team === 'blue') {
      gameState.blueCardsLeft--;
      console.log(`Cartes bleues restantes: ${gameState.blueCardsLeft}`);
    }
    
    // Vérifier les conditions de victoire ou défaite
    checkGameEnd(card.team);
    
    // Si la carte n'appartient pas à l'équipe actuelle, changer de tour
    if (card.team !== gameState.currentTeam && card.team !== 'black' && !gameState.gameOver) {
      changeTurn();
    }
    
    // Envoyer la mise à jour à tous les clients
    io.emit('gameStateUpdate', gameState);
  });
  
  // Fin de tour
  socket.on('endTurn', () => {
    // Vérifier si le jeu est terminé
    if (gameState.gameOver) return;
    
    // Vérifier si le joueur est dans l'équipe actuelle
    const playerInfo = getPlayerInfo(socket.id);
    if (!playerInfo || playerInfo.team !== gameState.currentTeam) {
      return;
    }
    
    // Changer de tour
    changeTurn();
    
    // Envoyer la mise à jour à tous les clients
    io.emit('gameStateUpdate', gameState);
  });
  
  // Nouvelle partie
  socket.on('newGame', () => {
    initGame();
    io.emit('gameStateUpdate', gameState);
  });
  
  // Déconnexion d'un client
  socket.on('disconnect', () => {
    console.log('Joueur déconnecté: ' + socket.id);
    
    // Retirer le joueur de son équipe
    const team = findPlayerTeam(socket.id);
    if (team) {
      removePlayerFromTeam(socket.id, team);
      
      // Informer tous les joueurs de la mise à jour
      io.emit('playersUpdate', gameState.players);
    }
  });
});

// Trouver l'équipe d'un joueur
function findPlayerTeam(socketId) {
  // Vérifier dans l'équipe rouge
  if (gameState.players.red.spymaster && gameState.players.red.spymaster.id === socketId) {
    return 'red';
  }
  
  if (gameState.players.red.agents.some(agent => agent.id === socketId)) {
    return 'red';
  }
  
  // Vérifier dans l'équipe bleue
  if (gameState.players.blue.spymaster && gameState.players.blue.spymaster.id === socketId) {
    return 'blue';
  }
  
  if (gameState.players.blue.agents.some(agent => agent.id === socketId)) {
    return 'blue';
  }
  
  // Vérifier dans les spectateurs
  if (gameState.players.spectators.some(spectator => spectator.id === socketId)) {
    return 'spectator';
  }
  
  return null;
}

// Obtenir les informations d'un joueur
function getPlayerInfo(socketId) {
  // Vérifier dans l'équipe rouge
  if (gameState.players.red.spymaster && gameState.players.red.spymaster.id === socketId) {
    return {
      team: 'red',
      role: 'spymaster',
      nickname: gameState.players.red.spymaster.nickname
    };
  }
  
  const redAgent = gameState.players.red.agents.find(agent => agent.id === socketId);
  if (redAgent) {
    return {
      team: 'red',
      role: 'agent',
      nickname: redAgent.nickname
    };
  }
  
  // Vérifier dans l'équipe bleue
  if (gameState.players.blue.spymaster && gameState.players.blue.spymaster.id === socketId) {
    return {
      team: 'blue',
      role: 'spymaster',
      nickname: gameState.players.blue.spymaster.nickname
    };
  }
  
  const blueAgent = gameState.players.blue.agents.find(agent => agent.id === socketId);
  if (blueAgent) {
    return {
      team: 'blue',
      role: 'agent',
      nickname: blueAgent.nickname
    };
  }
  
  // Vérifier dans les spectateurs
  const spectator = gameState.players.spectators.find(spectator => spectator.id === socketId);
  if (spectator) {
    return {
      team: 'spectator',
      role: 'spectator',
      nickname: spectator.nickname
    };
  }
  
  return null;
}

// Retirer un joueur d'une équipe
function removePlayerFromTeam(socketId, team) {
  if (team === 'red') {
    if (gameState.players.red.spymaster && gameState.players.red.spymaster.id === socketId) {
      gameState.players.red.spymaster = null;
    } else {
      gameState.players.red.agents = gameState.players.red.agents.filter(agent => agent.id !== socketId);
    }
  } else if (team === 'blue') {
    if (gameState.players.blue.spymaster && gameState.players.blue.spymaster.id === socketId) {
      gameState.players.blue.spymaster = null;
    } else {
      gameState.players.blue.agents = gameState.players.blue.agents.filter(agent => agent.id !== socketId);
    }
  } else if (team === 'spectator') {
    gameState.players.spectators = gameState.players.spectators.filter(spectator => spectator.id !== socketId);
  }
}

// Changer de tour
function changeTurn() {
  gameState.currentTeam = gameState.currentTeam === 'red' ? 'blue' : 'red';
}

// Vérifier si la partie est terminée
function checkGameEnd(teamRevealed) {
  // Victoire en trouvant toutes les cartes d'une équipe
  if (gameState.redCardsLeft === 0) {
    endGame('red');
    return;
  } else if (gameState.blueCardsLeft === 0) {
    endGame('blue');
    return;
  }
  
  // Défaite en trouvant la carte noire
  if (teamRevealed === 'black') {
    // L'équipe qui a cliqué sur la carte noire perd
    const winningTeam = gameState.currentTeam === 'red' ? 'blue' : 'red';
    endGame(winningTeam, true);
  }
}

// Terminer la partie
function endGame(winningTeam, byBlackCard = false) {
  gameState.gameOver = true;
  gameState.winningTeam = winningTeam;
  gameState.winByBlackCard = byBlackCard;
}

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Pour jouer localement: http://localhost:${PORT}`);
  console.log(`Pour jouer en réseau local: http://VOTRE_IP_LOCALE:${PORT}`);
  
  // Initialiser une partie au démarrage
  initGame();
});