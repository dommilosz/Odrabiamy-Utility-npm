const puppeter = require('puppeteer')
puppeeteer = null;
var fs = require('fs');
login_data = null;
page = null;
page = null;
browser = null;

///////////////////////////////////////////////////////////////////////////////////////////////////////
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function login(email, password)
{
    let cookies = []
    let error = false
    try{browser = await puppeter.launch({args: ['--no-sandbox']})}
    catch{
        try{
        browser = await puppeter.launch({ executablePath: 'chromium-browser' })}catch{
            puppeeteer = require('puppeteer-core');
            browser = await puppeeteer.launch({
                'args': [
                    '--disable-web-security',
                    '--allow-http-screen-capture',
                    '--allow-running-insecure-content',
                    '--disable-features=site-per-process',
                    '--no-sandbox'
                ],
                headless: true,
                executablePath: '/usr/bin/chromium-browser',
            });
        }
    }
    
    page = await browser.newPage();
    await page.goto('https://odrabiamy.pl/?signIn=true&type=Login')
    await page.type("#frontend-root > div > div:nth-child(1) > div > div > div > div.account-form > div > div > form > label.ValidatedField.ValidatedField--text > input", email)
    await page.type("#frontend-root > div > div:nth-child(1) > div > div > div > div.account-form > div > div > form > label.ValidatedField.ValidatedField--password > input", password)
    d1= await page.evaluate(()=>{
        return document.getElementsByClassName("form-control")[0].value
    })
    d2 = await page.evaluate(()=>{
        return document.getElementsByClassName("form-control")[1].value
    })
    d6 = await page.evaluate(()=>{
        return document.getElementsByClassName("btn-login")[0].click();
    })
    await page.click(".btn-login");
    await page.waitForSelector(".username");
    try{await page.click('#frontend-root > div > div.rodo-modal-blur > div > div > div.rodo-form > div > div.buttons.rodo-box-item > button')}catch{}

    await page.waitFor(500)
    d5= await page.evaluate(()=>{
        return document.getElementsByClassName("form-control")[0].value
    })
    d7 = await page.evaluate(()=>{
        return document.getElementsByClassName("username")[0].innerHTML
    })
    error = await page.evaluate(() => {
        let element = document.querySelector("#frontend-root > div > div:nth-child(1) > div > div > div > div.account-form > div > div > form > p")
        if(element != undefined)
            return true
        else
            return false
    })
    cookies = await page.cookies()
    login_data = {"Cookies": cookies, "Error": error};
    console.log("Logged In!");
    return {"Cookies": cookies, "Error": error}
}

function equalizeString(input)
{
    let normalized_string = input
    normalized_string = normalized_string.toLowerCase()
    normalized_string = normalized_string.replace('ą', 'a')
    normalized_string = normalized_string.replace('ć', 'c')
    normalized_string = normalized_string.replace('ę', 'e')
    normalized_string = normalized_string.replace('ł', 'l')
    normalized_string = normalized_string.replace('ń', 'n')
    normalized_string = normalized_string.replace('ó', 'o')
    normalized_string = normalized_string.replace('ś', 's')
    normalized_string = normalized_string.replace('ź', 'z')
    normalized_string = normalized_string.replace('ż', 'z')
    return normalized_string
}

async function FilterBooks(books, opts)
{
    var filtered_books = []
    for(var i = 0; i<books.length; i++)
    {
        var book_passed = true
        let book = books[i]

        if(opts.Title)
        {
            if(equalizeString(book.Title) != equalizeString(opts.Title))
                book_passed = false
        }

        if(opts.Href)
        {
            if(equalizeString(book.Href) != equalizeString(opts.Href))
                book_passed = false
        }

        if(opts.Kind)
        {
            if(equalizeString(book.Kind) != equalizeString(opts.Kind))
                book_passed = false
        }

        if(opts.Publisher)
        {
            if(equalizeString(book.Publisher) != equalizeString(opts.Publisher))
                book_passed = false
        }

        if(opts.Released)
        {
            if(equalizeString(book.Released) != equalizeString(opts.Released))
                book_passed = false
        }

        if(opts.Subject)
        {
            if(equalizeString(book.Subject) != equalizeString(opts.Subject))
                book_passed = false
        }

        if(book_passed)
            filtered_books.push(book)
    }
    return filtered_books
}

async function GetFilepathFromCode(file_code)
{
    let str = `odrabiamy-pl/odrabiamy-exercise-cache-${file_code}.jpeg`
    return str
}

async function destroyCache(file_code)
{
    let fs = require('fs')
    let filepath = await GetFilepathFromCode(file_code)
    fs.unlink(filepath, (err) => {
        if(err) return {"Error": err}
        else return {"Success": 0}
    })
}

