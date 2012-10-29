# Setup ucomment

I plan to bring my book online and build around it a commenting system resembling [The Django Book](http://www.djangobook.com/). I find [ucomment](http://ucomment.org) meets my needs to some extent, though I don't like the idea of mixing comments with the book itself. With ucomment, the document is written in reStructuredText, converted using sphinx, and version controlled by mercurial along with all the comments. I'll record the setting up steps here and keep updating this blog as I make further progress. In fact I'm thinking of revolving around this solution and coming up with a solution I like better.

## Dependency

```text
$ sudo aptitude install python-dev python-mysqldb python-setuptools
$ sudo easy_install sphinx django mercurial flup
```

Currently this will install `Sphinx-1.1.3`, `Django-1.4`, and `mercurial-2.2.1`.

## Setup a django Project with ucomment App

I set up my project mostly along the lines of [the official installation documentation](http://ucomment.org/installation/), though django 1.4 project needs some tweaks to adapt to the installation instructions.

1) I have to disable csrf middleware, because when ucomment requests `POST /document/_retrieve-comment-counts/` (which is an AJAX request) the middleware will return 403 Forbidden. Just comment out `'django.middleware.csrf.CsrfViewMiddleware',` from `MIDDLEWARE_CLASSES` in project file `settings.py`. I guess this may leave some security loophole. I'll fix that later when I get better understanding about this middleware.

2) The installation documentation says I should add `(r'^document/', include('ucommentapp.urls')),` to project file `urls.py`, but it turns out what should be added is `url(r'^document/', include('ucommentapp.urls')),`. Besides, I should uncomment all the lines about admin mechanism in `urls.py` and `settings.py` to enable it. Another problem is that django development server (run by `./manager.py runserver`) won't serve media files by default, I have to add a few lines to `urls.py` to make it work out (this solution comes from [muhuk's blog](http://www.muhuk.com/2009/05/serving-static-media-in-django-development-server/)):

```python
from django.conf import settings
if settings.DEBUG:
    from django.views.static import serve
    _media_url = settings.MEDIA_URL
    if _media_url.startswith('/'):
        _media_url = _media_url[1:]
        urlpatterns += patterns('',
                                (r'^%s(?P<path>.*)$' % _media_url,
                                serve,
                                {'document_root': settings.MEDIA_ROOT}))
    del(_media_url, serve)
```

3) Change the repository address in `ucommentapp/conf/settings.py` to the address of my documentation's mercurial repository. The original address refers to ucomment official documentation's repository, which is a good example of a structured document.

   [The official installation documentation](http://ucomment.org/installation/) only says I should edit `ucommentapp/conf/settings.py` accordingly. It doesn't mention the key step is to change the repository address. I think this is a defect.
