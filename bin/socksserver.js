
var addrRegex = /^(([a-zA-Z\-\.0-9]+):)?(\d+)$/;

var argv = require('minimist')(process.argv.slice(2));

var openshift_host = null;

if( process.env.OPENSHIFT_NODEJS_IP != null && process.env.OPENSHIFT_NODEJS_PORT != null)
    openshift_host = (process.env.OPENSHIFT_NODEJS_IP+':'+process.env.OPENSHIFT_NODEJS_PORT);

var listenOn = openshift_host || argv.l || process.env.l;

if(listenOn != null)
    listenOn = listenOn.match(addrRegex);

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
    console.log('listening on: ' + listenOn[0]);
    console.log('socks server started successfully ...');


    var options = {
        ListenOn:{
            Host:listenOn[2],
            Port:listenOn[3]
        }
    }


    const socks = require('socks-proxy');
    const net = require('net');

    const server = socks.createServer(function(client){
        var address = client.address;
        net.connect(address.port, address.address, function(err) {
            client.reply(0);
            client.pipe(this).pipe(client);

            client.on('end', function () {
                this.end()
            });
            client.on('error', function () {
                this.end();
            });


            this.on('end', function () {
                client.end()
            });
            this.on('error', function () {
                client.end();
            });

        });
    });

    server.listen(options.ListenOn.Port,options.ListenOn.Host);

    process.on('uncaughtException', function (err) {
        //console.log(err);
    })

}