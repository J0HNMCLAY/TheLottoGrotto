// REQUIRE
const fetch = require("node-fetch").default;
const cheerio = require("cheerio");
const fs = require('fs');

//---INIT---//
Init_Message();
//Lottery_Definition();

//-Game type enumerator
const GAME_TYPE = {
    Saturday_Lotto  : 'Saturday Lotto',
    Monday_Lotto    : 'Monday Lotto',
    Wednesday_Lotto : 'Wednesday Lotto',
    Powerball       : 'Powerball',
    Oz_Lotto        : 'Oz Lotto',
    Set_For_Life    : 'Set For Life'
};

//-State Machine
var STATE = new State_Machine();

//-Game-Vars for weekly checking
const GAME = {
    Global : 
    {
        THIS_YEAR : new Date().getFullYear(),
        FILE_DIRECTORY : './Results_Archive/'
    },
    SaturdayLotto : 
    {
        BASE_URL   : 'https://australia.national-lottery.com/saturday-lotto/results-archive-',
        YEAR_RANGE : [1986, 2020],
        GAME_TYPE  : GAME_TYPE.Saturday_Lotto,
        FILE       : 'SatLotto_Results.json'
    },
    MondayLotto : 
    {
        BASE_URL   : 'https://australia.national-lottery.com/monday-lotto/results-archive-',
        YEAR_RANGE : [2006, 2020],
        GAME_TYPE  : GAME_TYPE.Monday_Lotto,
        FILE       : 'MonLotto_Results.json'
    },
    WednesdayLotto : 
    {
        BASE_URL   : 'https://australia.national-lottery.com/wednesday-lotto/results-archive-',
        YEAR_RANGE : [2006, 2020],
        GAME_TYPE  : GAME_TYPE.Wednesday_Lotto,
        FILE       : 'WedLotto_Results.json'
    },
    Powerball : 
    {
        BASE_URL   : 'https://australia.national-lottery.com/powerball/results-archive-',
        YEAR_RANGE : [1996, 2020], //1996
        GAME_TYPE  : GAME_TYPE.Powerball,
        FILE       : 'Powerball_Results.json'
    },
    OzLotto : 
    {
        BASE_URL   : 'https://australia.national-lottery.com/oz-lotto/results-archive-',
        YEAR_RANGE : [1994, 2020], //1994
        GAME_TYPE  : GAME_TYPE.Oz_Lotto,
        FILE       : 'OzLotto_Results.json'
    },
    SetForLife : 
    {
        BASE_URL   : 'https://australia.national-lottery.com/set-for-life/results-archive-',
        YEAR_RANGE : [2015, 2020], //2015
        GAME_TYPE  : GAME_TYPE.Set_For_Life,
        FILE       : 'SetForLife_Results.json'
    }
}

//-Array of results
var All_Results = [];
var Scrape_Results = [];

// !! Global Override !!
const EXECUTE = true; 

// ENTRY POINT
STATE.Set('SETUP');

// MAIN LOOP
var mainLoop = setInterval( () =>{

    //-Global overrride
    if( !EXECUTE ) { clearInterval(mainLoop); return; }



    if( STATE.Is("SETUP") )
    {
        STATE.Game_Loop++;
        STATE.Set("PREPARING");
        Get_Lotto_Results_Setup().then( (nextState) => { STATE.Set(nextState); });
    }
    if( STATE.Is("READ_FILE") )
    {
        STATE.Set("READING_FILE");
        Read_File().then( () => { STATE.Set("SCRAPE_RESULTS"); });
    }
    if( STATE.Is("SCRAPE_RESULTS") )
    {
        STATE.Fetch_Loop++;
        STATE.Set("SCRAPING");
        Get_Lotto_Results().then( (nextState) => { STATE.Set(nextState); });
    }
    if( STATE.Is("CROSS_REFERENCE") )
    {
        STATE.Set("CROSS_CHECKING");
        Cross_Reference_Results().then( () => { STATE.Set("WRITE_FILE");  });
    }
    if( STATE.Is("WRITE_FILE") )
    {
        STATE.Set("WRITING");
        Write_Results_File().then( () => { STATE.Set("SETUP"); });
    }
    //--FINISH----------->>>>>>>
    if( STATE.Is("END") )
    {
        clearInterval(mainLoop);
    }


    // INTERVAL TICK
    console.log(`Interval: State::${STATE.state} | Game-Loop::${STATE.Game_Loop}`);
    //MainLoop_Loop++;
    //if( MainLoop_Loop>=5 ) clearInterval(mainLoop);
}, 500);

