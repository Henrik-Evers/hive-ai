function bot() {
    console.log("Joined Queue! Waiting for game to start...");
    bot.PF = require('pathfinding');
    bot.io = require('socket.io-client');
    if (!bot.isTest) {
        bot.socket = require('socket.io-client')(bot.hostURL);
        bot.socket.emit("name", bot.key);
    }
    else {
        bot.socket = require('socket.io-client')(bot.testHostURL);
        bot.socket.emit("name", bot.testKey);
    }

    // An array to store Data from one round to another
    bot.savedData = [];

    var globalGame;
    bot.socket.on("update", function (game) {

        console.log("----------------------------------------------")
        console.log("      \x1b[4m%s\x1b[0m", "Game number " + (game.gameId + 1));
        console.log("\x1b[31m", "Energy - Base Energy", "\x1b[0m");

        console.log("\x1b[31m", "My Bot " + "\x1b[0m" + game.myBot.energy + " - " + game.bases[game.idTurn].energy);
        for (var i = 0; i < game.players.length; i++) {
            if (i != game.myBot.id) {
                console.log("\x1b[31m", "Bot " + (i + 1) + "\x1b[0m " + game.players[i].energy + " - " + game.bases[i].energy);
            }
        }
        console.log("\x1b[33m", "Turn: " + game.turn + "/" + game.totalTurns, "\x1b[0m")

        console.log("----------------------------------------------")
        globalGame = game;
        // Running Player Created Brain        
        let tempdir = bot.direction(game);

        console.log("Going in this direction! " + tempdir)
        if (tempdir != undefined && tempdir != "") {
            bot.socket.emit("new direction", { dir: tempdir, "id": game.idTurn, "gameId": game.gameId });
        }
        console.log("avoidA RARR " + JSON.stringify(avoidArr));
        avoidArr = [];


    })


    let avoidArr = [];


    bot.clearAvoid = function () {
        avoidArr = [];
    }
    
    // Adds a PLUS shaped area to the avoid array
    bot.avoid = function (pos) {
        let enemyPos = JSON.parse(JSON.stringify(pos));
        avoidArr.push(enemyPos);
        if (globalGame.myBase.pos[0] != pos[0] && globalGame.myBase.pos[1] != pos[1]) {
            enemyPos = JSON.parse(JSON.stringify(pos));
            enemyPos[0]--;
            avoidArr.push(enemyPos);
            enemyPos = JSON.parse(JSON.stringify(pos));
            enemyPos[0]++;
            avoidArr.push(enemyPos);
            enemyPos = JSON.parse(JSON.stringify(pos));
            enemyPos[1]--;
            avoidArr.push(enemyPos);
            enemyPos = JSON.parse(JSON.stringify(pos));
            enemyPos[1]++;
            avoidArr.push(enemyPos);
        }
    }
    
    // Adds a single space to the avoidarray
    bot.avoidSpace = function(pos){
                let enemyPos = JSON.parse(JSON.stringify(pos));
        avoidArr.push(enemyPos);
    }



    bot.findDistance = function (pos1, pos2) {
        var grid = new bot.PF.Grid(globalGame.mapSize, globalGame.mapSize);
        grid.setWalkableAt(pos1[0], pos1[1], true);
        grid.setWalkableAt(pos2[0], pos2[1], true);
        for (let i = 0; i < globalGame.barricades.length; i++) {
            grid.setWalkableAt(globalGame.barricades[i][0], globalGame.barricades[i][1], false)
        }
        if (avoidArr !== undefined && avoidArr.length > 0) {
            if (avoidArr[0].constructor === Array) {
                for (let i = 0; i < avoidArr.length; i++) {
                    if (avoidArr[i][0] < globalGame.mapSize && avoidArr[i][0] >= 0 && avoidArr[i][1] < globalGame.mapSize && avoidArr[i][1] >= 0) {
                        grid.setWalkableAt(avoidArr[i][0], avoidArr[i][1], false);
                    }
                }
            }
            else {
                if (avoidArr[0] < globalGame.mapSize && avoidArr[0] >= 0 && avoidArr[1] < globalGame.mapSize && avoidArr[1] >= 0) {
                    grid.setWalkableAt(avoidArr[0], avoidArr[1], false);
                }
            }
        }
        var finder = new bot.PF.AStarFinder();
        var path = finder.findPath(pos1[0], pos1[1], pos2[0], pos2[1], grid);
        return path.length;
    }



    bot.stepArray = function (pos1, pos2) {
        var grid = new bot.PF.Grid(globalGame.mapSize, globalGame.mapSize);
        grid.setWalkableAt(pos1[0], pos1[1], true);
        grid.setWalkableAt(pos2[0], pos2[1], true);
        for (let i = 0; i < globalGame.barricades.length; i++) {
            grid.setWalkableAt(globalGame.barricades[i][0], globalGame.barricades[i][1], false)
        }
            if (avoidArr !== undefined && avoidArr.length > 0) {
                if (avoidArr[0].constructor === Array) {
                    for (let i = 0; i < avoidArr.length; i++) {
                        if (avoidArr[i][0] < globalGame.mapSize && avoidArr[i][0] >= 0 && avoidArr[i][1] < globalGame.mapSize && avoidArr[i][1] >= 0) {
                            grid.setWalkableAt(avoidArr[i][0], avoidArr[i][1], false);
                        }
                    }
                }
                else {
                    if (avoidArr[0] < globalGame.mapSize && avoidArr[0] >= 0 && avoidArr[1] < globalGame.mapSize && avoidArr[1] >= 0) {
                        grid.setWalkableAt(avoidArr[0], avoidArr[1], false);
                    }
                }
            }
        
        var finder = new bot.PF.AStarFinder();
        var path = finder.findPath(pos1[0], pos1[1], pos2[0], pos2[1], grid);
        return path;
    }

    bot.nextStep = function (pos1, pos2) {
        if (pos1 === undefined || pos2 === undefined) {
            return "none";
        }
        var grid = new bot.PF.Grid(globalGame.mapSize, globalGame.mapSize);
        grid.setWalkableAt(pos1[0], pos1[1], true);
        grid.setWalkableAt(pos2[0], pos2[1], true);
        for (let i = 0; i < globalGame.barricades.length; i++) {
            grid.setWalkableAt(globalGame.barricades[i][0], globalGame.barricades[i][1], false)
        }
            if (avoidArr !== undefined && avoidArr.length > 0) {
                if (avoidArr[0].constructor === Array) {
                    for (let i = 0; i < avoidArr.length; i++) {
                        if (avoidArr[i][0] < globalGame.mapSize && avoidArr[i][0] >= 0 && avoidArr[i][1] < globalGame.mapSize && avoidArr[i][1] >= 0) {
                            grid.setWalkableAt(avoidArr[i][0], avoidArr[i][1], false);
                        }
                    }
                }
                else {
                    if (avoidArr[0] < globalGame.mapSize && avoidArr[0] >= 0 && avoidArr[1] < globalGame.mapSize && avoidArr[1] >= 0) {
                        grid.setWalkableAt(avoidArr[0], avoidArr[1], false);
                    }
            }
        }
        var finder = new bot.PF.AStarFinder();
        var path = finder.findPath(pos1[0], pos1[1], pos2[0], pos2[1], grid);
        if (path === null || path === undefined || path.length === 0) { }
        else {

            if (path[1]) {
                if (path[1][0] === pos1[0]) {
                    if (path[1][1] < pos1[1]) {
                        return "north";
                    }
                    else {
                        return "south";
                    }

                }
                else {
                    if (path[1][0] > pos1[0]) {
                        return "east";
                    }
                    else {
                        return "west";
                    }
                }
            }
        }
    }

    bot.checkPos = function (dirStr, pos) {
        let tempPosVar = JSON.parse(JSON.stringify(pos));
        if (dirStr == "north") {
            tempPosVar[1]--;
        }
        else if (dirStr == "south") {
            tempPosVar[1]++;
        }
        else if (dirStr == "east") {
            tempPosVar[0]++;
        }
        else if (dirStr == "west") {
            tempPosVar[0]--;
        }
        return tempPosVar;

    }
    
    
}
module.exports = bot;
