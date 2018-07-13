// get user media
function hasGetUserMedia() {
  return !!(navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}
var URL = window.URL || window.webkitURL;
var WebCam, ctrackr; 
Webcam.set({
  width: 640,
  height: 360,
  image_format: 'jpeg',
  jpeg_quality: 90,
  swfURL: './src/webcam.swf'
});
Webcam.attach( '#imgCanvas' );
// var streamVideo = document.createElement('video'); // video stream
var streamVideo = document.getElementById('imgCanvas').children[1];
function getMedia(){
  // instruction: get camera access
  $("#warningP").html(instrMsg.camaccess);
  $('#warningP').show();
  if (hasGetUserMedia()) {
   navigator.mediaDevices.getUserMedia(getUserMediaConstraints)
   .then(function(stream) {
       // video stream
        streamVideo.muted = true;
        streamVideo.volume = 0;
        streamVideo.autoplay = true;
        streamVideo.width = hdW;
        streamVideo.height = hdH;
        // streamVideo.src = URL.createObjectURL(Webcam.stream);
        streamVideo.srcObject = stream;
        streamVideo.play();
        // localStream = Webcam.stream;
        localStream = stream;
        $('#fullscreenButton').prop('disabled', false);
        $('#fullscreenButton').css({"background-color":"#03a9f4", 'color':'#424242'});
        $('#fullscreenButton').hover(
          function(){$(this).css({'color':'#eeeeee','background-color':'#29b6f6'});},
          function(){$(this).css({'color':'#424242','background-color':'#03a9f4'});}
          );
        // turn on speaker
        $("#warningP").html('Please turn on the sound for better experience.');
      })
    .catch(
      function(err) {
          $("#warningP").html(err.message + instrMsg.refreshcamaccess);
      });
  } else {
   console.log('in ELSE of getMedia ');
   alert('getUserMedia() is not supported in your browser');
   $("#warningP").html(instrMsg.cameranotsupport);
  }// getUserMedia
}

// onload document
$(document).ready(function() {
  $('#instrmsgP').css({'max-width':"80%", "top":"51%","left":"10%","right":"10%"});
  $('#instrmsgP').show();
  if(bowser.name != 'Chrome') { // test web browser: terminate if not google chrome  
    alert(instrMsg.webbrowser);
    // instruction: copy address
    $("#instrmsgP").html(instrMsg.copylink);
    // button: copy the current URL to clipboard
    $("#copylinkButton").css({"width":"60%"})
    $("#copylinkButton").css({"top":"40%","left":"20%"});
    $("#copylinkButton").show();
    $("#copylinkButton").zclip({
    path: "./js/lib/ZeroClipboard.swf",
    copy: function(){
        return document.URL;
      }
    });
  }else{
    // screen size
    sW = screen.width;
    sH = screen.height;
    checkServerResponse(); // check response from the server
  }
}); // document ready

// set up canvas when ready
function setUpCanvas(){
  // canvas used for video streaming
  imgCanvas = document.getElementById('imgCanvas');
  imgCanvasCtx = imgCanvas.getContext('2d');
  drawW = imgCanvas.width;
  drawH = imgCanvas.height;

  // overlay canvas: display facial landmarks
  overlay = document.getElementById('overlay');
  overlayCtx = overlay.getContext('2d');

  // overlay canvas: display instruction message
  msgoverlay = document.getElementById('msgoverlay');
  msgoverlayCtx = msgoverlay.getContext('2d');

  // set up canvas to work on tracking: mid resolution
  trackCanvas = document.createElement('canvas');
  trackCanvasCtx = trackCanvas.getContext('2d');
  trackCanvas.width = trckW;
  trackCanvas.height = trckH;

  // set up canvas to work on feature extraction: high resolution
  hdCanvas = document.createElement('canvas');
  hdCanvasCtx = hdCanvas.getContext('2d');
  hdCanvas.width = hdW;
  hdCanvas.height = hdH;

  // full-screen canvas
  fsCanvas = document.getElementById("fullscreen");
  fsCanvas.width = sW;
  fsCanvas.height = sH;
  ctx = fsCanvas.getContext('2d');

  // full-screen overlay canvas
  fsoverlayCanvas = document.getElementById("fsoverlay");
  fsoverlayCtx = fsoverlayCanvas.getContext('2d');
  fsoverlayCanvas.width = sW;
  fsoverlayCanvas.height = sH;

  
  // instruction: allow access to fullscreen
  $('#instrmsgP').html('');
  $('#instrmsgP').css({'width':"80%", "top":"51%","left":"10%","right":"10%"});

  // button: enter full screen mode
  $("#fullscreenButton").show();

  // button: quit full screen mode
  $('#quitFullScreenButton').css( "backgroundColor", closeTabBttnColor);
  $('#quitFullScreenButton').prop('disabled', false);
  
  $('#content').show();
  $('#instrimgdiv').show();
  $('#hitsummary').show();
  $('#fullscreenButton').css({"background-color":"#A4A4A4", 'color':'#eeeeee'});
  $('#fullscreenButton').prop('disabled', false); // viral

  var w = $('#instrimgdiv').width();
  $('#instrimgdiv').css({'height':(w/5)});

  getMedia(); // start experiment
}


// enter full screen
function enterFullScreen(){
  ctx.fillStyle = fsmsgBckColor;
  ctx.fillRect(0,0,sW,sH);
  $('#fullscreen').show();

  $('#content').hide();
  fsoverlayCtx.clearRect(0, 0, sW, sH); 
  $('#fsoverlay').show();

  // place canvases to correct position
  displayElm2Center('#imgCanvas', sW, sH+cvsshift);
  displayElm2Center('#overlay', sW, sH+cvsshift);
  displayElm2Center('#msgoverlay', sW, sH+cvsshift);
  displayElm2Center('#fsoverlay', sW, sH);
  displayElm2Center('#fullscreen', sW, sH);
  // place buttons to correct position
  $('#reTrack').css({"width":"260px"});
  $('#start').css({"width":"260px"});
  displayElm2Center('#reTrack', sW-drawW/2, sH+drawH+cvsshift+cvsmargin+$('#reTrack').height());
  displayElm2Center('#start', sW+drawW/2, sH+drawH+cvsshift+cvsmargin+$('#start').height());
  $('#fullscreenButton').hide();
  // instruction messages
  $('#warningP').hide();
  // toggle full screen
  $('#fscontent').css({'width':sW, 'height':sH});
  toggleFullScreenOnEle("content");
  $(document).bind('keydown', function fn(event) 
  { 
    if(event.keyCode == 81){ // 'q'
      $(document).unbind(); // unbind key press event
      KEY_DOWN = true;
      toggleFullScreen();
      restartTask(instrMsg.restartwork);
    }
  });
  
  setTimeout(function() {checkFullscreenOn();}, 3000); // constantly check fullscreen
  startTracking(); // start facial landmark tracking
}

// restart the whole experiment
function restartTask(msg){
  if(MOLETEST){
    molestarttime = null;
    svgpaper.remove();
    $('#fullscreen').show();
    $('#fsoverlay').show(); 
    MOLETEST = false;
    DISPLAYON = false;
  }
  
  RESTART = true; // restart experiment
  // terminate loops
  if (ldmkTrackRequest) cancelRequestAnimFrame(ldmkTrackRequest);
  if (displayLdmkRequest) {
    cancelRequestAnimFrame(displayLdmkRequest);
    cancelRequestAnimFrame(displayStreamRequest);
  }
  if (checkFullscreenOnRequest) cancelRequestAnimFrame(checkFullscreenOnRequest);
  ctrackr.stop(); // face tracker
  if(recorder != null) recorder.stop(); // recorder
  if(rawcarrier != null) rawcarrier.terminate(); // stop sending eye patch data 

  recorder = null;
  KEY_DOWN = false;
  EXPERIMENT_END = false;
  ABTEST = false;

  // hide elements
  $('#eyeCanvas').hide();
  $('#imgCanvas').hide();
  $('#overlay').hide();
  $('#msgoverlay').hide();
  ctx.fillStyle = instrBodyColor;
  ctx.fillRect(0,0,sW,sH);
  $('#reTrack').hide();
  $('#start').hide();
  $('#statusmsgP').hide();
  $('#vismsgP').hide();
  $('#slider').hide();
  $('#fsoverlay').hide();
  $('#fullscreen').css('cursor','default');
  $('#fsoverlay').css('cursor','default');

  // if svg exists
  if (svgpaper != null){
    svgpaper.remove();
  }

  $('#instrmsgP').hide();
  $('#warningP').css('color',msgColor);
  $('#warningP').html(msg);
  $('#warningP').show();
  $('#content').show();
  $('#tipsdiv').hide();

    if (msg == instrMsg.computertooslow) {
      quitfullscreen();
    }else{
      $('#fullscreenButton').html('Restart Game');
      $("#fullscreenButton").show();
    }

    cntFPS = 0;
    avgFPS = 0;
    killpigscore = 0;
}

function startTracking(){
  $('#reTrack').prop('disabled', false);
  $('#start').prop('disabled', true);
  $('#statusmsgP').css({'color':statusMsgBarMsgColor, 'font-size':20});
  $("#statusmsgP").html('');
  $("#statusmsgP").show();
  // initialize tracker
  ctrackr = new clmpm.tracker({useWebGL : true});
//   ctrackr = new clm.tracker({useWebGL : true});
  ctrackr.init(pModel);
  // tracking
  facialLdmkTrackingDisplay();
  displayStreamingVideo();
  // display tips
  $('#tipsdiv').show();
}

// restart facial landmark tracking
function restartTracking(){
  ctrackr.reset();
}


//display video streaming
function displayStreamingVideo(){
  displayStreamRequest = requestAnimFrame(displayStreamingVideo);
  // flip the strem video and display
  imgCanvasCtx.save(); // Save the current state
    imgCanvasCtx.scale(-1, 1); // Set scale to flip the image
    imgCanvasCtx.drawImage(streamVideo, -showW, 0, showW, showH); // draw the image
    imgCanvasCtx.restore(); // Restore the last saved state
}

// display facial landmarks tracking results
function facialLdmkTrackingDisplay(){
  displayLdmkRequest = requestAnimFrame(facialLdmkTrackingDisplay);
  trackCanvasCtx.drawImage(streamVideo, 0, 0, trckW, trckH) // rescale the video stream
  ctrackr.trackFrame(trackCanvas); // tracking
  overlayCtx.clearRect(0, 0, showW, showH); // tracking results
  if(ctrackr.getCurrentPosition()){
    ctrackr.flipdraw(overlay, showW, showH);
  }
  // status message
  msgoverlayCtx.clearRect(0, 0, drawW, drawH);
  msgoverlayCtx.fillStyle = statusMsgBarColor;
  msgoverlayCtx.fillRect(0, 0, barw, barh);
  
  var positions = ctrackr.getCurrentPosition(); 
  var msg = checkLdmkValidity(positions);
  var validldmk = false;
  if (msg == ''){
    // check average intesnsity of eye patch
    var leftI = computeAverageIntensity(trackCanvasCtx, positions[23][0], positions[24][1], positions[25][0]-positions[23][0], positions[26][1]-positions[24][1]);
    var rightI = computeAverageIntensity(trackCanvasCtx, positions[30][0], positions[29][1], positions[28][0]-positions[30][0], positions[31][1]-positions[29][1]);
    if(leftI > minIntensity && rightI > minIntensity){
      validldmk = true;
    }else{
      msg = statusMsg.toodark;
    }
  }
  if(validldmk){
    $("#statusmsgP").html(statusMsg.clickrestart);
    if(DISPLAYON == false && DISPLAYDOTON == false && ABTEST == false){
      if($('#start').attr('disabled') == "disabled"){
        $('#start').prop('disabled', false);
        $('#start').css("backgroundColor", startBttnColor);
        $('#start').css( "color", '#424242');
        $('#start').hover(
              function(){$(this).css({'color':'#eeeeee', "backgroundColor":startBttnColor});},
              function(){$(this).css({'color':'#424242', "backgroundColor":startBttnColor});}
        );
      }
    }
  }else{
    if($('#start').attr('disabled') != "disabled"){
      $('#start').prop('disabled', true);
      $('#start').css( "color", '#eeeeee');
      $('#start').css( "backgroundColor", disableBttnColor);
    }
    $("#statusmsgP").html(msg);
  }
  $("#statusmsgP").css({'left': (sW-$("#statusmsgP").width())/2});
  $("#statusmsgP").css({'top': (sH+cvsshift-$('#msgoverlay').height())/2+barh/2-$("#statusmsgP").height()/2});
}

// start experiment
function startTask(){
  RESTART = false;
  $('#tipsdiv').hide();
  var positions = ctrackr.getCurrentPosition();
  if (checkLdmkValidity(positions) != ''){return;} 
  // hide cursor
  $('#fullscreen').css('cursor','none');
  $('#fsoverlay').css('cursor','none');
  $('#instrmsgP').css('cursor','none');
  fsoverlayCtx.clearRect(0, 0, sW, sH); 
  $('#fsoverlay').hide();

  prev_positions = null; // detect rapid change in facial landmark location

  // initialize the histogram extractor: eye width and height
  var ew =  Math.abs(positions[23][0]+positions[30][0]-positions[25][0]-positions[28][0])/2;
  var eh = Math.abs(positions[24][1]+positions[29][1]-positions[26][1]-positions[31][1])/2;
  ew = Math.max(ew, eh/eyepatchratio);
  eh = Math.max(eh, ew*eyepatchratio);

  optionColorhist.pw = ew * colorhistmargin;
  optionColorhist.ph = eh * colorhistmargin; 
  colorhist = new normalizedHist.hist(optionColorhist);
  patchsize[0] = colorhist.patchwidth();
  patchsize[1] = colorhist.patchheight();

  // initialize queue for training, testing, raw data collection
  trainQueue = [], testQueue = [], blankQueue = [], dataQueue = [], detectQueue = [], displayQueue = [], timeQueue = [];
  memActionQueue = []; pigQueue = [];
  
  // bilateral setting
    bfilterQ = new Array(bfilterLen);
  bfilterCnt = 0;
  
  // optical flow setting
  opticlflw_para.pw = patchsize[0];
  opticlflw_para.ph = patchsize[1];
  opticlflw_para.w = trckW;
  opticlflw_para.h = trckH;
  opticlflw = new OpticalFlow(opticlflw_idx, opticlflw_mp_idx, positions, opticlflw_para);
  
  // online prediction
  model_online = null;

  if (TEST_STABILIZATION){
    $('#opticalflow').show();
    ofCanvas = document.getElementById('opticalflow');
    ofCanvas.style.position = "absolute";
    displayElm2Center('#opticalflow', sW, sH+cvsshift-200);
    ofCtx = ofCanvas.getContext('2d');
    drawstabilization();
  }else{
    cancelRequestAnimFrame(displayLdmkRequest); // stop display tracking instruction
    cancelRequestAnimFrame(displayStreamRequest); // stop streaming
    // hide elements
    $('#imgCanvas').hide();
    $('#overlay').hide();
    $('#msgoverlay').hide();
    $('#reTrack').hide();
    $('#start').hide();
    $('#statusmsgP').hide();
    $('#instrmsgP').hide();
    // show elements
    ctx.fillStyle = pointBckColor;
    ctx.fillRect(0,0,sW,sH);
    $('#fullscreen').show();

    // initialzie recorder
    recorder = new VideoRecorder(localStream, recordW, recordH);
    ImageData = '';

    // start facial landmark tracking
    ldmktracking();

    // set buffer time for toggling screen to fullsize
    setTimeout(function() {
      recorder.start(); // start recording
      curposdisplay = 0;
      $('#instrmsgP').css('color',fsmsgColor);
      display(expsequence); // start display images on screen
      DISPLAYON = true;
    }, 10000);
  }
}

function ldmktracking(){
  ldmkTrackRequest = requestAnimFrame(ldmktracking);

  var time = new Date().getTime();
    if (lastFrameTimeTrck == null) { lastFrameTime = time;}
    if (time - lastFrameTimeTrck <= trckInterval) return; // control frame rate: 25 ms per frame
    lastFrameTimeTrck = time;
  
  trackCanvasCtx.drawImage(streamVideo, 0, 0, trckW, trckH) // rescale the image
  ctrackr.trackFrame(trackCanvas); // tracking
}

function drawstabilization(){
  requestAnimFrame(drawstabilization);
  var time = new Date().getTime();
    if (lastFrameTimeStb == null) { lastFrameTime = time;}
    if (time - lastFrameTimeStb <= trckInterval) return; // control frame rate: 25 ms per frame
    lastFrameTimeStb = time;

  var positions = ctrackr.getCurrentPosition();
  if(positions){
    hdCanvasCtx.drawImage(streamVideo,0,0,hdW,hdH); // hd image
    var midpoint = opticlflw.getmidpoint(positions, trackCanvasCtx, trckW, trckH);

    // without stabilization
    var curr_pos = [[0,0],[0,0]];
      // averaging
      for(var e = 0; e < 2; e++){
        for(var i = 0; i < opticlflw_mp_idx[0].length; i++){
          curr_pos[e][0] += positions[opticlflw_mp_idx[e][i]][0] * scaleW;
          curr_pos[e][1] += positions[opticlflw_mp_idx[e][i]][1] * scaleH;  
        }
        curr_pos[e][0] /= opticlflw_mp_idx[0].length;
        curr_pos[e][1] /= opticlflw_mp_idx[0].length;
      }
    // optical flow
    var imgdata = new Array(2);
    for(var e = 0; e < 2; e++){     
      // original ldmk
      imgdata[e] = hdCanvasCtx.getImageData(curr_pos[e][0] - (patchsize[0]-1)/2, curr_pos[e][1] - (patchsize[1]-1)/2, patchsize[0], patchsize[1]);
    }
    // draw eye image data
    var w = 150, h = 80;
    ofCtx.clearRect(0, 0, ofCtx.width, ofCtx.height); // clear the canvas
    ofCtx.fillStyle = "#FFF";
    ofCtx.fillRect((ofCanvas.width-w)/2,0,w,h);
    ofCtx.strokeStyle = "#FFFF00";
    ofCtx.strokeRect((ofCanvas.width-w)/2,0,w,h);
    
    for(var e = 0; e < 2; e++){
      ofCtx.putImageData(imgdata[e], (w/2-patchsize[0])/2+(ofCanvas.width)/2*e+(ofCanvas.width-w)/2*(1-e), (h-patchsize[1]-4)/2); 
    }

    // bilateral filtering
    bfilterQ.pop();
    var newPos = new Array(2);
    for(var e = 0; e < 2; e++){
      newPos[e] = new Array(2);
      for(var i = 0; i < 2; i++){
        newPos[e][i] = curr_pos[e][i];
      }
    }
    bfilterQ.unshift(newPos);
    if (bfilterCnt < bfilterLen) bfilterCnt++;
    var bfpos = bilateralFilter(bfilterQ, bfilterCnt, bfilter_para);

    var imgdata = new Array(2);
    for(var e = 0; e < 2; e++){
      imgdata[e] = hdCanvasCtx.getImageData(bfpos[e][0] - (patchsize[0]-1)/2, bfpos[e][1] - (patchsize[1]-1)/2, patchsize[0], patchsize[1]);
    }
    // draw eye image data
    for(var e = 0; e < 2; e++){
      ofCtx.putImageData(imgdata[e], (w/2-patchsize[0])/2+(ofCanvas.width)/2*e+(ofCanvas.width-w)/2*(1-e), (h+patchsize[1]+4)/2); 
    }

    // test fixed position
    if(jittercnter == -1){
      savejitterloc = new Array(60*2);
      savoploc = new Array(60*2);

      jitterloc = new Array(2);
      for(var e = 0; e < 2; e++){
        jitterloc[e] = new Array(2);
        for(var i = 0; i < 2; i++){
          jitterloc[e][i] = midpoint[e][i];
        }
      }
      jittercnter++;
    }else if(jittercnter > 300){
      jittercnter = -1;
      str = 'original:';
      for(var i = 0; i < savejitterloc.length; i++){
        str += savejitterloc[i] + ',';
      }
      console.log(str);
      str = 'op:';
      for(var i = 0; i < savoploc.length; i++){
        str += savoploc[i] + ',';
      }
      console.log(str);
      str = 'bf:';
      for(var i = 0; i < savoploc.length; i++){
        str += savebfloc[i] + ',';
      }
      console.log(str);
    }else{
      savejitterloc[jittercnter*2+0] = curr_pos[0][0];
      savejitterloc[jittercnter*2+1] = curr_pos[0][1];
      savoploc[jittercnter*2+0] = midpoint[0][0];
      savoploc[jittercnter*2+1] = midpoint[0][1];
      savebfloc[jittercnter*2+0] = bfpos[0][0];
      savebfloc[jittercnter*2+1] = bfpos[0][1];

      jittercnter++;
    }   
  }
}

// display images on screen
function display(sequence){
  if (RESTART){
    DISPLAYON = false;
    return; 
  }
  if (curposdisplay >= sequence.length){ // finish experiment
    curposdisplay++;
    DISPLAYON = false;
    stop();
    return;
  }

  var entry = sequence[curposdisplay];
  $('#instrmsgP').hide();

  // online prediction
  if(curposdisplay > 0 && sequence[curposdisplay].type != "point" && sequence[curposdisplay-1].type == "point"){
    onlineprediction();
  }
  switch(entry.type){
    case "point":
      var step = 30; // step size (ms)
      var duration = sequence[curposdisplay].duration+sequence[curposdisplay+1].duration;
      var ratio = sequence[curposdisplay+1].duration/duration;
      var px = entry.location[0]*sW, py = entry.location[1]*sH;
      curposdisplay++;
      DISPLAYDOTON = true;

      ctx.fillStyle = pointBckColor;
      ctx.fillRect(0,0,sW,sH);
      var iconidx = Math.floor(Math.random()*icons.length); // randomly select a bird
      // bird 
      ctx.drawImage(iconset[iconidx], px-iconsize/2, py-iconsize/2, iconsize, iconsize);
      iconsound.play();
      // door and dot
      ctx.lineWidth = ringLineWith;
      drawDynamicRing(ctx, px, py, pointBckColor, pointBckColor, duration*(1-ratio), iconsize*0.75, 8, step, function(){
        curposdisplay++;
        drawDynamicCirc(sW, sH, ctx, px, py, pointBckColor, iconcolor[iconidx], duration*ratio, 8, 8, step, function(){
          display(sequence); 
          DISPLAYDOTON = false;
        });
      });
      break;
    case "image":
      ctx.fillStyle = imgBckColor;
      ctx.fillRect(0,0,sW,sH);
      var idx;
      for(var i = 0; i < numimg; i++){
        if(imgpaths[i] == entry.path){
          idx = i; 
          break;
        }
      }
      image = hitimgs[idx];
      var s = Math.min(sW/image.width, sH/image.height);
      var w = image.width*s, h = image.height*s;
      ctx.drawImage(image, (sW-w)/2, (sH-h)/2, w, h);
      curposdisplay++;
      setTimeout(function(){display(sequence);}, entry.duration);
      break;
    case "video":
      ctx.fillStyle = imgBckColor;
      ctx.fillRect(0,0,sW,sH);
      
      var b = entry.index[0], c = entry.index[1];
      playvideos(b, c);
      curposdisplay++;
      setTimeout(function(){
        var b = livevideo[0], c = livevideo[1];
        videoobjs[b][c].pause();
        display(sequence);
      }, entry.duration);
      break;
    case "cross":
      var px = 0.5*sW, py = 0.5*sH, pr = crossRadius;
      ctx.fillStyle = crossBckColor;
      ctx.fillRect(0,0,sW,sH);
      // draw a cross
      drawCross(ctx, px, py, pr, crossColor, crosslineWidth);
      curposdisplay++;
      setTimeout(function(){display(sequence);}, entry.duration);
      break;
    case "crosshair":
      ctx.fillStyle = fsmsgBckColor;
      ctx.fillRect(0,0,sW,sH);
      var px = 0.5*sW, py = 0.5*sH;
      var r1 = 55, r2 = 45, color = '#DDD'
      var w1 = 2, w2 = 4, w = 2;
      drawMovieCntdown(ctx, px, py, r1, r2, color, w1, w2, w);
      showInstrMsg(entry.content, "#instrmsgP", sW, sH-45);
      curposdisplay++;
      setTimeout(function(){display(sequence);}, entry.duration);
      break;
    case "message":
      ctx.fillStyle = fsmsgBckColor;
      ctx.fillRect(0,0,sW,sH);
      showInstrMsg(entry.content, "#instrmsgP", sW, sH-100);
      curposdisplay++;
      setTimeout(function(){display(sequence);}, entry.duration);
      break;
    case "abtest":
      curposdisplay++;
      fsoverlayCtx.clearRect(0, 0, sW, sH); 
      $('#fsoverlay').show();
      abtestStartTime = new Date().getTime();
      startabtest();
      checkabtest();
      setTimeout(function(){
        if(ABTEST == false){ // program has restarted
          return;
        }else{
          ABTEST = false;
          // check whether all pigs are cleared
          if (cntPig > 0){ // restart experiment: show message
            restartTask(instrMsg.timeout);
          }
        }
      }, entry.duration);
      break;
    case "whacamole":
      curposdisplay++;
      $('#fullscreen').hide();
      $('#fsoverlay').hide();
      $('body').css('cursor','none');


      MOLETEST = true;
      gameTotalTime = entry.duration;
      cntmole = level2mole[entry.level];

      // whac-a-mole svg surface
      nummole = molegrid[entry.level];
      homesize = Math.floor(Math.min(sW / (nummole[1] + nummole[1] * gapmole + gapmole), (sH - toolbarHeight) / (nummole[0] + nummole[0] * gapmole + gapmole)));

      moley = (sH - nummole[0]*homesize - (nummole[0]-1)*homesize*gapmole)/2;
      molex = (sW - nummole[1]*homesize - (nummole[1]-1)*homesize*gapmole)/2;
      moleloc = getmolegridloc(molex, moley, [homesize, homesize], nummole, homesize*gapmole);

      svgpaper = Snap(sW, sH);
      svgbg = svgpaper.rect(0,0,sW,sH);
      svgbg.attr("fill", "black");
      molehomeobj = drawmolehome(moleloc, homesize, homesize*molecorner, "green");
      moleNumber =  drawMoleStatus(sW - 300 ,sH - toolbarHeight*0.4, cntmole);

      timeController = drawTimeController(sH - toolbarHeight*0.4, toolbarHeight*0.2 , 500);
      timeController.setTimeout(gameTotalTime);
        
      startwhacamole();
      molestarttime = new Date().getTime();
      setTimeout(checkMoleTimeout, entry.duration, molestarttime);
      break;
  }
}

function checkMoleTimeout(start_time){
  if (molestarttime != start_time){ // program has restarted or all moles has been hit
    return;
  }else{ // time out
    svgpaper.remove();
    $('#fullscreen').show();
    $('#fsoverlay').show();
    MOLETEST = false;
    // check whether all pigs are cleared
    if (cntmole > 0){ // restart experiment: show message
      DISPLAYON = false;
      restartTask(instrMsg.moletimeout);
    }
  }
}

function checkabtest(){
  abtestRequest = requestAnimationFrame(checkabtest);
  if(RESTART){
    ABTEST = false;
    DISPLAYON = false;
  }
  if(ABTEST == false){
    cancelAnimationFrame(abtestRequest);  
  }
}
// angry bird: kill pig test
function startabtest(){
  ABTEST = true;
  cntPig = numPig;
  drawPig();
}

function drawPig(){
  ctx.fillStyle = pointBckColor;
  ctx.fillRect(0,0,sW,sH);
  ctx.beginPath();
  var loc = [Math.random()*0.7+0.15, Math.random()*0.7+0.15]; // random position
  var t = new Date().getTime();
  var item = {"start_time":t, "location": loc};
  pigQueue.push(item);
  curpigpos = [sW*loc[0], sH*loc[1]];
  curpigidx = Math.floor(Math.random()*pigset.length);
  ctx.drawImage(pigset[curpigidx], curpigpos[0]-pigsize/2, curpigpos[1]-pigsize/2, pigsize, pigsize);
  var x = curpigpos[0]-bloodRectW/2, y = curpigpos[1]-pigsize/2-15;
  var colorgrad=ctx.createLinearGradient(x, y, x+pigsize, y);
  colorgrad.addColorStop(0,"red");
  colorgrad.addColorStop(0.5,"yellow");
  colorgrad.addColorStop(1,"green");
  ctx.fillStyle=colorgrad;
  ctx.fillRect(x, y, bloodRectW, bloodRectH);
  ctx.strokeStyle = bloodRectColor;
  ctx.rect(x, y, bloodRectW, bloodRectH);
  ctx.stroke();
  ctx.closePath();

  hitcountdown = numPigHit;
  lowblood = false;
  ABTEST = true;
}

//video recorder
function VideoRecorder(mediaStream,width,height) {
    this.start = function() {
        canvas.width = this.width;
        canvas.height = this.height;
        video.width = this.width;
        video.height = this.height;
        function drawVideoFrame(time) {
          lastAnimationFrame = requestAnimationFrame(drawVideoFrame);
            if (curposdisplay > expsequence.length){ // finish experiment
        cancelRequestAnimFrame(lastAnimationFrame);
        cancelRequestAnimFrame(ldmkTrackRequest);
        return;
      }
      if (curposdisplay < 0) return;
            // minimum time interval between two images
            var time = new Date().getTime();
            if (lastFrameTime == null) { lastFrameTime = time;}
            if (time - lastFrameTime <= 25) return; // control frame rate: 25 ms per frame

            if (cntFPS <= numFPSframe) {
              cntFPS++; 
              avgFPS += 1000/(time - lastFrameTime);
              if (cntFPS == numFPSframe) {
                avgFPS /= numFPSframe;
                if(avgFPS < minFPS){
            restartTask(instrMsg.computertooslow);
            return;
                } // fps is too low
              };
            }

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            lastFrameTime = time;

            if (VISUALIZATION == true){ // do not save video if visualizatin is not requested
              ImageData += time + ';' + canvas.toDataURL('image/jpeg', 0.9).substring(23) + ';'; // record frame
            }
            
            // track face and extract features
      hdCanvasCtx.drawImage(streamVideo,0,0,hdW,hdH); // hd image
      
      var positions = ctrackr.getCurrentPosition(); // get landmark location

      // check the validity of current landmark positions and temporal chagne
      var msg = checkLdmkValidity(positions);
      if (msg != ''){ // stop recorder
        if (lastAnimationFrame){
          cancelAnimationFrame(lastAnimationFrame);
        }
        if (msg == statusMsg.detecting){
          alert(instrMsg.losttrack);
        }else{
          alert(msg);
        }
        restartTask(instrMsg.keepstill);
        return;
      }
      // check the location change prev_positions
      if(!prev_stable_pos){
        prev_stable_pos = new Array(stable_idx.length);
        for(var i = 0; i < stable_idx.length; i++){
          prev_stable_pos[i] = new Array(2);
          prev_stable_pos[i][0] = positions[stable_idx[i]][0];
          prev_stable_pos[i][1] = positions[stable_idx[i]][1];
        }
      }else{
        var delta = 0;
        for(var i = 0; i < stable_idx.length; i++){
          delta += Math.sqrt(Math.pow(prev_stable_pos[i][0]-positions[stable_idx[i]][0], 2)+Math.pow(prev_stable_pos[i][1]-positions[stable_idx[i]][1], 2));
        }     
        if(delta/stable_idx.length > stable_th){
          // console.log(delta/stable_idx.length)
          prev_stable_pos = null;
          alert(instrMsg.headmove);
          restartTask(instrMsg.keepstill);
          return;
        }
      }

      var feature = {"type":"colorhist", "value":null, "entryidx":curposdisplay-1};
      var eyeloc = [[0,0],[0,0]];
      if(positions){
        detectQueue.push(true); // facial landmark exists

        // without stabilization
        var curr_pos = [[0,0],[0,0]];
          // averaging
          for(var e = 0; e < 2; e++){
            for(var i = 0; i < opticlflw_mp_idx[0].length; i++){
              curr_pos[e][0] += positions[opticlflw_mp_idx[e][i]][0] * scaleW;
              curr_pos[e][1] += positions[opticlflw_mp_idx[e][i]][1] * scaleH;  
            }
            curr_pos[e][0] /= opticlflw_mp_idx[0].length;
            curr_pos[e][1] /= opticlflw_mp_idx[0].length;
          }

        // bilateral filtering
        bfilterQ.pop();
        var newPos = new Array(2);
        for(var e = 0; e < 2; e++){
          newPos[e] = new Array(2);
          for(var i = 0; i < 2; i++){
            newPos[e][i] = curr_pos[e][i];
          }
        }
        bfilterQ.unshift(newPos);
        if (bfilterCnt < bfilterLen) bfilterCnt++;
        var midpoint = bilateralFilter(bfilterQ, bfilterCnt, bfilter_para);

        for(var e = 0; e < 2; e++){
          for(var d = 0; d < 2; d++){
            eyeloc[e][d] = midpoint[e][d] - (patchsize[d]-1)/2;
          }
        }
        feature.value = new Array(2);
        for(var e = 0; e < 2; e++){
          feature.value[e] = colorhist.getfeature(hdCanvasCtx, eyeloc[e][0], eyeloc[e][1]);
        }
        // sending to server: save to queue
      }else{
        detectQueue.push(false); // facial landmark not exists
      }

      // data collector
      var entry = expsequence[curposdisplay-1];
      if(feature.value == null){
        blankQueue.push(feature);
        displayQueue.push({'type':entry.tag, 'index': blankQueue.length-1});
      }else{
        switch(entry.tag){
          case "train":
            trainQueue.push(feature); 
            displayQueue.push({'type':entry.tag,'index': trainQueue.length-1});
            break;
          case "test":
            testQueue.push(feature);
            displayQueue.push({'type':entry.tag, 'index': testQueue.length-1});
            break;
          case "blank":
            blankQueue.push(feature);
            displayQueue.push({'type':entry.tag, 'index': blankQueue.length-1});
            break;
        }

        if(model_online != null){
          var q = [];
          q.push(feature);
          p = mlmodel_online.predict(q, expsequence, model_online, false); // prediction
          if (p != null){
            x = p.prediction.data[0]*sW;
            y = p.prediction.data[1]*sH;
            if (MOLETEST){
              curmousepos = [y, x];
            }

            if(SHOWONLINE && !ABTEST){
              fsoverlayCtx.clearRect(0, 0, sW, sH); 
              drawCrossHair(fsoverlayCtx, x, y, crosshairRadius, '#0F0', crosshairCircW, crosshairCrsW);
            }
            
            if(ABTEST){ // angry bird test
              // draw cross hair
              fsoverlayCtx.clearRect(0, 0, sW, sH); 
              drawCrossHair(fsoverlayCtx, x, y, crosshairRadius, '#0F0', crosshairCircW, crosshairCrsW);
              var d = Math.max(Math.abs(x-curpigpos[0]), Math.abs(y-curpigpos[1]));
              if (d < pigsize*0.5){
                hitcountdown--;
                // draw cross hair
                fsoverlayCtx.clearRect(0, 0, sW, sH); 
                drawCrossHair(fsoverlayCtx, x, y, crosshairRadius, '#F00', crosshairCircW, crosshairCrsW);
                laseracesound.play('laser');
                var x = curpigpos[0]-bloodRectW/2, y = curpigpos[1]-pigsize/2-15;
                ctx.fillStyle = pointBckColor;
                var w = hitcountdown/numPigHit * bloodRectW;
                ctx.fillRect(x+w, y, bloodRectW-w, bloodRectH);
                ctx.strokeStyle = bloodRectColor;
                ctx.beginPath();
                ctx.rect(x, y, bloodRectW, bloodRectH);
                ctx.stroke();
                if(lowblood == false && (hitcountdown/numPigHit) <= lowbloodTh){
                  ctx.drawImage(graypigset[curpigidx], curpigpos[0]-pigsize/2, curpigpos[1]-pigsize/2, pigsize, pigsize);
                  lowblood = true;
                }

                if(hitcountdown <= 0){
                  cntPig--;
                  item = pigQueue.pop();
                  var t = new Date().getTime();
                  item["end_time"] = t;
                  pigQueue.push(item);
                  if(cntPig > 0){
                    ABTEST = false;
                    drawPig();
                  }else{
                    ABTEST = false;
                    if(!SHOWONLINE){
                      $('#fsoverlay').hide(); 
                    }
                    // bonus points for abtest
                    var mark = basemarkpig;
                    var t = Math.round((abtestLen - (new Date().getTime()) + abtestStartTime)/1000);
                    if(t > 0) mark += t*stepmark_kill;
                    $('#memmark').css('color', "#8925D0");
                    $('#memmark').html('Time Bonus: ' + mark.toString());
                    $('#memmark').css({'left':(sW-$('#memmark').width())/2, 'margin-left':0});
                    $('#memmark').css({'top':(sH-$('#memmark').height())/2, 'margin-top':0});
                    $('#memmark').show();

                    killpigscore += mark;
                    setTimeout(function(){
                      laseracesound.play('winner');
                    },300);
                    setTimeout(function(){
                      display(expsequence); // start real experiment  
                      $('#memmark').hide();
                    }, 800);
                  }
                }

              }
            }
          }
        }
      }
      timeQueue.push(new Date().getTime()); // time stamp
        }
        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);
    };
    this.stop = function(callback) {
        if (lastAnimationFrame) { cancelAnimationFrame(lastAnimationFrame);}
        if (callback){callback();}    
    };
    this.width = width;
    this.height = height;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var video = document.createElement('video');
    video.muted = true;
    video.volume = 0;
    video.autoplay = true;
    video.src = URL.createObjectURL(mediaStream);
    video.play();
    var lastAnimationFrame = null;
    var lastFrameTime;
};

