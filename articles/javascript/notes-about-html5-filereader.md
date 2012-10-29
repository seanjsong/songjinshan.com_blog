# Notes about HTML5 FileReader

Today I have a try with this article: [Reading Files in JavaScript Using the File APIs](http://codeidol.com/unix/unix-network-programming/Multicasting/Multicast-Socket-Options/). The following are something noteworthy about this technique.

## Code Snippet

Here is the code snippet from that article:

```html
<style>
  .thumb {
    height: 75px;
    border: 1px solid #000;
    margin: 10px 5px 0 0;
  }
</style>

<input type="file" id="files" name="files[]" multiple />
<output id="list"></output>

<script>
  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      // Only process image files.
      if (!f.type.match('image.*')) {
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          var span = document.createElement('span');
          span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(theFile.name), '"/>'].join('');
          document.getElementById('list').insertBefore(span, null);
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
    }
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false);
</script>
```

Besides `readAsDataURL`, there are also APIs such as `readAsBinaryString`, `readAsText` etc, used in almost the same way.

## Browser Compatibility

From <http://caniuse.com/#feat=fileapi> <http://caniuse.com/#feat=filereader> we can see File API is currently supported by major browsers except IE. It is probable that IE 10 will support it.

When the example above is loaded from a web server, e.g. `http://localhost/path`, both Firefox and Chrome will work. However, if the example is loaded from local filesystem, e.g. `file:///path`, reading files in Chrome will end up with a FileError because of Chrome's security policy. But this should not be a security concern. Since it is the user who chooses files through the input control, reading these files is with user's consent. Hope Chrome can fix this in the future to facilitate writing offline web apps. Anyway, there is a workaround: if we start Chrome with `--allow-file-access-from-files` option, reading files is allowed. For more see <http://code.google.com/p/chromium/issues/detail?id=60889>.

## When JavaScript's Function Scope Matters

Here is the code skeleton of the example above:

```javascript
for (var i = 0, f; f = files[i]; i++) {
  ...
  reader.onload = (function(theFile) {
    return function(e) {
      // reference theFile here
    };
  })(f);
  ...
}
```

Why bother nesting like this? Why not just write:

```javascript
for (var i = 0, f; f = files[i]; i++) {
  ...
  reader.onload = function(e) {
    // reference f here
  };
  ...
}
```

That's because `f` changes with each iteration. These `onload` handlers are called asynchrously after the loop ends, hence they all end up referencing the last value of `f`. Then how about this:

```javascript
for (var i = 0; i < files.length; i++) {
  var f = files[i];
  ...
  reader.onload = function(e) {
    // reference f here
  };
  ...
}
```

We hope to create a different variable `f` in each iteration to be referenced by each `onload` handler. This doesn't work either. Because JavaScript doesn't have block scope, all local variables including `i` and `f` are actually declared in function scope. So this code is almost the same as the previous one, `f` changes with each iteration and all `onload` handlers end up referencing the last value of `f`.

However, with underscore.js, this really works because we create a new function scope in each iteration:

```javascript
_.each(files, function(f) {
  ...
  reader.onload = function(e) {
    // reference f here
  };
  ...
});
```
