# Sharing Internet Access in Hotel

These days I'm travelling around, changing from one hotel to another. Almost all hotels provide access to Internet in one of these two ways.

1. Provide a wire. No authentication is needed when accessing Internet through the wire, but obviously only one computer can access Internet.

2. Provide wireless access. I have to pass a web authentication with the given username/password. I guess the authentication mechanism is somehow bound with MAC address, allowing only one computer to access Internet.

But I have two laptops and two phones to access Internet! The point is setting up my Ubuntu laptop as a router. Here's how I cope with these two situations.

1. My laptop is accessing Internet through `eth0`, `wlan0` is idle. So I share `wlan0` as wireless access point: click network manager icon -> Create New Wireless Network. All other computers and mobile devices can access Internet through the newly created wireless access point.

2. My laptop is accessing Internet through the provided web authenticated wireless access point. All other computers and devices can register with the provided wireless access point but cannot pass web authentication. My solution is to set up static private IP adresses for other computers and devices and let them route through my laptop. I have to configure an NAT route on my laptop.

```text
$ sudo bash -c 'echo 1 > /proc/sys/net/ipv4/ip_forward'
$ sudo ip address add 10.22.0.1/24 dev wlan0 broadcast + label wlan0:1
$ sudo iptables -t nat -A POSTROUTING -o wlan0 -s 10.22.0.0/24 -j MASQUERADE
```
