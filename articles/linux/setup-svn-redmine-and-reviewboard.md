# Setup svn redmine and reviewboard

NOTE This memo is incomplete because the svn and redmine environment has been set up for a long time. I only leave some hints and config file fragments here. If I am to set up another such environment, I'll complete this memo by then.

## Dependency

The following packages should be prepared first:

```text
$ sudo aptitude install subversion subversion-tools sendmail apache php5 libapache2-svn libapache2-mod-python python-dev memcached python-svn ruby rubygems ruby-dev libgemplugin-ruby mysql-server libruby-extras rails rake apache2-threaded-dev libapache-dbi-perl libapache2-mod-perl2 libdigest-sha1-perl
$ sudo easy-install python-memcached ReviewBoard RBTools
```

## directory tree settings

Suppose all svn related files are put under `/opt/svnrepos`:

```text
/opt/svnrepose
|---svnproj
|   `---hooks
|       |---pre-commit
|       `---post-commit
|---redmine
|   `---public
|---reviews
|---www
|   |---svnindex.xsl
|   |---svnindex.css
|   `---redmine -> ../redmine/public
|---update-post-review
|---svn-auth
|---svn-access
`---LASTREV
```

## svn Configuration

`svn-auth` is svn account file. Use this command to add a user account or modify the password of an existing user:

```text
$ htpasswd -m svn-auth bob
```

All user accounts should be assigned to at least one group, access to svn repository is based on group ACL. This is accomplished in `svn-access`:

```text
# http://svnbook.red-bean.com/en/1.4/svn.serverconfig.pathbasedauthz.html
[groups]
dev_team = bob, alice
support_team = bill

[/branches]
@support_team = r

[/dev/support]
@support_team = rw

[/]
@dev_team = rw
```

These two files are accessed by Apache for authentication and authorization respectively. See the `httpd.conf` configuration below.

Here is the `pre-commit` hook script, enforcing the commit message to start with "refs #999: ", which can be utilized by redmine to associate commits to relevant issues:

```bash
#!/bin/sh

REPOS="$1"
TXN="$2"

# Make sure that the log message contains some text.
SVNLOOK=/usr/bin/svnlook
COMMIT_MSG=`$SVNLOOK log -t "$TXN" "$REPOS"`

