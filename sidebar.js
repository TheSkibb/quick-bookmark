/*
    * logic for setup the list of bookmarks
*/
async function setup(){
    const bookmarkTreenodes = await browser.bookmarks.getTree()
    //we are only interested in toolbar bookmarks
    bookmarks = bookmarkTreenodes[0].children[1]

    displayBookmarks(bookmarks)
}

// add html elements for the bookmarks
function displayBookmarks(bookmarks){

    bookmarks.children.forEach(bookmark => {
        if(bookmark.type == "folder"){
            displayBookmarks(bookmark)
        }
        else{
            console.log(bookmark.title)
            addBookmarkElement(bookmark)
        }
    });
}

// adds
function addBookmarkElement(bookmark){
    const bookmarkList = document.getElementById("bookmarkList")
    let bookmarkElement = document.createElement("div")
    bookmarkElement.innerHTML = bookmark.title
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
    if(event.key == "k"){
        move(true)
    }
    else if(event.key == "j"){
        move(false)
    }
});

var listIndex = undefined

// up is a boolean which decides if you are movin up or down
function move(up){

    if(listIndex == null){
        listIndex = 0
        console.log("listindex is null")
    }
    else if(up && listIndex != 0){
        console.log("movin up")
        listIndex -= 1
    }
    else if(!up && listIndex != 1000){ //find a way to detect bottom
        console.log("movin down")
        listIndex += 1
    }

    focusElement(listIndex, up)
    
}

function focusElement(elementIndex, up){
    let prevItem = up? elementIndex+1 : elementIndex-1
    let bookmarkElements = document.getElementsByClassName("bookmarkElement")

    bookmarkElements.item(elementIndex).classList.add("bookmarkElementFocused")
    bookmarkElements.item(prevItem).classList.remove("bookmarkElementFocused")
}





