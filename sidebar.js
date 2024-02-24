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
 * create a
*/





