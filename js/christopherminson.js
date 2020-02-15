/*
 * main.js
 * Here's where all the site javascript code lives.
 *
 * https://www.christopherminson.com
 *
 */

// 
// URL and directory roots
//
const BASE_URL = "http://www.christopherminson.com/perch";   // root. also set in common.inc
//const CONVERSIONS_PATH = "/var/www/perch/CONVERSIONS/"; // where images are stored
const CONVERSIONS_PATH = "/CONVERSIONS/"; // where images are stored

// 
// Our current session state
//
var ListImageURLS = [];  // list of all images in current session
var ListImageStats = []; // the parallel list of stats for the image list
var ListImageRegions = []; // the parallel list of regions for the image list
var CurrentPosition = 0; // position of the current image being worked on
var CurrentRegions = ''; // the regions associated with current image
var SelectedRegion = 'ALL'; // the regions currently selected
var CurrentSecondaryImage = ''; // the secondary image
var CurrentSecondaryRegions = ''; // the regions associated with secondary image
var SelectedSecondaryRegion = 'ALL'; // the secondary regions currently selected
var CurrentOpForm = null; // the operation form we are currently viewing, if anuy
var SelectedOp = null; // currently selected operation, if any
var SelectedSetting = null; // currently selected generic setting, if any

const PATH_BUSY_ICON = './resources/utils/busy2.gif'; 

const PATH_BANNER_ICON = './resources/banners/banner01.jpg';
const URL_IMAGE_LOADING = BASE_URL+'/resources/utils/loading.png';
const URL_IMAGE_ANALYZING = BASE_URL+'/resources/utils/analyzing.png';

var HelpPageDisplayed = false;
var ViewROIS = true;
var SecondaryViewROIS = true;
var ConvertButtonEnabled = false;

//
// the dimensions of the currently displayed image
//
var DisplayedImage = null; 
var CurrentImageWidth = 1;
var CurrentImageHeight = 1;

var DisplayedSecondaryImage = null; 
var SecondaryImageWidth = 1;
var SecondaryImageHeight = 1;

//
// POST Endpoints
//
ENDPOINT_SEGMENT = './ops/segmentx.php';

//
// Which regions to use after for an image just generated via an operation
// cross-defined in common.inc
//
const REGIONS_PREVIOUS = 'PREVIOUS';
const REGIONS_NONE = 'NONE';

var BusyStateActive = false;
var SecondaryBusyStateActive = false;
var FacePlantActive = false;


//
// Region constants
//
const REGIONS_PEOPLE = ['person'];
const REGIONS_LIVING = ['dog', 'cat', 'bird', 'potted plant', 'elephant', 'horse', 'sheep', 'cow', 'bear', 'zebra', 'giraffe'];
const REGION_PEOPLE_COLOR = '#ff0000';
const REGION_LIVING_COLOR = '#00ff00';
const REGION_WORLD_COLOR = '#0000ff';

//const COLOR_BACKGROUND = '#013220';
const CANVAS_COLOR_BACKGROUND = '#d3d3d3';
const CANVAS_COLOR_FOREGROUND = '#000000';
const BANNER_ANNOUNCE = 'Click to Load Image';
const BANNER_HELP1 = 'load an image  - click the upload arrow below';

/************************************************************/

function test()
{
    console.log('canvas load');

}

function init()
{
    //hide('ID_CONTROLS_SPAN');
    hide('ID_PRIMARY_BUSY');
    hide('ID_VIEW_IMAGE');
    hide('ID_DOWNLOAD_IMAGE');

    //CJM
    disableConvertButton();

    if (window. location. href.includes('extract') == true)
    {
        drawInitialCanvas('ID_CANVAS', 'bold 18px Tahoma', 'click to load image')
    }
    else
    {
        FacePlantActive = true;
        drawInitialCanvas('ID_CANVAS', 'bold 18px Tahoma', 'click to load target image')
        drawInitialCanvas('ID_SECONDARY_CANVAS', 'bold 13px Tahoma', 'click to load source image');
    }
    console.log('faceplant', FacePlantActive);
}


