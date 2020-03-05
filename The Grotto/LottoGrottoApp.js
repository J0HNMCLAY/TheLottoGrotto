//import{ Lotto_Game, Setup_Game, Init_UP } from "./Universal_Play.js";

//-App module
var LottoGrottoApp = angular.module('LottoGrottoApp', []);

//-Controller
LottoGrottoApp.controller('LottoGrottoController',
($scope, $log) =>
{
    $s = $scope; // shorthand
    $l = $log.log; // shorthand
    $s.initMsg = Init();
    //Init_UP();

    //-General setup
    Setup_App();

    //-Dimensional Lotto Setup
    $s.MDL_GameType   = new MDL_GameType();
    $s.MDL_TotalGames = 14;
    $s.MDL_Games      = [];
    //
    $s.MDL_Universes  = 42;
    $s.MDL_Playing    = false;
    $s.MDL_Stats      = [];


    //TESTING//
    $s.notSoRandomNumbers = NotSo_Random_Numbers();
    $log.log($scope.notSoRandomNumbers);

    /****************************************************************
     * FUNCTIONS *
     ****************************************************************/

    //--++ DIMENSIONAL LOTTERY ++--//
    //-Update the selected game-type
    $scope.MDL_SetGameType = function (gameType) 
    {
        $s.MDL_GameType.DeselectAll();
        $s.MDL_GameType.Select(gameType);
        $s.MDL_Games = [];
    };
    //-Generate rows of random lottery numbers
    $scope.MDL_GenerateNumbers = function ()
    {
        let gameType  = $s.MDL_GameType.Selected;
        let noOfGames = $s.MDL_TotalGames;
        //
        for(let i=0; i<=noOfGames; i++)
            $s.MDL_Games.push( MDL_Setup_Game(gameType) );
    }
    //-Clear/Reset game array
    $scope.MDL_ClearGames = function ()
    {
        $s.MDL_Games = [];
    }

    //-Template URLs
    $scope.homepage_template = 'Homepage-template.html';
    $scope.dimensional_template = 'DimensionalLottery-template.html';

});


/**
 * Prime setup function for the App.
 * Run all setup functions within this function.
 */
function Setup_App ()
{
    //-Enable tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

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
            Class: this.Class_Selected
        };
        this.Powerball = {
            Name: 'Powerball',
            Acronym: 'PB',
            Class: this.Class_Deselected
        };
        this.Oz_Lotto = {
            Name: 'Oz Lotto',
            Acronym: 'OZ',
            Class: this.Class_Deselected
        };
        this.Selected = this.Gold_Lotto.Acronym;
        //
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



//#endregion

//#region TESTING -----------------------------------------------------/////
function NotSo_Random_Numbers ()
{
    let numbers = [
        {primary: [5,12,20,33,38,45], bonus:[15,30] }
    ];
    return numbers;
}

function Init ()
{
    let message = 'Sup Japzzz!';
    return message;
}

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
