
var addrRegex = /^([a-zA-Z\-\.0-9]+)?:(\d+)$/;

var argv = require('minimist')(process.argv.slice(2));

var connectionLog = {};



function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Bytes';
   var k = 1024,
       dm = decimals <= 0 ? 0 : decimals || 2,
       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

var json_data = JSON.parse(require('fs').readFileSync(__dirname +'/conf.json'));

var listenOn = argv.l || process.env.l || json_data.socks.listenOn;

if(!addrRegex.test(listenOn))
{
	listenOn = null;
}

var port = listenOn.match(addrRegex)[2];// process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;

var ip = listenOn.match(addrRegex)[1];//process.env.IP || process.env.OPENSHIFT_NODEJS_IP || OPENSHIFT_DIY_IP || '0.0.0.0';


if(listenOn == null )
{
    console.log('Usage: node socksserver.js -l "listen_socket"');
    console.log('   listen_socket: socket to listen on for incoming call (server port)');
    console.log('example: node socksserver.js -l "127.0.0.1:8080"');
    console.log('above example will listen on 127.0.0.1:8080');
    console.log('hovewer the IP list of this host is:');

    {
        'use strict';
        var os = require('os');
        var ifaces = os.networkInterfaces();
        Object.keys(ifaces).forEach(function (ifname) {
            var alias = 0;
            ifaces[ifname].forEach(function (iface) {
                if (alias >= 1)
                    console.log(' - '+ifname + ':' + alias, iface.address);
                 else
                    console.log(' - '+ifname, iface.address);
                ++alias;
            });
        });
    }

}
else
{
    console.log('Node Socks Server Listening on: ' + listenOn);
    console.log('Node Socks Server Started Successfully ...');


    var options = {
        ListenOn:{
            Host:ip,
            Port:port
        }
    }

	const lineReader = require('line-reader');

	var wildcards = [];
	
	lineReader.eachLine('bad-hosts-wc.txt', function(line, last) {
			var trd = line.trim();
			
			if(trd)
			{
				if(!trd.startsWith('#'))
				{
					wildcards.push(trd);
					//console.log(trd);
				}
			}
				
		  });
		

    
	

    const socks = require('socks-proxy');
    const net = require('net');
	const micromatch = require('micromatch');

    const server = socks.createServer(function(client){
        var address = client.address;
        var ended = false;
		
        if(address == null)
            console.log("Null Address");
        else
		{
						
				
			var socket_ = net.connect(address.port, address.address, function(err) {

				var drop = micromatch.isMatch(address.address, wildcards);
				
				function closeSession() {
						client.end();
						socket_.end();
						//this.end();
					   client.destroy();
					   socket_.destroy()
					   //this.destroy();
					   ended = true;
					   delete client;
					   delete socket_;
					}
					
				if(drop)
				{
					//console.log('dropping '+address.address);
					
					client.reply(2);//connection not allowed by ruleset
					
					closeSession();
					
				}
				else
				{
					client.reply(0);
					client.pipe(this).pipe(client);
					
					client.on('data', function (chunk) {
						if(connectionLog[client.remoteAddress])
							connectionLog[client.remoteAddress] += chunk.length;
						else
							connectionLog[client.remoteAddress] = chunk.length;
					});
					
					this.on('data', function (chunk) {
						if(connectionLog[client.remoteAddress])
							connectionLog[client.remoteAddress] += chunk.length;
						else
							connectionLog[client.remoteAddress] = chunk.length;
					});

					client.on('end', function () {
						closeSession();
					});
					client.on('error', function () {
						closeSession();
					});


					this.on('end', function () {
						closeSession();
					});
					this.on('error', function () {
						closeSession();
					});
				}
				
                
            });
		}
    });

    var res = server.listen(options.ListenOn.Port,options.ListenOn.Host);

	var http = require('http');
    var url = require('url');
	
	if(json_data.cpanel.port)
	{
		http.createServer(function (req, res) {
	  var queryData = url.parse(req.url, true).query;
	  var authorized = false;
	  var sentSec = '';
	  
	  if(queryData.secret)
		  sentSec = queryData.secret;
	  
	  var h1 = require('crypto').createHash('md5').update(sentSec).digest('hex');
	  var h2 = require('crypto').createHash('md5').update(h1).digest('hex');
		  
	  authorized  = (h2 == json_data.cpanel.secretDoubleMd5);
	  
	  if(authorized)
	  {
		  res.write('<html> Bandwidth Usage by IP: </br>');
		  
		  for (var k in connectionLog){
				if (connectionLog.hasOwnProperty(k)) {
					
					res.write('<p>'+k+':'+formatBytes(connectionLog[k],2));
					//alert("Key is " + k + ", value is" + target[k]);
				}
			}
		res.write('</html>');
	  }
	  else
	  {
		  res.write('<html><h1>404 not found!!!</h1></html>'); //write a response to the client
	  }
	  
	  res.end(); //end the response
	}).listen(json_data.cpanel.port); //the server object listens on port 80

	
	}
	//create a server object:
	
    server.on('error',function (e) {console.log(e);});

    process.on('uncaughtException', function (err) {
        console.log(err);
    })
	
	process.on('SIGINT', function() {
        console.log("Caught interrupt signal");
        process.exit();
    });

}

//app.listen(port, ip);

//console.log('Socks Server running on %s:%s', ip, port);

//module.exports = app ;