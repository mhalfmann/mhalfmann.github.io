<?php
	if(!isset($_POST["file"])) 
    {
        echo ("NO DATA RECIEVED");
        return;
    }
    $myFile = $_POST["file"];

    if(file_exists($myFile))
        echo ("file");
    else
        echo ("none");
 ?>