/**
 * Setup phase :: 1
 */
function Get_Lotto_Results_Setup() {
    return new Promise((resolve, reject) => 
    {
        //-Check if we're FINISHED scraping
        if( Object.keys(GAME).length==STATE.Game_Loop )
        {
            console.log("Scrape-Finished ---------------++++++++++++++++++++++++++++>>>>>>>>>>>>>>");
            resolve("END");
            return;
        }

        //-Reset arrays before processing
        All_Results = [];
        Scrape_Results = [];

        //-Shorthand for objects
        let keys = Object.keys(GAME);
        let object = keys[STATE.Game_Loop]; //<-- drive via. an incrementing STATE loop

        //-Exit/Do-Not Process on these objects +++
        if (object == "Global") {
            //-(Repeat this state & Function)
            resolve("SETUP");
            return;
        }

        //-Create file path for this game
        STATE.File_Path = GAME['Global'].FILE_DIRECTORY + GAME[object].FILE;
        //-Create URL_Range to pull results
        STATE.URL = [];
        let start = GAME[object].YEAR_RANGE[0];
        let end = GAME[object].YEAR_RANGE[1];
        for (let i = start; i <= end; i++) {
            STATE.URL.push(GAME[object].BASE_URL + i);
        }
        //-Assign gameType
        STATE.Game_Type = GAME[object].GAME_TYPE;

        //-Set next state
        resolve("READ_FILE");
    });
}

/**
 * Read File phase :: 2
 * Reads the results file...however will create a new blank file if
 * the .json file doesn't exist (using the {flag:'w+'} object)
 */
function Read_File ()
{
    var readType = 'Open_Attempt';

    return new Promise( (resolve, reject) => 
    {

        let fileOptions = {flag:'r'}; // 'r' = read file
        //-Check if file exists
        if( !fs.existsSync(STATE.File_Path) ) 
        {
            fileOptions = {flag:'w+'}; // 'w+' write & read & will create new file!
        }
        

        fs.readFile(STATE.File_Path, fileOptions, (err, data) => {
            //-Error checking...typically if the file doesn't exist!
            if ( err) { console.log(`ERROR READING FILE::${err}`); }
            //-Assign/collect existing results
            if (!err) { 

                if( data=='' ) console.log('New file created or no data in file');
                if( data!='' ) All_Results = JSON.parse(data);

                resolve();
                return;
                // DEBUG
                //console.log(`File::${typeof(data)}`);
                //clearInterval(mainLoop);
                //console.log(`Results file read. Length::${All_Results.length}`);
            }
        });
    });
}

/**
 * Web-scraping phase :: 3
 * Scrape for this year's (or historical) lottery results
 * @param {Enum} gameType The lotto gameType as referenced by the global enum.
 * @param {string} results_url The URL to scrape for results
 * @param {Array} existing_results Existing results to combine...
 */
