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
        bookmark.title + "</a>" + " <i>(match " + bookmark.match + ")</i>"
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
    a = a.toLowerCase().split('')
    b = b.toLowerCase().split('')

    //console.log(a)
    //console.log(b)

    let matchArrays = []

    //find all matches
    for(let i = 0; i < a.length; i++){

        let char_a = a[i]

        //skip spaces
        if(char_a == " "){
            continue
        }

        let matches = {
            letter: char_a,
            indexes: []
        }

        for(let k = 0; k < b.length; k++){
            let char_b = b[k]
            if(char_a == char_b){
                matches.indexes.push(k)
            }
        }

        if(matches.indexes.length == 0){
            return 0
        }
    matchArrays.push(matches)
    }

    // build matchscore
    let matchScore = 0
    for(let j = 0; j < matchArrays.length; j++){
        matchScore += matchArrays[j].indexes.length
    }

    matchScore = matchScore / b.length

    return matchScore
}
