# New Blog Framework Based on node

I've recently learned node.js and got very keen about it. So I migrate my blog from wordpress to a lightweight framework based on node.

## Main Component

There is [a popular blog solution around based on git+github+markdown+jekyll](http://www.yangzhiping.com/tech/writing-space.html):

* git features version control
* github features collaboration and remote backup
* markdown features markup language for writing
* jekyll features web framework for a blog

I really like the idea of integrating blog revision history with git repository. You can get the source code and articles of my blog from <https://github.com/djkings/songjinshan.com_blog>.

Personally, I prefer reStructuredText to markdown. But markdown integrates well with github, which I have to accept. So I take it for writing blogs. But I'm not planning to migrate my book to markdown anytime soon.

And jekyll is written in Ruby on Rails, for which I've found a node alternative called [wheat](https://github.com/creationix/wheat). [howtonode](http://howtonode.org) is a site based on wheat, and I've borrowed a lot from that site.

What's more, I've integrated [disqus](http://disqus.com) for commenting so I don't need to implement that part. This really saves a lot of trouble.

## Deployment

When it comes to deployment I see the limitations. I have to keep running nginx for other services, hence node can't serve 80 port. The only choice is to have node listen on another port and have nginx reverse proxy to that port:

```text
location /blog/ {
    rewrite ^/blog/(.*)$ /$1 break;
    proxy_pass http://localhost:10000;
    proxy_set_header X-Real-IP $remote_addr;
}
```

By the `rewrite` directive the node application can keep the assumption of serving the root path. But hyperlinks in html is tricky. All the `href` values of absolute paths in html templates must have a `/blog/` prefix. Maybe it's better to have a configuration variable called `url_prefix` which can be rendered into html templates.

This reverse proxy stuff has virtually offsetted the performance boost brought by node. But for a tiny blog as mine, I don't care that much.

Another chore is to figure out a service start/stop script. Trivial as it seems, it is often tricky. This time I found a pretty cool stuff coming from the node community called [forever](https://github.com/nodejitsu/forever). I end up throwing a line of `forever` command into `rc.local` instead of writing an `init.d` or `upstart` script.

## My Comment on node Web Development

Cool, but tricky. Asynchronous code is not that easy to grasp as synchronous code. But once I get used to the conventions and paradigms, it becomes easier, but still trickier than writing synchronous code. An missed event (i.e. a missed transition of the state machine) can block both server and client without any exception or error message. Debugging is also trickier. Since it's unpredictable when a specific function will get called, I have to change breakpoints and run over again and again.

Anyway, async is the right way to do things. I will stick to it.

## TODOs

The color highlighting for code snippets isn't quite right by now. I've got to figure out a solution later.

I need to implement a category list view and paginate article list on the sidebar.
