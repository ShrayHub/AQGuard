function getBookmarks() {
    return JSON.parse(localStorage.getItem('airQualityBookmarks')) || [];
}

function saveBookmarks(bookmarks) {
    localStorage.setItem('airQualityBookmarks', JSON.stringify(bookmarks));
}

function addBookmark(newBookmark) {
    const bookmarks = getBookmarks();
    bookmarks.push(newBookmark);
    saveBookmarks(bookmarks);
}

function removeStoredBookmark(index) {
    const bookmarks = getBookmarks();
    bookmarks.splice(index, 1);
    saveBookmarks(bookmarks);
}

function clearAllStoredBookmarks() {
    localStorage.removeItem('airQualityBookmarks');
}
