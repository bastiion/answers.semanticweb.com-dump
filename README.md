# answers.semanticweb.com-dump
A script, that transforms questions from answers.semanticweb.com to a JSON file for possible migration

## installation

a recent version of *node* and *npm* is needed. To install the packages type

    npm install

run the transform process by starting it

    node index.js

## data dump

In order to download a copy of the site from the wayback machine
you can use the ruby program wayback-machine-downloader 
(https://github.com/hartator/wayback-machine-downloader).

To download the question pages

    wayback_machine_downloader http://answers.semanticweb.com/questions/

