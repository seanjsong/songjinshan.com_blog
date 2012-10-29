# Open iptables for ftp on CentOS

Once I configured the firewall on a CentOS system to let through ftp flow while blocking all others. I opened port 21 and it didn't work. Then I realized by ftp protocol the client and server would negotiate over port 21 to determine another port for data transfer.

The problem is the port for data transfer is variable from connection to connection and can't be specified in `iptables` rules in advance. But being a firewall it must have some mechanism to let through ftp flow. So I guess there must be an ftp-specific solution. And I'm right.

On CentOS, edit `/etc/sysconfig/iptables-config` to enable ftp-specific modules for `iptables`:

```text
IPTABLES_MODULES="ip_conntrack_ftp"
IPTABLES_MODULES="ip_nat_ftp"
```

Then restart `iptables` service, and it works. `iptables` depends on `conntrack` to look into ftp protocol packet and then track the data transfer port.