// CJM
function drawInitialCanvas(id, font, text)
{

    var canvas  = document.getElementById(id);

    if (canvas == null)
    {
        console.log(id, canvas);
        return;
    }

    var x = Math.floor(canvas.width / 2);
    var y = Math.floor(canvas.height / 2);

    var ctx = canvas.getContext("2d");

    ctx.fillStyle = CANVAS_COLOR_BACKGROUND;
    ctx.textAlign = "center";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = font;
    ctx.fillStyle = CANVAS_COLOR_FOREGROUND;
    ctx.fillText(text, x, y);
}


//
// Executed by the Load Image button.
// Bring up the file chooser 
//
function chooseFile() 
{

    var inputForm  = document.getElementById('ID_SUBMIT_FILE');
    inputForm.value=""; //  MUST do this to avoid load caching!

    // make sure we're at top of page
     window.location.href = "#home";

    // click the button.  This will bring up the file chooser
    // which will then execute submitFile() once an image is selected
    inputForm.click();
}


//
// Executed via the click function in choosefile
// Submit the form and display Busy Indicator
//
function submitFile() 
{
    console.log('submitFile');
    document.getElementById('ID_LOAD_FORM').submit();
    busyStateActivate();
}



// 
// Scroll the main area out
// And the op form into the bottom of the screen
//
function displayOpForm()
{
}


function executeConversion()
{
    if (ConvertButtonEnabled == false) return;
    if (BusyStateActive == true) return;
    if (SecondaryBusyStateActive == true) return;


    e = document.getElementById('ID_SELECTED_REGION');
    if (e != null && e.options.length == 0) return;
    e = document.getElementById('ID_SELECTED_SECONDARY_REGION');
    if (e != null && e.options.length == 0) return;

    document.getElementById('ID_IMAGE_STATS').innerHTML = 'Processing Image ...';

    // Don't want to block.  
    // Therefore run submission in background, not in main thread
    setTimeout(executeConversionInBackground, 500);
}


//
// Execute the operation submission
// This is called in the background via a timer from submitOpForm()
// 
function executeConversionInBackground()
{

    // disable convertButton. display busy image 
    disableConvertButton();
    busyStateActivate();

    // set current variable to the current image
    // this is the image we will operate on
    // this gets sent to php during the submit
    var currentImage = getCurrentImagePath();
    document.getElementById('ID_CURRENT_IMAGE').value = currentImage;

    //CJM
    var e = document.getElementById('ID_CURRENT_SECONDARY_IMAGE');
    if (e != null) {
        e.value = CurrentSecondaryImage;
    }
    /*
    var e = document.getElementById('ID_SECONDARY_IMAGE');
    if (e != null)
    {
        var imageURL = e.src;
        var imagePath = getPathFromURL(imageURL);

        e = document.getElementById('ID_CURRENT_SECONDARY_IMAGE');
        e.value = imagePath;
        console.log('submitSecondaryImage', imageURL, imagePath);
    }
    */

    // execute the POST
    console.log('POSTING FORM: ', currentImage);
    document.getElementById('ID_OP_SUBMITFORM').submit();
}



//
// Update the op form with HTML required for that op
//
function displayOp(op)
{
    console.log('displayOp');
    console.log('REGIONS: ', CurrentSecondaryRegions, SelectedSecondaryRegion);
    CurrentOpForm = op; 

    var currentImage = getCurrentImagePath();
    var homeImageURL = ListImageURLS[0];
    var currentRegions = ListImageRegions[CurrentPosition];

    if (currentImage != null) 
    {
        console.log("POST: ", currentImage, op);
        console.log("POST REGIONS: ", SelectedSetting, SelectedRegion, SelectedSecondaryRegion);
        $.post(op, 
            {
                CURRENT_IMAGE: currentImage,
                CURRENT_REGIONS: currentRegions,
                SELECTED_REGION: SelectedRegion,
                SELECTED_OP: SelectedOp,
                SELECTED_SETTING: SelectedSetting,
                CURRENT_SECONDARY_IMAGE: CurrentSecondaryImage,
                CURRENT_SECONDARY_REGIONS: CurrentSecondaryRegions,
                SELECTED_SECONDARY_REGION: SelectedSecondaryRegion
            },
            function(data, status) 
            {
                console.log(data.length, status);
                if (data.length > 10)
                {
                    document.getElementById('ID_OP_FORM').innerHTML = data;
                    displayOpForm()
                    show('ID_RETURN_TO_MAINPAGE');
                }
            }
        );
    }
}


