var canvas = document.getElementById('myCanvas'), 
    context = canvas.getContext('2d');

window.addEventListener('DOMContentLoad', initImageLoader);

function initImageLoader() {
    var location = window.location.href.replace(/\/+$/, "");
    loadFile('./images/pic_the_scream.jpg');
}

function loadFile(file) {
    var tempImageStore = new Image();

    // set up the onload function - it won't run this code wntil the page loads
    tempImageStore.onload = function(ev) {
        // Gets the canvas width and height, sets the canvas size
        canvas.height = ev.target.height;
        canvas.width = ev.target.width;

        // Draw the image onto the canvas
        context.drawImage(ev.target, 0, 0);
    }

    tempImageStore.src = file;

    return true;
}











