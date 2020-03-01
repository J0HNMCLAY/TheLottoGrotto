// REQUIRE
const fetch = require("node-fetch").default;
const cheerio = require('cheerio').default;

//---INIT---//
Init_Message();

var DEF = Lottery_Definition();


console.log(`DEF::${DEF}`);

//---SATURDAY GOLD LOTTO RESULTS---//



function Lottery_Definition ()
{
    const wiktionary_url = 'https://en.wiktionary.org/wiki/lottery';
    //var definition = '';

    fetch(wiktionary_url).then( response =>
        {
            console.log("Fetch status:: " + response.status);
            //-Parse the body text
            response.text().then( body => 
                {
                    const $ = cheerio.load(body);
                    $('ol').each( (i, element) => 
                    {
                        console.log(element);
                    });


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


function Init_Message ()
{
    var Raw_DateTime = new Date();
    
    //-Search for date & time string before 'GMT' 
    const pattern = /^(.*) GMT/gm;
    const DateTime_Now = pattern.exec(Raw_DateTime);
     
    //-Print to the console as an init message
    console.log(`Sup Japz! Page loaded:: ${DateTime_Now[1]}`);
}