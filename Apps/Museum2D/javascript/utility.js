function getCurrentTime(){
  let d = new Date()
  return d.getTime()
}
function printTest(text){
    console.log(text)
}

function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

function addText(thumbnail){
  let query = thumbnail.id
    if(query.endsWith("L"))query = query.substr(0, query.length-1)
    if(query.endsWith("M"))query = query.substr(0, query.length-1)
    if(query.endsWith("R"))query = query.substr(0, query.length-1)
    for(var j=0; j<text.length; j++){
        if(text[j].Inventarnummern!=null){
            if( text[j].Inventarnummern.toString().indexOf(query)>-1){

              let header = text[j].Uberschrift_deutsch.toString().split('\n')

              for(var k=0; k<header.length; k++){
                if(k==0)infoTextString+="<b>"+header[k]+"</b>"
                if(k!=0)infoTextString+=header[k]
                infoTextString+="<br>"                  
              }                
              infoTextString+="<br><br>"
              infoTextString+=text[j].Text_deutsch.toString()
              thumbnail.setAttribute('textDE',infoTextString)
            }
        }
        infoTextString = ""
        if(text[j].Inventarnummern!=null){  
                    
            if( text[j].Inventarnummern.toString().indexOf(query)>-1){

              let header = text[j].Uberschrift_englisch.toString().split('\n')

              for(var k=0; k<header.length; k++){
                if(k==0)infoTextString+="<b>"+header[k]+"</b>"
                if(k!=0)infoTextString+=header[k]
                infoTextString+="<br>"                  
              }                
              infoTextString+="<br><br>"
              infoTextString+=text[j].Text_englisch.toString()
              thumbnail.setAttribute('textEN',infoTextString)
            }
        }
      }
  }  

  function showLargeImage(image){
    // console.log("showing image",image.src)
    iCard.style.visibility = "visible"
    iImage.src = image.src
  }
    
  function incrementCount(t){
    setTimeText(t)
    setInterval(function(){
      t--
      currentTime++
      setTimeText(t)
      if(t ==0){
        overlay.style.visibility = "visible"
        gameOver = true
        overlayText.innerHTML = "Game Over"
      }
    },1000);
  }

  function setTimeText(cTime){
    minutes = Math.floor(cTime / 60)
      seconds = Math.round(cTime%60)

      secondStr = seconds < 10 ?  "0" + Math.round(seconds) : seconds
      minuteStr = minutes
      if(seconds == 60){
          secondStr = "00"
          minuteStr = (minutes+1)
      }
      timeText.innerHTML = minuteStr+":"+secondStr
  }  

  function changeOrientation(){
    if(window.orientation == 180 || window.orientation == 0){        
      output.innerHTML="portrait mode"
      let h = iCard.getBoundingClientRect().width
      let fSize = h/50
      iText.style.fontSize = fSize+"px"
      // iText.style.fontSize="1.5vw"
    }
    else{        
      output.innerHTML="landscape mode"
      let h = iCard.getBoundingClientRect().height
      let fSize = h/50
      iText.style.fontSize = fSize+"px"
      // iText.style.fontSize="1.5vh"
    }
  }

  function logString(action,data){
    var dict = {}
    
    var entries = data.split("*");
    for (var i=0; i<entries.length; i++){
        dict[entries[i].split("#")[0]]=entries[i].split("#")[1]
    }

    // window.iwmstudy_access.logAction("greeting",dict)
    if(typeof window.iwmstudy_access != 'undefined')window.iwmstudy_access.logAction(action,dict)
    if(typeof window.iwmstudy_access == 'undefined')console.log('logging',action,dict)
  }

  let opacityLeft = 1.0
  let opacityRight = 1.0

  function enableArrowButtons(){
    document.getElementById("goLeft").style.pointerEvents = "all"
    document.getElementById("goRight").style.pointerEvents = "all"

    document.getElementById("goLeft").style.opacity = opacityLeft
    document.getElementById("goRight").style.opacity = opacityRight
  }

  function disableArrowButtons(){
    document.getElementById("goLeft").style.pointerEvents = "none"
    document.getElementById("goRight").style.pointerEvents = "none"

    opacityLeft = document.getElementById("goLeft").style.opacity
    opacityRight = document.getElementById("goRight").style.opacity

    document.getElementById("goLeft").style.opacity = 0.1
    document.getElementById("goRight").style.opacity = 0.1

  }