// online regression
function onlineprediction(){
  mlmodel_online = new MLModel.mlmodel(learning_para);
  model_online = mlmodel_online.train(trainQueue, expsequence); // train model
}

// finish experiment
function stop(){
  $(document).unbind(); // unbind key press event
  cancelRequestAnimFrame(checkFullscreenOnRequest);
  EXPERIMENT_END = true;
  // localStream.stop(); // stop web cam
  Webcam.reset();
  // Webcam.off();
  estimategaze(); // gaze estimation

  if(MemTest){ // add memorability test
    ctx.clearRect(0, 0, sW, sH); 
        ctx.fillStyle = imgBckColor;
    ctx.fillRect(0,0,sW,sH);
    $('#fullscreen').show();
    $('#fsoverlay').show();
    $('#fullscreen').css('cursor','default');
    $('#fsoverlay').css('cursor','default');
    $('#instrmsgP').css('cursor','default');
    $('#instrmsgP').css('color',fsmsgColor);
    memorytestpreview()
    
  }else{
    $('#fullscreen').show();
    $('#fsoverlay').show();
    $('#fullscreen').css('cursor','default');
    $('#fsoverlay').css('cursor','default');
    $('#instrmsgP').css('cursor','default');
    resultmsg = 'Thanks for your participation!';
    ctx.clearRect(0, 0, sW, sH); 
    ctx.fillStyle = imgBckColor;
    ctx.fillRect(0,0,sW,sH);
    $('#memmark').hide();
    senddata();
  }
}
function senddata(){
  $('#fsoverlay').hide();
  $('#instrmsgP').css('cursor','auto');

  if (VISUALIZATION){ // visualization
    // imgCanvasCtx.clearRect(0,0,drawW,drawH);
    imgCanvasCtx.fillStyle = visBlankBckColor;
    imgCanvasCtx.fillRect(0,0,drawW,drawH);
    imgCanvasCtx.fill();
    imgCanvasCtx.strokeStyle = visBlankFrmColor;
    imgCanvasCtx.strokeRect(0,0,drawW,drawH);
    imgCanvasCtx.stroke();
    overlayCtx.clearRect(0,0,drawW,drawH);
    $('#imgCanvas').show();
    $('#overlay').show();
    displayElm2Center('#replayButton', sW-drawW/2, sH+drawH+cvsshift+cvsmargin+$('#replayButton').height());
  }

  resultQueue = new Array(displayQueue.length);
  for(var i = 0; i < resultQueue.length; i++){
    var predict_val = null;
    var n = displayQueue[i].index, entryidx;
    switch(displayQueue[i].type){
      case "train":
        entryidx = trainQueue[n].entryidx
        if(train_result != null) predict_val = [train_result.prediction.data[2*n],train_result.prediction.data[2*n+1]];
        break;
      case "test":
        entryidx = testQueue[n].entryidx;
        if(test_result != null) predict_val = [test_result.prediction.data[2*n],test_result.prediction.data[2*n+1]];
        break;
      case "blank":
        entryidx = blankQueue[n].entryidx;
        break;
      default:
        break;
    }
    var data_item = {'index': entryidx,'time':timeQueue[i],'value': predict_val};
    resultQueue[i] = data_item;
  }
  saveQueue = []; // data to download
  saveQueue.push({'patchsize':patchsize, 'margin':margin_raw, 'screenw': sW, 'screenh':sH}); //raw data parameter 
  saveQueue.push(expsequence); // experiment configuration
  saveQueue.push(resultQueue); // time stamp, prediction 
  var trainerr = null, testerr = null, looerr_train = null, looerr_test = null;
  if (train_result != null) trainerr = train_result.error;
  if (test_result != null) testerr = test_result.error;
  if (looerr != null){
    looerr_train = JSON.stringify(looerr.train);
    looerr_test = JSON.stringify(looerr.test);  
  } 
  saveQueue.push({'trainerr':trainerr, 'testerr':testerr, 'looerr_train':looerr_train, 'looerr_test':looerr_test, 'bonusmoney':bonusmoney});

  if (imagehit){
    saveQueue.push(memActionQueue); // memory test action, time stamp
    saveQueue.push(pigQueue); // abtest data  
  }
  if (videohit){
    saveQueue.push(videolist); // videolist 
  }

  quitfullscreen();

  // download to local file
  if (DOWNLOAD_DATA){

    if (VISUALIZATION){
      displayElm2Center('#downloadButton', sW+drawW/2, sH+drawH+cvsshift+cvsmargin+$('#replayButton').height());
    }else{
      $('#downloadButton').css({'position':'absolute', 'top':window.innerHeight/3, 'left':(window.innerWidth-$('#downloadButton').width())/2});
    }
    $('#downloadButton').prop('disabled', false); 
    $('#downloadButton').show();
  }
}