//
// Invoked when an operation terminates with no change to image
//
function completeWithNoAction()
{
    var stats = ListImageStats[CurrentPosition];

    stats = "[" + (CurrentPosition+1) + "/" + ListImageStats.length + "] " + stats;

    console.log('completeWithNoAction');
    enableConvertButton();
    busyStateDeactivate();
    document.getElementById('ID_IMAGE_STATS').innerHTML = '(No Operation Executed) '+stats;
    if (CurrentPosition < 1)
    {
        //hide('imagearea');
    }
}

//
// Invoked once the image has been successfully loaded
// This function is invoked via javascript injection at ./ops/loadx.php
//
function completeImageLoad(imageURL, text, width, height)
{
    console.log('completeImageLoad');

    CurrentImageWidth = width;
    CurrentImageHeight = height;
    console.log("completeImageLoad: ", imageURL, text);


    ListImageURLS = [imageURL];
    ListImageStats = [text];
    ListImageRegions = [null];
    CurrentRegions = null;

    CurrentPosition = ListImageURLS.length - 1;
    displayCurrentImage();

    console.log("setting HOME", imageURL);

    // have the AI analyze the image for regions of interest (ROI)
    executeImageAnalysis();
}


//
// Invoked once the image has been ROI analyzed
// Save off the regions and then display them. 
// Terminate any busy indicators
//
function completeImageAnalysis(imagePath, regions)
{
    console.log('completeImageAnalysis', imagePath, regions);

    //show('ID_CONTROLS_SPAN');
    CurrentRegions = regions;
    ListImageRegions[CurrentPosition] = regions; 
    displayRegions();

    var regionList = regions.split(',');
    var regionAttributes = '';
    var regionCount = 0;
    for (i = 0; i < regionList.length; i++) {
        var region = regionList[i];

        if (FacePlantActive == true)
        {
            if ((region.includes('face'))  == false) continue;
        }
        else
        {
            if (region.includes('background')) continue;
        }
        regionCount += 1;
    }

    if (FacePlantActive == true)
    {
    if (regionCount == 0)
        regionAttributes = 'Image Loaded and Analyzed: No Faces Detected';
    else if (regionCount == 1)
        regionAttributes = 'Image Loaded and Analyzed: 1 Face Detected';
    else
        regionAttributes = 'Image Loaded and Analyzed: '+regionCount+' Faces Detected';
    }
    else
    {
    if (regionCount == 0)
        regionAttributes = 'Image Loaded and Analyzed: No Regions Detected';
    else if (regionCount == 1)
        regionAttributes = 'Image Loaded and Analyzed: 1 Region Detected';
    else
        regionAttributes = 'Image Loaded and Analyzed: '+regionCount+' Regions Detected';

    }

    console.log('Setting STAT: ', regionAttributes);
    document.getElementById('ID_IMAGE_STATS').innerHTML = regionAttributes;
    ListImageStats[CurrentPosition] = regionAttributes;
    updateRegionSelector('ID_SELECTED_REGION', regions);

    busyStateDeactivate();
    enableConvertButton();
    show('ID_VIEW_IMAGE');
    show('ID_DOWNLOAD_IMAGE');
}


//
// Update UI  once a conversion has been executed on an image.
// This function is executed by NotifyUI() in common.inc.
//
// Re-enable convert button
// Determine what regions are associated with this converted image
//      1) if region == EGthen we use the previous image's regions (default)
//      2) if region == '0', then we will have no regions for this image
//      3) otherwise, use the string in regions as our new region set
// Store off all conversion data (imageURL, status text, regions)
// Disable busy state
//
function completeImageOp(imageURL, text, regions)
{
    console.log('completeImageOp', imageURL, text, regions);

    if (regions == REGIONS_PREVIOUS) regions = ListImageRegions[CurrentPosition]; 
    else if (regions == REGIONS_NONE) regions = '';

    ListImageURLS.push(imageURL);
    ListImageStats.push(text);
    ListImageRegions.push(regions);
    CurrentPosition = ListImageURLS.length - 1;
    CurrentRegions = regions;
    displayCurrentImage();

    busyStateDeactivate();
    updateRegionSelector('ID_SELECTED_REGION', regions)
    enableConvertButton();
}