async function odrabiamySanitizeString(input)
{
    var numeric = "1234567890"
    var char_pagele = []
    for(var i = 0; i<input.length; i++)
    {
        if(numeric.includes(input[i]))
            char_pagele.push(input[i])
    }
    var sanitized_string = char_pagele.join('')
    return sanitized_string
}
async function odrabiamyGetPageExercises(href)
{

    await page.goto(href)
    await page.waitFor(500)
    try{await page.click('#frontend-root > div > div.rodo-modal-blur > div > div > div.rodo-form > div > div.buttons.rodo-box-item > button')}catch{}
    

        let exercises = await page.evaluate(() => {
            let container = document.getElementsByClassName('exercise-header-row')
            let buttons = container[0].querySelectorAll("a")
            let data = []
            for(var index = 0; index < buttons.length; index++)
            {
                data.push({"Exercise": buttons[index].innerText, "Href": buttons[index].getAttribute('href')})
            }
            return data
        })
        return exercises;
}
async function odrabiamyGetPages(href)
{


    await page.goto(href)
    await page.waitFor(500)
       try{await page.click('#frontend-root > div > div.rodo-modal-blur > div > div > div.rodo-form > div > div.buttons.rodo-box-item > button')}catch{}
    await page.click('#frontend-root > div > div > div.content-wrapper > div > div.wide-wrapper.exercises > div.container > div.container-content > div.wide-wrapper.book-panel > div > div > div > div.page-nav > div.Select.Select--single.has-value')
    var options = await page.evaluate(() => {
        
        let container = document.getElementById('react-select-4--list')
        let data = []
        for(var index = 0; index < container.children.length; index++)
        {
            let page_number = container.children[index].innerText
            let page_id = container.children[index].id
            data.push({"Number": page_number, "PageId": page_id})
        }
        return data
    })
    
    return options;
}
async function odrabiamyGetSubjects(class_id)
{

    classname = "";
    if(class_id==6){
        classname = "I-liceum";
    }
    if(class_id==7){
        classname = "II-liceum";
    }
    if(class_id==8){
        classname = "III-liceum";
    }
    if(class_id==9){
        classname = "I-technikum";
    }
    if(class_id==10){
        classname = "II-technikum";
    }
    if(class_id==11){
        classname = "III-technikum";
    }
    if(class_id==12){
        classname = "IV-technikum";
    }
    if(class_id<=5){
        classname = (parseInt( class_id)+3)+"-szkoly-podstawowej";
    }

    await page.goto("https://odrabiamy.pl/"+classname)
    await page.waitFor(500)
    try{await page.click('#frontend-root > div > div.rodo-modal-blur > div > div > div.rodo-form > div > div.buttons.rodo-box-item > button')}catch{}
    
    var options2 = await page.evaluate(() => {
        let container = document.getElementsByClassName("subjects-tabs")[0]
        let data = []
        for(var index = 0; index < container.children.length; index++)
        {
            let page_number = container.children[index].innerText
            let page_id = container.children[index].href
            data.push({"Subject": page_number, "value": page_id})
        }
        return data
    })
    
    return options2;
}
async function odrabiamyGetExercise(href) 
{


    await page.goto(href);
    await page.waitFor(500);
        
        try{await page.click('#frontend-root > div > div.rodo-modal-blur > div > div > div.rodo-form > div > div.buttons.rodo-box-item > button')}catch{}
        await page.waitForSelector(".username");
        await page.waitFor(() => !document.querySelector(".freePart"));
        await page.waitFor(500);

    
    const rect = await page.evaluate(() => {
        let elements = document.getElementsByClassName('exercise-solution')
        let element = null
        if(elements.length > 0)
            element = elements[0]
        else
            return null
        const {x, y, width, height} = element.getBoundingClientRect();
        return {left: x, top: y, width, height, id: element.id};
    });

    if(rect)
    {
        image = await page.screenshot({
            clip: {
                x: rect.left - 0,
                y: rect.top - 0,
                width: rect.width + 0 * 2,
                height: rect.height + 0 * 2
            }
        });
        
        
        return Buffer.from(image).toString('base64');
    }
    
            
        

}
async function odrabiamyGetBooks(subject) {

    await page.goto(subject)
    await page.waitFor(500)
    try{await page.click('#frontend-root > div > div.rodo-modal-blur > div > div > div.rodo-form > div > div.buttons.rodo-box-item > button')}catch{}
    await page.click('#frontend-root > div > div > div.content-wrapper > div > div.Books > div.books-header > div.books-options > div.Select.search-field.grades.Select--single.has-value')


    let result = await page.evaluate(() => {
        let data = []
        let elements = document.querySelectorAll('.book')
        for(var element of elements)
        {
            let title = element.querySelector('h2').innerText
            let link = element.href
            let kind = element.querySelector('.book-cover-kind').innerText
            ////////////////////////////////////////////////////////////////////////////////////////
            let _author = element.querySelector('.book-cover-publisher').innerText.split(':')
            let _release_date = element.querySelector('.book-cover-released').innerText.split(':')
            let _subject = element.querySelector('.book-cover-subject').innerText.split(':')
            ////////////////////////////////////////////////////////////////////////////////////////
            let author = _author[1]
            let release_date = _release_date[1]
            let subject = _subject[1]
            data.push({"Title": title, "Href": link, "Kind": kind, "Publisher": author, "Released": release_date, "Subject": subject})
        }
        return data
    })
    //await page.waitFor(30000)
    return result
}
///////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports.GetBooks = odrabiamyGetBooks
module.exports.GetSubjects = odrabiamyGetSubjects
module.exports.SanitizeString = odrabiamySanitizeString
module.exports.GetExercise = odrabiamyGetExercise
module.exports.GetFilepathFromCode = GetFilepathFromCode
module.exports.destroyCache = destroyCache
module.exports.FilterBooks = FilterBooks
module.exports.equalizeString = equalizeString
module.exports.GetOptions = odrabiamyGetPages
module.exports.GetExercises = odrabiamyGetPageExercises
module.exports.login = login