/*
    * logic for setup the list of bookmarks
*/
async function setup(){
    window.focus()
    const bookmarkTreenodes = await browser.bookmarks.getTree()

    //we are only interested in toolbar bookmarks
    //may change
    bookmarks = bookmarkTreenodes[0].children[1]

    displayBookmarks(bookmarks)

}

//let event = new CustomEvent("SidebarFocused", { bubbles: true });
//browser.contentWindow.dispatchEvent(event);

window.addEventListener("SidebarFocused", () =>{
    console.log("focus sidebar")
    document.getElementById("bookmarkSearchField").focus()
}
);

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
function displayBookmarks(bookmarks){

    bookmarks.children.forEach(bookmark => {
        if(bookmark.type == "folder"){
            displayBookmarks(bookmark)
        }
        else{
            //console.log(bookmark.title)
            addBookmarkElement(bookmark)
        }
    });
}

// adds
function addBookmarkElement(bookmark){
    const bookmarkList = document.getElementById("bookmarkList")

    let bookmarkElement = document.createElement("div")
    bookmarkElement.innerHTML = '<a href="' + bookmark.url + '">' + bookmark.title + "</a>"
    bookmarkElement.classList.add("bookmarkElement")

    bookmarkList.appendChild(bookmarkElement)
}

setup()


/* 
    * logic for paring the list and 
    * create an event listener which listens to keypresses 
*/

addEventListener("keypress", (event) => {
    console.log(event.key)

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
        openselected("enter")
    }
    else if(event.key == "l"){
        openselected("l")
    }
    else if(event.key == "/"){
        focusSearchField()
    }
});

var listIndex = undefined

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

function openselected(method){
    // NB: may fail if bookmarkelements get more children
    let bookmarkLink  = document.getElementsByClassName("bookmarkElementFocused")[0].children[0]

    //open the url in a new tab
    if(method == "enter"){
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

