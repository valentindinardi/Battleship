//Modules that we are going to use all
const fs = require('fs');

function getHash() {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( var i = 0; i < 8; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
//dataRooms=array with the info of my rooms
//roomId=identifier of the room
function roomExists(dataRooms,roomId) {
    const idParsed = parseInt(roomId);
    //if this position of the array have something
    if (dataRooms[idParsed]) {
        return true;}
    return false;
}

//dataRooms=array with the info of my rooms
//roomId=identifier of the room
function roomDeleteByID(dataRooms,roomId) {
    const idParsed = parseInt(roomId, 10);
    dataRooms[idParsed] = null;
}

//delete de rooms that are closed and past more that four hours that
function deleteUselessRooms(url,time){
    //readFile
    jsonRooms = fs.readFileSync(url,'utf-8');
    dataRooms = JSON.parse(jsonRooms); 
    let newDataRooms = dataRooms.map(room => {
        dateNow=Date.parse(Date());
        let result=dateNow-room.time;
        if ((room.matchCanceled)||(room.matchFinished)){ //check if the room was canceled or if it ended
            if ((result > time)){ //check if more than four hours have passed since the room was created
                return null;
            }else{
                return room;
            }
        }else{
            return room;
        }
    });
    //writeFile
    let data = JSON.stringify(newDataRooms,null,1);
    fs.writeFileSync(url,data); 
}

module.exports = {
    getHash,
    roomExists,
    roomDeleteByID,
    deleteUselessRooms
}