// memory test
function memorytest(){
  MEMTESTPREVIEW = false;
  
  $("#memscore").fadeTo(0, 1);
  $("#bestmemscore").fadeTo(0, 1);
  $("#fullscreen").fadeTo(0, 1);
  $("#fsoverlay").fadeTo(0, 1);
  $("#instrmsgP").css({"background-color":"no", "padding":"0"});

  var memshowidx = nchoosekRandom(numimg, numshown);
  for(var i = numimg; i < hitimgs.length; i++){
    memshowidx.push(i);
  }
  var memdispidx = nchoosekRandom(numgrids[0]*numgrids[1], numgrids[0]*numgrids[1]);
  var cnt = 0;
  gridsel = new Array(numgrids[0]); //  status: checked/unchecked
  gridmark = new Array(numgrids[0]); // mark
  gridimgs = new Array(numgrids[0]); // image index
  for(var i = 0; i < numgrids[0]; i++){
    gridsel[i] = new Array(numgrids[1]);
    gridmark[i] = new Array(numgrids[1]);
    gridimgs[i] = new Array(numgrids[1]);
    for(var j = 0; j < numgrids[1]; j++){
      gridsel[i][j] = 0;
      gridmark[i][j] = 0;
      gridimgs[i][j] = memshowidx[memdispidx[cnt++]];
    }
  }
  gridselans = new Array(numgrids[0]); // ground truth grid
  for(var i = 0; i < numgrids[0]; i++){
    gridselans[i] = new Array(numgrids[1]);
    for(var j = 0; j < numgrids[1]; j++){
      gridselans[i][j] = 0;
      for(var k = 0; k < numshown; k++){
        if(gridimgs[i][j] == memshowidx[k]){
          gridselans[i][j] = 1;
          break;
        }
      }
    }
  }
  
  // draw images
  drawGrids(fsoverlayCtx, gridx, gridy, gridloc, gridsize, gridsel, gridselans, gridColor, selgridColor, gridLineWidth, selLineWidth);
  drawGridsImg(ctx, gridloc, gridsize, MEMTESTPREVIEW);
  memActionQueue = [];
  var item = {'imgpaths': imgpaths, 'numgrids': numgrids, 'numshown':numshown, 'shownimgidx':memshowidx, 'imgorder':gridimgs, 'gridselans':gridselans, 'basemark':basemark, 'stepmark_kill':stepmark_kill, 'stepmark_catch':stepmark_catch, 'penaltymark':penaltymark, 'gridimgs':gridimgs};
  memActionQueue.push(item);
  memtestStartTime = new Date().getTime();
  item = {'action': 'start','time':memtestStartTime};
  memActionQueue.push(item);
  MEMTESTON = true;
  memtestcountdown(Math.floor(memetesTimeLimit/1000));
  setTimeout(function(){
    if(MEMTESTON == false) return; // already submitted
    MEMTESTON = false;
    $('#memmark').css('color', "#ff9100");
    $('#memmark').html('Time Out');
    $('#memmark').css({'left':(sW-$('#memmark').width())/2, 'margin-left':0});
    $('#memmark').css({'top':(sH-$('#memmark').height())/2, 'margin-top':0});
    $('#memmark').show();
    setTimeout(function(){
      submitMemTest(); // go to the final page  
    }, 800);
  }, memetesTimeLimit);
}

