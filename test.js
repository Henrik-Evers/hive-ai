var bot = require("./bot"); //Don't change this
bot.hostURL = 'http://denaliai19-matthesby1.c9users.io'; //Put the server url/IP adress here!
bot.key = "qgaemnxzqco"; //Set your bot key to this string!

/* TEST CODE */
bot.testHostURL = 'http://hive-ai-henrikevers.c9users.io'; //Put the server url/IP adress here!
bot.testKey = "testrun"; //Do Not Change This Key!
bot.isTest = true;
/* End Test Code */

var botsData;

const fs = require('fs');

function jsonReader(filePath) {
    const jsonString = fs.readFileSync(filePath);
    botsData = JSON.parse(jsonString);
    return botsData;
} // For reading JSON file.
/***************************************************/
//Write your code in this function!!!
bot.direction = function(game) {
    
    /* ~~~ Determines and Organizes Data About The Game ~~~ */
    var enemyBots = [];
    var enemyBases = [];
    var myDir = "none";
    var ival = 0;
    var fittestEnemy;
    var fittestBase;
    var myBase = game.bases[game.myBot.id];
    var defcon = 5;
    var target = '';
    var mostWanted;
    var turnsebase = 0;
    botsData = [];
    console.log(game.myBot);

    var dirs = ["north", "east", "south", "west"];

    for (let i = 0; i < game.players.length; i++) { //Adds all other bots to the enemyBots array.
        if (game.players[i].id != game.myBot.id) {
            enemyBases.push(game.bases[i]); //Adds all other bases to the enemyBases array
            enemyBots.push(game.players[i]);
            // if(game.players[i].pollen < game.players[game.myBot.id].pollen) {
            //     bot.avoid(game.players[i].pos);
            // } // Avoids bots with less pollen during pathfinding.
        }
    } // Adds other bots and bases to the array.
    for (var i = 0; i < enemyBots.length; i++) {
        if (enemyBots[i].pos == enemyBases[i].pos) {
            bot.avoid(enemyBases[i].pos);
        }
    } // Avoids enemy bots on their baases.
    
    function flowerProcessing() {
        var flowers = [];
        
        for (var i = 0; i < game.flowers.length; i++) { // Fills the flowers array with the fitness value of each flower - the pollen divided by path distance.
            flowers.push(game.flowers[i].pollen/(bot.stepArray(game.myBot.pos, game.flowers[i].pos).length)*1.5);
        }
        
        var bestFlower = flowers[0];
        
        for (var i = 0; i < flowers.length; i++) { // Find the fittest flower and sets bestFlower to equal it.
            if (flowers[i] > bestFlower) {
                bestFlower = flowers[i];
                ival = i;
            }
        }
        
        return bestFlower;
    } // Processes flowers to find fittest.
    function enemyBotProcessing() {
        fittestEnemy = enemyBots[0];
        fittestEnemy.fitness = (game.myBot.pollen - enemyBots[0].pollen) / bot.stepArray(game.myBot.pos, enemyBots[0].pos).length;
        for (var i = 0; i < enemyBots.length; i++) {
            var testedFitness = (game.myBot.pollen - enemyBots[0].pollen) / bot.stepArray(game.myBot.pos, enemyBots[0].pos).length;
            if (fittestEnemy.fitness < testedFitness) {
                fittestEnemy = enemyBots[i];
                fittestEnemy.fitness = testedFitness;
            }
        }
        return true;
        
    } // Processes enemies to find fittest.
    function enemyBaseProcessing() {
        fittestBase = enemyBases[0];
        fittestBase.fitness = -10;
        for (var i = 0; i < enemyBases.length; i++) {
            enemyBases[i].fitness = enemyBases[i].pollen / (bot.stepArray(game.myBot.pos,enemyBases[i].pos) * 2);
            fittestBase = enemyBases[i].fitness > fittestBase.fitness ? enemyBases[i] : fittestBase;
        }
    } // Processes bases to find fittest.
    function wantedProcessing() {
        jsonReader('wanted.json');
        for (var i = 0; i < enemyBots.length; i++) {
            if (typeof botsData[enemyBots[i].name] != 'undefined') { // If they are found in JSON file.
                if (typeof botsData[enemyBots[i].name][0] != 'undefined') {
                enemyBots[i].wanted = botsData[enemyBots[i].name][0];
                console.log(enemyBots[i].name, botsData[enemyBots[i].name][0]);
                }
            }
            else { // If they are not found in JSON file.
                // Set start wanted level in here.
                enemyBots[i].wanted = 0;
            }
            if (enemyBots[i].pos == myBase.pos) { // If they are on my base, increase wanted (stealing me honeys).
                enemyBots[i].wanted += 10;
            }
            if (bot.stepArray(game.myBot.pos, enemyBots[i].pos).length <= 3) { // If they are near me, increase wanted (possible chasing).
                enemyBots[i].wanted += 3;
            }
        }
    } // Processes enemy wanted levels to find most wanted.
    function defconProcessing() {
        for (var i = 0; i < enemyBots.length; i++) {
            if (bot.findDistance(enemyBots[i].pos, game.bases[game.myBot.id].pos) <= 5) {
                enemyBots[i].wanted += 6;
                defcon = 1;
            }
        }
    } // Processes conditions to set defcon level.
    function targetProcessing() {
        mostWanted = enemyBots[0];
        for (var i = 0; i < enemyBots.length; i++) {
            if (enemyBots[i].wanted > mostWanted.wanted) {
                mostWanted = enemyBots[i];
            }
        } // Find most wanted.
        console.log('Searching for targets...');
        if (mostWanted.wanted >= 1000) {
            target = mostWanted;
            console.log('Target acquired.');
            console.log('Determining method of engagement.');
            if (game.bases[target.id].pollen > 500 && (bot.findDistance(game.myBot.pos, game.bases[target.id].pos) * 2) + 5 > turnsLeft && turnsebase < 4) {
                console.log('Targeting base.');
                fittestBase = game.bases[target.id];
                fittestBase.fitness = game.bases[target.id].pollen / (bot.stepArray(game.myBot.pos, game.bases[target.id].pos) * 2) * 10;
                mostWanted.wanted -= 50;
            }
        }
        else {
            console.log('No targets found.');
        }
    } // Processes wanted to target and determine attack.
    
    var turnsLeft = game.totalTurns - game.turn;
    turnsLeft /= 4;
    
    
    flowerProcessing();
    enemyBotProcessing();
    enemyBaseProcessing();
    wantedProcessing();
    defconProcessing();
    targetProcessing();
    
    /* ~~ This code decides what to do ~~ */
    var task = 'flower'; // Default of getting flower.
    
    if (game.myBot.pollen >= 300 || turnsLeft - 2 < bot.stepArray(game.myBot.pos, myBase.pos).length) { // If bot has 500 or more pollen, or there is barely enough time to get back, then return to base.
        task = 'base';
    }
    else if (defcon == 1) {
        task = 'base';
    }
    else if (game.myBot.pollen >= 150 && bot.stepArray(game.myBot.pos, myBase.pos).length <= 3) {
        task = 'base';
    }
    else if (fittestBase.fitness >= flowerProcessing()) {
        task = 'ebase';
    }
    else if (fittestEnemy.fitness > (flowerProcessing()*2)) {
        task = 'chase';
    }

    /* ~~This code decides how to do it ~~ */
    if (task == 'none') {
        console.log('Task none.');
        myDir = dirs[Math.floor(Math.random() * 4)]; // Moves in random direction if no task.
    }
    else if (task == 'flower') {
        console.log('Task flower.');
        myDir = bot.nextStep(game.myBot.pos,game.flowers[ival].pos); // Pathfinds to the fittest flower.
    }
    else if (task == 'base') {
        console.log('Task base.');
        myDir = bot.nextStep(game.myBot.pos,myBase.pos); // Pathfind to my base.
    }
    else if (task == 'chase') {
        console.log('Task chase.');
        myDir = bot.nextStep(game.myBot.pos,fittestEnemy.pos);
    }
    else if (task == 'ebase') {
        console.log('Task ebase.');
        myDir = bot.nextStep(game.myBot.pos,fittestBase.pos);
    }
    
    var botData = {}; // Store future JSON data in here as object.
    
    botData = jsonReader('wanted.json');
    
    for (var i = 0; i < enemyBots.length; i++) {
        console.log(enemyBots[i].name, enemyBots[i].wanted);
        botData[enemyBots[i].name] = [];
        botData[enemyBots[i].name][0] = enemyBots[i].wanted;
    } // Prepare botData for writing to JSON file.
    
    const jsonString = JSON.stringify(botData); // Parse into JSON.
    
    fs.writeFileSync('wanted.json', jsonString); // Write to JSON file.

    return myDir;
};
bot();