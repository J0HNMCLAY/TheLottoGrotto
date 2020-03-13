//import{ Lotto_Game, Setup_Game, Init_UP } from "./Universal_Play.js";

//-App module
var LottoGrottoApp = angular.module('LottoGrottoApp', []);


// LottoGrottoApp.provider('BallValue', function() {
    
//     //var noObj = {};
//     let no = Math.floor(Math.random()*45);
//     return {
//         $get : () => { return Math.floor(Math.random()*45);; }
//     }
//     //randomObj.Generate = () => { return no; }
// });

//-Controller
LottoGrottoApp.controller('LottoGrottoController',
($scope, $log, $interval) =>
{
    $s = $scope; // shorthand
    $l = $log.log; // shorthand
    $i = $interval;

    //-General setup
    Setup_App();
    Set_Start_Page('RESULTS');

    //-Dimensional Lotto Setup
    $s.MDL_GameType   = new MDL_GameType();
    $s.MDL_TotalGames = 14;
    $s.MDL_GamePrice  = 0;
    $s.MDL_Games      = [];
    //
    $s.MDL_Universes  = 2;
    $s.MDL_UniYears   = 1000;
    $s.MDL_Playing    = 'No';
    $s.MDL_Stats      = [];
    $s.Session_Stats  = Setup_Session();
    //
    $s.Input_Focus = {
        Active    : false,
        BallType  : '',
        Value     : 0,
        element   : '',
        gameIndex : 0,
        ballIndex : 0
    };
    //-Random numbers for the homepage!
    $s.Lucky_Numbers = Setup_Lucky_Numbers();

    /*----------------------------------------------------------------/
     * Watchers & Listeners *
     *---------------------------------------------------------------*/
    $scope.$watch('MDL_TotalGames', (newValue, oldValue) => {

        if( newValue==oldValue ) return;
        let value = parseInt(newValue); if( isNaN(value) ) value = 0;
        if( value > 250 ) $scope.MDL_TotalGames = 250;
        //
        $s.MDL_GamePrice = $s.MDL_GameType.GetTicketPrice( value );
    });

    //-Capture any click to disable Lotto-Ball input focus
    document.addEventListener('mousedown', (event) => {
        if( event.button==0 || event.button==2 ) { 
        if( $s.Input_Focus.Active ) {
            $scope.Save_Ball();
        }}
    }, false);
    //-Capture keypresses to disable Lotto-Ball input focus
    document.onkeydown = (event) =>
    {
        let key = event.code;
        if( key=='Enter' || key=='NumpadEnter') {
        if( $s.Input_Focus.Active ) {
            $scope.Save_Ball();
        }}
    }

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

        if( noOfGames==0 ) return;

        //-Set game price (per-week)
        $s.MDL_GamePrice = $s.MDL_GameType.GetTicketPrice( noOfGames );
        //-Add games to your lottery-ticket
        for(let i=0; i<noOfGames; i++)
            $s.MDL_Games.push( MDL_Setup_Game(gameType) );

            console.log("Numbers GENERATED");
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
    //-Run the Multi-Dimensional Lottery
    $scope.MDL_Play_Universal_Lottery = function ()
    {
        //-No. of games to play before the player will spend more than they can win
        let gamesByPrice = Math.floor( 1000000 / ($s.MDL_GamePrice * 52) );
            //$l(`Games to be played with $1,000,000::${gamesByPrice}`);

        console.time('MDL');

        //-Variables for MDL function
        let Uvars = {
            gameType    : $s.MDL_GameType.Selected,
            years       : $s.MDL_UniYears,
            ticketPrice : $s.MDL_GamePrice
        };

        console.log(`UNI Years::${$s.MDL_UniYears}`);

        //-Process all Universes
        for(let u=0; u<$s.MDL_Universes; u++)
        {
            let Universe_Results = MDL_Process_Universe( Uvars );
            $s.MDL_Stats.push( Universe_Results );

            //-Update individual game wins on object
            if( Universe_Results.Won ) {
                $s.MDL_Games[ Universe_Results.GameIndex ].Won=true;
                $s.MDL_Games[ Universe_Results.GameIndex ].Division_1_Wins++;
            }
        }

        //-Show list of MDL Results
        $s.MDL_Playing='Loaded';

        console.timeEnd('MDL');

        $s.Update_SessionData();
    }
    //-Clear the Multi-Dimensional lottery results
    $scope.MDL_ClearUniversalLottery = function ()
    {
        $s.MDL_Playing='No'; $s.MDL_Stats = [];
    }
    //---------------------------------------------------------------------/////
    //-Acknowledge session-update 
    $scope.Acknowledge_SessionUpdate = function ()
    {
        $s.Session_Stats.Updated=false;
    }
    //-
    $scope.Update_SessionData = function ()
    {
        //-Alert 
        $s.Session_Stats.Updated=true;

        // compute stats
        for(let i=0; i<$s.MDL_Stats.length; i++)
        {
            $s.Session_Stats.Games += $s.MDL_Stats[i].WeeksRaw;
            $s.Session_Stats.Years += $s.MDL_Stats[i].Years;
            $s.Session_Stats.Spent += $s.MDL_Stats[i].Spent;
            $s.Session_Stats.Dividends += $s.MDL_Stats[i].Dividend;
            $s.Session_Stats.Universes ++;

            //-Winning stats
            if( $s.MDL_Stats[i].Won )
            {
                // build stats object
                let WinStats = {
                    WinNo      : $s.Session_Stats.Winners.length+1,
                    Dividend   : $s.MDL_Stats[i].Dividend,
                    GameSpend  : $s.MDL_Stats[i].Spent,
                    YearsPlayed: $s.MDL_Stats[i].Years,
                    WeeksPlayed: $s.MDL_Stats[i].Weeks,
                    TotalSpent : $s.Session_Stats.Spent,
                    YearsPassed: $s.Session_Stats.Years,
                    WeeksPassed: $s.Session_Stats.Games,
                    WinningNo  : $s.MDL_Stats[i].WinningNumbers,
                    NumbersFull: $s.MDL_Stats[i].WinningArray,
                    GameType   : $s.MDL_Stats[i].GameType

                }
                $s.Session_Stats.Won ++;
                $s.Session_Stats.Winners.push( WinStats );
            }

        }

        //console.log(`Winners::${ $s.Session_Stats.Winners.length}` );

    }
    //-Erase all session data
    $scope.Erase_SessionData = function ()
    {
        $s.Session_Stats = Setup_Session();
    }
    //-------------------------------------------------------------------------------------/////
    //-Edit the value of an individual lotto ball
    $scope.Edit_Ball = function (gameIndex, ballIndex, ballType)
    {
        //-Element ID for selection
        let inputElementID = '';

        //-Set object to selected to switch HTML to input
        if( ballType=='main' ) {
            $s.MDL_Games[gameIndex].Main_Selected[ballIndex] = true;
            $s.Input_Focus.Value = $s.MDL_Games[gameIndex].Main_Numbers[ballIndex];
            inputElementID = `MainBall_${gameIndex}_${ballIndex}`;
        }
        if( ballType=='supp' ) {
            $s.MDL_Games[gameIndex].Supp_Selected[ballIndex] = true;
            $s.Input_Focus.Value = $s.MDL_Games[gameIndex].Supp_Numbers[ballIndex];
            inputElementID = `SuppBall_${gameIndex}_${ballIndex}`;
        }
        
        //-Save input_focus variables
        $s.Input_Focus.BallType  = ballType;
        $s.Input_Focus.gameIndex = gameIndex;
        $s.Input_Focus.ballIndex = ballIndex;

        //-Run an interval that attempts to focus on the input
        // while angular reveals the input
        let Ball_Focus = () => 
        {       
            let element = document.getElementById( inputElementID );
            if( element!=null ) {
                element.value='';
                element.focus();
                $s.Input_Focus.element = element;
                $s.Input_Focus.Active  = true;
                $interval.cancel(timer);
            }
        }
        let timer = $interval(Ball_Focus, 50);
    }
    //-Called if a ball is selected & after the user clicks elsewhere
    $scope.Save_Ball = function () 
    {
        //console.table($s.Input_Focus);

        //-Shorthand
        let gameAlert = '';
        let ballType  = $s.Input_Focus.BallType;
        let gameIndex = $s.Input_Focus.gameIndex;
        let ballIndex = $s.Input_Focus.ballIndex;

        //-Synthesize ball value
        let ballValue = parseInt( $s.Input_Focus.element.value );
        // If Ball-Value is Nan or nothing...
        if( isNaN(ballValue) || ballValue<=0 ) 
        {
            ballValue = $s.Input_Focus.Value;
        }
        // If Ball is outside the game-range
        if( ballType=='main' && ballValue!='!' )
        {
            if( !$s.MDL_GameType.IsInMainRange( ballValue ) )
                gameAlert += "-Ball value outside of game range!";
        }
        if( ballType=='supp' && ballValue!='!' )
        {
            if( !$s.MDL_GameType.IsInSuppRange( ballValue ) )
                gameAlert += "-Ball value outside of game range!";
        }
        
        //$s.Input_Focus.Value; //<--Saved value

        //-Switch selected ball off
        $s.Input_Focus.Active = false;
        if( ballType=='main' ) {
            $s.MDL_Games[gameIndex].Main_Selected[ballIndex] = false;
            $s.MDL_Games[gameIndex].Main_Numbers[ballIndex]  = ballValue;
            $s.MDL_Games[gameIndex].Main_Altered = true;
        }
        if( ballType=='supp' ) {
            $s.MDL_Games[gameIndex].Supp_Selected[ballIndex] = false;
            $s.MDL_Games[gameIndex].Supp_Numbers[ballIndex]  = ballValue;
        }

        // Post check for duplicates (after numbers have been updated)...
        let isDupe = $s.MDL_Games[gameIndex].CheckForDupes();
        if (isDupe) {
            gameAlert += "\n-Duplicate balls detected!";
        }

        //***ERROR IN DUPE CHECKING...as it will NOT reset the dupe alert message
        //*** in the other ball_Type

        //-Apply Alert message
        if( ballType=='main' ) $s.MDL_Games[gameIndex].Main_Alert = gameAlert;
        if( ballType=='supp' ) $s.MDL_Games[gameIndex].Supp_Alert = gameAlert;

        $scope.$apply();
    }

     
    //-------------------------------------------------------------------------------------/////
    //--++ MY LOTTERY RESULTS ++--//
    $s.LottoResults = {};

    $scope.Get_MyResults = function ()
    {
        //-Get my lotto numbers!
        Get_My_Numbers().then( (myNumbers) => {

            Get_Historical_Lotto_Results( myNumbers ).then( (results) => 
            {
                $s.LottoResults = results;
                console.log("GOT MY RESULTS!!!!-->>>>>>>>>>>!");
                $scope.$apply();
            })
        });
    }

    
    //-Template URLs
    $scope.homepage_template = './templates/Homepage-template.html';
    $scope.dimensional_template = './templates/DimensionalLottery-template.html';
    $scope.statistics_template = './templates/Statistics-template.html';
    $scope.myResults_template  = './templates/MyResults-template.html';


        //***TEST***//
        //console.log( Deep_Comparison() );


        $s.MDL_TotalGames = 50;
        $s.MDL_Universes  = 10;
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
    //-Enable popovers
    $(() => {  $('[data-toggle="popover"]').popover()  });

}

/**
 * Setup and return overall Session Data
 */
function Setup_Session ()
{
    //-Get raw date
    let Raw_DateTime = new Date();
    //-Search for date & time string before 'GMT' 
    let pattern = /^(.*) GMT/gm;
    let DateTime_Now = pattern.exec(Raw_DateTime);

    //-Session Data setup
    let Session = {
        Updated : false,
        Start : DateTime_Now[1],
        Games : 0, Years : 0,
        Won   : 0, Spent : 0,
        Dividends : 0,
        Universes : 0,
        Winners : []
    }
    return Session;
}

/**
 * Setup 'lucky numbers' for the homepage
 * *These are just numbers generated at random when the site is loaded!
 */
function Setup_Lucky_Numbers ()
{
    let lucky_numbers = {
        "Gold Lotto"   : MDL_Setup_Game('GL'),
        "Powerball"    : MDL_Setup_Game('PB'),
        "Oz Lotto"     : MDL_Setup_Game('OZ'),
        "Set for Life" : MDL_Setup_Game('S4L')
    };
    return lucky_numbers;
}

/**
 * Set the Homepage at index.html
 * @param {string} page Shorthand ID of the page: HOME : MDL : STATS : RESULTS
 */
function Set_Start_Page (page) 
{
    //-Set start-page for testing!
    let pageID = '';
    if( page=='HOME') pageID = 'home'; 
    if( page=='MDL' ) pageID = 'profile';
    if( page=='STATS') pageID = 'messages';
    if( page=='RESULTS') pageID = 'settings';

    //-Set
    navBar = $(`a[href*="#v-pills-${pageID}"]`).addClass('active');
    page   = $(`#v-pills-${pageID}`).addClass('show active');
}

/**
 * Pull my saved lotto numbers (lucky numbers lol)
 */
function Get_My_Numbers ()
{
    return new Promise((resolve,reject) => {

        let baseDir = 'http://localhost:8080/Results_Archive/';
        let MyNumbersFile = baseDir + 'My_Numbers.json';

        fetch(MyNumbersFile).then( response => 
            {
                //-Process response
                response.text().then( body => {
                    //-Resolve and send obj data back
                    resolve( JSON.parse(body) );
                    return;
                });
            });
    });
}

/**
 * Pulls the saved lotto-results from the server...
 * @param {Object} [myNumbers] Object containing my lotto numbers
 */
function Get_Historical_Lotto_Results (myNumbers)
{
    return new Promise( (resolve, reject) => 
    {

        let Results = [];

        let baseDir = 'http://localhost:8080/Results_Archive/';
        let Saturday_Lotto  = 'SatLotto_Results.json';
        let Monday_Lotto    = 'MonLotto_Results.json';
        let Wednesday_Lotto = 'WedLotto_Results.json';
        let Oz_Lotto     = 'OzLotto_Results.json';
        let Powerball    = 'Powerball_Results.json';
        let Set_For_Life = 'SetForLife_Results.json';

        let fileArray = [ Saturday_Lotto, Monday_Lotto, Wednesday_Lotto, Oz_Lotto, Powerball, Set_For_Life ];
        let gameArray = [ 'Saturday_Lotto', 'Monday_Lotto', 'Wednesday_Lotto', 'Oz_Lotto', 'Powerball', 'Set_For_Life' ];

        let checkState = 'Ready';
        let fileLoop = -1;

        // THE LOOP
        var checkLoop = setInterval( () => {

            
            if( checkState=='Ready' )
            {
                fileLoop++;
                //-Check if we've reached the end of the file-array
                if( fileLoop==fileArray.length ) { 
                    clearInterval( checkLoop ); 
                    resolve( Results );
                    return; 
                }

                //-Setup vars
                checkState='Checking';
                let url  = baseDir + fileArray[fileLoop];
                let game = gameArray[fileLoop];

                //Get Data...
                fetch( url ).then( response => 
                {
                    //-Process response
                    response.text().then( body => 
                        {
                            let lottoResults = JSON.parse( body );

                            Cross_Reference_Lotto_Results( myNumbers, lottoResults, game ).then( (gameResult) => 
                            {
                                Results.push( gameResult );
                                checkState = 'Ready';
                            });
                        });
                });
            }
        }, 500);

    });
}

/**
 * Cross-reference historical lotto results with our numbers!
 */
function Cross_Reference_Lotto_Results (myNumbers, lottoNumbers, game)
{
    return new Promise( (resolve,reject) => {

        let resultsObject = {
            'name' : game,
            'Divisions' : 0,
            'Division 1 Wins' : 0,
            'Division 2 Wins' : 0,
            'Division 3 Wins' : 0,
            'Division 4 Wins' : 0,
            'Division 5 Wins' : 0,
            'Division 6 Wins' : 0,
            'Division 7 Wins' : 0,
            'Division 8 Wins' : 0,
            'Division 9 Wins' : 0
        };

        //-Turn my numbers into a string array for comparison
        let my_numbers = [];
        let wins_main = [];
        let wins_supp = [];

        let winning_numbers = [];

        //-Setup key to pull my Numbers
        let gameKey = '';
        if( game=='Saturday_Lotto' || game=='Monday_Lotto' || game=='Wednesday_Lotto' ) 
        {
            gameKey = 'GoldLotto';

        }
        if( game=='Oz_Lotto' ) { gameKey = 'OzLotto';  }
        if( game=='Powerball') { gameKey = 'Powerball';  }
        if( game=='Set_For_Life' ) { gameKey = 'SetForLife'; }


        //-Derive lotto results
        for(let i=0; i<lottoNumbers.length; i++)
        {
            wins_main = lottoNumbers[i].Numbers['Winning'];
            wins_supp = lottoNumbers[i].Numbers['Supps'];

            //-Turn my numbers into a string-array
            for( let key in myNumbers[gameKey] )
            {
                my_numbers = myNumbers[gameKey][key];

                let dc_Result = Deep_Comparison( my_numbers, wins_main, wins_supp );
                let divisionWin = Check_Win_Division( game, dc_Result );
                if( divisionWin != -1) 
                {
                    resultsObject['Division '+divisionWin+' Wins'] ++;
                }
            }
        }

        //-Push to cool object
        let gameParsed = game.replace(/\_/g, " ");
        resultsObject.name = gameParsed;

        //-Resolve and return wins!
        resolve( resultsObject );

    });
}

/**
 * Perform a deep comparison on lotto-games & winning numbers
 */
function Deep_Comparison (playedNumbers, mainNumbers, suppNumbers)
{
    // let playedNumbers = [2, 9, 15, 24, 31, 42];
    // let mainNumbers   = [3, 9, 10, 24, 30, 42];
    // let suppNumbers   = [2, 35];

    let wins_main = mainNumbers.filter( (item) => { return playedNumbers.includes(item); });
    let wins_supp = suppNumbers.filter( (item) => { return playedNumbers.includes(item); });

    let result = {
        wins_main : wins_main,
        wins_supp : wins_supp
    };

    //console.log(`Wins: Main::${result.wins_main.length} | Supp::${result.wins_supp.length}`);

    return result;
}

/**
 * Cross reference winning numbers against each defined lottery division and return the division win
 * ...or -1 for no win!
 * @param {string} [game] The particular lotto game
 * @param {Object} [winningNumbers] Object containing 2 winning number arrays: Main & Supps
 * @returns {number} The division of the win ( -1 for no win )
 */
function Check_Win_Division ( game, winningNumbers )
{
    let Division = -1;

    // Gold Lotto
    if( game=='Saturday_Lotto' || game=='Monday_Lotto' || game=='Wednesday_Lotto' ) 
    {
        if( winningNumbers.wins_main.length==6 ) { Division = 1; }
        else if( winningNumbers.wins_main.length==5 && winningNumbers.wins_supp.length==1 ) { Division = 2; }
        else if( winningNumbers.wins_main.length==5 ) { Division = 3; }
        else if( winningNumbers.wins_main.length==4 ) { Division = 4; }
        else if( winningNumbers.wins_main.length==3 && winningNumbers.wins_supp.length==1 ) { Division = 5; }
        else if( winningNumbers.wins_main.length==2 && winningNumbers.wins_supp.length==2
             ||  winningNumbers.wins_main.length==1 && winningNumbers.wins_supp.length==2 ) { Division = 6; }
    }
    // Powerball
    if( game=="Powerball" )
    {
        if( winningNumbers.wins_main.length==7 && winningNumbers.wins_supp.length==1 ) { Division = 1; }
        else if( winningNumbers.wins_main.length==7 ) { Division = 2; }
        else if( winningNumbers.wins_main.length==6 && winningNumbers.wins_supp.length==1 ) { Division = 3; }
        else if( winningNumbers.wins_main.length==6 ) { Division = 4; }
        else if( winningNumbers.wins_main.length==5 && winningNumbers.wins_supp.length==1 ) { Division = 5; }
        else if( winningNumbers.wins_main.length==4 && winningNumbers.wins_supp.length==1 ) { Division = 6; }
        else if( winningNumbers.wins_main.length==5 ) { Division = 7; }
        else if( winningNumbers.wins_main.length==3 && winningNumbers.wins_supp.length==1 ) { Division = 8; }
        else if( winningNumbers.wins_main.length==2 && winningNumbers.wins_supp.length==1 ) { Division = 9; }
    }
    // Oz Lotto
    if( game=="Oz_Lotto" )
    {
        if( winningNumbers.wins_main.length==7 ) { Division = 1; }
        else if( winningNumbers.wins_main.length==6 && winningNumbers.wins_supp.length==1 ) { Division = 2; }
        else if( winningNumbers.wins_main.length==6 ) { Division = 3; }
        else if( winningNumbers.wins_main.length==5 && winningNumbers.wins_supp.length==1 ) { Division = 4; }
        else if( winningNumbers.wins_main.length==5 ) { Division = 5; }
        else if( winningNumbers.wins_main.length==4 ) { Division = 6; }
        else if( winningNumbers.wins_main.length==3 && winningNumbers.wins_supp.length==1 ) { Division = 7; }
    }
    // Set for Life
    if( game=="Set_For_Life" )
    {
        if( winningNumbers.wins_main.length==8 ) { Division = 1; }
        else if( winningNumbers.wins_main.length==7 && winningNumbers.wins_supp.length==1 ) { Division = 2; }
        else if( winningNumbers.wins_main.length==7 ) { Division = 3; }
        else if( winningNumbers.wins_main.length==6 && winningNumbers.wins_supp.length==1 ) { Division = 4; }
        else if( winningNumbers.wins_main.length==6 ) { Division = 5; }
        else if( winningNumbers.wins_main.length==5 && winningNumbers.wins_supp.length==1 ) { Division = 6; }
        else if( winningNumbers.wins_main.length==5 ) { Division = 7; }
        else if( winningNumbers.wins_main.length==4 && winningNumbers.wins_supp.length==1 ) { Division = 8; }
    }


    return Division;
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
            Acronym : 'GL',
            MainRange : [1,45],
            SuppRange : [1,45],
            Class: this.Class_Selected,
            GamePrice: 0.65
        };
        this.Powerball = {
            Name: 'Powerball',
            Acronym : 'PB',
            MainRange : [1,35],
            SuppRange : [1,20],
            Class: this.Class_Deselected,
            GamePrice: 1.20
        };
        this.Oz_Lotto = {
            Name: 'Oz Lotto',
            Acronym : 'OZ',
            MainRange : [1,45],
            SuppRange : [1,45],
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
        this.IsInMainRange = (ballNo) => {
            if( this.Selected=="GL" 
            &&  ballNo >= this.Gold_Lotto.MainRange[0]
            &&  ballNo <= this.Gold_Lotto.MainRange[1] ) { return true; }
            if( this.Selected=="PB" 
            &&  ballNo >= this.Powerball.MainRange[0]
            &&  ballNo <= this.Powerball.MainRange[1] ) { return true; }
            if( this.Selected=="OZ" 
            &&  ballNo >= this.Oz_Lotto.MainRange[0]
            &&  ballNo <= this.Oz_Lotto.MainRange[1] ) { return true; }
            return false;
        }
        this.IsInSuppRange = (ballNo) => {
            if( this.Selected=="GL" 
            &&  ballNo >= this.Gold_Lotto.SuppRange[0]
            &&  ballNo <= this.Gold_Lotto.SuppRange[1] ) { return true; }
            if( this.Selected=="PB" 
            &&  ballNo >= this.Powerball.SuppRange[0]
            &&  ballNo <= this.Powerball.SuppRange[1] ) { return true; }
            if( this.Selected=="OZ" 
            &&  ballNo >= this.Oz_Lotto.SuppRange[0]
            &&  ballNo <= this.Oz_Lotto.SuppRange[1] ) { return true; }
            return false;
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
    constructor(main, supps, mainSelected, suppSelected) 
    {
        this.Main_Numbers  = main;
        this.Main_Selected = mainSelected;
        this.Supp_Numbers  = supps;
        this.Supp_Selected = suppSelected;
        //
        this.Main_Altered = false;
        this.Main_Alert = "";
        this.Supp_Alert = "";
        //
        this.Won = false;
        this.Division_1_Wins = 0;
        //
        this.CheckForDupes = (newBall) => {
            let numbers = this.Main_Numbers.concat( this.Supp_Numbers );
            return new Set(numbers).size !== numbers.length;
        } 
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
        main_selected : [],
        supp          : [],
        supp_selected : []
    };

    if( gameType=="GL" ) {}
    if( gameType=="PB" ) {
        VARS.number_range = 35;
        VARS.main_numbers = 7; 
    }
    if( gameType=="OZ"  ) {
        VARS.total_numbers = 9;
        VARS.main_numbers = 7; 
    }
    if( gameType=="S4L" ) {
        VARS.total_numbers = 10;
        VARS.main_numbers = 8;
    }

    //-Create array of ballz
    for(let i=1; i<(VARS.number_range+1);i++) { VARS.numbers.push(i); }

    //-Get and assign numbers to ballz arrayz
    for(let i=0; i<VARS.total_numbers; i++)
    {
        let index = MWC_Random( VARS.numbers.length-1, 0 );
        let no = VARS.numbers[index];
        VARS.numbers.splice(index,1);
        //
        if( i < VARS.main_numbers ) { VARS.main.push(no); VARS.main_selected.push(false); }
        else { VARS.supp.push(no); VARS.supp_selected.push(false); }

        //-Override powerball!
        if( gameType=="PB" ) VARS.supp = [ MWC_Random( 20, 1 ) ];
    }

    //-Sort
    VARS.main.sort((a,b) => {return a-b});
    VARS.supp.sort((a,b) => {return a-b});


    //-Return the final game
    return new Lotto_Game(VARS.main, VARS.supp, VARS.main_selected, VARS.supp_selected );
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

        //-Ensure sort is performed on balls if they've been altered
        let numbersInstance = element.Main_Numbers;
        if( element.Main_Altered )
            numbersInstance.sort((a,b) => {return a-b});

        //-Compare as strings
        if( game_string==numbersInstance.toString() )
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
    Universe.WeeksRaw = (year*52) + week;
    Universe.StatsActive = false;
    Universe.Spent = ((year*52) + week) * Uvars.ticketPrice;
    Universe.Dividend = 0;
    //-Build the full gameType string
    if( Uvars.gameType=='GL' ) Universe.GameType='Gold Lotto';
    if( Uvars.gameType=='PB' ) Universe.GameType='Powerful';
    if( Uvars.gameType=='OZ' ) Universe.GameType='Oz Lotto';

    //-Create winning object
    if( Universe.Won ) {
        Universe.WinningNumbers = game.Main_Numbers.toString().replace(/,/g,'-');
        if( Uvars.gameType=="PB" ) Universe.WinningNumbers += `(${game.Supp_Numbers.toString()})`;
        Universe.WinningArray   = game.Main_Numbers.concat(game.Supp_Numbers);
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

/**
 * Define and return dividends
 */
function MDL_Dividends (gameType) 
{

}


//#endregion

//#region  Random-No generators -----------------------------------------------------/////

/**
 * The random number generator here, uses Marsaglia's MWC (multiply with carry) algorithm.
 * @param {int/float} [_max] Maximum end of the range
 * @param {int/float} [_min] *Optional - Minimal end of the range
 * @returns {int} Returns and integer between _max & _min (1)
 */
function MWC_Random (_max, _min)
{
    let max = _max + 1;
    let min = _min || 0;

    //Masaglia's default values (save...)
    let m_w = 521288629;
    let m_z = 362436069;

    //-Create date-time that's converted to FileTime
    //let dt = new Date().getTime() * 1e4 + 116444736e9;
    //-Drive the seed value with a random value * currentTime
    let seed = Math.floor(Math.random() * new Date().getTime());

    //-Seeded values
    m_w = (new Uint32Array([seed >> 16]))[0];
    m_z = (new Uint32Array([seed % 4294967296]))[0];

    //-Generate...
    m_z = 36969 * (m_z & 65535) + (m_z >> 16);
    m_w = 18000 * (m_w & 65535) + (m_w >> 16);
    //let number = (m_z << 16) + m_w;
    let number = (new Uint32Array([(m_z << 16) + m_w]))[0]

    // Uniform RNG
    // The result is strictly between 0 and 1.
    number = Math.floor(((number + 1.0) * 2.328306435454494e-10) * max);
    if (number < min) number = min;

    return number;
}

/**
 * The multiply-with-carry method is a variant of the add-with-carry 
 * generator introduced by Marsaglia and Zaman (1991).
 * @param {int/float} [_max] Maximum end of the range
 * @param {int/float} [_min] *Optional - Minimal end of the range
 * @returns {int} Returns and integer between _max & _min (1)
 */
function MWC_Rand (_max, _min)
{
    let min = _min || 1;
    let max = _max;
    let m = Math.floor(Math.random() * (max+1));
    let c = Math.floor(Math.random() * m);
    let x = Math.floor(Math.random() * max);
  
    x = (m * x + c) % max;
    //c = (m * x + c) / max;

    return x;
}

/**
 * JavaScript's inbuilt pseudo-random number generator
 * @param {int/float} [_max] Maximum end of the range
 * @param {int/float} [_min] *Optional - Minimal end of the range
 * @returns {int} Returns and integer between _max & _min (1)
 */
function JS_Rand (_max, _min)
{
    return Math.floor(Math.random() * (_max+1));
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
