//import{ Lotto_Game, Setup_Game, Init_UP } from "./Universal_Play.js";

//-App module
var LottoGrottoApp = angular.module('LottoGrottoApp', []);

//-Controller
LottoGrottoApp.controller('LottoGrottoController',
($scope, $log, $interval) =>
{
    $s = $scope; // shorthand
    $l = $log.log; // shorthand
    $i = $interval;

    //-General setup
    Setup_App();

    //-Dimensional Lotto Setup
    $s.MDL_GameType   = new MDL_GameType();
    $s.MDL_TotalGames = 14;
    $s.MDL_GamePrice  = 0;
    $s.MDL_Games      = [];
    //
    $s.MDL_Universes  = 2;
    $s.MDL_Playing    = 'No';
    $s.MDL_Stats      = [];


    /*----------------------------------------------------------------/
     * Watchers *
     *---------------------------------------------------------------*/
    $scope.$watch('MDL_TotalGames', (newValue, oldValue) => {

        if( newValue==oldValue ) return;
        let value = parseInt(newValue); if( isNaN(value) ) value = 0;
        if( value > 250 ) $scope.MDL_TotalGames = 250;
        //
        $s.MDL_GamePrice = $s.MDL_GameType.GetTicketPrice( value );
    });


    /*----------------------------------------------------------------/
     * FUNCTIONS *
     *---------------------------------------------------------------*/

    //--++ DIMENSIONAL LOTTERY ++--//
    //-Update the selected game-type
    $scope.MDL_SetGameType = function (gameType) 
    {
        $s.MDL_GameType.DeselectAll();
        $s.MDL_GameType.Select(gameType);
        $s.MDL_Games = []; $s.MDL_GamePrice = 0;
    };
    //-Generate rows of random lottery numbers
    $scope.MDL_GenerateNumbers = function ()
    {
        //-Reset
        $scope.MDL_ClearGames()

        //
        let gameType  = $s.MDL_GameType.Selected;
        let noOfGames = $s.MDL_TotalGames;
        //-Set game price (per-week)
        $s.MDL_GamePrice = $s.MDL_GameType.GetTicketPrice( noOfGames );
        //-Add games to your lottery-ticket
        for(let i=0; i<=noOfGames; i++)
            $s.MDL_Games.push( MDL_Setup_Game(gameType) );
    }
    //-Clear/Reset game array
    $scope.MDL_ClearGames = function ()
    {
        $s.MDL_Games = []; $s.MDL_GamePrice = 0;
    }
    //
    //-Setup the MDL as we need some time to ensure angular refreshes!
    $scope.Setup_MDL = function ()
    {
        //-Reset
        $scope.MDL_ClearUniversalLottery();
        $s.MDL_Playing = 'Loading';

        //-Create brief blocking timer for angular refresh
        let Weee = () => { $s.MDL_Play_Universal_Lottery();  }
        let timer = $interval(Weee, 100, 1);
    }
    //
    $scope.MDL_Play_Universal_Lottery = function ()
    {
        //-Game cap before a player will spend more than they'll win
        let gamesByPrice = Math.floor( 1000000 / ($s.MDL_GamePrice * 52) );
            //$l(`Games to be played with $1,000,000::${gamesByPrice}`);

        //-Variables for MDL function
        let Uvars = {
            gameType    : $s.MDL_GameType.Selected,
            years       : 1000,
            ticketPrice : $s.MDL_GamePrice
        };

        //-Process all Universes
        for(let u=0; u<$s.MDL_Universes; u++)
        {
            let Universe_Results = MDL_Process_Universe( Uvars );
            $s.MDL_Stats.push( Universe_Results );
        }

        //-Show
        $s.MDL_Playing='Loaded';
    }
    //-
    $scope.MDL_ClearUniversalLottery = function ()
    {
        $s.MDL_Playing='No'; $s.MDL_Stats = [];
    }

    //-Template URLs
    $scope.homepage_template = 'Homepage-template.html';
    $scope.dimensional_template = 'DimensionalLottery-template.html';


        //***TEST***/
        $s.MDL_GenerateNumbers();
        //$s.MDL_Play_Universal_Lottery();

});


/**
 * Prime setup function for the App.
 * Run all setup functions within this function.
 */
function Setup_App ()
{
    //-Enable tooltips via. Popper.js
    $(() => {  $('[data-toggle="tooltip"]').tooltip()  });

}

/**
 * The Game-Type object and congruent methods
 */
class MDL_GameType {
    constructor() {
        this.Class_Selected = 'gameType-ball gameType-ball-selected';
        this.Class_Deselected = 'gameType-ball';
        //
        this.Gold_Lotto = {
            Name: 'Gold Lotto',
            Acronym: 'GL',
            Class: this.Class_Selected,
            GamePrice: 0.65
        };
        this.Powerball = {
            Name: 'Powerball',
            Acronym: 'PB',
            Class: this.Class_Deselected,
            GamePrice: 1.20
        };
        this.Oz_Lotto = {
            Name: 'Oz Lotto',
            Acronym: 'OZ',
            Class: this.Class_Deselected,
            GamePrice: 1.30
        };
        this.Selected = this.Gold_Lotto.Acronym;
        //
        this.GetTicketPrice = (games) => {
            if( this.Selected=="GL") return this.Gold_Lotto.GamePrice * games;
            if( this.Selected=="PB") return this.Powerball.GamePrice * games;
            if( this.Selected=="OZ") return this.Oz_Lotto.GamePrice * games;
        }
        this.DeselectAll = () => {
            this.Gold_Lotto.Class = this.Class_Deselected;
            this.Powerball.Class = this.Class_Deselected;
            this.Oz_Lotto.Class = this.Class_Deselected;
        };
        this.Select = (game) => {
            if (game == "GL")
                this.Gold_Lotto.Class = this.Class_Selected;
            if (game == "PB")
                this.Powerball.Class = this.Class_Selected;
            if (game == "OZ")
                this.Oz_Lotto.Class = this.Class_Selected;
            this.Selected = game;
        };
    }
}

