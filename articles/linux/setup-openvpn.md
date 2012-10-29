# Setup OpenVPN

This article shows how to setup an OpenVPN server to get around Gr8 F*cking Wall selectively: all flow abroad will go through VPN, while all domestic flow will go through default gateway as usual.

## Build CA and Certificates

```text
$ sudo apt-get install openvpn
$ cp /usr/share/doc/openvpn/examples/easy-rsa/2.0 ~
$ cd 2.0
$ source vars
$ ./clean-all # clean up keys directory
$ ./build-ca # generate CA key under keys directory
$ ./build-key-server <servername> # generate server key under keys directory
$ ./build-key <clientname> # generate client key under keys directory
$ ./build-dh # generate diffie-hellman parameter under keys directory
```

Hereafter, whenever I need to generate certificates for a new client, I only need these steps:

```text
$ cd 2.0
$ source vars
$ ./build-key <clientname>
```

## Server Configuration

```text
$ cd /etc/openvpn
$ sudo cp /usr/share/doc/openvpn/examples/sample-config-files/server.conf.gz .
$ sudo gunzip server.conf.gz
```

Then copy these previously generated files to `/etc/openvpn`:

* ca.crt
* server.crt
* server.key
* dh1024.pem

These files are referred to in `server.conf`. Then modify `server.conf` accordingly:

* Uncomment `push "route a.b.c.d 255.255.255.0"` if I need access to the remote LAN. But I only need to access remote VPS server, so leave it alone.
* Uncomment `push "dhcp-option DNS a.b.c.d"` and set it to google DNS (8.8.8.8 and 8.8.8.4).
* Add `max-routes 2000` at the top, to accommodate a route table from [chnroutes](http://code.google.com/p/chnroutes) later.
* Uncomment `client-config-dir ccd` and meanwhile make a directory called `ccd` under `/etc/openvpn`, into which I'll put a file called `DEFAULT`. That file comes from [chnroutes](http://code.google.com/p/chnroutes), and will be pushed to clients whenever a client connects to this server.
* Change `server 10.8.0.0 255.255.255.0` to my own VPN subnet address.
* Uncomment `push "redirect-gateway def1 bypass-dhcp"`, so that when a client connects to this server its default gateway will be changed to this server.
* Uncomment `client-to-client` to enable clients to see each other.

At the server side, enable `ip_forward` and NAT for the new VPN subnet:

```text
$ sudo vi /etc/sysctl.conf # set net.ipv4.ip_forward=1
$ sudo sysctl -p
$ sudo iptables -t nat -A POSTROUTING -s 172.16.192.0/24 -o eth0 -j MASQUERADE
$ sudo iptables-save >/etc/iptables.rules
```

Then create an executable script file `/etc/network/if-up.d/iptables` which says:

```bash
#!/bin/sh
iptables-restore < /etc/iptables.rules
```

Lastly, restart services:

```text
$ sudo /etc/init.d/networking restart
$ sudo /etc/init.d/openvpn restart
```

Fetch a route table from [chnroutes](http://code.google.com/p/chnroutes) and transform it into certain form:

```text
# wget http://chnroutes.googlecode.com/files/routes.txt -O - -q|sed  's/route/push \"route/' |sed  's/net_gateway 5/net_gateway\"/' > /etc/openvpn/ccd/DEFAULT
```

Since `routes.txt` will be regularly updated online. This command can be add to `crontab` for periodical execution, maybe once per month. When a client connects to this VPN server, it can reach networks within China by the directions of this route table and reach networks abroad through VPN server.

## Client Configuration

First install `openvpn` package. Then copy these previously generated files from server to client:

* ca.crt
* client.key
* client.crt

These files are referred to in `client.conf`. Now copy `/usr/share/doc/openvpn/examples/sample-config-files/client.conf` to the same directory as above, and edit it accordingly:

* Edit `remote my-server-1 1194`, change `my-server-1` to the real server address.
* Add `max-routes 2000` at the top.
* Append `up /etc/openvpn/update-resolv-conf` and `down /etc/openvpn/update-resolv-conf` to the end, and before that add `script-security 2` to enable executing external scripts. This will make client update its `/etc/resolv.conf` each time it connects to the server, receiving DNS settings from the server. Note for this `update-resolv-conf` script to function correctly, the package `resolvconf` must have been installed.

All these files can be put directly under `/etc/openvpn`, and the VPN connnection will be established at each startup. Or I can just put these files to another directory, and initiate VPN connection when needed:

```text
$ sudo openvpn --config client.conf
```

Long time testing shows that when the connection keeps idle for several hours it is very likely to get lost. I configure the server and client to communicate on tcp rather than udp, but the problem remains. So I make a workaround - add a crontab task that says:

```text
# m h dom mon dow command
*/2 * * * * ping -c 3 -w 10 172.16.192.1 || sudo /etc/init.d/openvpn restart
```