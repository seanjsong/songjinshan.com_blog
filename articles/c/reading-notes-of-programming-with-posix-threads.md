# Reading Notes of Programming with POSIX Threads

## Overview

![Book Cover](bookcover.jpg)

## Memory Visibility

> Consider, for example, a thread that writes new data to an element in an array, and then updates a `max_index` variable to indicate that the array element is valid. Now consider another thread, running simultaneously on another processor, that steps through the array performing some computation on each valid element. If the second thread "sees" the new value of `max_index` before it sees the new value of the array element, the computation would be incorrect. This may seem irrational, but memory systems that work this way can be substantially faster than memory systems that guarantee predictable ordering of memory accesses. A mutex is one general solution to this sort of problem. If each thread locks a mutex around the section of code that's using shared data, only one thread will be able to enter the section at a time.

This implies that the implementation of mutex contains a memory barrier. Later the book explains,

> A common misconception about memory barriers is that they "flush" values to main memory, thus ensuring that the values are visible to other processors. That is not the case, however. What memory barriers do is ensure an order between sets of operations. If each memory access is an item in a queue, you can think of memory barrier as a special queue token. Unlike other memory accesses, however, the memory controller cannot remove the barrier, or look past it, until it has completed all previous accesses.

> A mutex lock, for example, begins by locking the mutex, and completes by issuing a memory barrier. The result is that any memory accesses issued while the mutex is locked cannot complete before other threads can see that the mutex was locked. Similarly, a mutex unlock begins by issuing a memory barrier and completes by unlocking the mutex, ensuring that memory accesses issued while the mutex is locked cannot complete after other threads can see that the mutex is unlocked.

Besides mutex lock/unlock, many other thread operations also involve memory barrier:

> Pthreads provides a few basic rules about memory visibility. You can count on all implementations of the standard to follow these rules:

> 1. Whatever memory values a thread can see when it calls pthread_create can also be seen by the new thread when it starts. Any data written to memory after the call to pthread_create may not necessarily be seen by the new thread, even if the write occurs before the thread starts.

> 2. Whatever memory values a thread can see when it unlocks a mutex, either directly or by waiting on a condition variable, can also be seen by any thread that later locks the same mutex.

> 3. Whatever memory values a thread can see when it terminates, either by cancellation, returning from its start function, or by calling pthread_exit, can also be seen by the thread that joins with the terminated thread by calling pthread_join.

> 4. Whatever memory values a thread can see when it signals or broadcasts a condition variable can also be seen by any thread that is awakened by that signal or boadcast.

That means these synchronization operations all contain memory barriers. I understand the author tries to describe in a platform-independent way, but I think he should talk about memory barrier more explicitly.

## Atomicity

> Even without read/write ordering and memory barriers, it may seem that writes to a single memory address must be atomic, meaning that another thread will always see either the intact original value or the intact new value. But that's not always true, either. Most computers have a natural memory granularity, which depends on the organization of memory and the bus architecture. Even if the processor naturally reads and writes 8-bit units, memory transfers may occur in 32- or 64-bit "memory units".

The book then gives two examples which I'll brief here.

1. Memory conflict. Suppose natural memory width is 32-bit. The original 32-bit in memory is 00 01 02 03. Thread 1 intends to change byte 01 to 14, while at the same time thread 2 intends to change byte 02 to 25. But actually both threads write down the whole four bytes. The final result could be 00 14 02 03, or 00 01 25 03, but not 00 14 25 03. Therefore the write operation of one of the threads will fail. The predicate "another thread will always see either the intact original value or the intact new value" is not true, because it might never get the intended new value (which is 00 14 25 03 in this case).

2. Word tearing. Suppose natural memory width is 32-bit. The original 32-bit in memory is xx xx 00 01 02 03 xx xx. Thread 1 change the unaligned 32-bit 00 01 02 03 to 00 14 02 03, while at the same time thread 2 change this 32-bit to 00 01 25 03. Unaligned memory access might be split into multiple accesses. Suppose thread 2 first writes down xx xx 00 01 unchanged, then thread 1 write xx xx 00 14, then thread 1 write down 02 03 xx xx unchanged, then thread 2 write 25 03 xx xx - the final result will be xx xx 00 14 25 03 xx xx, this is not an intended new value (we intend to get either 00 01 02 03 or 00 01 25 03). I know unaligned memory access isn't permitted at all on some RISC architectures, so this example can probably happen on CISC architectures.

In one word, even when accessing a single variable, consider using mutex lock instead of assuming it's an atomic operation. But I still have one question left: if I avoid these edge cases, only accessing an aligned memory of natural width, can I guarantee atomicity?

## About the Unlocking Order of Mutex