//
// Ask the AI to perform a ROI analysis of the current image
// The AI will return a comman delimitted string of all the 
// detected ROI masks.
//
function executeImageAnalysis()
{
    var imagePath = getCurrentImagePath();

    document.getElementById('ID_IMAGE_STATS').innerHTML = 'Analyzing Image (takes 15-20 seconds) ...';

    var op = './ops/segmentx.php';
    $.post(ENDPOINT_SEGMENT, 
        {
            CURRENT_IMAGE: imagePath 
        },
        function(regions, status) 
        {
            completeImageAnalysis(imagePath, regions);
        }
    );
}


//
// Render all the region rects associated with the current image
//
function displayRegions()
{
    if (ViewROIS == false) return;
    if (ListImageRegions[CurrentPosition] == null) return;

    regions = ListImageRegions[CurrentPosition];
    console.log('displayRegions: ', regions);
    var canvas  = document.getElementById('ID_CANVAS');
    var ctx = canvas.getContext("2d");

    // determine how much image dimensions are altered in view (encoded in aspects)
    var aspectX = (canvas.width / CurrentImageWidth).toFixed(2);
    var aspectY = (canvas.height / CurrentImageHeight).toFixed(2);

    
    //ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (regions == '') return;
    if (regions.length < 10) return;

    // for all regions (except the background), draw the region bounding box
    var regionList = regions.split(',');
    var regionCount = 0;
    for (i = 0; i < regionList.length; i++) {

        var region = regionList[i];

        if ((FacePlantActive) && region.includes('face') == false) continue;
        if (region.includes('background')) continue;

        // 
        // assumes images of form: name.score.type.box.suffix
        // therefore we want the 3rd part of this string (box)
        // if this form changes then this code must change!
        //
        var name = region.split('.')[2];
        var boundingBox = region.split('.')[3];
        var terms = boundingBox.split('_');
        var x = parseInt(terms[0]);
        var y = parseInt(terms[1]);
        var w = parseInt(terms[2]);
        var h = parseInt(terms[3]);
        //console.log(x, y, w, h, aspectX, aspectY);


        var x = Math.floor(x * aspectX);
        var y = Math.floor(y * aspectY);
        var width = Math.floor(w * aspectX);
        var height = Math.floor(h * aspectY);

        // colors are set based on category of region
        var color;
        if (REGIONS_PEOPLE.includes(name))
            color = REGION_PEOPLE_COLOR;
        else if (REGIONS_LIVING.includes(name))
            color = REGION_LIVING_COLOR;
        else
            color = REGION_WORLD_COLOR;

        var codeCharacter = String.fromCharCode(65 + regionCount);

        ctx.lineWidth = "2";
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'normal 20px Arial';
        ctx.fillStyle = color;
        ctx.fillText(codeCharacter, x, y);
        //console.log('Drawing region: code x y w h ', codeCharacter, x, y, width, height);
        regionCount += 1;
    }
}


//
// Render all the region rects associated with the secondary image
//
function displaySecondaryRegions()
{
    if (SecondaryViewROIS == false) return;

    console.log('displaySecondaryRegions: ', CurrentSecondaryRegions);
    var canvas  = document.getElementById('ID_SECONDARY_CANVAS');
    var ctx = canvas.getContext("2d");

    var aspectX = (canvas.width / SecondaryImageWidth).toFixed(2);
    var aspectY = (canvas.height / SecondaryImageHeight).toFixed(2);

    if (CurrentSecondaryRegions == '') return;
    if (CurrentSecondaryRegions.length < 10) return;

    // for all regions (except the background), draw the region bounding box
    var regionList = CurrentSecondaryRegions.split(',');
    var regionCount = 0;
    for (i = 0; i < regionList.length; i++) {

        var region = regionList[i];

        if ((FacePlantActive) && region.includes('face') == false) continue;
        if (region.includes('background')) continue;

        // 
        // assumes images of form: name.score.type.box.suffix
        // therefore we want the 3rd part of this string (box)
        // if this form changes then this code must change!
        //
        var name = region.split('.')[2];
        var boundingBox = region.split('.')[3];
        var terms = boundingBox.split('_');
        var x = parseInt(terms[0]);
        var y = parseInt(terms[1]);
        var w = parseInt(terms[2]);
        var h = parseInt(terms[3]);
        //console.log(x, y, w, h, aspectX, aspectY);


        var x = Math.floor(x * aspectX);
        var y = Math.floor(y * aspectY);
        var width = Math.floor(w * aspectX);
        var height = Math.floor(h * aspectY);

        // colors are set based on category of region
        var color;
        if (REGIONS_PEOPLE.includes(name))
            color = REGION_PEOPLE_COLOR;
        else if (REGIONS_LIVING.includes(name))
            color = REGION_LIVING_COLOR;
        else
            color = REGION_WORLD_COLOR;

        var codeCharacter = String.fromCharCode(65 + regionCount);

        ctx.lineWidth = "2";
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, width, height);

        ctx.font = 'normal 10px Arial';
        ctx.fillStyle = color;
        ctx.fillText(codeCharacter, x, y);
        console.log('Secondary Drawing region: code x y w h ', codeCharacter, x, y, width, height);
        regionCount += 1;
    }
}









