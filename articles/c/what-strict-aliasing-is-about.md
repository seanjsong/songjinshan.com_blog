# What strict-aliasing is about

Once I came across a gcc optimization problem. The prototype code is:

```c
#include <stdio.h>
#include <stdint.h>

int main (void)
{
    uint64_t n;
    double val;

    n = 0x4087e00000000000LL;
    val = *(double *)&n;
    printf("%f\n", val);

    return 0;
}
```

Here's the result:

```text
$ gcc test1.c -Wall
$ ./a.out
764.000000

$ gcc test1.c -Wall -O3
test1.c: In function 'main':
test1.c:10: warning: dereferencing type-punned pointer will break strict-aliasing rules
$ ./a.out
0.000000

$ gcc test1.c -Wall -O3 -fno-strict-aliasing
$ ./a.out
764.000000
```
 
I searched issues about strict-aliasing and found this article from <http://mail-index.netbsd.org/tech-kern/2003/08/11/0001.html>:

    Subject: Aliasing, pointer casts and gcc 3.3.
    To: None 
    From: Krister Walfridsson 
    List: tech-kern
    Date: 08/11/2003 23:16:48

    I have seen some commits that "fix" gcc 3.3 alias warnings, that does not
    give me warm fuzzy feelings (the commits that is), and I have alse seen a
    lot of confusion about aliasing (and ISO C in general) on different
    mailing lists, so I have tried to explain some of the issues that I know
    have/will bite us.

    Apologies if this is too elementary...

    ALIASING
    ========

    What is aliasing?
    =================
    The hardware-centric view of pointers is that they can point at any
    memory,
    so a write through a pointer may change any variable in a program:

        int i = 23;
        *f = 5;
        /* We don't know what value i has at this point. */

    We cannot know what value i has, since the pointers &i and f may point
    at the same address (that is what ISO C means when it say that &i and f
    may alias).

    This prevents many types of optimizations, and it makes a real difference
    since most pointers in real life cannot point on the same position.  ISO C
    improves the situation (for the compiler) by roughly saying "pointers of
    different types cannot point to the same address".

        int
        foo(float *f) {
                int i = 23;
                *f = 5.0;
                /* A float* cannot point on the same address as int*. */
                return i * 2;
        }

    So the compiler may optimize this to

        int
        foo(float *f) {
                *f = 5.0;
                return 46;
        }

    The ISO specification does not really prevent pointers to point to the
    same address -- it specifies that the result is undefined when you
    dereference a pointer that points to an object of a different
    (incompatible) type.  So the following example is OK:

        int i = 23, *tmp;
        tmp = (int*)f;
        *tmp = 5;
        /* We don't know what value i has at this point. */

    But note the important difference that we are actually writing the memory
    position as an "int" and not as a "float".

    There exist an important exception to the rule above:  char* may alias all
    types (too much code would break if ISO had prevented this...)

    There are cases where you wish to access the same memory as different
    types:

        float *f = 2.718;
        printf("The memory word has value 0x%08x\n", *((int*)f));

    You cannot do that in ISO C, but gcc has an extension in that it
    considers memory in unions as having multiple types, so the following
    will work in gcc (but is not guaranteed to work in other compilers!)

        union {
            int i;
            float f;
        } u;
        u.f = 2.718;
        printf("The memory word has value 0x%08x\n", u.i);

    One bieffect of this is that gcc may miss optimization opportunities
    when you use union-heavy constructs.

    What the standard says [*]
    ==========================
    The aliasing rules are stated in clause 6.5 (Expressions):

     7 An object shall have its stored value accessed only by an lvalue
       expression that has one of the following types: {footnote 73}

         a type compatible with the effective type of the object,

         a qualified version of a type compatible with the effective type of
         the object,

         a type that is the signed or unsigned type corresponding to the
         effective type of the object,

         a type that is the signed or unsigned type corresponding to a
         qualified version of the effective type of the object,

         an aggregate or union type that includes one of the aforementioned
         types among its members (including, recursively, a member of a
         subaggregate or contained union), or

         a character type.

     {footnote 73} The intent of this list is to specify those circumstances
     in which an object may or may not be aliased.

    The gcc warnings
    ================
    gcc may warn for some constructs that break the aliasing rules, but not
    all of them (or not even most of them!), so a warning-free source code
    does not give you any guarantee.

    The most common warning you will see is probably "dereferencing type-
    punned pointer will break strict-aliasing rules".  The place where it
    warns is in general not wrong -- what gcc tries to tell you is that you
    will break the aliasing rules when you dereference the pointer later
    (unless you cast it back to its original type first).  This warning
    should be interpreted as saying that your interfaces are badly designed,
    and the correct way to avoid the warning is to redesign them in a way
    where you do not need to cast between conflicting types.  (Even if you
    often can make this warning go away by changing void** to void*...)

    POINTER CASTS AND ALIGNMENT
    ===========================

    The problem
    ===========
    Many architectures requires that pointers are correctly aligned when
    accessing objects bigger than a byte.  There are however many places
    in system code where you receive unaligned data (e.g. the network stacks)
    so you need to fix it up:

        char* data;
        struct foo_header *tmp, header;

        tmp = data + offset;
        memcpy(&header, tmp, sizeof(header));

        if (header.len < FOO)
        [...]

    But this does not work...  The reason is that the behavior is undefined
    when you assign an unaligned value to a pointer that points to a type
    that need to be aligned.  What happens in the example above is that gcc
    notices that tmp and header must be aligned, so it may use an inlined
    memcpy that uses instructions that assumes aligned data.

    The correct way to fix this is not to use the foo_header pointer

        char* data;
        struct foo_header header;

        memcpy(&header, data + offset, sizeof(header));

        if (header.len < FOO)
        [...]

    The original example above might look silly, but this has bitten us a
    couple of times already...

    What the standard says [*]
    ==========================
    The pointer alignment requirements are stated in clause 6.3.2.3
    (Pointers):

     7 A pointer to an object or incomplete type may be converted to a pointer
       to a different object or incomplete type. If the resulting pointer is
       not correctly aligned {footnote 57} for the pointed-to type, the
       behavior is undefined. Otherwise, when converted back again, the result
       shall compare equal to the original pointer. [...]

     {footnote 57} In general, the concept "correctly aligned" is transitive:
     if a pointer to type A is correctly aligned for a pointer to type B,
     which in turn is correctly aligned for a pointer to type C, then a
     pointer to type A is correctly aligned for a pointer to type C.

    CONCLUSION
    ==========
    ISO C is not your grandfather's C, and it is wrong to think of it as a
    high-level machine language...

    Pointer casts are evil (both explicit and implicit casts), and you
    should think twice before adding a pointer cast to the code...

    [*] The standard references are from ISO/IEC 9899:1999, but the older
    ANSI/ISO standard says essentially the same thing.

       /Krister
