// Fichier public/script.js
document.addEventListener('DOMContentLoaded', function() {
    // Connexion au serveur socket.io
    const socket = io();
    
    // Éléments DOM
    const gameBoard = document.getElementById('gameBoard');
    const newGameBtn = document.getElementById('newGameBtn');
    const endTurnBtn = document.getElementById('endTurnBtn');
    const redCardsCounter = document.getElementById('redCards');
    const blueCardsCounter = document.getElementById('blueCards');
    const currentTeamDisplay = document.getElementById('currentTeam');
    const gameOverModal = document.getElementById('gameOverModal');
    const winnerMessage = document.getElementById('winnerMessage');
    const newGameAfterWinBtn = document.getElementById('newGameAfterWinBtn');
    
    const joinSection = document.getElementById('joinSection');
    const teamInfo = document.getElementById('teamInfo');
    const roleSelectionGroup = document.getElementById('roleSelectionGroup');
    const playerTeamDisplay = document.getElementById('playerTeamDisplay');
    const playerRoleDisplay = document.getElementById('playerRoleDisplay');
    const changeTeamBtn = document.getElementById('changeTeamBtn');
    
    const joinRedTeamBtn = document.getElementById('joinRedTeam');
    const joinBlueTeamBtn = document.getElementById('joinBlueTeam');
    const joinSpectatorBtn = document.getElementById('joinSpectator');
    const joinAsSpymasterBtn = document.getElementById('joinAsSpymaster');
    const joinAsAgentBtn = document.getElementById('joinAsAgent');
    
    const redTeamPlayers = document.getElementById('redTeamPlayers');
    const blueTeamPlayers = document.getElementById('blueTeamPlayers');
    const spectatorsList = document.getElementById('spectatorsList');
    const clueSection = document.getElementById('clueSection');
    const clueForm = document.getElementById('clueForm');
    const clueWord = document.getElementById('clueWord');
    const clueNumber = document.getElementById('clueNumber');
    const submitClueBtn = document.getElementById('submitClueBtn');
    const currentClueDisplay = document.getElementById('currentClue');
    const attemptsDisplay = document.getElementById('attemptsLeft');
    
    const newWordsBtn = document.getElementById('newWordsBtn');
    const newPositionsBtn = document.getElementById('newPositionsBtn');
    
    const nicknameInput = document.getElementById('nickname');
    
    // État du jeu local
    let gameState = null;
    let playerInfo = {
        team: null,
        role: null,
        clientId: null
    };
    
    // Gestionnaires d'événements pour rejoindre une équipe
    joinRedTeamBtn.addEventListener('click', () => {
        selectTeam('red');
        roleSelectionGroup.style.display = 'block';
    });
    
    joinBlueTeamBtn.addEventListener('click', () => {
        selectTeam('blue');
        roleSelectionGroup.style.display = 'block';
    });
    
    joinSpectatorBtn.addEventListener('click', () => {
        joinTeam('spectator', 'spectator');
    });
    
    joinAsSpymasterBtn.addEventListener('click', () => {
        if (playerInfo.team) {
            joinTeam(playerInfo.team, 'spymaster');
        }
    });
    
    joinAsAgentBtn.addEventListener('click', () => {
        if (playerInfo.team) {
            joinTeam(playerInfo.team, 'agent');
        }
    });
    
    changeTeamBtn.addEventListener('click', () => {
        teamInfo.style.display = 'none';
        joinSection.style.display = 'block';
        playerInfo.team = null;
        playerInfo.role = null;
    });
    
    // Gestionnaire d'événement pour le formulaire d'indice
    clueForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const word = clueWord.value.trim();
        const number = clueNumber.value;
        
        if (word && number) {
            socket.emit('submitClue', {
                word: word,
                number: parseInt(number)
            });
            
            // Réinitialiser le formulaire
            clueWord.value = '';
            clueNumber.value = '';
        }
    });
    
    // Gestionnaires pour générer de nouvelles grilles
    newWordsBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous générer une nouvelle grille de mots tout en conservant les positions actuelles?')) {
            socket.emit('newWordsGrid');
        }
    });
    
    newPositionsBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous générer une nouvelle grille de positions? Cela réinitialisera également la partie.')) {
            socket.emit('newPositionsGrid');
        }
    });
    
    // Événements Socket.io
    socket.on('connect', () => {
        console.log('Connecté au serveur');
    });
    
    socket.on('gameState', (state) => {
        console.log('État initial du jeu reçu:', state);
        gameState = state;
        playerInfo.clientId = state.clientId;
        updateGameBoard();
        updateCounters();
        updateCurrentTeam();
        updateClueDisplay();
    });
    
    socket.on('gameStateUpdate', (state) => {
        console.log('Mise à jour de l\'état du jeu reçue:', state);
        gameState = state;
        updateGameBoard();
        updateCounters();
        updateCurrentTeam();
        updateClueDisplay();
        
        if (gameState.gameOver) {
            showGameOverModal();
        }
    });
    
    socket.on('teamJoined', ({ team, role }) => {
        console.log(`Équipe rejointe: ${team}, rôle: ${role}`);
        playerInfo.team = team;
        playerInfo.role = role;
        
        // Mettre à jour l'interface utilisateur
        joinSection.style.display = 'none';
        teamInfo.style.display = 'block';
        
        // Mettre à jour les informations d'équipe et de rôle
        updatePlayerInfo();
        
        // Si le joueur est un maître-espion, activer la vue d'espion
        if (role === 'spymaster') {
            document.body.classList.add('spymaster-view');
            // Afficher le formulaire d'indice pour les maîtres-espions
            updateClueControls();
        } else {
            document.body.classList.remove('spymaster-view');
        }
    });
    
    socket.on('playersUpdate', (players) => {
        console.log('Mise à jour des joueurs reçue:', players);
        updatePlayersList(players);
    });
    
    socket.on('roleChanged', ({ team, role }) => {
        console.log(`Rôle changé: équipe ${team}, nouveau rôle ${role}`);
        playerInfo.role = role;
        updatePlayerInfo();
        
        if (role === 'spymaster') {
            document.body.classList.add('spymaster-view');
        } else {
            document.body.classList.remove('spymaster-view');
        }
        
        // Mettre à jour l'interface des indices selon le rôle
        updateClueControls();
    });
    
    socket.on('clueSubmitted', ({ clue, team }) => {
        console.log(`Indice reçu: ${clue.word} (${clue.number}) pour l'équipe ${team}`);
        // Mettre à jour l'interface pour afficher l'indice
        currentClueDisplay.textContent = `${clue.word} (${clue.number})`;
        
        // Mettre à jour les tentatives restantes
        if (gameState) {
            gameState.currentClue = clue;
            gameState.attemptsLeft = clue.number + 1;  // +1 pour la règle officielle
            updateClueDisplay();
        }
    });
    
    // Fonctions
    function updateGameBoard() {
        // Vérifier si l'état du jeu existe et si les cartes sont définies
        if (!gameState || !gameState.cards || !Array.isArray(gameState.cards)) {
            console.error('État du jeu invalide:', gameState);
            return;
        }
        
        // Vider le plateau
        gameBoard.innerHTML = '';
        
        // Créer les cartes
        gameState.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.index = index;
            cardElement.textContent = card.word;
            
            // Ajouter la classe de l'équipe si la carte est révélée
            if (card.revealed) {
                cardElement.classList.add('revealed');
                cardElement.classList.add(card.team);
            }
            
            // Ajouter l'indicateur d'équipe (visible en mode espion)
            const teamIndicator = document.createElement('div');
            teamIndicator.className = `card-team ${card.team}`;
            cardElement.appendChild(teamIndicator);
            
            // Ajouter l'événement de clic
            cardElement.addEventListener('click', () => {
                handleCardClick(index);
            });
            
            // Ajouter la carte au plateau
            gameBoard.appendChild(cardElement);
        });
        
        // Console log pour debug
        console.log(`Plateau mis à jour avec ${gameState.cards.length} cartes`);
    }
    
    function updateCounters() {
        redCardsCounter.textContent = gameState.redCardsLeft;
        blueCardsCounter.textContent = gameState.blueCardsLeft;
    }
    
    function updateCurrentTeam() {
        currentTeamDisplay.textContent = gameState.currentTeam === 'red' ? 'Rouge' : 'Bleu';
        currentTeamDisplay.style.color = gameState.currentTeam === 'red' ? '#d32f2f' : '#1976d2';
        
        // Activer/désactiver le bouton de fin de tour
        if (playerInfo.team === gameState.currentTeam) {
            endTurnBtn.disabled = false;
            endTurnBtn.style.opacity = 1;
        } else {
            endTurnBtn.disabled = true;
            endTurnBtn.style.opacity = 0.5;
        }
        
        // Mettre à jour l'interface des indices selon l'équipe active
        updateClueControls();
    }
    
    function updateClueDisplay() {
        if (!gameState) return;
        
        if (gameState.currentClue) {
            currentClueDisplay.textContent = `${gameState.currentClue.word} (${gameState.currentClue.number})`;
            attemptsDisplay.textContent = gameState.attemptsLeft;
            document.getElementById('clueDisplaySection').style.display = 'block';
        } else {
            currentClueDisplay.textContent = "Aucun";
            attemptsDisplay.textContent = "0";
            document.getElementById('clueDisplaySection').style.display = 'none';
        }
    }
    
    function updateClueControls() {
        // Si le joueur est le maître-espion de l'équipe active, afficher le formulaire d'indices
        if (playerInfo.role === 'spymaster' && playerInfo.team === gameState.currentTeam && !gameState.gameOver) {
            clueForm.style.display = 'flex';
        } else {
            clueForm.style.display = 'none';
        }
    }
    
    function updatePlayerInfo() {
        if (playerInfo.team === 'red') {
            playerTeamDisplay.textContent = 'Équipe Rouge';
            playerTeamDisplay.style.color = '#d32f2f';
        } else if (playerInfo.team === 'blue') {
            playerTeamDisplay.textContent = 'Équipe Bleue';
            playerTeamDisplay.style.color = '#1976d2';
        } else {
            playerTeamDisplay.textContent = 'Spectateur';
            playerTeamDisplay.style.color = '#616161';
        }
        
        if (playerInfo.role === 'spymaster') {
            playerRoleDisplay.textContent = 'Maître-Espion';
        } else if (playerInfo.role === 'agent') {
            playerRoleDisplay.textContent = 'Agent';
        } else {
            playerRoleDisplay.textContent = '';
        }
    }
    
    function updatePlayersList(players) {
        // Mettre à jour la liste des joueurs de l'équipe rouge
        redTeamPlayers.innerHTML = '';
        if (players.red.spymaster) {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.innerHTML = `<span class="spymaster-tag">Maître-Espion:</span> ${players.red.spymaster.nickname}`;
            redTeamPlayers.appendChild(playerElement);
        }
        
        players.red.agents.forEach(agent => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.textContent = agent.nickname;
            redTeamPlayers.appendChild(playerElement);
        });
        
        // Mettre à jour la liste des joueurs de l'équipe bleue
        blueTeamPlayers.innerHTML = '';
        if (players.blue.spymaster) {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.innerHTML = `<span class="spymaster-tag">Maître-Espion:</span> ${players.blue.spymaster.nickname}`;
            blueTeamPlayers.appendChild(playerElement);
        }
        
        players.blue.agents.forEach(agent => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.textContent = agent.nickname;
            blueTeamPlayers.appendChild(playerElement);
        });
        
        // Mettre à jour la liste des spectateurs
        spectatorsList.innerHTML = '';
        players.spectators.forEach(spectator => {
            const playerElement = document.createElement('div');
            playerElement.className = 'spectator-item';
            playerElement.textContent = spectator.nickname;
            spectatorsList.appendChild(playerElement);
        });
    }
    
    function selectTeam(team) {
        playerInfo.team = team;
    }
    
    function joinTeam(team, role) {
        const nickname = nicknameInput.value.trim() || `Joueur-${Math.floor(Math.random() * 1000)}`;
        
        console.log(`Tentative de rejoindre: équipe=${team}, rôle=${role}, pseudo=${nickname}`);
        
        socket.emit('joinTeam', {
            team: team,
            role: role,
            nickname: nickname
        });
    }
    
    function handleCardClick(cardIndex) {
        // Vérifier si c'est au tour du joueur et s'il n'est pas un maître-espion
        if (playerInfo.team === gameState.currentTeam && playerInfo.role !== 'spymaster' && !gameState.gameOver) {
            if (gameState.currentClue && gameState.attemptsLeft > 0) {
                // Envoyer l'événement de clic au serveur
                socket.emit('cardClick', cardIndex);
            } else {
                alert("Attendez que votre Maître-Espion donne un indice!");
            }
        }
    }
    
    function showGameOverModal() {
        const winningTeam = gameState.winningTeam === 'red' ? 'Rouge' : 'Bleu';
        
        if (gameState.winByBlackCard) {
            winnerMessage.textContent = `L'équipe ${winningTeam} gagne car l'équipe adverse a trouvé la carte noire!`;
        } else {
            winnerMessage.textContent = `L'équipe ${winningTeam} gagne en trouvant toutes ses cartes!`;
        }
        
        gameOverModal.style.display = 'block';
    }
    
    // Gestionnaires d'événements pour les boutons de jeu
    newGameBtn.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de vouloir démarrer une nouvelle partie?')) {
            socket.emit('newGame');
        }
    });
    
    endTurnBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous terminer votre tour?')) {
            socket.emit('endTurn');
        }
    });
    
    newGameAfterWinBtn.addEventListener('click', () => {
        socket.emit('newGame');
        gameOverModal.style.display = 'none';
    });
    
    // Fermer le modal quand on clique en dehors
    window.addEventListener('click', (event) => {
        if (event.target == gameOverModal) {
            gameOverModal.style.display = 'none';
        }
    });
});