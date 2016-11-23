'use strict'

let fs = require('fs');
let cheerio = require('cheerio');
let ProgressBar = require('progress');
let _ = require('lodash');


let dir = 'websites/answers.semanticweb.com/questions';
let outFile = 'questions.json';


function analyzeFile(inputFile){
  return new Promise((resolve, reject) =>  {
    if(!fs.existsSync(inputFile))
    {
      reject('file does not exists ' + inputFile);
      return;
    }
    fs.readFile(inputFile, 'utf8', (err, content) => {
      if(err) throw err
      else {
        let $ = cheerio.load(content);


        function userInfo(ctx) {
          return {
            name: $('p > a', ctx).text(),
            posted: $('p > strong', ctx).text(),
            timestamp: Date.parse($('p > strong', ctx).text()) || 0,
            reputation: parseInt($('span.score', ctx).text()) || 0,
            profile: $('p > a', ctx).attr('href'),
            id: parseInt($('p > a', ctx).attr('href').split('/')[2])
          }
        }

        function answerInfo(ctx) {
          return {
            content: $('div.answer-body', ctx).html().trim(),
            score: parseInt($('div.post-score', ctx).text()) || 0,
            accepted: $('a.accept-answer.on', ctx).length > 0,
            user: userInfo($('div.post-update-info-container div.post-update-info-user', ctx)),
            comments: $('div.comments-container div.comment', ctx).map((i, tag) => commentInfo($(tag))).get()
          }
        }

        function commentInfo(ctx) {
          return {
            content: $('div.comment-text', ctx).html(),
            score: parseInt($('div.comment-score').text()) || 0,
            user: {
              name: $('div.comment-info a.comment-user', ctx).text(),
              posted: $('div.comment-info span.comment-age', ctx).text().replace(/^\((.*)\)/, '$1'),
              timestamp: Date.parse($('div.comment-info span.comment-age', ctx).text().replace(/^\((.*)\)/, '$1'))  || 0,
              profile: $('div.comment-info a.comment-user', ctx).attr('href'),
              id: parseInt($('div.comment-info a.comment-user', ctx).attr('href').split('/')[2])
            }
          }
        }

        let ctx = $('#wrapper table#question-table');
        resolve({
          title: $('div.headNormal > h1 > a').text(),
          link: $('div.headNormal > h1 > a').attr('href'),
          id: parseInt($('div.headNormal > h1 > a').attr('href').split('/')[2]),
          content: $('div.question-body', ctx).html().trim(),
          tags: $('#question-tags .post-tag', ctx).map((i, tag) => $(tag).text()).get(),
          score: parseInt($('div.post-score', ctx).text()),
          views: parseInt($('div.boxC > p:nth-child(4) > strong', 'div#CARight').text().replace(/\D/g, '')),
          user: userInfo($('div.post-update-info-container div.post-update-info-user', ctx)),
          comments: $('div.comments-container div.comment', ctx).map((i, tag) => commentInfo($(tag))).get(),
          answers: $('#wrapper div.answer').map((i, tag) => answerInfo($(tag))).get()
        });
      }
    });
})
}


let stream = fs.createWriteStream(outFile);
stream.write('{ "questions": [');

fs.readdir(dir, (err, files) => {
  if(err) throw err;
  var qfolders = files.filter(file => file.match(/^\d*$/));
  var bar = new ProgressBar('parsing :current/:total (:percent) [:bar]', {total: qfolders.length });
  var promises = qfolders.map((qfolder) => {
    return new Promise((resolve, reject) =>
      fs.readdir(`${dir}/${qfolder}`, (err, files) => {
        if(err) {
          console.error('could not load folder');
          resolve();
          return;
        }
        var files = files.filter(f => !f.match(/\?/));
        if(files.length === 0) {
          resolve();
          return;
        }
        var file = files[0];
        analyzeFile(`${dir}/${qfolder}/${file}/index.html`).then(
          question => {
            if(!_.isNil(question)) {
              stream.write(JSON.stringify(question, null, 2) + ',\n');
            } else {
              console.error('question is null');
            }
            bar.tick({ question: file});
            resolve();
          },
          reason => {
            console.error(reason);
            resolve();
          }
        );        
      })
    );
  });
  Promise.all(promises).then(() => {
    stream.write(']}');
    stream.end();
    console.log('success');
  });
});