> You are free to unloclk the mutexes in whatever order makes the most sense. Unlocking mutexes cannot result in deadlock. If you use a "try and back off" algorithm, however, you should always try to release the mutexes in reverse order. That is, if you lock mutex 1, mutex 2, and then mutex 3 you should unlock mutex 3, then mutex 2, and finally mutex 1. If you unlock mutex 1 and mutex 2 while mutex 3 is still locked, another thread may have to lock both mutex 1 and mutex 2 before finding it cannot lock the entire hierarchy, at which point it will have to unlock mutex 2 and mutex 1, and then retry. Unlocking in reverse order reduces the chance that another thread will need to back off.

This is a good advice. Although not complying to it will not cause a deadlock, complying to it, however, can improve performance.

## Reason the Timing of Condition Variable Operations

> It is important that you test the predicate after locking the appropriate mutex and before waiting on the condition variable. If a thread signals or broadcasts a condition variable while no threads are waiting, nothing happens. If some other thread calls `pthread_cond_wait` right after that, it will keep waiting regardless of the fact that the condition variable was just signaled, which means that if a thread waits when it doesn't have to, it may never wake up. Because the mutex remains locked until the thread is blocked on the condition variable, the predicate cannot become set between the predicate test and the wait - the mutex is locked and no other thread can change the shared data, including the predicate.

The pros and cons about whether to signal within mutex lock:

> Although you must have the associated mutex locked to wait on a condition variable, you can signal (or broadcast) a condition variable with the associated mutex unlocked if that is more convenient. The advantage of doing this is that, on many systems, this may be more efficient. When a waiting thread awakens, it must first lock the mutex. If the thread awakens while the signaling thread holds the mutex, then the awakened thread must immediately block on the mutex - you've gone through two context switches to get back where you started.

> * There is an optimization, which I've called "wait morphing", that move a thread directly from the condition variable wait queue to the mutex wait queue in this case, without a context switch, when the mutex is locked. This optimization can produce a substantial performance benefit for many applications.

> Weighing on the other side is the fact that, if the mutex is not locked, any thread (not only the one being awakened) can lock the mutex prior to the thread being awakened. This race is one source of intercepted wakeups. A lower-priority thread, for example, might lock the mutex while another thread was about to awaken a very high-priority thread, delaying scheduling of the high-priority thread. If the mutex remains locked while signaling, this cannot happen - the high-priority waiter will be placed before the lower-priority waiter on the mutex, and will be scheduled first.

Consider these two different signaling code (error handling code left out for brevity):

```c
pthread_mutex_lock(&mutex);
set_predicate();
pthread_mutex_unlock(&mutex);
pthread_cond_signal(&cond);
```

```c
pthread_mutex_lock(&mutex);
set_predicate();
pthread_cond_signal(&cond);
pthread_mutex_unlock(&mutex);
```

And how they affect this waiting code respectively:

```c
pthread_mutex_lock(&mutex);
while (!predicate())
    pthread_cond_wait(&cond, &mutex);
pthread_mutex_unlock(&mutex);
```

## Other Details about Condition Variable

> When a timed condition wait returns with the `ETIMEDOUT` error, you should test your predicate before treating the return as an error. If the condition for which you were waiting is true, the fact that it may have taken too long usually isn't important. Remember that a thread always relocks the mutex before returning from a condition wait, even when the wait times out. Waiting for a locked mutex after timeout can cause the timed wait to appear to have taken a lot longer than the time you requested.

The book suggests this structure:

```c
pthread_mutex_lock(&mutex);

while (!predicate()) {
    status = pthread_cond_timedwait(&cond, &mutex, &timeout);
    if (status == ETIMEDOUT) {
        indicate_time_out();
        break;
    } else if (status != 0)
        err_abort();
}

if (predicate)
    do_something_under_condition();

pthread_mutex_unlock(&mutex);
```

> To make use of a `PTHREAD_PROCESS_SHARED` condition variable, you must also use a `PTHREAD_PROCESS_SHARED` mutex. That's because two threads that synchronize using a condition variable must also use the same mutex.

## About Detach State

> All threads systems support the detachstate attribute. The value of this attribute can be either `PTHREAD_CREATE_JOINABLE` or `PTHREAD_CREATE_DETACHED`. By default, threads are created joinable, which means that the thread identification created by pthread_create can be used to join with the thread and retrieve its return value, or to cancel it. If you set the detachstate attribute to `PTHREAD_CREATE_DETACHED`, the identification of threads created using that attributes object can't be used. It also means that when the thread terminates, any resources it used can immediately be reclaimed by the system.

> When you create threads that you know you won't need to cancel, or join with, you should create them detached. Remember that, in many cases, even if you want to know when a thread terminates, or receive some return value from it, you may not need to use `pthread_join`. If you provide your own notification mechanism, for example, using condition variable, you can still create your threads detached.

Oh I need not call `pthread_create` first and then `pthread_detach`. I could have done that in one step. And detachstate not only determines whether a thread can be joined, but also determines whether it can be canceled.

## About `pthread_cancel`

