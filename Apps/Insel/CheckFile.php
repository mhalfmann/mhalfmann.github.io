<?php
if(!isset($_POST["file"])) 
    {
        echo ("NO DATA RECIEVED");
        return;
    }
$filename = $_POST["file"];
if (file_exists($filename)) {
    echo "file";
} else {
    echo "none";
}
?>