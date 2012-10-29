# Reading a Whole File into a string with ifstream

A succinct way for such a task:

```cpp
std::ifstream ifs("filename.txt");
std::string str((std::istreambuf_iterator<char>(ifs)), std::istreambuf_iterator<char>());
```

Mind the extra parentheses around the first argument of `str`'s constructor, it's necessary for correct parsing. It's a case of C++'s "most vexing parse" (Scott Meyer's *Effective STL*, Item 6): anything that can be parsed as a declaration **is** a declaration. Without that extra parentheses, compiler will recognize a function declaration named `str` and complain:

> undefined reference to `str(std::istreambuf_iterator<char, std::char_traits<char> >, std::istreambuf_iterator<char, std::char_traits<char> > (*)())'

Here is the most intriguing part. In function declaration

```cpp
std::string str(std::istreambuf_iterator<char>(ifs), std::istreambuf_iterator<char>());
```

`std::istreambuf_iterator<char>(ifs)` is recognized as a parameter named `ifs` of type `std::istreambuf_iterator<char>`, which can be rewritten as (omitting parentheses)

```cpp
std::istreambuf_iterator<char> ifs
```

while `std::istreambuf_iterator<char>()` is recognized as an unnamed parameter of a function pointer type, which can be rewritten as

```cpp
std::istreambuf_iterator<char>(*)()
```
