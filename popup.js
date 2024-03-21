/*
    * setup (needs to be inside async funtion to use browser api)
*/

var bookmarksTree //global bookmarks variable
var bookmarksList = []//
var listIndex = undefined //index for currently focused bookmark


async function setup(){
    window.focus()
    const bookmarkTreenodes = await browser.bookmarks.getTree()

    //we are only interested in toolbar bookmarks (may change)
    bookmarksTree = bookmarkTreenodes[0].children[1]

    displayBookmarkTree(bookmarksTree)
    const theme = await browser.theme.getCurrent();
    setThemeColors(theme)
}


// recursively add html elements for the bookmarks
// todo display folders
function displayBookmarkTree(bookmarks){
    console.log(bookmarks)

    bookmarks.children.forEach(bookmark => {
        if(bookmark.type == "folder"){
            displayBookmarkTree(bookmark)
        }
        else{
            //console.log(bookmark)
            if(bookmarks.title != "Bookmarks Toolbar"){
                bookmark.parentName = bookmarks.title
            }
            bookmarksList.push(bookmark)
        }
    });
    displayBookmarkList(bookmarksList)
}

// display bookmarks from list
function displayBookmarkList(bookmarks){
    clearBookmarks()

    bookmarks.forEach(bookmark => {
        addBookmarkElement(bookmark)
    });
}

// adds a bookmark to the bookmarkList element
function addBookmarkElement(bookmark){
    const bookmarkList = document.getElementById("bookmarkList")

    let bookmarkElement = document.createElement("div")
    bookmarkElement.innerHTML = 
        '<a href="' + bookmark.url + '">' + 
        bookmark.parentName + "/" +
        bookmark.title + "</a>" 
        + " <i>(match " + bookmark.match + ")</i>"
    bookmarkElement.classList.add("bookmarkElement")

    bookmarkList.appendChild(bookmarkElement)
}

// empties list of bookmarks in bookmarkList element
function clearBookmarks(){
    const bookmarkList = document.getElementById("bookmarkList")
    bookmarkList.innerHTML = ""
}

setup()

/* 
    * keypress handler
*/

addEventListener("keypress", (event) => {
    //console.log(event)

    //if the search field is focused, the keyevents should be ignored
    let searchField = document.getElementById("bookmarkSearchField")
    if(document.activeElement === searchField){
        console.log("search bar has focus, returning")

        if(event.key == "Enter"){
            //unfocus the search bar
            searchField.blur()
            console.log(listIndex == undefined)

            // if user is at start of list move to the first element
            // if user has moved down the list open the selected bookmark
            if(listIndex == undefined){
                move(false)
            }
            else{
                openselected("Enter")
                window.close()
            }

            move(false)
        }
        //todo: fuzzy find through the bookmarks
        return
    }
    
    if(event.key == "k"){
        move(true)
    }
    else if(event.key == "j"){
        move(false)
    }
    else if(event.key == "Enter"){
        openselected("Enter")
        window.close()
    }
    else if(event.key == "/"){
        focusSearchField()
        listIndex = undefined
    }
});

// keyup for handling arrows
addEventListener("keyup", (event) => {

    console.log(event.key)

    if(event.key == "ArrowUp"){
        move(true)
    }
    else if(event.key == "ArrowDown"){
        move(false)
    }
})

//prevent scrolling with arrow keys
document.onkeydown = function(evt) {
    evt = evt || window.event;
    var keyCode = evt.keyCode;
    if (keyCode >= 37 && keyCode <= 40) {
        return false;
    }
};

/*
 * movement
*/

// up is a boolean which decides if you are movin up or down
function move(up){
    const maxIndex = document.getElementsByClassName("bookmarkElement").length

    if(listIndex == null){
        listIndex = 0
        //console.log("listindex is null")
    }
    else if(up && listIndex != 0){
        //console.log("movin up")
        listIndex -= 1
    }
    else if(!up && listIndex < maxIndex -1){ 
        listIndex += 1
    }
    else{
        //console.log(listIndex, maxIndex)
    }

    if(listIndex <= maxIndex - 1){
        //console.log("list", listIndex)
        //console.log("max", maxIndex)
        focusElement(listIndex, up)
    }
    
}

