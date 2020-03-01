// REQUIRE
const fetch = require("node-fetch").default;
const cheerio = require("cheerio");

//---INIT---//
Init_Message();

//Lottery_Definition();




//---SATURDAY GOLD LOTTO RESULTS---//
GoldLotto_Results_Saturday();



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

function GoldLotto_Results_Saturday ()
{
    let results_url = 'https://www.ozlotteries.com/saturday-lotto/results';

    fetch(results_url).then( response =>
        {
            console.log("Fetch status:: " + response.status + " | URL:: " + results_url);
            //-Parse the body text
            response.text().then( body => 
                {
                    //***CHEERIO***//
                    console.log("BANG!");
                    //console.log(body);
                    const $ = cheerio.load(body);
                    $('[data-id=drawNumber_number]').each((i, element) => 
                    {

                        console.log($(element).text());
                        
                    });

                });
        });

}

function Init_Message ()
{
    var Raw_DateTime = new Date();
    
    //-Search for date & time string before 'GMT' 
    const pattern = /^(.*) GMT/gm;
    const DateTime_Now = pattern.exec(Raw_DateTime);
     
    //-Print to the console as an init message
    console.log(`Sup Japz! Page loaded:: ${DateTime_Now[1]}`);
}