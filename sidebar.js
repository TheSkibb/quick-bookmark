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
}

//let event = new CustomEvent("SidebarFocused", { bubbles: true });
//browser.contentWindow.dispatchEvent(event);

window.addEventListener("SidebarFocused", () =>{
    console.log("focus sidebar")
    document.getElementById("bookmarkSearchField").focus()
});

// Focus the sidebar
browser.windows.getCurrent({populate: true}).then(windowInfo => {
    console.log("setting focus test")
    browser.windows.update(windowInfo.id, {focused: true});
});

// Get the current window
browser.windows.getCurrent({populate: true}).then(windowInfo => {
    // Focus the window
    browser.windows.update(windowInfo.id, {focused: true});
});

// recursively add html elements for the bookmarks
// todo display folders
function displayBookmarkTree(bookmarks){
    bookmarks.children.forEach(bookmark => {
        if(bookmark.type == "folder"){
            displayBookmarkTree(bookmark)
        }
        else{
            //console.log(bookmark.title)
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
    bookmarkElement.innerHTML = '<a href="' + bookmark.url + '">' + bookmark.title + "</a>"
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
    console.log(event)

    //if the search field is focused, the keyevents should be ignored
    let searchField = document.getElementById("bookmarkSearchField")
    if(document.activeElement === searchField){
        console.log("search bar has focus, returning")

        if(event.key == "Enter"){
            //unfocus the search bar
            searchField.blur()
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
    }
    else if(event.key == "l"){
        openselected("l")
    }
    else if(event.key == "/"){
        focusSearchField()
        listIndex = undefined
    }
});

// up is a boolean which decides if you are movin up or down
function move(up){
    const maxIndex = document.getElementsByClassName("bookmarkElement").length

    if(listIndex == null){
        listIndex = 0
        console.log("listindex is null")
    }
    else if(up && listIndex != 0){
        console.log("movin up")
        listIndex -= 1
    }
    else if(!up && listIndex < maxIndex -1){ 
        console.log("movin down")
        listIndex += 1
    }
    else{
        console.log(listIndex, maxIndex)
    }

    if(listIndex <= maxIndex - 1){
        console.log("list", listIndex)
        console.log("max", maxIndex)
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
    //open window in sidebar
    else if(method == "l"){
        window.location.replace(bookmarkLink.href)
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
    console.log(searchStr)

    bookmarksList.forEach(bookmark => {
        let titleMatch = strMatch(searchStr, bookmark.title)
        bookmark.match = titleMatch
    });

    bookmarksList.sort((a, b) => {
        return b.match - a.match
    })
    console.log(bookmarksList[0].match)
    console.log(bookmarksList)

    displayBookmarkList(bookmarksList)
}

function strMatch(str1, str2){
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    let str1Array = str1.split('');
    let str2Array = str2.split('');
    
    let matchedCount = 0;
    let lastIndex = -1;
    
    for (let i = 0; i < str1Array.length; i++) {
        let index = str2Array.indexOf(str1Array[i], lastIndex + 1);
        if (index > lastIndex) {
            matchedCount++;
            lastIndex = index;
        }
    }
    
    let score = matchedCount / str1Array.length;
    return score;
}
