var canvas = document.getElementById('myCanvas'), 
    context = canvas.getContext('2d');
    uploadedFile = document.getElementById('uploaded-file');


window.addEventListener('DOMContentLoad', initImageLoader);

function initImageLoader() {
    function handleManualUploadedFiles(ev) {
        var file = ev.target.files[0];
        handleFile(file);
    }
}

function handleFile(file) {
    var imageType = /image.*/;

    if (file.type.match(imageType)) {
        var reader = new FileReader();

        reader.onloadend = function (event) {
            var tempImageStore = new Image();

            tempImageStore.onload = function(ev) {
                canvas.height = ev.target.height;
                canvas.width = ev.target.width;

                context.drawImage(ev.target, 0, 0);
            }
        }
    }
}
