# How INADDR_ANY Affects Multicast

I have once written a streaming media program receiving from a multicast address using `libavformat`. Now I quit that job but I'd like to record the interesting part here.

## Problem

The program had been running pretty well, until some day we put it on a multihomed system and it couldn't receive TS stream from the multicast source. Through `strace` I could see that when it joined the multicast group it was bound to the wildcard address:

```c
setsockopt(4, SOL_IP, IP_ADD_MEMBERSHIP, "\351\23\314\205\0\0\0\0", 8) = 0
```

The trailing `\0\0\0\0` stands for IP address 0.0.0.0. According to the document:

> If the local interface is specified as the wildcard address for IPv4 (`INADDR_ANY`) or as an index of 0 for IPv6, then a single local interface is chosen by the kernel. (<http://codeidol.com/unix/unix-network-programming/Multicasting/Multicast-Socket-Options/>)

I seems that if a system has multiple network interfaces attached and a process on that system joins a mutlicast group bound to `INADDR_ANY`, that doesn't mean that the process can receive from all network interfaces - in fact the kernel will choose an arbitrary network interface for the process to receive from. In this case, if the network interface to which the mutlicast stream arrives is not the one the kernel chooses for the process, the process will receive nothing.

## A Workaround

By experiment I find that adding a route entry can help the kernel to choose the right network interface for the process. For example, if I add this route entry:

```text
$ route add -net 224.0.0.0 netmask 240.0.0.0 dev eth1
```

Then the kernel will choose `eth1` for the process to receive multicast stream, even if it would have otherwise chosen `eth0`.

This trick applies to the case that I need to receive mutlicast stream from only one network interface. If I need to receive from two network interfaces simultaneously, I can't rely on this trick. For example, if I add two route entries for multicast addresses:

```text
$ route add -net 224.0.0.0 netmask 240.0.0.0 dev eth0
$ route add -net 224.0.0.0 netmask 240.0.0.0 dev eth1
```

Then the kernel still chooses `eth0` for the process to receive mutlicast stream.

## General Solution

A more general solution involves modifying relevant code in `libavformat` so that I can specify a network interface for the function `udp_join_multicast_group` in `libavformat/udp.c`:

```c
static int udp_join_multicast_group(int sockfd, struct sockaddr *addr)
{
#ifdef IP_ADD_MEMBERSHIP
    if (addr->sa_family == AF_INET) {
        struct ip_mreq mreq;

        mreq.imr_multiaddr.s_addr = ((struct sockaddr_in *)addr)->sin_addr.s_addr;
        mreq.imr_interface.s_addr = INADDR_ANY;
        if (setsockopt(sockfd, IPPROTO_IP, IP_ADD_MEMBERSHIP, (const void *)&mreq, sizeof(mreq)) < 0) {
            av_log(NULL, AV_LOG_ERROR, "setsockopt(IP_ADD_MEMBERSHIP): %s\n", strerror(errno));
            return -1;
        }
    }
...
```

This function should be added another parameter to replace `INADDR_ANY`, and this parameter reflects the real IP address for a specified network interface. Note all functions from `udp_join_multicast_group` up the calling stack until `av_open_input_file` should be changed to adapt the extra parameter. For compatibility we should keep the old function interfaces and let the old functions call their new one-extra-parameter counterparts:

```c
static int udp_join_multicast_group(int sockfd, struct sockaddr *addr)
{
    struct sockaddr_in if_addr = {0};
    return udp_join_multicast_group_if(sockfd, addr, &if_addr);
}

static int udp_join_multicast_group_if(int sockfd, struct sockaddr *addr, const struct sockaddr *if_addr)
{
#ifdef IP_ADD_MEMBERSHIP
    if (addr->sa_family == AF_INET) {
        struct ip_mreq mreq;

        mreq.imr_multiaddr.s_addr = ((struct sockaddr_in *)addr)->sin_addr.s_addr;
        mreq.imr_interface.s_addr = ((struct sockaddr_in *)if_addr)->sin_addr.s_addr;;
        if (setsockopt(sockfd, IPPROTO_IP, IP_ADD_MEMBERSHIP, (const void *)&mreq, sizeof(mreq)) < 0) {
            av_log(NULL, AV_LOG_ERROR, "setsockopt(IP_ADD_MEMBERSHIP): %s\n", strerror(errno));
            return -1;
        }
    }
...
```

## Another Problem

If the sending and receiving network interfaces have IP addresses of different subnet. Even if they are joined to the same multicast group they can't transmit mutlicast data. I've met such a case in which my receiving process ran on a multihomed system with IP addresses 10.0.101.10 and 10.0.200.10, but the sending system had an IP address of 124.108.14.144, and my process received nothing.

I guess in this case the receiving network interface filters out the packet before it arrives the multicast layer. Maybe setting the network interface to promiscuous mode will work. I haven't tried that. I work around this problem by adding another route entry considering 124.108.14/24 as directly connected subnet:

```text
$ route add -net 124.108.14.0 netmask 255.255.255.0 dev eth1
```