//
// Executed by the View Image button
// Set the link to the currently display image URL (if any)
//
function viewCurrentImage()
{
    var imagePath = getCurrentImagePath();
    if (imagePath != null) 
    {
        console.log('viewCurrentImage'. imagePath);
        document.getElementById('ID_VIEW_IMAGE').href = BASE_URL+"/displayimage.html?CURRENTIMAGE="+imagePath;
    }
}


//
// Render the current image into the canvas
//
function displayCurrentImage()
{
    console.log('displayCurrentImage');
    var imageURL = ListImageURLS[CurrentPosition];
    var stats = ListImageStats[CurrentPosition];

    stats = "[" + (CurrentPosition+1) + "/" + ListImageStats.length + "] " + stats;

    DisplayedImage = new Image();
    DisplayedImage.src = imageURL;

    DisplayedImage.onload = function(){

        console.log(DisplayedImage);
        renderCurrentImage();
        displayRegions();
    }

    document.getElementById('ID_IMAGE_STATS').innerHTML = stats;
    setDownloadImageLink(imageURL);

    regions = ListImageRegions[CurrentPosition]
    if (regions != null) updateRegionSelector('ID_SELECTED_REGION', regions);
}


function renderCurrentImage()
{
        var canvas  = document.getElementById('ID_CANVAS');
        var ctx = canvas.getContext("2d");

        if (DisplayedImage == null) 
        {
            drawInitialCanvas('ID_CANVAS', 'bold 30px Tahoma', BANNER_ANNOUNCE)
            return;
        }

        var aspectRatioY = canvas.height / DisplayedImage.height;
        canvas.width = DisplayedImage.width * aspectRatioY;

        ctx.drawImage(DisplayedImage, 
            0, 0, 
            DisplayedImage.width, 
            DisplayedImage.height,
            0, 0, 
            canvas.width, canvas.height);
}

//
// Render the secondary image into the canvas
//
function displaySecondaryImage(imageURL)
{
    console.log('displaySecondaryImage');

    DisplayedSecondaryImage = new Image();
    DisplayedSecondaryImage.src = imageURL;
    DisplayedSecondaryImage.onload = function(){

        console.log(imageURL);
        renderSecondaryImage();
    }

    //if (regions != null) updateRegionSelector('ID_SELECTED_SECONDARY_REGION', regions);
}


// CJM
function renderSecondaryImage()
{

    console.log('renderSecondaryImage');
        var canvas  = document.getElementById('ID_SECONDARY_CANVAS');
        var ctx = canvas.getContext("2d");

        if (DisplayedSecondaryImage == null) 
        {
            drawInitialSecondaryCanvas();
            return;
        }

        var aspectRatioY = canvas.height / DisplayedSecondaryImage.height;
        canvas.width = DisplayedSecondaryImage.width * aspectRatioY;

        ctx.drawImage(DisplayedSecondaryImage, 
            0, 0, 
            DisplayedSecondaryImage.width, 
            DisplayedSecondaryImage.height,
            0, 0, 
            canvas.width, canvas.height);
}



function getCurrentImageURL()
{
    var imageURL = null;

    if (CurrentPosition < ListImageURLS.length)  {
        imageURL = ListImageURLS[CurrentPosition];
    }
    return imageURL;
}

function getCurrentImagePath()
{
    var imageURL = getCurrentImageURL();
    return(getPathFromURL(imageURL));
}