function getPosition(event){
  if(MEMTESTON == false) return;
  var cx = event.x;
  var cy = event.y;
  cx -= fsoverlayCanvas.offsetLeft;
  cy -= fsoverlayCanvas.offsetTop;
  // select picked image
  var idx = null;
  for(var i = 0; i < numgrids[0]; i++){
    for(var j = 0; j < numgrids[1]; j++){
      var x = gridloc[i][j][0];
      var y = gridloc[i][j][1];
      var w = gridsize[1], h = gridsize[0];
      if(cx >= x && cx <= x+w && cy >= y && cy <= y+h){
        idx = [i,j];
      }
    }
  }
  if(idx != null){
    var t = new Date().getTime();
    var item = {'action': 'click','time':t,'grididx': idx};
    memActionQueue.push(item);
    if(gridsel[idx[0]][idx[1]] == 0){ // respond only when being selected for the 1st time
       gridsel[idx[0]][idx[1]] = 1;
      // gridsel[idx[0]][idx[1]] = 1 - gridsel[idx[0]][idx[1]]; // flip status
      // update grids
      fsoverlayCtx.clearRect(0, 0, $('#fsoverlay').width(), $('#fsoverlay').height()); 
      drawGrids(fsoverlayCtx, gridx, gridy, gridloc, gridsize, gridsel, gridselans, gridColor, selgridColor, gridLineWidth, selLineWidth);
      // update game score
      var mark;
      var color;
      var t = new Date().getTime();
      if(gridsel[idx[0]][idx[1]] == 1 && gridselans[idx[0]][idx[1]] == 1){
        mark = basemark;
        gridmark[idx[0]][idx[1]] = mark;
        color = "#94FA3A";
        truesound.play();

        var cnt = 0;
        for(var i = 0; i < numgrids[0]; i++){
          for(var j = 0; j < numgrids[1]; j++){
            if(gridsel[i][j] == 1 && gridselans[i][j] == 1) cnt++;
          }
        }
        if(cnt == numshown) MEMTESTON = false;
      }else if(gridsel[idx[0]][idx[1]] == 1 && gridselans[idx[0]][idx[1]] == 0){
        // mark = -penaltymark - stepmark * Math.floor((t - memtestStartTime)/1000);
        mark = -penaltymark;
        gridmark[idx[0]][idx[1]] = mark;
        color = "#F52600";
        falsesound.play();
      }
      
      drawCage(ctx, gridloc, idx[0], idx[1], gridsel[idx[0]][idx[1]], gridselans[idx[0]][idx[1]], gridsize);
      var str = mark.toString();
      if(mark > 0) str = '+' + str; 
      $('#memmark').css('color', color);
      $('#memmark').html(str);
      $('#memmark').css({'left':(idx[1]+1)*(gridspacing+gridsize[1])+gridx-gridsize[1]/2-$('#memmark').width()/2, 'margin-left':0});
      $('#memmark').css({'top':(idx[0]+1)*(gridspacing+gridsize[0])+gridy-gridsize[0]/2-$('#memmark').height()/2, 'margin-top':0});
      $('#memmark').show();

      var s = 0;
      for(var i = 0; i < numgrids[0]; i++){
        for(var j = 0; j < numgrids[1]; j++){
          s += gridmark[i][j];
        }
      }
      $('#memscore').html(s+killpigscore);
      var x = $('#fsoverlay').width() + numgrids[1]*(gridspacing+gridsize[1])+gridx; 
      displayElm2Center('#memscore', x, $('#fsoverlay').height()/2);

      setTimeout(function(){
        $('#memmark').hide();
        if(MEMTESTON == false) submitMemTest(); // go to the final page
      }, 500);
    }
  }
}

