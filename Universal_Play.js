

console.log("hello");

//let no_1 = new Six_Pick();

Setup_Game()


//--6-Pick Constructor
function Setup_Game ()
{
    let numbers = [];
    for(let i=1; i<46;i++) { numbers.push(i); }

    let main = [];
    let supp = [];

    //-Get numbers
    for(var i=0; i<8; i++)
    {
        let index = Math.floor( Math.random() * numbers.length - 1 );
        let no = numbers[index];
        numbers.splice(index,1);
        //
        if( i<6 ) main.push(no);
        else supp.push(no);
    }

    console.log(`Main::${main} | Supp::${supp}`);

}
function Six_Pick (no1,no2,no3,no4,no5,no6,s1,s2)
{
    this.Main_Numbers = [no1,no2,no3,no4,no5,no6]; 
    this.Supp_Numbers = [s1,s2];
}

