
var addrRegex = /^([a-zA-Z\-\.0-9]+)?:(\d+)$/;

var argv = require('minimist')(process.argv.slice(2));

//var openshift_host = null;

//


//if( process.env.OPENSHIFT_NODEJS_IP != null && process.env.OPENSHIFT_NODEJS_PORT != null)
//    openshift_host = (process.env.OPENSHIFT_NODEJS_IP+':'+process.env.OPENSHIFT_NODEJS_PORT);

//console.log('Openshift ip port: ' + (process.env.OPENSHIFT_NODEJS_IP+':'+process.env.OPENSHIFT_NODEJS_PORT));

var listenOn = argv.l || process.env.l;

if(!addrRegex.test(listenOn))
{

    console.log('invalid address: '+listenOn);
    process.exit(1);
}

var port = listenOn.match(addrRegex)[2];// process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;

var ip = listenOn.match(addrRegex)[1];//process.env.IP || process.env.OPENSHIFT_NODEJS_IP || OPENSHIFT_DIY_IP || '0.0.0.0';

//if(listenOn != null)
//    listenOn = listenOn.match(addrRegex);


//var listenOn = ip.toString() + ':' + port.toString();


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
    console.log('listening on: ' + listenOn);
    console.log('socks server started successfully ...');


    var options = {
        ListenOn:{
            Host:ip,
            Port:port
        }
    }


    const socks = require('socks-proxy');
    const net = require('net');

    const server = socks.createServer(function(client){
        var address = client.address;

        if(address == null)
            console.log("Null adress");
        else
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


    var res = server.listen(options.ListenOn.Port,options.ListenOn.Host);


    server.on('error',function (e) {console.log(e);});

    process.on('uncaughtException', function (err) {
        console.log(err);
    })

}

//app.listen(port, ip);

console.log('Server running on http://%s:%s', ip, port);

//module.exports = app ;