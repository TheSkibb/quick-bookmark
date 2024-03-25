/*
    * setup (needs to be inside async funtion to use browser api)
*/


var bookmarksList = []
var bookmarksCount = 0
var listIndex = undefined //index for currently focused bookmark


async function setup(){
    const theme = await browser.theme.getCurrent();
    setThemeColors(theme)

    //we are only interested in toolbar bookmarks (may change)
    const bookmarkTreenodes = await browser.bookmarks.getTree()
    let bookmarksTree = bookmarkTreenodes[0].children[1]

    //adds the bookmarks from the bookmarksTree into bookmarksList
    createBookmarklistFromTree(bookmarksTree)

    displayBookmarkList(bookmarksList)
}


// takes in a tree of bookmarks, and creates a list
// add attribute parentFolder, which is used when 
// displaying and searching the list
function createBookmarklistFromTree(bookmarks, path){
    if(path == undefined){
        path = ""
    }

    bookmarks.children.forEach(bookmark => {
        if(bookmark.type == "folder"){
            createBookmarklistFromTree(bookmark, path + bookmark.title + "/")
        }
        else{
            bookmarksCount += 1

            /*
             * add special attributes for bookmark
             */

            bookmark.path = path
            //used to sort the list back to original position without 
            //having to re-flatten the tree
            bookmark.initialPos = bookmarksCount

            bookmarksList.push(bookmark)
        }
    });
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
        generateBookmarkName(bookmark)

    bookmarkElement.classList.add("bookmarkElement")

    bookmarkList.appendChild(bookmarkElement)
}

function generateBookmarkName(bookmark){
    if(bookmark.matchResult == undefined){

        return bookmark.path + bookmark.title +
        "</a>"
    }
    // bookmark with highlight for match-positions
    else{
        if(bookmark.matchResult.score == 0){
            return ""
        }

        let bookmarkDisplayName = (bookmark.path + bookmark.title).split("")

        let startTag = "<b>"
        let closeTag = "</b>"

        for(let i = 0; i < bookmark.matchResult.matches.length; i++){
            bookmarkDisplayName[bookmark.matchResult.matches[i].index] = 
                startTag + bookmark.matchResult.matches[i].letter + closeTag
        }

        return bookmarkDisplayName.join("") + 
        "</a>" +
        " <i>(match " + bookmark.matchResult.score + ")</i>"
    }
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
        //console.log("search bar has focus, returning")

        if(event.key == "Enter"){
            //unfocus the search bar
            searchField.blur()

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

        bookmarksList.forEach((e) => {
            e.matchResult = undefined
        })

        // sort bookmarks to original order
        bookmarksList = bookmarksList.sort(function(a, b){
            return a.initialPos - b.initialPos
        })

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

    bookmarksList.forEach(bookmark => {
        let titleMatch = strmatch(searchStr, bookmark.path + bookmark.title)
        // console.log(bookmark.title, titleMatch.score)
        bookmark.matchResult = titleMatch
    });

    bookmarksList = bookmarksList.sort(function(a, b){
        // console.log(b.matchResult.score - a.matchResult.score)
        return b.matchResult.score - a.matchResult.score
    })

    displayBookmarkList(bookmarksList)

}

function matchIsNull(b){
    b.match != 0
}

function strmatch(a, b){
    a = a.toLowerCase().split("")
    b = b.toLowerCase().split("")

    let len_a = a.length
    let len_b = b.length


    if(len_a == 0 || len_b == 0 || len_a > len_b){
        return new Result(0, 0, 0)
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

        if(len_before == matches.length){
            return new Result(0, 0, 0)
        }

    }

    let score = 0

    //create score
    for(let i = 0; i < matches.length; i++){
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

