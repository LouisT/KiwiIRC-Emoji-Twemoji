#!/usr/bin/env node
/*
  Emoji Plugin Generator - Build an emoji plugin for Kiwi IRC using Twemoji.

  Usage: build-plugin [--local] [--baseurl=<URL or Path>]
*/
var fs = require('fs'),
    path = require('path'),
    args = process.argv.slice(2);

var settings = {
    overwrite: false,
    baseurl: '//twemoji.maxcdn.com/2',
    local: false,
    size: '72x72', // Twemoji 2.0 only supports 72x72.
};

if (!fs.existsSync('./twemoji/2/'+settings.size+'/')) {
   console.log('Twemoji is missing! Install with git and run again:\n\n   git clone https://github.com/twitter/twemoji.git');
   process.exit(1);
}

/*
  Parse argv for settings.
*/
args.forEach(function (arg) {
    var match = null;
    if ((match = arg.match(/--baseurl=(.+)/i))) {
       settings.baseurl = match[1];
     } else if ((match = arg.match(/--local/i))) {
       settings.local = true;
    }
});
if (settings.local) {
   if (settings.baseurl.indexOf('maxcdn') >= 0) {
      settings.baseurl = "/kiwi/assets/twemoji";
      console.log('\n\nNOTICE: Local install mode enabled without "--baseurl" - Default: "'+settings.baseurl+'"\n');
   }
   console.log('\nPlease copy "./twemoji/" to: /client/assets/twemoji/');
}

fs.readdir('./twemoji/2/'+settings.size+'/', function (err, files) {
   if (err) {
      throw err;
   }
   var mapped =  files.map(function (file) {
       return path.basename(file, '.png');
   });

   var emojis = [],
       chunking = mapped.slice(0);
   while (chunking.length > 0) {
         emojis.push(chunking.splice(0,200));
   }

   var data = fs.readFileSync('./src/plugin.html').toString();
   var format = {
       size: settings.size,
       baseurl: settings.baseurl,
       buildmode: (settings.local?'Local Install':'CDN Install'),
       date: new Date(),
       count: mapped.length,
       emojiToggles: '\n'+emojis.map(function (arr, idx) {
                         return '    <span class="emojiToggle'+(idx==0?' emojiInit':'')+'" target="t'+idx+'">'+(idx+1)+'</span>';
                     }).join('\n')+'\n ',
       emojiTabs: '\n'+emojis.map(function (arr, idx) {
                     return '    <div class="emojiTab" id="t'+idx+'"></div>';
                 }).join('\n')+'\n ',
       emojis: emojis.map(function (arr, idx) {
                   return '    t'+idx+': ["'+arr.join('","')+'"]';
               }).join(',\n'),
   };

   var plug = 'emoji-plugin.'+(settings.local?'local':'cdn')+'.html';
   fs.writeFileSync('./'+plug,formatter(data,format));
   if (!fs.existsSync('./'+plug)) {
      console.warn('Failed installing pluign to '+paths.plugin);
    } else {
      console.log('\nPlugin created: '+plug+'\n');
   }
});

function formatter (str, values) {
         return str.replace(/{{(?:\\?:)([^|}]+)(?:\|([^|]+))?}}/g,function(match, key, opt) {
                return (values[key]?values[key]:(opt?opt:match));
         });
}