function focusElement(elementIndex, up){

    let prevItem = up? elementIndex+1 : elementIndex-1

    let bookmarkElements = document.getElementsByClassName("bookmarkElement")

    bookmarkElements.item(elementIndex).classList.add("bookmarkElementFocused")
    bookmarkElements.item(prevItem).classList.remove("bookmarkElementFocused")
}

// opens selected bookmark.
// allowed methods are Enter (new tab) and l (in sidebar)
function openselected(method){
    // NB: may fail if bookmarkelements get more children
    let bookmarkLink  = document.getElementsByClassName("bookmarkElementFocused")[0].children[0]

    //open the url in a new tab
    if(method == "Enter"){
        window.open(bookmarkLink.href)
    }
}

function focusSearchField(){
    let searchField = document.getElementById("bookmarkSearchField")
    searchField.focus()
}

/*
 * searching 
*/

const searchField = document.getElementById("bookmarkSearchField")
searchField.oninput = function(){
    //if the search query is empty, display the original bookmark list
    if(searchField.value == ""){
        displayBookmarkList(bookmarksList)
    }
    else{
        fuzzyFindBookmarks(searchField.value)
    }
}

class Result {
    constructor(score, matches){
        this.score = score
        this.matches = matches
    }
}

function fuzzyFindBookmarks(searchStr){
    //console.log(searchStr)

    bookmarksList.forEach(bookmark => {
        let titleMatch = strmatch(searchStr, bookmark.title)
        bookmark.match = titleMatch
    });

    let bookmarksListCopy = [...bookmarksList]

    //console.log("bookmarks", bookmarksListCopy)
    bookmarksListCopy = bookmarksListCopy.filter(element => {
        return element.match !== 0});

    //console.log("bookmarks filtered", bookmarksListCopy)

    bookmarksListCopy
        .sort((a, b) => {
            return  b.match - a.match
    })

    //console.log(bookmarksList[0].match)
    //console.log(bookmarksList)

    displayBookmarkList(bookmarksListCopy)
}

function matchIsNull(b){
    b.match != 0
}

function strmatch(a, b){
    a = a.split("")
    b = b.split("")

    let len_a = a.length
    let len_b = b.length


    if(len_a == 0 || len_b == 0){
        return Result(0, 0, 0)
    }

    let matches = []
    let startIndex = 0

    // step 1 forwards scan
    for(let i = 0; i < len_a; i++){

        if(a[i] == " "){
            continue
        }

        let len_before = matches.length

        for(let j = startIndex; j < len_b; j++){
            if(a[i] == b[j]){
                matches.push({letter: b[j], index: j})
                startIndex = j + 1
                break
            }
        }

        console.log(matches)

        if(len_before == matches.length){
            console.log("no match for", a[i])
            return new Result(0, 0, 0)
        }

    }

    let score = 0

    //create score
    for(let i = 0; i < matches.length; i++){
        console.log(matches[i])
        score += b.length - matches[i].index
    }

    score = score / b.length

    return new Result(score, matches)
}

/* 
 * theme
*/

//basics for a theme integrated color-scheme 
//not fully realized, as som values are hard-coded to fit my scheme 
//and it has no considerations for potentially unset colors
function setThemeColors(theme){

    // dynamically create a stylesheet based on theme colors
    if (theme.colors) {
        document.body.style.backgroundColor = theme.colors.popup;
        document.body.style.color = theme.colors.popup_text;
        // Define the CSS styles you want to apply to the class
        const focusedElementId = 'bookmarkElementFocused';
        const searchInputId = "bookmarkSearchField"
        const cssStyles = `
            .${focusedElementId} {
                background-color: ${theme.colors.popup_highlight};
            }
            #${searchInputId}{
                background-color: ${theme.colors.input_background};
                color: ${theme.colors.input_color};
            }
            a{
                color: ${theme.colors.ntp_text};
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.textContent = cssStyles;
        document.head.appendChild(styleElement);
    }
}