function startMemTest(){
  $('#startmemtestButton').hide();
  $("#fsoverlay" ).fadeTo( 0.3 , 0.2, function() {
    $("#fsoverlay").fadeTo(0, 1.0);
    fsoverlayCtx.clearRect(0, 0, $('#fsoverlay').width(), $('#fsoverlay').height()); 
    fsoverlayCanvas.addEventListener("mousedown", getPosition, false); // mouse click event
    memorytest();
  });
}

function memtestcountdown(t){
  if(MEMTESTON){
    // show message
    var sec = t
    if(sec<10) sec = '0' + sec.toString();
    var str = "<span style='color: #3399FF; font-size: 65px; font-family:lcd'>"+ '00:00:' + sec + "</span>";
    $("#instrmsgP").css({"width":"550px","margin-left":"0"});
    showInstrMsg(str, "#instrmsgP", numgrids[1]*(gridspacing+gridsize[1])+gridx*2, gridy);
    if(t > 0){
      setTimeout(function(){
        memtestcountdown(t-1);
      }, 1000);
    }
  }
}

function memorytestpreview(){
  MEMTESTPREVIEW = true;
  var str = "Part " + numpart + "/" + numpart + ": Relax, you can move your head now. Next, you will see 15 photos: 3 of them you already saw, and 12 new ones. Pigs are hiding behind the 3 photos you already saw -- find the pigs by clicking on them.";
  $("#instrmsgP").html(str);
  $("#instrmsgP").css({"color":"#000", "font-size":"22px","width":"550px","top":"30%","left":"50%", "margin-left":"-275px", "background-color":"#ffc107", "padding":"10px"});
  $("#instrmsgP").show();
  $("#startmemtestButton").css({"width":"370px","top":"50%","left":"50%","right":"50%",  "margin-left":"-185px"});
  $("#startmemtestButton").show();

  gridsel = new Array(numgrids[0]); 
  for(var i = 0; i < numgrids[0]; i++){
    gridsel[i] = new Array(numgrids[1]);
    for(var j = 0; j < numgrids[1]; j++){
      gridsel[i][j] = 0;
    }
  }
  gridloc = getgridloc(gridx, gridy, gridsize, numgrids, gridspacing);
  
  drawGridsImg(fsoverlayCtx, gridloc, gridsize, MEMTESTPREVIEW);
  drawGrids(fsoverlayCtx, gridx, gridy, gridloc, gridsize, gridsel, gridsel, gridColor, selgridColor, gridLineWidth, selLineWidth);
  $('#memscore').html(killpigscore);
  $('#memscore').css({"font-family":"digital", "color": "#F00", "font-size": "100px"});
  $('#bestmemscore').html('BEST SCORE : ' + bestpastscore);
  $('#bestmemscore').css({"width":"145px","font-family":"digital", "color": "#DB9900", "font-size": "20px"});

  var x = $('#fsoverlay').width() + numgrids[1]*(gridspacing+gridsize[1])+gridx; 
  displayElm2Center('#memscore', x, $('#fsoverlay').height()/2);
  displayElm2Center('#bestmemscore', x, $('#fsoverlay').height()/2+150*2);

  $("#fullscreen").fadeTo(0, 0.15);
  $("#memscore").fadeTo(0, 0.2);
  $("#bestmemscore").fadeTo(0, 0.3);
  $("#fsoverlay").fadeTo(0, 0.25);
}

