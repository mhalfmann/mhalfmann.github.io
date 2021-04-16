function getCurrentTime(){
  let d = new Date()

  return (d.getTime()-startTime)/1000
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

  function loaded(img){

    let imgOuterWidth = document.getElementById("infoImage").getBoundingClientRect().width
    let imgOuterHeight = document.getElementById("infoImage").getBoundingClientRect().height
    let textOuterWidth = document.getElementById("infoText").getBoundingClientRect().width
    let textOuterHeight = document.getElementById("infoText").getBoundingClientRect().height
    
    let imgInnerWidth = document.getElementById("infoImageIMG").getBoundingClientRect().width
    let imgInnerHeight = document.getElementById("infoImageIMG").getBoundingClientRect().height
    let textInnerWidth = document.getElementById("infoTextTXT").getBoundingClientRect().width
    let textInnerHeight = document.getElementById("infoTextTXT").getBoundingClientRect().height
    // let cardWidth = imgWidth+textWidth      

    let imgPosX = (imgOuterWidth-imgInnerWidth)/2
    let imgPosY = (imgOuterHeight-imgInnerHeight)/2
    let txtPosY = (textOuterHeight-textInnerHeight)/2

    // console.log(imgOuterWidth,imgInnerWidth,imgPosX)

    // let left = (screenWidth-cardWidth)/2

    // iCard.style.width = cardWidth+"px"
    // iCard.style.height = imgHeight+"px"
    // iCard.style.left = left+"px"
    // iCard.style.left = "15%"
    iImage.style.left = imgPosX+"px"
    iImage.style.top = imgPosY+"px"
    iText.style.top = txtPosY+"px"

    iCard.style.visibility = "visible"
  }

  function showLargeImage(image){
    // console.log("showing image",image.src)
    iCard.style.visibility = "visible"
    iImage.src = image.src
  }
  function closeInfoCard(){
    iCard.style.visibility = "hidden"
    let id_ = iCard.getAttribute('imgID')+"Num"+iCard.getAttribute("objNumber")
    
    infoCardEndTime = getCurrentTime()
    let deltaT = (infoCardEndTime-infoCardStartTime)
    
    viewingTimes[id_]=viewingTimes[id_]+deltaT

    objectSequence+=" "+id_+"_"+deltaT
    objectNumberSequence+=" objectNumber"+iCard.getAttribute("objNumber")+"_"+deltaT
    
    logString("infoCardClosed","ObjectName#"+id_+"*ObjectNumber#"+iCard.getAttribute("objNumber")+"*ViewingTime#"+deltaT)
    enableArrowButtons()
  }
    
  function incrementCount(t){
    setTimeText(t)
    setInterval(function(){
      t--
      currentTime++
      setTimeText(t)
      if(t ==0){
        exit()
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
    if(data.endsWith("*"))data=data.substr(0,data.length-1)
    data+="*Condition#"+condition
    data+="*TimeStamp#"+getCurrentTime()

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

  function disableThumbnails(){
    for(var i=1; i<thumbnailArray.length; i++){      
      thumbnailArray[i].style.pointerEvents = "none"
    }
  }
  function enableThumbnails(){
    for(var i=1; i<thumbnailArray.length; i++){      
      thumbnailArray[i].style.pointerEvents = "all"
    }
  }
  function isObjectVisible(obj){
    let test = false
    let objPos = obj.getBoundingClientRect().left + obj.getBoundingClientRect().width*0.5
    let imgBarL = imgBar.getBoundingClientRect().left
    let imgBarR = imgBar.getBoundingClientRect().right
    if(condition == "2D_Multi")if(objPos >= imgBarL && objPos <= imgBarR) test = true
    if(condition == "2D_Single")if(obj.style.opacity == 1) test = true
    return test
  }

  function isObjectVisibleCenter(obj){
    let test = false
    let objPos = obj.getBoundingClientRect().left + obj.getBoundingClientRect().width*0.5
    let left = leftBar.getBoundingClientRect().left
    let right = rightBar.getBoundingClientRect().right
    if(condition == "2D_Multi")if(objPos >= left && objPos <= right) test = true
    if(condition == "2D_Single")if(obj.style.opacity == 1) test = true
    // if(test)console.log(obj.id)
    return test
  }

  function preventScroll(e){
    e.preventDefault()
  }

  function exit(){
    console.log("EXIT")
    if(iCard.style.visibility == "visible")closeInfoCard()
    if(iCard.style.visibility == "hidden"){          
      let deltaT = getCurrentTime() - infoCardEndTime
      objectSequence+=" None_"+deltaT
      objectNumberSequence+=" None_"+deltaT
    }
    overlay.style.visibility = "visible"
    gameOver = true
    overlayText.style.top = (screenHeight/2 - overlayText.getBoundingClientRect().height/2) +"px"
    overlayText.innerHTML = "Ende <br><br>Bitte rechts oben auf 'weiter' klicken um fortzufahren"
    let viewingTimesData = ""
    for(var key in viewingTimes) {
      var value = viewingTimes[key]
      viewingTimesData+="Z"+key+"#"+value+"*"
    }
    logString("end","TimeStamp#"+getCurrentTime())
    logString("objectSequence","ObjectSequence#"+objectSequence)
    logString("objectNumberSequence","ObjectNumberSequence#"+objectNumberSequence)
    logString("viewingTimes",viewingTimesData)
    iwmstudy_access.enableNextButton()
  }