function Get_Lotto_Results ( gameType )
{
    return new Promise( (resolve, reject) => 
    {

    //-Check for end of URL List
    // then Resolve
    if( STATE.Fetch_Loop == STATE.URL.length )
    {
        STATE.Fetch_Loop = -1;
        resolve("CROSS_REFERENCE");
        return;
    }

    //-This URL
    let URL = STATE.URL[ STATE.Fetch_Loop ];
    
    fetch(URL).then( response =>
        {
            console.log("Fetch status:: " + response.status + " | URL:: " + URL);
            //-Parse the body text
            response.text().then( body => 
                {
                    const $ = cheerio.load(body);
                    $('tbody tr').each((i, element) => 
                    {
                        //-Cheerio the child element
                        let childElement = cheerio.load(element);

                        //-Get the date
                        let _date = childElement('a').first().text().split(' ');
                        let date = {
                            dayFull : _date[0],
                            day     : _date[1],
                            month   : _date[2],
                            year    : _date[3]
                        };
                        //-Get a formatted date
                        let dateObj = Get_Formatted_Date(date);

                        //-Get the jackpot
                        let jackpot = childElement('[data-title=Jackpot]').first().text();
                        // parse the jackpot
                        jackpot = jackpot.replace('AU','').replace('*','').replace('R','').trim();
                        //jackpot = jackpot.replace(/\$\d*,\d*,\d*|\$\d*,\d*/g).trim();

                        //-Get the winning numbers
                        // GOLD LOTTO!-------------------------------------------------------------!
                        if( STATE.Game_Type==GAME_TYPE.Saturday_Lotto || STATE.Game_Type==GAME_TYPE.Monday_Lotto
                        ||  STATE.Game_Type==GAME_TYPE.Wednesday_Lotto )
                        {
                            let numbers = { winning : [], supps : [] }
                            // Pull winning numbers
                            childElement('span').each( (i, element) =>
                            {
                                let ballClass = $(element).hasClass('lotto-ball');
                                let suppClass = $(element).hasClass('lotto-supplementary');
                                let number    = $(element).text();
                                //
                                if( ballClass ) numbers.winning.push( number );
                                if( suppClass ) numbers.supps.push( number );
                            });
                            //-Create result object
                            var result = new Lotto_Result(date, dateObj, numbers, jackpot);
                            Scrape_Results.push( result );
                        }
                        // // POWERBALL!--------------------------------------------------------------!
                        if( STATE.Game_Type==GAME_TYPE.Powerball )
                            {
                                let numbers = { winning : [], supps : [] }
                                // Pull winning numbers
                                childElement('span').each( (i, element) =>
                                {
                                    let ballClass = $(element).hasClass('powerball-ball');
                                    let powerballClass = $(element).hasClass('powerball-powerball');
                                    let number    = $(element).text();
                                    //
                                    if( ballClass ) numbers.winning.push( number );
                                    if( powerballClass ) numbers.supps.push( number );
                                });
                                //-Create result object
                                var result = new Lotto_Result(date, dateObj, numbers, jackpot);
                                Scrape_Results.push( result );
                            }
                        // // OZ-LOTTO & SET-FOR-LIFE!-------------------------------------------------!
                        if( STATE.Game_Type==GAME_TYPE.Oz_Lotto || STATE.Game_Type==GAME_TYPE.Set_For_Life )
                        {
                            let numbers = { winning : [], supps : [] }
                            // Pull winning numbers
                            childElement('span').each( (i, element) =>
                            {
                                let ballClass = $(element).hasClass('oz-lotto-ball') || $(element).hasClass('set-for-life-ball');
                                let suppClass = $(element).hasClass('oz-lotto-supplementary') || $(element).hasClass('set-for-life-bonus-ball')
                                let number    = $(element).text();
                                //
                                if( ballClass ) numbers.winning.push( number );
                                if( suppClass ) numbers.supps.push( number );
                            });
                            //-Create result object
                            var result = new Lotto_Result(date, dateObj, numbers, jackpot);
                            Scrape_Results.push( result );
                        }
                    


                    });
                    //-Return results we've scraped into global Array
                    // 'Scrape_Results' <-- Array
                    console.log(`Scrape::${Scrape_Results.length}`);
                    resolve("SCRAPE_RESULTS");

                });

        });

    });

}

/**
 * Cross-check phase :: 4
 */
function Cross_Reference_Results ()
{
    return new Promise( (resolve, reject) => {

        let uniqueResults = [];

        //-Iterate and grab unique results
        for(let i=0; i<Scrape_Results.length; i++)
        {
            let exists = false;
            let date = Scrape_Results[i].Date_String;

            for(let r=0; r<All_Results.length; r++) {
                // parse the 'formatted-date' to JS-Date Object
                // (the JSON parsing must disrupt the date's original formatting)
                let prDateObj = new Date(All_Results[r].Date_String);
                let pr_date = prDateObj.toString();
                //
                if( pr_date==date ) exists=true;
            }

            //-Push this scraped result
            if(!exists) uniqueResults.push( Scrape_Results[i] );
        }

        //-Combine our new results with existing results
        if( All_Results.length!=0 ) { All_Results = All_Results.concat( uniqueResults ); }
        if( All_Results.length==0 ) { All_Results = uniqueResults; }

        //-Sort by Date
        All_Results.sort( Sort_byDate );

        //-Set INDEX on results list
        for(let i=0; i<All_Results.length; i++ ) {
            All_Results[i].Index = i;
        }

        //-Stringify for file-writing
        STATE.Results_JSON = JSON.stringify(All_Results);

            // DEBUG
            console.log(`Unique Results::${uniqueResults.length}` );
            console.log( All_Results );
            //console.log( All_Results[All_Results.length-4].Date_Formatted.toString());

        resolve();
        return;
    });
}

/**
 * Write phase :: 5
 * Write our scraped lotto results to our .json file
 * @param {Object} Results_JSON Stringified version of our scraped results
 */