function submitMemTest(){
  $('#instrmsgP').hide();
  var t = new Date().getTime();
  var item = {'action': 'submit','time':t};
  memActionQueue.push(item);
  MEMTESTON = false;
  fsoverlayCanvas.removeEventListener("mousedown", getPosition, false); // mouse click event

  var mark = 0;
  var cnt = 0, cntf = 0; // number of correct/wrong selection
  memtestscore = 0; // total score
  for(var i = 0; i < numgrids[0]; i++){
    for(var j = 0; j < numgrids[1]; j++){
      memtestscore += gridmark[i][j];
      if(gridsel[i][j] == 1 && gridselans[i][j] == 1) cnt++;
      if(gridsel[i][j] == 1 && gridselans[i][j] == 0) cntf++;
    }
  }
  var leftT = Math.max(Math.floor((memetesTimeLimit - (new Date().getTime()) + memtestStartTime)/1000), 0);
  var dT = 0;
  if(leftT > 0 && cnt > 0){
    mark = stepmark_catch * leftT * cnt;
    dT = 800;
    memtestscore += mark;
    str = 'Time Bonus: ' + mark.toString();
    $('#memmark').css('color', "#8925D0");
    $('#memmark').html(str);
    $('#memmark').css({'left':(sW-$('#memmark').width())/2, 'margin-left':0});
    $('#memmark').css({'top':(sH-$('#memmark').height())/2, 'margin-top':0});
    $('#memmark').show();
  }

  var item = {'gridsel':gridsel, 'memtestscore':memtestscore,'gridmark':gridmark, 'bonus':mark, 'killpigscore':killpigscore};
  memActionQueue.push(item);

  $('#memscore').html(memtestscore+killpigscore);
  $('#memscore').show();
  setTimeout(function(){
    $("#fullscreen").fadeTo(0, 0.15);
    $("#memscore").fadeTo(0, 0.2);
    $("#bestmemscore").fadeTo(0, 0.3);

    if(memtestscore > 0) laseracesound.play('awesome');
    memrank = Math.min(Math.max(Math.floor((memtestscore+killpigscore)/maxscore*100), 0), 99); // 0-99

    // bonus money: only apply when get at least two correct, at most one wrong
    if (weightederr != null && cnt >= 2 && cntf <= 1){
      bonusmoney = Math.round(maxbonusmoney*memrank/100*(1-weightederr)*10)/10;
    }else{
      bonusmoney = 0;
    }
    
    resultmsg = 'Congratulations! You have beaten ' + memrank + '% players in the world';
    if(bonusmoney > 0){
      resultmsg += ' and get ' + bonusmoney +'&cent bonus for this HIT!';
    }else{
      resultmsg += "!"; 
    } 
    
    // finishMemTest();
    $('#memmark').hide();
    senddata();
  }, dT);
}

