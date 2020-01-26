var canvas = document.getElementById('myCanvas'), 
    context = canvas.getContext('2d');
uploadedFile = document.getElementById('uploaded-file');

aaA = document.getElementById("butTest");
//aaA.onclick = vizualizare("fdsfds")


window.addEventListener('DOMContentLoad', initImageLoader);

function initImageLoader() {
    uploadedFile.addEventListener('change', handleManualUploadedFiles);
    
    function handleManualUploadedFiles(ev) {
        var file = ev.target.files[0];
        handleFile(file);
        document.getElementById('test').innerHTML = file;
        vizualizare("bla bla")
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
        tempImageStore.src = event.target.result;
            
        }

    reader.readAsDataURL(file);
    }
}

function vizualizare(mesaj) {
  var h = document.createElement("H1");
  var t = document.createTextNode(mesaj);
  h.appendChild(t);
  document.body.appendChild(h);
}