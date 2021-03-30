function printTest(text){
    console.log(text)
}

function addText(thumbnail){
    for(var j=0; j<text.length; j++){
        if(text[j].Inventarnummern!=null){
            if( text[j].Inventarnummern.toString().indexOf(thumbnail.id)>-1){

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
                    
            if( text[j].Inventarnummern.toString().indexOf(thumbnail.id)>-1){

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

      console.log( minuteStr+":"+secondStr)
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