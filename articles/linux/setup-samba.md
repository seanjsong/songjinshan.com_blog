# Setup samba

I need samba service to facilitate file sharing between Windows desktop and VPN server. So I configure a simple one.

```text
$ sudo aptitude install samba
$ sudo smbpasswd -a username
(Enter the samba access password for username)
```

Edit `/etc/samba/smb.conf`:

```text
[global]
   display charset = UTF-8
   unix charset = UTF-8
   dos charset = cp936
   security = user

[shared_folder_visible_name]
   comment = comments for this shared folder
   path = /path/to/shared_folder
   public = yes
   writable = yes
   valid users = username
   create mask = 0644
   directory mask = 0755
   force user = username
   force group = username
   available = yes
   browseable = yes
```