echo "$COMMIT_MSG" | egrep "^refs #[0-9]+: " > /dev/null || exit 1
test ${#COMMIT_MSG} -gt 30 || exit 1

# All checks passed, so allow the commit.
exit 0
```

Here is the `post-commit` hook, sending a reporting mail to a mail group:

```bash
#!/bin/sh

REPOS="$1"
REV="$2"

AUTHOR=`svnlook info -r "${REV}" /opt/svnrepos/svnproj | head -1`

/usr/share/subversion/hook-scripts/commit-email.pl --from svnproj@corp.com "$REPOS" "$REV" svnproj@googlegroups.com --summary -s "[svn] ${AUTHOR}" -r svnproj@googlegroups.com
```

## Apache Configuration

Set `/etc/apache2/mods-available` and `/etc/apache2/mods-enabled` to load the following modules:

```text
LoadModule dav_module /usr/lib/apache2/modules/mod_dav.so
LoadModule ssl_module /usr/lib/apache2/modules/mod_ssl.so
LoadModule dav_svn_module /usr/lib/apache2/modules/mod_dav_svn.so
LoadModule authz_svn_module /usr/lib/apache2/modules/mod_authz_svn.so
LoadModule python_module /usr/lib/apache2/modules/mod_python.so
```

Add to `/etc/apache2` directory a set of generated certificates:

```text
server-ca.crt
server.crt
server.csr
server.key
```

Edit `/etc/apache2/httpd.conf`:

```text
<FilesMatch "^\.svn">
    Order allow,deny
    Deny from all
    Satisfy All
</FilesMatch>

<Directory "/opt/svnrepos/www">
    Options FollowSymLinks
    AllowOverride None
    Order allow,deny
    Allow from all
</Directory>

<VirtualHost *:80>
    ServerAdmin admin@corp.com
    DocumentRoot /opt/svnrepos/www
    ServerName corp.com
</VirtualHost>

<VirtualHost *:443>
    ServerAdmin admin@corp.com
    DocumentRoot /opt/svnrepos/www
    ServerName corp.com
    ErrorLog /var/log/corp.com-error_log
    CustomLog /var/log/corp.com-access_log combined

    SSLEngine on
    SSLCipherSuite ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP:+eNULL
    SSLCertificateChainFile /etc/apache2/server-ca.crt
    SSLCertificateFile /etc/apache2/server.crt
    SSLCertificateKeyFile /etc/apache2/server.key
    BrowserMatch ".*MSIE.*" nokeepalive ssl-unclean-shutdown downgrade-1.0 force-response-1.0

    # http://svnbook.red-bean.com/en/1.4/svn.serverconfig.httpd.html
    <Location /svn/svnproj>
        DAV svn
        SVNPath /opt/svnrepos/svnproj
        AuthzSVNAccessFile /opt/svnrepos/svn-access
        SVNIndexXSLT "/svnindex.xsl"

        AuthType Basic
        AuthName "svnproj repository"
        AuthUserFile /opt/svnrepos/svn-auth
        Require valid-user
    </Location>

    RailsEnv production
    RailsBaseURI /redmine

    <Directory /opt/svnrepos/www/redmine>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride None
        Order allow,deny
        allow from all
    </Directory>

    <Location /reviews>
        PythonPath "['/opt/svnrepos/reviews/conf'] + sys.path"
        SetEnv DJANGO_SETTINGS_MODULE reviewboard.settings
        SetEnv PYTHON_EGG_CACHE "/opt/svnrepos/reviews/tmp/egg_cache"
        SetHandler mod_python
        PythonHandler django.core.handlers.modpython
        PythonAutoReload Off
        PythonDebug Off
        # Used to run multiple mod_python sites in the same apache
        PythonInterpreter reviewboard_reviews
    </Location>

    # Serve static media without running it through mod_python
    # (overrides the above)
    <Location "/reviews/media">
        SetHandler None
    </Location>

    <Location "/reviews/errordocs">
        SetHandler None
    </Location>

    # Alias static media requests to filesystem
    Alias /reviews/media "/opt/svnrepos/reviews/htdocs/media"
    Alias /reviews/errordocs "/opt/svnrepos/reviews/htdocs/errordocs"

</VirtualHost>
```

## redmine

Mostly log onto redmine website, and configure svn repository in the settings page - set "SCM" to "Subversion", set "URL" to `file:///opt/svnrepos/svnproj`, no username or password needed.

## reviewboard

I once wrote the following script, scheduled to be run by `cron` every 10 minutes:

```bash
#!/bin/bash

HEADREV=`svn info file:///opt/svnrepos/svnproj | awk '/^Last Changed Rev:/ {print $4}'`
LASTREV=`cat /opt/svnrepos/LASTREV`

REV=$((LASTREV+1))

while [ "$REV" -le "$HEADREV" ]; do 

   LINES=`svn log -r "${REV}" file:///opt/svnrepos/svnproj|wc|awk '{print $1}'`
   AUTHOR=`svn log -r "${REV}" file:///opt/svnrepos/svnproj |sed -n '2 p'|awk '{print $3}'`
   DESC=`svn log -r "${REV}" file:///opt/svnrepos/svnproj |sed -n "4,$((LINES-1)) p"`

   if [ ${#DESC} -gt 100 ]; then
       SUMMARY="${DESC:0:100}..."
   else
       SUMMARY="${DESC}"
   fi

   /usr/local/bin/post-review --server=https://corp.com/reviews --revision-range="$((REV-1)):${REV}" --repository-url=file:///opt/svnrepos/svnproj --username=admin --password=123456 --submit-as="${AUTHOR}" --publish --summary="r${REV} - ${SUMMARY}" --description="${DESC}"
   echo "${REV}" >/opt/svnrepos/LASTREV
   REV=$((REV+1))

done
```
