const puppeteer = require('puppeteer');

/**
 * Func to randomize the waiting time
 */
function randomIntFromInterval(min,max) // min and max included
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

var scrape = async () => {

    var browser = await puppeteer.launch({headless: false});
    var page = await browser.newPage();

    // ALL EMAIL DOMAINS TO TRY
    var emailDomains = require('./emaildomains.js');

/* ////////////// 1. CHANGE THE SITE \\\\\\\\\\\\\\ */
    await page.goto('https://www.google.com/search?biw=1440&bih=766&ei=-A82XcS0DYeWlwS46qzoAQ&q=site%3Adoctolib.fr+%2B+"%40live.fr"&oq=site%3Adoctolib.fr+%2B+"%40live.fr"&gs_l=psy-ab.3...5429.5489..5579...0.0..0.68.132.2......0....1..gws-wiz.u1Mkf-bKGMA&ved=0ahUKEwjEkLXposnjAhUHy4UKHTg1Cx0Q4dUDCAo&uact=5');

    var timeWaitFor = randomIntFromInterval(500, 1500);
    await page.waitFor(timeWaitFor);

    // Get the next page
    var nextPage = await page.evaluate(() => {
        let followingPage = document.querySelector('#pnnext'); //Select next page URL
        if(followingPage != null){
            followingPage = followingPage.href;
        }
        return followingPage
    });

    var data = [];

    while (nextPage){
        var result = await page.evaluate(data => {

            /** GET DATA IN JSON FORMAT */
            let elements = document.querySelectorAll('.rc'); // Select all Results

            for (var element of elements){ // Loop through each proudct

                let title = element.children[0].innerText; // Select the title
                let site = element.children[0].children[0].href // Select URL (full path)
                let description = element.children[1].innerText; // Select the description

                let email = description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi); // Select only email in description

                data.push({site, title, email}); // Push in the false data array
                
            }
            
            /**  GET NEXT PAGE */
            let followingPage = document.querySelector('#pnnext'); //Select next page URL

            if(followingPage != null){
                followingPage = followingPage.href;
                data.push({followingPage}); // push the next page in the false data array
            }
            
            return data; // Return our data array
        }, data);

        data = result; // Push the result to the True Data Array
        
        //Get the next page URL (Always at the end of the array)
        if (typeof result[result.length-1]['followingPage'] == "string"){
            nextPage = result[result.length-1]['followingPage'];

            await page.goto(nextPage);
            var timeWaitFor = randomIntFromInterval(500, 1500);
            await page.waitFor(timeWaitFor);
        } else {
            break; // If there isn't nextPage, stop the loop
        }
    }

    var result = await page.evaluate(data => {

        /** GET DATA IN JSON FORMAT */
        let elements = document.querySelectorAll('.rc'); // Select all Results

        for (var element of elements){ // Loop through each proudct

            let title = element.children[0].innerText; // Select the title
            let site = element.children[0].children[0].href // Select URL (full path)
            let description = element.children[1].innerText; // Select the description

            let email = description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi); // Select only email in description

            data.push({site, title, email}); // Push in the false data array
            
        }
        
        return data; // Return our data array
    }, data);

    data = result; // Push the result to the True Data Array

    browser.close();

    return data;
};

scrape().then((value) => {

    //CREATE JSON FILE
    var dictstring = JSON.stringify(value);
    var fs = require('fs');

/* ////////////// 2. CHANGE THE NAME OF THE JSON \\\\\\\\\\\\\\ */
    fs.writeFile("doctolib-icloud-com.json", dictstring, (err) => {
        // check if there is error
        if (err) throw err;
    });

    console.log(value); // Show the True data table <3
});