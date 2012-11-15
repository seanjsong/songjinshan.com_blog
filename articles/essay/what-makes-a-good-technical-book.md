# What Makes a Good Technical Book

These years a large portion of my time has been spent on reading technical books. Recently, when I finish reading one book I'll make some comments on [douban](http://book.douban.com). The principle of my judgement is simple: I wanna invest little time while get the most out of the book. If the book allows me to read that way, then it is a good book.

I write technical books myself. Of course those practices that I despise will not appear in [my own book](http://songjinshan.com/akabook/).

## Any Part of a Book Should be Less than 300 Pages, Ideally Less than 200

[Node: Up and Running](http://shop.oreilly.com/product/0636920015956.do) is a wonderful book, because it has only 200 pages including glossary and index. This book set a good example for any technical books that can be deemed helpful. The documentation and API reference of node.js is out there. As a node.js book, it should only reveal the basic principles underneath all those APIs, and teach people how to comfortably resort to the online documentation from time to time in development. That's all. Any attempts to replicate the online documentation in a book is stupid.

From this perspective, [Pro Git](http://git-scm.com/book) is a good book, covering all the key concepts and internal working mechanisms of Git in a reasonable length, though I think it can be further reduced to 200 pages. In contrast, [Version Control with Git](http://shop.oreilly.com/product/9780596520137.do) is a bad book, 100 pages more than Pro Git, crammed with a lot of gory details, but still not as in-depth as Pro Git.

[JavaScript: The Definitive Guide](http://shop.oreilly.com/product/9780596805531.do) is also a good book despite its 1000 pages length. The author is very smart to divide the book into four parts: Core JavaScript, Clien-Side JavaScript, Core JavaScript Reference, Clien-Side JavaScript Reference. The latter two parts are replication of documentation, but it's obvious so we don't need to waste time reading those parts. The first two parts take up 300 pages each, quite fair for such complicated topics. What's most brilliant is the first two parts have good orthogonality. I can just read through the first part and begin hacking on node.js. Having knowledge of client-side JavaScript is of no help to programming server-side JavaScript. The author knows this and intentionally separates these two parts.

<!--how to arrange cohesive chapters, from basic to advanced, not one by one, one by one creates too many cross references-->

## To Some Authors: Please Don't Show off Your Literary Skills in a Technical Book

I do not enjoy reading technical books. What I do enjoy when reading technical books is gaining techniques and getting things done.

Sprinkling jokes and digressions here and there makes reading the book really painful for me. I've got deadline to meet, I wanna find out about this technique quickly, yet I have to filter out all those irrelevant information. What a headache! Most of the time I don't really appreciate your sense of humor. Even if I do, I would prefer reading those in a novel. When I encounter a joke in [The Hitchhiker's Guide to the Galaxy](http://en.wikipedia.org/wiki/The_Hitchhiker's_Guide_to_the_Galaxy) I would say, "Gee, it's brilliant!" But if I see the same joke in a technical book, "Go to hell!"

And don't write too many footnotes, specially meaningless footnotes. I have to read footnotes anyway, and I'll be upset having to go back and forth, back and forth for each footnote, especially for footnotes like this:

> † Melville, in Moby-Dick, spends much of Chapter 22 (“Cetology”) arguing that the whale is a fish. This sounds
>   silly but he’s not denying that whales have lungs and give milk; he’s arguing for a definition of “fish” based
>   on appearance, as opposed to Linnaeus’s definition “from the law of nature” (ex lege naturae).

Yes, I mean [RESTful Web Services](http://shop.oreilly.com/product/9780596529260.do) is a bad example. This book is too lengthy, contains tons of footnotes, and footnotes like above are really meaningless. What's more, can't you just use [1] [2] [3] to number footnotes? I hate to see * † ‡ §. Even more worse, those footnotes do not usually appear in the same page as their reference points!

Also, do not quote some weird words before starting a chapter, unless you are really a deep thinker like the authors of [SICP](http://mitpress.mit.edu/sicp/full-text/book/book.html).