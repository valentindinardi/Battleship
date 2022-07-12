const express = require('express')
const PORT = 3000
const app = express()
const roomsURL = './battleship/battleshipRooms.json'
const fs = require('fs');
const common = require('./commonModules/commonModules.js'); //Aca puede estar accediendo o no.

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

//Preguntas: 1- Cuando necesito player (1 o 2) e idRoom para x situacion, se la pido al body al igual que x e y?


//Variables para rooms
var ID = 0;
let roomData = {};

function readFile() {
  JSONRooms = fs.readFileSync('./battleship/battleshipRooms.json', 'utf-8');      // read 
  roomData = JSON.parse(JSONRooms);                                              // conver my JSON to array 
}

function writeFile() {
  let data = JSON.stringify(roomData, null, 1);                                      //convert my array to a JSON
  fs.writeFileSync('./battleship/battleshipRooms.json', data)                        // write
}

function createRoom() {
  readFile();

  let room = {
    id: roomData.length,
    playerWon: -1, // "-1" if the game not finished, "0" if player 1 win , "1" if player 2 win and "2" if is a tie
    matchClosed: false, //if the match is canceled
    grids: [
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null]
    ],
    ships: [3, 3],
    playerCounter: 1,
    currentTurn: 0
  }
  roomData.push(room);
  writeFile();
  readFile(); // read again to keep it updated
  return {
    idRoom: room.id,
    idPlayer: 0  //si el lo creo, siempre es el 0
  };
}

app.get('/', (req, res) => {
  res.render('index')
})

app.post('/rooms/create', (req, res) => {
  const { idRoom, idPlayer } = createRoom();
  return res.render('choose-placements', {        //Cuando recibo la request renderizo choose placements
    idRoom: idRoom,                               // y le retorno esta informacion. Despues voy a accederla a traves de <%= idRoom %>
    idPlayer: idPlayer
  })
});

app.get('/rooms/join', (req, res) => {   //Entrando el segundo player 2
  readFile()
  const idLobby = req.query.id;                    //Le pido al get que me de su id que ingreso como parametro
  console.log(idLobby);
  if (roomData.filter(r => r.id == idLobby).length == 0) {
    res.status(400).json({ error: true, message: 'La sala no existe' });
    return;
  }
  // if player 2 is already in game 
  if (roomData[idLobby].playerCounter == 2) {
    res.status(400).json({ error: true, message: 'El jugador dos ya existe' });
    return;
  }

  roomData[idLobby].playerCounter++;

  writeFile();
  readFile();

  return res.render('choose-placements', {   //Renderizo chooseplacements con dos locals
    idRoom: idLobby,
    idPlayer: 1
  })



});

function placeCharacter(num, c, grid) {
  grid[num] = c;
}

//  POSICIONAR BARCOS (3 VECES)
app.post('/choose-placement', (req, res) => {
  readFile();
  const { id, player, num } = req.body
  placeCharacter(num, 'O', roomData[id].grids[player])
  roomData[id].ships[player]++;
  writeFile();
  readFile();                               //Keep it updated
  res.status(200).json({
    error: false,
    message: 'Barquito posicionado'
  });
})

app.post('/attack', (req, res) => {
  readFile();


  let hit = false
  const { id, player, num } = req.body

  if (roomData[id].currentTurn != player)       //not finished
    return res.status(400).json({
      error: true,
      message: 'No es tu turno'
    });


  const enemy = (player == 0) ? 1 : 0              //Me fijo que player es 

  if (roomData[id].grids[enemy][num] == 'O') {                // Si tiene un 0 en el grid enemigo es pq le pego
    roomData[id].grids[enemy][num] = "X"                     // X = barco tirado
    roomData[id].ships[enemy]--;                            //Decremento ships del enemigo
    console.log('El jugador ' + player + ' le ha pegado en cuadrado numero' + num)
    hit = true                                              //Para saber si le pego en el res.status
  }

  roomData[id].currentTurn = (roomData[id].currentTurn == 0) ? 1 : 0        //cambio de turno!

  writeFile();
  readFile();

  res.status(200).json({
    error: false,
    message: (hit) ? 'Barco hundido!' : 'No habia nada',
    drown: (hit) ? 1 : 0
  });

})

app.get('/check-status/:id/:player', (req, res) => {    //Falta checkear esto 
  readFile();
  const { id, player } = req.params
  let winner

  if (roomData[id].playerCounter != 2) {
    return res.status(400).json({
      error: true,
      message: 'Falta un jugador'
    });
  }

  if (roomData[id].ships[0] == 0 || roomData[id].ships[1] == 0) {
    // se acabo el juego
    if (roomData[id].ships[0] == 0) {
      winner = 1
    } else {
      winner = 0
    }

    res.status(200).json({
      error: false,
      matchClosed: true,
      winner: winner,
      message: 'Juego finalizado'
    });
  } else {
    if (roomData[id].currentTurn != player)
      res.status(200).json({
        error: false,
        matchClosed: false,
        message: 'pending'
      });
    else
      res.status(200).json({
        error: false,
        matchClosed: false,
        message: 'your turn'
      });
  }
})

app.get('/game', (req, res) => {
  return res.render('battleshipGame')
})

app.post('/game-data', (req, res) => {            //falta checkear.
  readFile();
  const { id, player } = req.body
  let miGrid = roomData[id].grids[player]
  return res.status(200).json({
    error: false,
    grid: miGrid
  })
})