<?php
/*
 * Fetch old artists
 */

require_once('simple_html_dom.php');

// Create DOM from URL or file
$html = file_get_html('http://local.dev:1000/nnn/radio_ui.htm');

$entries = array();
$id = 0;

// Find all images 
foreach($html->find('.single-artist') as $el) { 
    $name = $el->find('h3 > a',0)->plaintext;
    $venue_date = explode("\n",$el->find('p',0)->plaintext);
    $venue = str_replace("Venue: ","",$venue_date[0]);
    $date = str_replace("Date: ","",$venue_date[1]);
    $picture = $el->find('.artist-picture a img',0)->src;
    $picture = str_replace("./radio_ui_files","data/artist_thumbs",$picture);
    $entry = array(
        "id" =>   $id,
        "artist_name" => $name,
        "venue" => $venue,
        "date" => $date,
        "picture" => $picture,
        "actions" => array(
            "meetngreet" => rand(0,15),
            "tickets" => rand(0,15),
            "interview" => rand(0,15),
            "appearance" => rand(0,15)
        )
    );
    array_push($entries,$entry);
    $id++;
}

//print_r($entries);
echo json_encode($entries);

?>

