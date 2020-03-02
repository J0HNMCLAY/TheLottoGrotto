// REQUIRE
const fetch = require("node-fetch").default;
const cheerio = require("cheerio");
const fs = require('fs');

//---INIT---//
Init_Message();

//Lottery_Definition();




//-Array of results
var Previous_Results = [];
var Scrape_Results = [];

var MainLoop_Counter = 0;
var MainLoop_Processing = false;

// MAIN LOOP
var mainLoop = setInterval((tick) =>{

    if (!MainLoop_Processing) 
    {
        MainLoop_Processing = true;
        Lotto_Monday_Setup()
        MainLoop_Counter++;
    }

    // INTERVAL TICK
    console.log(`Interval!`);
    //MainLoop_Counter++;
    //if( MainLoop_Counter>=5 ) clearInterval(mainLoop);
}, 500);
//GoldLotto_Results_Saturday_Setup();


function Lotto_Monday_Setup ()
{
    //-Reset arrays before processing
    Previous_Results = [];
    Scrape_Results   = [];

    var Year_Max = 2020;
    var Year_Min = 2006;
    
    let YEAR = Year_Max - MainLoop_Counter; // YEAR to append to URL

    var URL = 'https://australia.national-lottery.com/monday-lotto/results-archive-';
    let mon_URL = URL + YEAR.toString(); // formatted URL

    //-File path
    var filePath = './Results_Archive/MonLotto_Results.json';

    //-Determine if this is the last loop...to exit MainLoop
    var finalLoop = (YEAR==Year_Min) ? true : false;

    //-Read existing JSON file
    fs.readFile(filePath, (err, data) => {
        //-Error checking...typically if the file doesn't exist!
        if (err) { }//console.log(`ERROR READING FILE::${err}`); }
        //-Assign
        if (!err) Previous_Results = JSON.parse(data);
            //-Debug
            console.log(`Results file read. Length::${Previous_Results.length}`);
            //console.log(Previous_Results);

        //-GET MONDAY LOTTO RESULTS
        Lotto_Monday( mon_URL, filePath, finalLoop );
    });
}

function Lotto_Monday ( mon_lotto_url, filePath, finalLoop )
{
    fetch(mon_lotto_url).then( response =>
        {
            console.log("Fetch status:: " + response.status + " | URL:: " + mon_lotto_url);
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
                        let numbers = {
                            winning : [],
                            supps   : []
                        }

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
                    
                    });

                        // DEBUG
                        console.log(`No of Prev-Results :: ${Previous_Results.length}`);
                        console.log(`No of Mon-Results :: ${Scrape_Results.length}`);

                    //-Concat with previous results
                    Scrape_Results = Scrape_Results.concat(Previous_Results);

                    //-Turn results into a JSON string
                    let Results_JSON = JSON.stringify(Scrape_Results);

                    //-Write our JSON file
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


                    // //***VANILLA JS ***/
                    // //-Parse body for 'Ordered List' tags
                    // let regpattern_definitions = /<ol>(.*)<\/ol>/gs;
                    // let defintions_HTML = regpattern_definitions.exec( body )[1];
                    // //-Get the first list element
                    // regpattern_definitions = /<li>(.*)<\/li>/m;
                    // let definition = regpattern_definitions.exec( defintions_HTML )[1];
                    // //-Replace all the inner HTML tags with blank text
                    // definition = definition.replace(/(<([^>]+)>)/gi, '');
                    // //
                    // return definition;
                });
        });
}
