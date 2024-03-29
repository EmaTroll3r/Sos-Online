//----------------------------------------------------------------------------------------------
//--------------------------------------- Parameters -------------------------------------------

//let backgroundColor =  "#add8e6"
let backgroundImage = "url('images/background.webp')";
let maxHandHints = 3;
let maxHandActions = 3;


//---------------------------------- Variable Declaration --------------------------------------

let mtype = 0;
let partyID = 1234;
let maxCards = 157;         //146
let maxHintCards = 122;
let maxBlockCards = 140;    //134
let maxHintHand = 3;
let maxActionHand = 3;


let deck = new Array(maxCards).fill(1);
let hintsHand = new Array(maxHintHand).fill(0);
let actionsHand = new Array(maxActionHand).fill(0);
let nBlockInHand = 0;
let nBlameInHand = 0;
let maxHand = maxHandHints + maxHandActions;

let selectedCard = -1;
let lastMessage;
let lastMtype = 1;
//let next_player = 2;
//let turn = 1;



//---------------------------------------- Firebase --------------------------------------------


const firebaseConfig = {
    apiKey: "AIzaSyAvUpw4PbzarZYFs29jZiNF685nJN6eHS8",
    authDomain: "sos-online-2f71a.firebaseapp.com",
    projectId: "sos-online-2f71a",
    storageBucket: "sos-online-2f71a.appspot.com",
    messagingSenderId: "408880326437",
    appId: "1:408880326437:web:610c70df6162ec3b781ccc",
    measurementId: "G-V856YYDF2S",
    databaseURL: "https://sos-online-2f71a-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
let database = firebase.database();

// Ricevi solo i messaggi con un mtype specifico
database.ref('messages').on('child_added', function(snapshot) {
    let message = snapshot.val();
    if (message.partyID === partyID && (message.mtype === mtype || message.mtype === 0)){
        //console.log(message.text);
        handlerMessage(message);
        
        if(message.mtype !== 0){
            database.ref('messages/' + snapshot.key).remove();
        }
    }

    /*
    if (message.partyID === partyID && message.text.startsWith("TURN")) {
        let newTurnNumber = parseInt(message.text.split(" ")[1]);
        if (!isNaN(newTurnNumber)) {
            turn = newTurnNumber;
        }
    }
    */
});



//------------------------------------- Game Functions -----------------------------------------



function getTurn() {
    let turn = 1;
    database.ref('messages').on('value', function(snapshot) {

        snapshot.forEach(function(childSnapshot) {
            message = childSnapshot.val();
            if (message.partyID === partyID && message.text.startsWith("TURN")) {
                let newTurnNumber = parseInt(message.text.split(" ")[1]);
                if (!isNaN(newTurnNumber)) {
                    turn = newTurnNumber;
                }
            }
        });
        //console.log(lastMessage);
    });
    if(turnName){
        turnName.textContent = "Giocatore di turno: " + turn;
    }
    //console.log("Turn",turn)
    return turn;
}

function listMessages() {
    database.ref('messages').on('value', function(snapshot) {

        snapshot.forEach(function(childSnapshot) {
            lastMessage = childSnapshot.val();
            //console.log(lastMessage);
        });
        //console.log(lastMessage);
    });
}

function sendMessage(message, mtype, partyID,print = 0) {
    if(print === 1){
        console.log("MESSAGE:",message,"\nMTYPE: ",mtype,"\nPARTY ID: ",partyID);      
    }
    database.ref('messages').push({
        text: message,
        mtype: mtype,
        partyID: partyID
    });
    return true;
}

function joinLobby() {
    let message;
    partyID = parseInt(prompt("Enter the party code"));
    database.ref('messages').on('value', function(snapshot) {    
    let found = false;
        snapshot.forEach(function(childSnapshot) {
            message = childSnapshot.val();
            if (message.partyID === partyID && message.mtype === 0) {
                //console.log("Messaggio trovato:", message);
                found = true;
                return true;  // Interrompe il ciclo forEach
            }
        });
    });
            
    //console.log("Near IF",message.text);
    if(message.text === "LOBBY " + partyID){
            
        //console.log("inside IF");
        tempMtype = Math.floor(Math.random() * 9000) + 1000;
        //console.log("tempMtype",tempMtype);
        sendMessage("ASK-MTYPE "+tempMtype, 1, partyID);

        //console.log("Waiting for mtype...");
        waitForMessage(tempMtype,partyID).then(message => {
                    
            //console.log("Messaggio ricevuto:", message);
            let parts = message.text.split(" ");

            if(parts[0] ==="ANSWER-MTYPE"){
                mtype = parseInt(parts[1]);
                sendMessage("JOINED " + mtype, 0, partyID);
                alert("You have joined the lobby");
                console.log("Your mtype is", mtype);
            }
        
        }).catch(error => {
            console.error("Errore:", error);
        });
    }
}

function hostLobby(){
    partyID = Math.floor(Math.random() * 9000) + 1000;
    alert("Your party code is " + partyID);
    mtype = 1;
    sendMessage("LOBBY " + partyID, 0 , partyID);
    console.log("Your mtype is", mtype);
}

function waitForMessage(mtype, partyID) {
    return new Promise((resolve, reject) => {
        database.ref('messages').on('child_added', function(snapshot) {
            let message = snapshot.val();
            if (message.partyID === partyID && message.mtype === mtype) {
                resolve(message);  // Risolve la promessa con il messaggio
            }
        });
    });
}

function startGame(){
    if(mtype !== 1)
        return false

    for(let i=1;i<lastMtype+1;i++){
        for(let j=0;j<maxHandHints;j++){
            sendMessage("DRAW " + pickCard(1), i, partyID);
        }

        sendMessage("DRAW " + pickCard(2), i, partyID);
        for(let j=0;j<maxHandActions-1;j++){
            sendMessage("DRAW " + pickCard(0), i, partyID);
        }
        
        
    }

        localStorage.setItem('lastMtype', lastMtype);    
        localStorage.setItem('partyID', partyID);
        localStorage.setItem('mtype', mtype);
        localStorage.setItem('hintsHand', JSON.stringify(hintsHand));
        localStorage.setItem('actionsHand', JSON.stringify(actionsHand));
        localStorage.setItem('deck', JSON.stringify(deck));
        //window.location.href = "game.html";


        //sendMessage("START", 0, partyID);
        //console.log("lastMtype",lastMtype);
        
        sendMessage("TURN 1",0,partyID);
        broadcast("START "+lastMtype,partyID);
        /*
        let waiting_players = lastMtype;
        for(let i=0;i<lastMtype;i++){
            waitForMessage(i,partyID).then(message => {
                console.log("Messaggio ricevuto:", message);
                if(message.text === "START-OK"){
                    waiting_players--;
                }
            }).catch(error => {
                console.error("Errore:", error);
            });
        }   
        */
}

function broadcast(message,partyId = -1){
    if(partyId === -1){
        partyId = partyID;
    }
    for(let i=2;i<lastMtype+1;i++){
        sendMessage(message, i, partyId,1);
    }
    sendMessage(message, 1, partyId,1);        //lo invia a tutti e per ultimo all'host
}

function updateDropdown(){
    //console.log("Updating dropdown",nBlockInHand,nBlameInHand);
    var dropdownItems = document.querySelectorAll('#context-menu option');
    
    nBlockInHand = 0
    for(let i=0;i<maxActionHand;i++){
        if(actionsHand[i] >= maxHintCards && actionsHand[i] < maxBlockCards){
            nBlockInHand++
        }
    }

    nBlameInHand = 0
    for(let i=0;i<maxActionHand;i++){
        if(actionsHand[i] >= maxBlockCards && actionsHand[i] < maxCards){
            nBlameInHand++
        }
    }

    dropdownItems.forEach(function(item, index) {
        if(index == 1){
            item.textContent = 'Blocca x' +nBlockInHand;
            //console.log("nBlockInHand",nBlockInHand);
        }
        if(index == 2){
            item.textContent = 'Scaricabarile x' +nBlameInHand;
        }
    });
}

function handlerMessage(message) {
    //console.log(message);
    let parts = message.text.split(" ");
    let cmd = parts[0];
    let par = parts[1]; // Il parametro è la seconda parte del messaggio

    switch (cmd) {
        case "ASK-MTYPE":
            lastMtype++;
            let str = "ANSWER-MTYPE " + lastMtype;
            //console.log(str);
            sendMessage(str, parseInt(par), partyID);
            break;
        case "START":
            
            localStorage.setItem('lastMtype', parseInt(par));    
            localStorage.setItem('partyID', partyID);
            localStorage.setItem('mtype', mtype);
            localStorage.setItem('hintsHand', JSON.stringify(hintsHand));
            localStorage.setItem('actionsHand', JSON.stringify(actionsHand));
            localStorage.setItem('deck', JSON.stringify(deck));

            sendMessage("START-OK", 1, partyID);
            window.location.href = "game.html?get=" + encodeURIComponent(1);
            break;
        case "DRAW":
            console.log("Drawing",parseInt(par),"card...");
            addCardToHand(parseInt(par));
            
            localStorage.setItem('hintsHand', JSON.stringify(hintsHand));
            localStorage.setItem('actionsHand', JSON.stringify(actionsHand));
            
            sendMessage("DRAW-OK", 1, partyID);
            break;
        case "PLAY":
            sendMessage("PLAYED "+ parseInt(par),0,partyID);
            break;
        case "PLAYED":
            ShowPlayedCard(parseInt(par));
            break
        case "ASK-DRAW":
            let wantsHint = parseInt(par.split("_")[0]); 
            let asker = parseInt(par.split("_")[1]);
            //console.log("ASK-DRAW",wantsHint,asker);
            sendMessage("DRAW " + pickCard(wantsHint), asker, partyID);
            //console.log("drawed",wantsHint,asker);
            break;
        case "TURN":
            if(parseInt(par) === mtype){
                //alert("E' il tuo turno");
                if(!isActionsHandFull()){
                    askDraw(0);
                    showHand();
                }
            }
            break;            
        default:
            // Fai qualcosa quando nessuno dei casi precedenti corrisponde
            break;
    }

        // Elimina il messaggio dopo averlo letto
        
}


//-------------------------------------- DOM elements ------------------------------------------


var images = document.querySelectorAll('#game-images img');
var dropdownMenu = document.getElementById('context-menu');
let turnName = document.getElementById('playerTurn');
var listMessagesButton = document.getElementById('list-messages');
var startGameButton = document.getElementById('start-game');
//var showHandButton = document.getElementById('show-hand');
var playCardButton = document.getElementById('play-card');
var hostLobbyButton = document.getElementById('host-lobby');
var joinLobbyButton = document.getElementById('join-lobby');
var drawButton = document.getElementById('drawButton');

if (joinLobbyButton) {
    joinLobbyButton.addEventListener('click', joinLobby);
}

if (hostLobbyButton) {
    hostLobbyButton.addEventListener('click', hostLobby);
}

if (startGameButton) {
    startGameButton.addEventListener('click', startGame);
}

if (dropdownMenu) {
    dropdownMenu.addEventListener('click', function(e) {
        var selectedOption = dropdownMenu.selectedIndex;
        //console.log('Hai selezionato:', selectedOption);

        switch (selectedOption) {
            case 0:
                //console.log("playing");
                playCard(selectedCard,0);
                break;
            case 1:
                playCard(selectedCard,1);
                break;
            case 2:                
                playCard(selectedCard,2);
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target !== dropdownMenu && !Array.from(images).includes(e.target)) {
            dropdownMenu.style.display = 'none';
            selectedCard = -1;
        }
    });
}

if (listMessagesButton) {
    listMessagesButton.addEventListener('click', listMessages);
}

if (playCardButton) {
    playCardButton.addEventListener('click', playCard);
}

if(drawButton){
    drawButton.addEventListener('click', askDraw);
}

// Aggiungere un ascoltatore di eventi a ciascuna immagine
images.forEach(function(image) {
    image.addEventListener('click', function(e) {
        var url = e.target.src;
        var filename = url.split('/').pop();
        var name = filename.split('.')[0]; // Ottenere solo il nome senza l'estensione
        //console.log('Nome della carta:', name);
        selectedCard = parseInt(name);

        updateDropdown();
        dropdownMenu.style.left = e.clientX + 'px';
        dropdownMenu.style.top = e.clientY + 'px';

        // Mostra il menu a tendina
        dropdownMenu.style.display = 'block'; 
    });
});



//----------------------------------- Estetical Functions --------------------------------------


function ShowPlayedCard(card){
    
    var img = document.createElement('img'); // Crea un nuovo elemento img
    img.src = 'images/' + card + '.png'; // Imposta l'attributo src all'URL dell'immagine
    img.className = 'centered-image'; // Applica la classe CSS all'immagine
    img.style.paddingTop = '3%';
    document.body.appendChild(img); // Aggiunge l'immagine al body

    var overlay = document.createElement('div'); // Crea un nuovo elemento div
    overlay.style.position = 'fixed'; // Posiziona l'elemento in modo fisso
    overlay.style.top = '0'; // Inizia dall'alto dello schermo
    overlay.style.left = '0'; // Inizia dal lato sinistro dello schermo
    overlay.style.width = '100%'; // Copre l'intera larghezza dello schermo
    overlay.style.height = '100%'; // Copre l'intera altezza dello schermo
    overlay.style.zIndex = '10'; // Imposta l'indice Z in modo che l'elemento sia sopra le carte ma sotto l'immagine
    //overlay.style.backgroundColor = backgroundColor; // Imposta il colore dello sfondo a semi-trasparente
    overlay.style.backgroundImage = backgroundImage;
    document.body.appendChild(overlay); // Aggiunge l'elemento al body

    /*
    var cards = document.querySelectorAll('.card'); // Seleziona tutte le carte
    cards.forEach(function(card) {
        card.style.display = 'none'; // Nasconde le carte
    });
    */
    
    setTimeout(function() {
        img.remove(); // Rimuove l'immagine dopo 3 secondi
        overlay.remove(); // Rimuove l'overlay dopo 3 secondi
        
        showHand(); // Mostra le carte dopo 3 secondi
        
        /*cards.forEach(function(card) {
            card.style.display = ''; // Mostra di nuovo le carte
        });
        */
    }, 3000);
}



//------------------------------------- Card Functions -----------------------------------------


//------------ Play Cards Functions ------------

function playBlockCard(){
    
    if(nBlockInHand > 0 ){
        for(let i=0;i<maxActionHand;i++){
            if (actionsHand[i] < maxBlockCards) {
                actionsHand[i] = 0;
                nBlockInHand--;
                askDraw(0);
                return true;
            }
        }
    }
    return false;
}

function playBlameCard(){
    
    if(getTurn() == mtype && nBlameInHand > 0 ){
        for(let i=0;i<maxActionHand;i++){
            if (actionsHand[i] >= maxBlockCards) {
                actionsHand[i] = 0;
                nBlameInHand--;
                return true;
            }
        }
    }
    return false;
}

function playCard(card = 0,action = -1,next_p = -1){
    if(getTurn() !== mtype && action !== 1){
        alert("Non e' il tuo turno")
        return false;
    }

    if(card === -1){
        while(removeCardFromHand(card) === -1){
        
            card = parseInt(prompt("Quale carta vuoi giocare?"));
            if (card === null){
                return false;
            }
        }
    }

    if(action !== 0){               //Not a normal play
        if(action === 1){              //Block
            if(!playBlockCard()){
                alert("Non hai carte Blocca in mano");
                return false;
            }
        }
        //else if(isBlame(action)){
        else if(action === 2){          //Blame
            if(!playBlameCard()){
                alert("Non hai carte Scaricabarile in mano");
                return false;
            }else{
                while(isNaN(next_p) || next_p < 1 || next_p > lastMtype || next_p === mtype){
                    next_p = parseInt(prompt("A chi vuoi dare la colpa?"))
                    if (isNaN(next_p)){
                        return false;
                    }
                }
                sendMessage("TURN "+ next_p,0,partyID);
            }
        }
    }

    if(removeCardFromHand(card) !== -1){
       

        // Nascondi l'immagine della carta
        /*
        var cardImage = document.querySelector(`img[src="images/${card}.png"]`);
        if (cardImage) {
            cardImage.style.display = 'none';
        }
        */
       

        sendMessage("PLAY "+card,1,partyID);

        if(action === 2){
            for(let i=0;i<maxHintHand;i++){
                askDraw(1);
            }
        }

        return true;
    }
    //console.log("false");
    return false;
}


//------------ Draw Cards Functions ------------

function pickCard(hint = 1){
    let card,max,min;
    if(hint === 1){             //hint
        //max = maxHintCards + 1;
        max = maxHintCards;
        min = 1;
    }else if(hint === 0){       //action
        max = maxCards;
        //min = maxHintCards + 2;
        min = maxHintCards;
    }else if(hint === 2){       //blame
        max = maxCards;
        min = maxBlockCards;
    }
    //for(let i=0;i<maxCards;i++){
    while(true){
        card = Math.floor(Math.random() * (max - min) + min);
        //console.log("Picking card",card)
        if(deck[card] === 1){
            deck[card] = 0;
            return card;
        }
    }
    return -1;
}

function drawCard(card = -1,hint = 1,){
    if(hint === 1 && !isHintsHandFull() || hint === 0 && !isActionsHandFull()){
        if(card === -1){
            card = pickCard(hint);
        }
        addCardToHand(card);
    }
    return -1;
}

function askDraw(hint = 1){
    //console.log("AskDraw",hint);
    if(hint === 1 && !isHintsHandFull()){
        console.log("ASK-DRAW " + hint + "_"+mtype)
        return sendMessage("ASK-DRAW " + hint + "_"+mtype, 1, partyID);
        
    }else if(hint === 0 && !isActionsHandFull()){
        console.log("ASK-DRAW " + hint + "_"+mtype)
        return sendMessage("ASK-DRAW " + hint + "_"+mtype, 1, partyID);
    }
    return false;
}

//------------ Hand Functions ------------


function showHand(){
    
    let ncard = 1;
    for(let i=0;i<maxHintHand;i++){
        var newImage = 'images/'+ hintsHand[i] + '.png';
        var imageElement = document.getElementById('card'+ncard);
        //console.log(hintsHand[i],ncard)
        imageElement.src = newImage;
        ncard++;
    }
}

function addCardToHand(card){
    if(card < maxHintCards){
        for(let i=0;i<maxHintHand;i++){
            if(hintsHand[i] === 0){
                hintsHand[i] = card;
                return card;
            }
        }
    }else if(card >= maxHintCards){
        for(let i=0;i<maxActionHand;i++){
            if(actionsHand[i] === 0){
                actionsHand[i] = card;
                if(card < maxBlockCards){
                    nBlockInHand++;
                }else if(card >= maxBlockCards){
                    nBlameInHand++;
                    //console.log("Blame in hand",nBlameInHand);
                }
                updateDropdown();
                return card;
            }
        }
    }
    return -1;
}

function removeCardFromHand(card){
    
    if(card < maxHintCards){
        if(hintsHand.includes(card) === true){
            for(let i=0;i<maxHintHand;i++){
                if(hintsHand[i] === card){
                    hintsHand[i] = 0;
                    
                    localStorage.setItem('hintsHand', JSON.stringify(hintsHand));
                    return card;
                }
            } 
        }
    }else if(card >= maxHintCards){
        if(actionsHand.includes(card) === true){
            for(let i=0;i<maxActionHand;i++){
                if(actionsHand[i] === card){
                    actionsHand[i] = 0;
                    if(card < maxBlockCards){
                        nBlockInHand--;
                    }else if(card >= maxBlockCards){
                        nBlameInHand--;
                    }
                    
                    localStorage.setItem('actionsHand', JSON.stringify(actionsHand));
                    return card;
                }
            }
        }
    }
    return -1;
}

function isHintsHandFull(){
    console.log("hintHand",hintsHand)
    for(let i=0;i<maxHintHand;i++){
        if(hintsHand[i] === 0)
            return false;
    }
    return true;
}

function isActionsHandFull(){
    for(let i=0;i<maxActionHand;i++){
        if(actionsHand[i] === 0)
            return false;
    }
    return true;
}


//------------ IsCard Functions ------------


function isHint(card){
    if(card < maxHintCards)
        return true;
    return false;
}

function isAction(card){
    if(card >= maxHintCards)
        return true;
    return false;
}

function isBlock(card){
    if(card >= maxHintCards &&  card < maxBlockCards)
        return true;
    return false;
}

function isBlame(card){
    if(card >= maxBlockCards)
        return true;
    return false;
}


//------------------------------------ On Load Function ----------------------------------------

window.onload = function() {
    var urlParams = new URLSearchParams(window.location.search);
    var parametro = urlParams.get('get');
    if(parametro === "1"){
        lastMtype = parseInt(localStorage.getItem('lastMtype', lastMtype));    
        partyID = parseInt(localStorage.getItem('partyID', partyID));
        mtype = parseInt(localStorage.getItem('mtype', mtype));
        hintsHand = JSON.parse(localStorage.getItem('hintsHand')).map(Number);
        actionsHand = JSON.parse(localStorage.getItem('actionsHand')).map(Number);
        deck = JSON.parse(localStorage.getItem('deck')).map(Number);

        
        for(let i=0;i<maxActionHand;i++){
            if(actionsHand[i] < maxBlockCards){
                nBlockInHand++;                
            }
            else if(actionsHand[i] >= maxBlockCards){
                nBlameInHand++;
            }
        }
        
        /*
        database.ref('messages').orderByChild('mtype').equalTo(0).on('value', function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                let message = childSnapshot.val();
                if (message.partyID === partyID && message.text.startsWith("TURN")) {
                    let turnNumber = parseInt(message.text.split(" ")[1]);
                    if (!isNaN(turnNumber)) {
                        turn = turnNumber;
                    }
                }
            });
        });
        */

        // Aggiungi lettere alle voci del menu 
        updateDropdown();
        //console.log("lastMtype",lastMtype);
        showHand();
        getTurn();
    }
}