//#region MULTI-DIMENSIONAL LOTTO GAMES ----------------------------------/////

/**
 * Generic constructor for a lotto-game
 * @param {array} main Main Numbers
 * @param {array} supps Supplementary no.s / Powerball / etc.
 */
class Lotto_Game {
    constructor(main, supps) 
    {
        this.Main_Numbers = main;
        this.Supp_Numbers = supps;
        //
        this.Won = false;
        this.Division_1_Wins = 0;
    }
};

/**
 * Setup a single lotto game (run within a loop to create games!)
 * @param {string} [gameType] Specify the Game-Type as an acronym e.g. GL | PB | OZ
 * @returns {Lotto_Game} Returns a Lotto_Game object
 */
function MDL_Setup_Game (gameType)
{
    let VARS = {
        number_range  : 45,
        total_numbers : 8,
        main_numbers  : 6,
        numbers       : [],
        main          : [],
        supp          : []
    };

    if( gameType=="GL" ) {}
    if( gameType=="PB" ) {
        VARS.number_range = 35;
        VARS.main_numbers = 7; 
    }
    if( gameType=="OZ" ) {
        VARS.total_numbers = 9;
        VARS.main_numbers = 7; 
    }

    //-Create array of ballz
    for(let i=1; i<(VARS.number_range+1);i++) { VARS.numbers.push(i); }

    //-Get and assign numbers to ballz arrayz
    for(let i=0; i<VARS.total_numbers; i++)
    {
        let index = Math.floor( Math.random() * VARS.numbers.length );
        let no = VARS.numbers[index];
        VARS.numbers.splice(index,1);
        //
        if( i < VARS.main_numbers ) VARS.main.push(no);
        else VARS.supp.push(no);

        //-Override powerball!
        if( gameType=="PB" ) VARS.supp = [ Math.floor( Math.random() * 21 ) ];
    }

    //-Sort
    VARS.main.sort((a,b) => {return a-b});
    VARS.supp.sort((a,b) => {return a-b});

    //-Return the final game
    return new Lotto_Game(VARS.main, VARS.supp);
};

/**
 * Cross-reference the current week's game with the player's numbers
 * @param {object} [games] The user's current lotto-games
 * @param {object} [game]  The universe week's winning lotto game
 * @param {string} [gameType]  GameType as abbreviation e.g. PB
 * @returns {int} Return the index of the winning game. If no game wins, return -1
 */
function MDL_GameMatch (games, game, gameType)
{
    let winning_index = -1;
    let game_string = game.Main_Numbers.toString(); // this week's winning numbers

    //-Check Div-1 numbers by converting the arrays to strings
    // and comparing...EASY!
    games.forEach( (element, i) => {
        if( game_string==element.Main_Numbers.toString() )
        {
            if( gameType!="PB" ) winning_index = i;
            if( gameType=="PB" && game.Supp_Numbers[0]==element.Supp_Numbers[0] ) winning_index = i;
        }
            

        //if( game_string!=element.Main_Numbers.toString() )console.log('No win!');
        //console.log( i + ' - ' + element.Main_Numbers.toString() + ' - '  + game_string );
    });

    //***--++ Refactor for Division 2-6 winnings, supplementarys etc... ***//

    return winning_index;
}

/**
 * Run a lotto game in a parallel-universe for a set no. of years
 * or until Division 1 is won.
 * @param {Object} Uvars Universe variables | gameType : years
 * @returns {Object} Returns the Universe object with all stats
 */
function MDL_Process_Universe (Uvars)
{
    //-Object to return
    let Universe = {};

    //-Statistics to capture
    let game; let match;
    let won = false;
    let week = 0; let year = 0;
    
    //-Play!
    for(let i=0; i<(Uvars.years*52); i++)
    {
        //-Increment time 
        week++; if( week==52 ) { year++; week=0; }

        //-Create game and cross-reference against player's numbers
        game  = MDL_Setup_Game( Uvars.gameType );
        match = MDL_GameMatch( $s.MDL_Games, game, Uvars.gameType );

        //-We Won!!!
        if( match != -1 ) { won = true; break; }
    }

    //-Set globals
    Universe.Won   = won;
    Universe.Years = year;
    Universe.Weeks = week;
    Universe.StatsActive = false;
    Universe.Spent = ((year*52) + week) * Uvars.ticketPrice;
    Universe.Dividend = 0;

    //-Create winning object
    if( Universe.Won ) {
        Universe.WinningNumbers = game.Main_Numbers.toString().replace(/,/g,'-');
        if( Uvars.gameType=="PB" ) Universe.WinningNumbers += `(${game.Supp_Numbers.toString()})`;
        Universe.GameIndex = match;
        Universe.Dividend = 1000000;
        Universe.Msg = `WINNER after - ${year} years & ${week} weeks.`;
    }
    //-Create losing object
    if( !Universe.Won ) {
        Universe.Msg = `No win after - ${year} years & ${week} weeks.`;
    }

    return Universe;
}


//#endregion

//#region TESTING -----------------------------------------------------/////
function Get_Resource ()
{
    let url = './testData.json';
    fetch(url, {mode:'no-cors'}).then( response =>
        {
            console.log(`Fetch response status::${response.status}`);
            //
            response.text().then( data =>{
                console.log(`Fetch Data::${data}`);
                console.dir(data);
            });
            
        });
}

//#endregion