function finishMemTest(){
  $('#memscore').hide();
  $('#bestmemscore').hide();
  $('#finishmemtestButton').hide();
  senddata();
}


// download to local file
function download(){
  var datatosave = JSON.stringify(saveQueue);
  saveToFile(datatosave, download_fname);
}

// train model and estimate gaze
function estimategaze(){
  mlmodel = new MLModel.mlmodel(learning_para);
  model = mlmodel.train(trainQueue, expsequence); // train model
  train_result = mlmodel.predict(trainQueue, expsequence, model, true);
  test_result = mlmodel.predict(testQueue, expsequence, model, true); // prediction

  // cross validation LOO test
  looerr = mlmodel.crossvalidation(trainQueue, expsequence, model, kfold);
  // weighted error
  if (looerr != null){ 
    var meanerr = 0; 
    for(var i = 0; i < looerr.test.length; i++){
      if(i == 0 || i == looerr.test.length-1){
        meanerr += looerr.test[i];
      }else{
        meanerr += looerr.test[i]*2;  
      }
    }
    meanerr /= (2*(looerr.test.length-1));
    weightederr = meanerr;
  }else{
    weightederr = null;
  }
}

// reset to play the video
function visReset(){
  dataPos = 0;
  currVisFrameNum = 0;
  lastShowFrameTime = null;
  smlH = smlW/sW*sH;
  $('#replayButton').prop('disabled', true);
  $('#replayButton').css( "backgroundColor", disableBttnColor);
  visualize();
  
}