function Write_Results_File ()
{
    return new Promise( (resolve, reject) =>{ 

        // STATE.Results_JSON //<-- Results in stringified JSON

    //-Write our JSON file---------------------------->>>>
        fs.writeFile(STATE.File_Path, STATE.Results_JSON, (err) => {
            if (err) console.log(`ERROR WRITING FILE::${err}`);
            else {
                // DEBUG
                console.log(`File written successfully::${STATE.File_Path}`);

                //-Resolve
                resolve();

                // FINISH UP if the last loop
                //clearInterval(mainLoop);
            }
        });
    //------------------------------------------------->>>>>
    });
}


/**
 * Create a Gold-Lotto result object 
 * @param {Object} [_date] Custom date object comprised of strings: Day spelt; Day number; Month spelt; Year number
 * @param {Object} [_dateObj] JS Date Object (for array sorting)
 * @param {Object} [_numbers] Object with arrays of winning and supplementary numbers
 * @param {string} [_jackpot] The result's jackpot amount in AUD as a string
 */
function Lotto_Result (_date, _dateObj, _numbers, _jackpot)
{
    this.Index = 0;
    this.Date  = {
        DayFull : _date.dayFull,
        Day     : _date.day,
        Month   : _date.month,
        Year    : _date.year
    };
    this.Date_Formatted = _dateObj;
    this.Date_String = _dateObj.toString();
    this.Numbers = {
        Winning : _numbers.winning,
        Supps   : _numbers.supps
    };
    this.Jackpot = _jackpot;
}

/**
 * State Machine constructor
 */
function State_Machine () 
{
    this.state = '';
    this.Set = (_state) => { this.state = _state; };
    this.Is  = (_state) => { if(_state==this.state) return true; return false; };
    //-Local vars
    this.Game_Loop  = -1;
    this.Fetch_Loop = -1;
    this.File_Path  = '';
    this.Game_Type  = '';
    this.URL = '';
    this.Results_JSON = '';
    
}

/**
 * Create a JS-Date Object from the scraped date info.
 * Use this to sort the resulting data.
 * @param {Object} [_date] Date object extracted from data
 */
function Get_Formatted_Date (_date)
{
    let Months = ["January","February","March","April","May","June","July",
    "August","September","October","November","December"];

    // _date = Date string
    let date = new Date();
    date.setMonth( Months.indexOf(_date.month) );
    date.setFullYear( parseInt(_date.year) );
    date.setDate( parseInt(_date.day) );
    date.setHours(19);
    date.setMinutes(30);
    date.setSeconds(0);
    //
    return date;
}

/**
 * Array.sort function that compares and sorts by an object's date value
 * @param {Lotto_Result} a Value - A
 * @param {Lotto_Result} b Value - B
 */
function Sort_byDate (a,b)
{
    let a_Date = new Date( a.Date_Formatted );
    let b_Date = new Date( b.Date_Formatted );
    //
    if( a_Date < b_Date ) return -1;
    if( b_Date > a_Date ) return  1;
    return 0;
}

/**
 * Console message indicating the script has been initialised/loaded
 */
function Init_Message ()
{
    var Raw_DateTime = new Date();
    
    //-Search for date & time string before 'GMT' 
    const pattern = /^(.*) GMT/gm;
    const DateTime_Now = pattern.exec(Raw_DateTime);
     
    //-Print to the console as an init message
    console.log(`Sup Japz! Page loaded:: ${DateTime_Now[1]}`);
}

/**
 * Return a definition for the word 'lottery' from wikitionary!
 * (First attempt at JS scraping haha)
 */
function Lottery_Definition ()
{
    const wiktionary_url = 'https://en.wiktionary.org/wiki/lottery';
    var definition = '';

    fetch(wiktionary_url).then( response =>
        {
            console.log("Fetch status:: " + response.status);
            //-Parse the body text
            response.text().then( body => 
                {
                    //***CHEERIO***//
                    const $ = cheerio.load(body);
                    $('ol li').each( (i, element) => 
                    {
                        //-Get the first list element/definition
                        if( i==0 ) definition = $(element).text();
                    });

                    return definition;


                    //***VANILLA JS ***/
                    //-Parse body for 'Ordered List' tags
                    let regpattern_definitions = /<ol>(.*)<\/ol>/gs;
                    let defintions_HTML = regpattern_definitions.exec( body )[1];
                    //-Get the first list element
                    regpattern_definitions = /<li>(.*)<\/li>/m;
                    let definition = regpattern_definitions.exec( defintions_HTML )[1];
                    //-Replace all the inner HTML tags with blank text
                    definition = definition.replace(/(<([^>]+)>)/gi, '');
                    //
                    return definition;
                });
        });
}