`pthread_cancel` is always confusing and error-prone. I should check these notes every time I have to use it (best to avoid it at all).

> If you request that a thread be canceled while cancellation is disabled, the thread rememebers that it was canceled but won't do anything about it until after cancellation is enabled again. Because enabling cancellation isn't a cancellation point, you also need to test for a pending cancel request if you want a cancel processed immediately.

> When a thread may be canceled while it holds private resources, such as a locked mutex or heap storage that won't ever be freed by any other thread, those resources need to be released when the thread is canceled. If the thread has a mutex locked, it may also need to "repair" shared data to restore program invariants. Cleanup handlers provide the mechanism to accomplish the cleanup, somewhat like process atexit handlers. After acquiring a resource, and before any cancellation points, declare a cleanup handler by calling pthread_cleanup_push. Before releasing the resource, but after any cancellation points, remove the cleanup handler by calling pthread_cleanup_pop.

> If a section of code needs to restore some state when it is canceled, it must use cleanup handlers. When a thread is canceled while waiting for a condition vairable, it will wake up with the mutex locked. Before the thread terminates it usually needs to restore invariants, and it always needs to release the mutex.



<!--

> You should never destroy a key while some thread still has a value for that key. 在pthread_key_delete之后可能还会有线程pthread_key_create并reuse先前的pthread_key_t identifier，从而造成严重问题。可以为pthread_key_t identifier维护一个reference count，当减到0时才destroy the key. Even better, don't destroy thread-specific data keys. There's rarely any need to do so.

主线程用多次pthread_join等待N个线程结束也可以用reference count的方式代替，当reference count减到0时发一个signal通知主线程。

> Thread-specific data destructors can set a new value for the key for which a value is being destroyed or for any other key. You should never do this directly, but is can easily happen indirectly if you call other functions from your destructor. For example, the ANSI C library's destructors might be called before yours - and calling an ANSI C functio, for example, using fprintf to write a log message to a file, could cause a new value to be assigned to a thread-specific data key. The system must recheck the list of thread-specific data values for you after all destructors have been called.

> The standard requires that a Pthreads implementation may recheck the list some fixed number of times and then give up. When it gives up, the final thread-specific data value is not destroyed. The result may be a memory leak, so be careful.

> Thread-specific data destructors are called in "unspecified order".


> It has always been common wisdom that library code should not change signal actions - that this is exclusively the province of the main program. This philosophy becomes even more wise when you are programming with threads. Signal actions must always be under the control of a single component, at least, and to assign that responsibility to the main program makes the most sense in nearly all situations.

Thread 1 调sigaction设置handler1，保存old_handler，Thread 2调sigaction设置handler2，保存handler1，Thread 1恢复成old_handler，然后Thread 2恢复成handler1。所以在library中改handler不是个好主意，即使恢复也恢复不回来。

???APUE上用SIGALRM实现了sleep函数，在实际的多线程环境中是怎么实现的？


> Each thread has its own private signal mask, which is modified by calling pthread_sigmask. Pthreads does not specify what sigprocmask does within a threaded process - it may do nothing. Portable threaded code does not call sigprocmask. A thread can block or unblock signals without affecting the ability of other threads to handle the signal. When a thread is created, it inherits the signal mask of the thread that created it - if you want a signal to be masked everywhere, mask it first thing in main.

> With multiple threads, code calling raise is most likely to intend that the signal be sent to the calling thread, rather than to some arbitrary thread within the process. Pthreads specifies that raise(SIGABRT) is the same as pthread_kill(pthread_self(), SIGABRT).

> POSIX specifies a small set of functions that may be called safely from within signal-catching functions ("async-signal safe" functions), and fork is one of them. However, none of the POSIX threads functions is async-signal safe (and there are good reasons for this, because being async-signal safe generally makes a function substantially more expensive). 

> With the introduction of fork handlers, however, a call to fork is also a call to some set of fork handlers. The purpose of a fork handler is to allow threaded code to protect synchronization state and data invariants across a fork, and in most cases that requires locking mutexes. But you cannot lock mutexes from a signal-catching function. So while it is legal to call fork from within a signal-catching function, doing so may (beyond the control or knowledge of the caller) require performing other operations that cannot be performed within a signal-catching function.

...

> To awaken a thread from a POSIX signal-catching function, you need a mechanism that's reentrant with respect to POSIX signals (async-signal safe). POSIX provides relatively few of these functions, and none of the Pthreads functions is included. That's primarily because an async-signal safe mutex lock operation would be many times slower than one that isn't async-signal safe. Outside of the kernel, making a function async-signal safe usually requires that the function mask (block) signals while it runs - and that is expensive.

... sem_post是async-signal safe的函数，可以用来awaken a thread from a signal-catching function

??? 部分解释了为什么async-signal safe函数（即APUE上的reentrant函数）的实现是expensive的，但没看明白？

-->