// visualize gaze estimation
function visualize(){
  visualRequest = requestAnimationFrame(visualize);
  var time = new Date().getTime();
  if (lastShowFrameTime == null) lastShowFrameTime = time;
    if(time - lastShowFrameTime <= 30) return; // control frame rate: ~30 ms per frame
    lastShowFrameTime = time;

    var frame = getNextFrame();

    if (frame != ''){
      var imgX = new Image;
        imgX.onload = function(){
          imgCanvasCtx.drawImage(imgX,0,0,showW,showH); // display the image
            showInstrMsg("Your Screen", "#vismsgP", sW-drawW+smlx*2+smlW, sH-showH+cvsshift+smly/2);
      // small window frame
            imgCanvasCtx.fillStyle = smlBckColor;
            imgCanvasCtx.fillRect(smlx, smly, smlW, smlH);
            overlayCtx.clearRect(0, 0, showW, showH);
            overlayCtx.lineWidth = smlLineWidth;
            overlayCtx.strokeStyle = smlFrameColor;
            overlayCtx.strokeRect(smlx-1, smly-1, smlW+2, smlH+2);

          // display images
          var mlentry = displayQueue[currVisFrameNum];
          var n = mlentry.index, entry;
          var predict_val = null;
          // get content
          switch(mlentry.type){
            case "train":
              entry = expsequence[trainQueue[n].entryidx];
              if(train_result!=null) predict_val = [train_result.prediction.data[2*n],train_result.prediction.data[2*n+1]];
              break;
            case "test":
              entry = expsequence[testQueue[n].entryidx];
              if(test_result!=null) predict_val = [test_result.prediction.data[2*n],test_result.prediction.data[2*n+1]];
              break;
            case "blank":
              entry = expsequence[blankQueue[n].entryidx];
              break;
          }
          // draw display content
          switch(entry.type){
            case "point":
              overlayCtx.fillStyle = pointBckColor;
          overlayCtx.fillRect(smlx,smly,smlW,smlH);
          var px = entry.location[0]*smlW+smlx, py = entry.location[1]*smlH+smly, pr = smlPntRadius;
          drawCircle(overlayCtx, px, py, pr, pointColor, true);
              break;
            case "image":
              if(cursmlImgSrc!= null && cursmlImgSrc==entry.path){
                var s = Math.min(smlW/image.width, smlH/image.height);
            var w = image.width*s, h = image.height*s;
                      imgCanvasCtx.drawImage(image, smlx+(smlW-w)/2, smly+(smlH-h)/2, w, h);
              }else{
                cancelRequestAnimFrame(visualRequest);
                image = new Image();  
                    image.onload = function() {
                      cursmlImgSrc = image.src;
                        var s = Math.min(smlW/image.width, smlH/image.height);
              var w = image.width*s, h = image.height*s;
                        imgCanvasCtx.drawImage(image, smlx+(smlW-w)/2, smly+(smlH-h)/2, w, h);
                        visualRequest = requestAnimationFrame(visualize);
                    }
                    image.src = entry.path;
              }
              break;
            case "cross":
              var px = 0.5*smlW+smlx, py = 0.5*smlH+smly, pr = smlCrxRadius;
          overlayCtx.fillStyle = crossBckColor;
          overlayCtx.fillRect(smlx,smly,smlW,smlH);
          // draw a cross
          drawCross(overlayCtx, px, py, pr, crossColor, smlCrxLineWidth);
              break;
          }
          // show prediction results
          if (predict_val != null){
            var px = predict_val[0]*smlW+smlx, py = predict_val[1]*smlH+smly, pr = smlPntRadius;
            if (entry.tag == 'train'){
          drawCircle(overlayCtx, px, py, pr, predPntColor, false);  
        }else{
          drawCircle(overlayCtx, px, py, pr, predPntColorTest, false);    
        }
          }
          currVisFrameNum++;
          // visualRequest = requestAnimationFrame(visualize);
        }
        imgX.src = 'data:image/jpeg;base64,'+frame;
    }else{
      if(visualRequest != null) cancelRequestAnimFrame(visualRequest);
      $('#replayButton').prop('disabled', false);
    $('#replayButton').css( "backgroundColor", visBttnColor);
    alert('End of the Video');
    }
}

function getNextFrame(){
  var startPos = ImageData.indexOf(';', dataPos)+1; // skip time stamp
  if (startPos == 0){
    return '';
  }
  var endPos = ImageData.indexOf(';', startPos);
  if (endPos == -1){
    return '';
  }
  dataPos = endPos+1;
  return ImageData.substring(startPos, endPos);
}

function quitfullscreen(){
  if(window.innerHeight == screen.height){
    toggleFullScreen();
  }
  if (MemTest){
    $('#instrmsgP').css('color', msgColor); 
  }
  $('#quitFullScreenButton').hide();
  
}