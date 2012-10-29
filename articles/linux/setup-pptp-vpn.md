# Setup PPTP VPN

OpenVPN is good enough for getting around Gr8 F*cking Wall, but I have to setup a PPTP VPN service so that my not-jailbreaked iPhone and iPad can take advantage of it.

However, setting up PPTP VPN is more complicated than setting up OpenVPN. Sometimes my router or ISP interferes with the connection, and I have to restart my router or move to another place to access Internet. Sometimes the connection request just fails with no good reason. Sometimes the connection is very unstable and get lost frequently after successfully connected. The online discussion threads are always mysterious.

Anyway I've tried my best to configure it to be usable, by which I mean usable with some luck.

## Preparation

```text
$ sudo aptitude install pptpd
```

## Configuration

Edit `/etc/pptpd.conf`, add:

```text
localip 172.16.195.1
remoteip 172.16.195.101-200
```

Providing DNS server for VPN clients is necessary. Some clients, such as iPhone, will forget its own DNS server as soon as VPN connection is established. Add some DNS server address to `/etc/ppp/pptpd-options`:

```text
ms-dns 8.8.8.8
ms-dns 8.8.4.4
```

Another tweak is made in `/etc/ppp/options`:

```text
mtu 1400
mru 1400
```

I don't know why MTU size matters. I just do what I've been told to in some online discussion thread, and it works out my connection problem.

To create a VPN account, add one line to `/etc/ppp/chap-secrets`:

```text
# client        server  secret                  IP addresses
username        pptpd   password                *
```

Note the server name should conform to what's specified in `/etc/ppp/pptpd-options`, which defaults to `pptpd`.

Lastly, restart pptpd service:

```text
$ sudo service pptpd restart
```

So far we can only make connections from clients to VPS server. To pass through VPS server and access other websites needs a further tweak. First, edit `/etc/sysctl.conf`, uncomment `net.ipv4.ip_forward=1`, and make it go into effect immediately by:

```text
$ sudo sysctl -p
```

Having enabled ip forwarding, we need setup an NAT rule for iptables:

```text
$ iptables -t nat -A POSTROUTING -o eth0 -s 172.16.195.0/24 -j MASQUERADE
```

We can append this command line to `/etc/rc.local` for permanent effectiveness, or use the same technique mentioned in [setup openvpn](/blog/setup-openvpn).

## chnroutes

With OpenVPN we can push those routes from the server, but now we have to setup those routes on the client side. Follow the instructions on <http://code.google.com/p/chnroutes/wiki/Usage>.