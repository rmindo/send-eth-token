const fs = require('fs');
const http = require('http');
const dapp = require('./dapp');
const form = require('formidable');



const server = http.createServer(function(req, res) {

  var fn = {};
  var file = new form.IncomingForm();

  var conf = fs.readFileSync('./config.json', 'utf8');
  var html = fs.readFileSync('./public/token.html', 'utf8');

  fn.write = function(data) {
    // Variables
    if(pattern = html.match(/(\{[a-z]+\})/g)) {
      html = html.replace(new RegExp(pattern.join('|'), 'g'), (m) => {
        if(value = data[m.match(/([a-z]+)/g)]) {
          return value;
        }
        return m;
      });
    }
    res.write(html);

    res.end();
  };


  file.parse(req, function(error, fields, files) {

    if(typeof files.file == 'undefined') {
      fn.write({output: '<p>Upload CSV file separated by comma.</p>'});
    } else {
      if(/.csv/.test(files.file.name)) {
        // Temporary file
        let tmp = fs.readFileSync(files.file.path, 'utf8');
        // Send
        dapp.send(JSON.parse(conf), tmp.split('\n')).then((data) => {

          if(Object.keys(data).length > 0) {
            output = `<ul class="items">`;

            for(let i in data) {
              let row = data[i];

              if(row.status) {
                output += `<li class="success">Completed - ${row['address']}</li>`;
              } else {
                output += `<li class="failed">Failed - ${row['address']} (${row['error']})</li>`;
              }
            }
            output += `</ul>`;

            fn.write({output: output});
          } else {
            fn.write({output: 'No results'});
          }
        })
        .catch((e) => console.log(`Error: ${e}`));

      } else {
        fn.write({output: '<p>Invalid file type.</p>'});
      }
    }
  });

});
server.setTimeout(0, () => console.log('Timeout 0'));


server.listen(8000);