function getPathFromURL(imageURL)
{
    if (imageURL == null) return null;

    var imageArray = imageURL.split("/");
    return CONVERSIONS_PATH+imageArray[imageArray.length - 1];

}


function setDownloadImageLink(imageURL)
{
    var downloadLink = document.getElementById('ID_DOWNLOAD_IMAGE');
    if (downloadLink != null) {
        downloadLink.href = imageURL;
    }
}


function setCurrentImage(imageURL)
{
    document.getElementById('ID_MAIN_IMAGE').src = imageURL;
    setDownloadImageLink(imageURL);
}


function setCurrentStatus(image,text)
{
    var e = document.getElementById('opstatus');
    e.innerHTML = text;
}



function nextImage()
{
    //CJM
    if (ListImageURLS.length == 0) return;
    
    CurrentPosition++;
    if (CurrentPosition >= ListImageURLS.length) CurrentPosition = 0;
    displayCurrentImage();
}

function previousImage()
{
    //CJM
    if (ListImageURLS.length == 0) return;

    CurrentPosition--;
    if (CurrentPosition < 0) CurrentPosition = ListImageURLS.length - 1;
    displayCurrentImage();
}

function homeImage()
{
    console.log("homeImage");
    CurrentPosition = 0;
    displayCurrentImage();
}

function enableConvertButton()
{
    console.log('enableConvertButton');
    ConvertButtonEnabled = true;
}

function disableConvertButton()
{
    console.log('disableConvertButton');
    ConvertButtonEnabled = false;
}


function toggleViewROIS()
{
    ViewROIS = !ViewROIS;

    renderCurrentImage();
    displayRegions();
}


function toggleViewSecondaryROIS()
{
    console.log('toggleViewSecondaryROIS');
    SecondaryViewROIS = !SecondaryViewROIS;

    renderSecondaryImage();
    displaySecondaryRegions();
}


function toggleHelpPage()
{
    if (HelpPageDisplayed == true) {

        HelpPageDisplayed = false;
        hide('ID_HELP_AREA');
        show('ID_CONTENT_AREA');
    } 
    else {

        HelpPageDisplayed = true;
        show('ID_HELP_AREA');
        hide('ID_CONTENT_AREA');
    }
}


function executeWithArg(argValue) 
{
    var arg1 = document.getElementById('ID_ARG1');
    arg1.value = argValue;
    executeConversion();
}


function hide(id)
{
    console.log(id);
    document.getElementById(id).style.display = 'none';
}


function show(id)
{
    console.log(id);
    // CJM - must be INLINE for ID_CONTROLS_SPAN
    document.getElementById(id).style.display = 'inline';
    //document.getElementById(id).style.display = 'block';
}


function reportOpError(error)
{
    console.log('reportOpError');
    busyStateDeactivate();
    document.getElementById('ID_IMAGE_STATS').innerHTML = error;
}


function reportLoadError(error)
{
var e;

    console.log('reportLoadError');
    busyStateDeactivate();
    if (CurrentPosition < 1)
    {
        //hide('imagearea');
    }
    e = document.getElementById('ID_IMAGE_STATS');
    e.innerHTML = error;
}

function regionTest()
{
    var canvas  = document.getElementById('ID_CANVAS');
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = "4";
    ctx.strokeStyle = "blue";
    ctx.strokeRect(0, 0, 100, 100);
}


function busyStateActivate()
{
    BusyStateActive = true;
    hide('ID_CANVAS');
    show('ID_PRIMARY_BUSY');
}


function busyStateDeactivate()
{
    BusyStateActive = false;
    hide('ID_PRIMARY_BUSY');
    show('ID_CANVAS');
}



function busyStateSecondaryActivate()
{
    SecondaryBusyStateActive = true;
    hide('ID_SECONDARY_CANVAS');
    show('ID_SECONDARY_BUSY');
}


function busyStateSecondaryDeactivate()
{
    SecondaryBusyStateActive = false;
    hide('ID_SECONDARY_BUSY');
    show('ID_SECONDARY_CANVAS');
}



