# Writing Blogs in reStructuredText and Paste into WordPress

This is my previous blogging workflow. Obviously it's not as straightforward as the current github+wheat solution. But I record it here anyway. At that time the ideal workflow in my mind was like:

1. write blogs in emacs, in the form of reStructuredText
2. commit changes into git repository
3. the git repository should have some sort of post-commit hook which transforms the modified file into WordPress HTML format and updates my WordPress site in a RESTful way

Unfortunately I've found no easy way to achieve the last step, mostly for the lack of a RESTful interface in WordPress. I've studied several WordPress plugins as well as its builtin xmlrpc interface but with no luck. All I need is simply updating posts and pages identified by permalinks rather than IDs. I prefer to use slugs as identifiers because I name directories and files by slugs in git repository. I have to keep on searching or come up with a home-grown solution. Anyway, I've done with the transformation part - transforming my blogs to WordPress HTML format.

## dependency

First I need python components `docutils` and `pygments` as well as `xclip` package:

```text
$ sudo easy_install docutils pygments
$ sudo aptitude install xclip
```

## transforming reStructuredText to WordPress HTML

To convert reStructuredText to HTML and highlight code snippet, I find [some utility in docutils' sandbox](http://docutils.sourceforge.net/sandbox/code-block-directive/), and then make some tweaks around it:

```python
#!/usr/bin/python

import os, sys, subprocess, re

if len(sys.argv) != 2:
    print >>sys.stderr, "Usage: rst2wordpress input_file.rst"
    sys.exit(1)

html_buf = subprocess.Popen([os.path.dirname(sys.argv[0]) + '/code-block-directive/rst2html-highlight.py', sys.argv[1]],
                            stdout=subprocess.PIPE).communicate()[0]

# cut header and footer, add reference to rst2html-hightlight.css
left_cut = html_buf.find("</h1>") + 5
right_cut = html_buf.rfind("</div>")
html_buf = '<link href="/static/rst2html-highlight.css" rel="stylesheet" type="text/css"/>' + html_buf[left_cut:right_cut]

# insert <!--more--> after the third text block (<p> or <pre>)
count = 0
pos = 0
for m in re.finditer(r'</p>|</pre>', html_buf):
    count += 1
    if count == 3:
        pos = m.end() + 1

if pos > 0:
    html_buf = html_buf[:pos] + '<!--more-->' + html_buf[pos:]

process = subprocess.Popen(["xclip", "-selection", "c"], stdin=subprocess.PIPE)
process.stdin.write(html_buf)
process.stdin.close()
process.wait()
```

Basically, I manipulate the outcome of `rst2html-highlight.py` in four ways:

1. extract all css code from the outcome, together with the highlight css code produced by command `pygmentize -S emacs -f html` I put them all in a static file `rst2html-highlight.css` which is added as a `link href` reference in the outcome
2. cut off html header and footer, because WordPress needs an HTML fragment rather than a complete HTML document
3. insert a `<!--more-->` mark after the third text block, to help WordPress partially display each blog on the home page
4. launch `xclip` to absorb the outcome into clipboard, then I can easily update the blog in WordPress' textarea by Ctrl-A Ctrl-V
