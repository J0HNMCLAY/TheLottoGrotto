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



//-Array of results
var Previous_Results = [];
var Scrape_Results = [];

//-Loop variables
var MainLoop_Counter = 0;
var MainLoop_Processing = false;

const EXECUTE = false; // !! Global Override !!

// MAIN LOOP
var mainLoop = setInterval((tick) =>{

    if( !EXECUTE ) { clearInterval(mainLoop); return; }

    if (!MainLoop_Processing) 
    {
        MainLoop_Processing = true;
        Get_Lotto_Results_Setup()
        MainLoop_Counter++;
    }

    // INTERVAL TICK
    console.log(`Interval!`);
    //MainLoop_Counter++;
    //if( MainLoop_Counter>=5 ) clearInterval(mainLoop);
}, 500);


function Get_Lotto_Results_Setup ()
{
    //-Reset arrays before processing
    Previous_Results = [];
    Scrape_Results   = [];

    //-Gametype determines the data scraped
    let gameType = GAME_TYPE.Set_For_Life;

    //-Archived years to loop through
    let Year_Max = 2020;
    let Year_Min = 2015;
    
    let YEAR = Year_Max - MainLoop_Counter; // YEAR to append to URL

    let URL_base = 'https://australia.national-lottery.com/set-for-life/results-archive-';
    let URL      = URL_base + YEAR.toString(); // formatted URL

    //-File vars
    var fileDirectory = './Results_Archive/';
    var fileName = 'SetForLife_Results.json';
    var filePath = fileDirectory + fileName;

    //-Determine if this is the last loop...to exit MainLoop
    var finalLoop = (YEAR==Year_Min) ? true : false;

    //-Read existing JSON file
    fs.readFile(filePath, (err, data) => {
        //-Error checking...typically if the file doesn't exist!
        if (err) { }//console.log(`ERROR READING FILE::${err}`); }
        //-Assign/collect existing results
        if (!err) Previous_Results = JSON.parse(data);
            //-Debug
            console.log(`Results file read. Length::${Previous_Results.length}`);
            //console.log(Previous_Results);

        //-GET LOTTO RESULTS
        Get_Lotto_Results( gameType, URL, filePath, finalLoop );
    });
}

function Get_Lotto_Results ( gameType, results_url, filePath, finalLoop )
{
    fetch(results_url).then( response =>
        {
            console.log("Fetch status:: " + response.status + " | URL:: " + results_url);
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
                        let jackpot = 
                            childElement('[data-title=Jackpot]').first().text().replace('AU', '').trim();

                        //-Get the winning numbers
                        // GOLD LOTTO!-------------------------------------------------------------!
                        if( gameType==GAME_TYPE.Saturday_Lotto || gameType==GAME_TYPE.Monday_Lotto
                        ||  gameType==GAME_TYPE.Wednesday_Lotto )
                        {
                            let numbers = { winning : [], supps : [] }
                            // Pull winning numbers
                            childElement('span').each( (i, element) =>
                            {
                                let ballClass = $(element).hasClass('lotto-ball')
                                let number    = $(element).text();
                                //
                                if( ballClass ) numbers.winning.push( number );
                                if(!ballClass ) numbers.supps.push( number );
                            });
                            //-Create result object
                            var result = new GoldLotto_Result(date, dateObj, numbers, jackpot);
                            Scrape_Results.push( result );
                        }
                        // POWERBALL!--------------------------------------------------------------!
                        if( gameType==GAME_TYPE.Powerball )
                            {
                                let numbers = { winning : [], powerball : [] }
                                // Pull winning numbers
                                childElement('span').each( (i, element) =>
                                {
                                    let ballClass = $(element).hasClass('powerball-ball')
                                    let number    = $(element).text();
                                    //
                                    if( ballClass ) numbers.winning.push( number );
                                    if(!ballClass ) numbers.powerball.push( number );
                                });
                                //-Create result object
                                var result = new Powerball_Result(date, dateObj, numbers, jackpot);
                                Scrape_Results.push( result );
                            }
                        // OZ-LOTTO & SET-FOR-LIFE!-------------------------------------------------!
                        if( gameType==GAME_TYPE.Oz_Lotto || gameType==GAME_TYPE.Set_For_Life )
                        {
                            let numbers = { winning : [], supps : [] }
                            // Pull winning numbers
                            childElement('span').each( (i, element) =>
                            {
                                let ballClass = $(element).hasClass('oz-lotto-ball') || $(element).hasClass('set-for-life-ball');
                                let number    = $(element).text();
                                //
                                if( ballClass ) numbers.winning.push( number );
                                if(!ballClass ) numbers.supps.push( number );
                            });
                            //-Create result object
                            var result = new GoldLotto_Result(date, dateObj, numbers, jackpot);
                            Scrape_Results.push( result );
                        }
                    
                    });

                        // DEBUG
                        console.log(`No of Previous-Results :: ${Previous_Results.length}`);
                        console.log(`No of Current -Results :: ${Scrape_Results.length}`);

                    //-Concat with previous results
                    Scrape_Results = Scrape_Results.concat(Previous_Results);

                    //-Turn results into a JSON string
                    let Results_JSON = JSON.stringify(Scrape_Results);

                    //-Write our JSON file ---------------------------->>>>
                    fs.writeFile(filePath, Results_JSON, (err) => {
                        if (err) console.log(`ERROR WRITING FILE::${err}`);
                        else 
                        {
                                // DEBUG
                                console.log("File written successfully!");

                            // Consider this loop processed!
                            MainLoop_Processing = false;

                            // FINISH UP if the last loop
                            if( finalLoop ) clearInterval(mainLoop);
                        }
                    });
                    //------------------------------------------------->>>>>

                });
        });

}

/**
 * Create a Gold-Lotto result object 
 * @param {Object} [_date] Custom date object comprised of strings: Day spelt; Day number; Month spelt; Year number
 * @param {Object} [_dateObj] JS Date Object (for array sorting)
 * @param {Object} [_numbers] Object with arrays of winning and supplementary numbers
 * @param {string} [_jackpot] The result's jackpot amount in AUD as a string
 */
function GoldLotto_Result (_date, _dateObj, _numbers, _jackpot)
{
    this.Index = 0;
    this.Date  = {
        DayFull : _date.dayFull,
        Day     : _date.day,
        Month   : _date.month,
        Year    : _date.year
    };
    this.Date_Formatted = _dateObj;
    this.Numbers = {
        Winning : _numbers.winning,
        Supps   : _numbers.supps
    };
    this.Jackpot = _jackpot;
}

/**
 * Create a Powerball result object 
 * @param {Object} [_date] Custom date object comprised of strings: Day spelt; Day number; Month spelt; Year number
 * @param {Object} [_dateObj] JS Date Object (for array sorting)
 * @param {Object} [_numbers] Object with arrays of winning numbers and the powerball
 * @param {string} [_jackpot] The result's jackpot amount in AUD as a string
 */
function Powerball_Result (_date, _dateObj, _numbers, _jackpot)
{
    this.Index = 0;
    this.Date  = {
        DayFull : _date.dayFull,
        Day     : _date.day,
        Month   : _date.month,
        Year    : _date.year
    };
    this.Date_Formatted = _dateObj;
    this.Numbers = {
        Winning   : _numbers.winning,
        Powerball : _numbers.powerball
    };
    this.Jackpot = _jackpot;
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