//
// Save off UI selected region state 
// This is (used later so that user keeps her region selections when
// moving between screens).
//
// This function is called via onChange in DisplayRegionPicker [common.inc]
//
function saveRegionSelection()
{
    var e;

    e = document.getElementById('ID_SELECTED_REGION');
    if (e != null  && e.options.length > 0)
    {
        SelectedRegion = e.options[e.selectedIndex].value;
        console.log('Saving Selected Region', SelectedRegion);
    }
    e = document.getElementById('ID_SELECTED_SECONDARY_REGION');
    console.log(e);
    if (e != null && e.options.length > 0)
    {
        SelectedSecondaryRegion = e.options[e.selectedIndex].value;
        console.log('Saving Selected Secondary Region', SelectedSecondaryRegion);
    }

}

//
// Save off UI selected operation state
// This is (used later so that user keeps her op selections when
// moving between screens).
//
// This function is called via onChange in DisplayOpPicker [common.inc]
//
function saveOpSelection()
{
    var e;

    e  = document.getElementById('ID_SELECTED_OP');
    if (e != null)
    {
        SelectedOp = e.options[e.selectedIndex].value;
        console.log('Saving Selected Op', SelectedOp);
    }
    console.log('saveOpSelection', SelectedOp);
}


function saveSettingSelection()
{
    var e;

    e  = document.getElementById('ID_SELECTED_SETTING');
    if (e != null)
    {
        SelectedSetting = e.options[e.selectedIndex].value;
        console.log('Saving Selected Setting', SelectedOp);
    }
}



function chooseSecondaryImage() 
{
    console.log('chooseSecondaryImage');
    e  = document.getElementById('SUBMITIMAGE');
    e.value=""; // CJM - MUST do this to avoid load caching!
    e.click();
}


function submitSecondaryImage() 
{

    busyStateSecondaryActivate();
    document.getElementById('ID_LOAD_SECONDARY_IMAGE').submit();
}


function completeSecondaryImageLoad(imageURL, text, width, height)
{

    SecondaryImageWidth = width;
    SecondaryImageHeight = height;
    console.log('completeSecondaryImageLoad:', imageURL, width, height);

    CurrentSecondaryImage = getPathFromURL(imageURL);
    displaySecondaryImage(imageURL);

    // Now execute segment analysis
    var op = './ops/segmentx.php';
    $.post(ENDPOINT_SEGMENT, 
        {
            CURRENT_IMAGE: CurrentSecondaryImage 
        },
        function(regions, status) 
        {
            CurrentSecondaryRegions = regions;
            console.log('Secondary Regions: ', CurrentSecondaryRegions);

            updateRegionSelector('ID_SELECTED_SECONDARY_REGION', CurrentSecondaryRegions);
            //displaySecondaryImage();
            displaySecondaryRegions();
            busyStateSecondaryDeactivate();

            //document.getElementById('ID_SECONDARY_IMAGE').src = imageURL;
        }
    );
}

function updateRegionSelector(id, regions)
{
    console.log('updateRegionSelector', regions);

    // clear all previous options, if any.
    var regionSelector = document.getElementById(id);
    for (i = regionSelector.options.length - 1 ; i >= 0 ; i--)
    {
        regionSelector.remove(i);
    }

    if (regions.length < 10) 
    {
        var el = document.createElement("option");
        el.textContent = '(No Regions Found)';
        el.value = 'NA';
        regionSelector.appendChild(el);
        return;
    }

    var regionList = regions.split(',');
    var regionAttributes = '';
    var regionCount = 0;


    // add in new options, if any
    /*
    var el = document.createElement("option");
    el.textContent = 'Entire Image';
    el.value = 'ALL';
    regionSelector.appendChild(el);
    */

    for (i = 0; i < regionList.length; i++) {
        var region = regionList[i];
        console.log(region);

        if (FacePlantActive)
        {
            if (region.includes('face') == false) continue;
        }

        var terms = region.split('.');
        var regionName = terms[2];
        console.log(region, terms[3]);
        var regionDimensions = terms[3].split('_');
        var x = regionDimensions[0];
        var y = regionDimensions[1];
        var width = regionDimensions[2];
        var height = regionDimensions[3];

        if (region.includes('background') == true)
        {
            code = ' ';
        }
        else
        {
            code = String.fromCharCode(regionCount+65)+')';
            regionCount += 1;
        }

        var regionAttribute = code+'  '+regionName+'  '+width+'x'+height;

        var el = document.createElement("option");
        el.textContent = regionAttribute;
        el.value = region;
        regionSelector.appendChild(el);
    }
}



