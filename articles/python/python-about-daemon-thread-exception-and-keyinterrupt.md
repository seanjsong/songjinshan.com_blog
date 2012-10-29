# Python: about daemon thread, Exception, and KeyInterrupt

This is a summary out of the documents I have read through about these related topics. I didn't take the time to dig in Python's source code, so some conclusions are just conjectures.

## Python daemon thread

The term `daemon thread` in Python documentation is very misleading. Actually it is nothing close to a daemon process. Setting a thread to be a daemon thread only has such an effect, as stated in `/usr/share/doc/python-doc/html/library/threading.html`, that "the entire Python program exits when no alive non-daemon threads are left". I figure daemon thread has nothing to do with the controlling terminal. Setting a thread to be a daemon thread won't detach it from the controlling terminal, as the terminal is associated with the process and there's no way to detach one thread of the process from the terminal without detaching other threads. Maybe when all the non-daemon threads exit, the remaining deamon threads will be killed by `pthread_cancel` or `pthread_kill`, hence the entire Python program exits. According to <http://joeshaw.org/2009/02/24/605/>, Python daemon thread is considered harmful. I go along with this point. It is dangerous to end a thread asynchronously because the thread may end in an unknown state, thus we must be cautious when involved with daemon thread.

## Why is KeyInterrupt Only Sent to the Main Thread

Another question is: why is `KeyInterrput` only sent to the main thread? In the default case for a Linux process, when Ctrl-C is pressed any thread should be able to receive `SIGINT`. Python must have manipulated some signal masks. The documentation `/usr/share/doc/python-doc/html/library/thread.html` says:

> Threads interact strangely with interrupts: the KeyboardInterrupt exception will be received by an arbitrary thread. (When the signal module is available, interrupts always go to the main thread.)

So I guess when `signal` module is imported (which is my case), all threads other than the main thread will block `SIGINT`. As a consequence, if the main thread exits or is aborted by any Exception, there will be no thread receiving KeyInterrupt and Ctrl-C will have no effect.

## An Unhandled Exception Only Aborts the Current Thread

I had assumed an unhandled exception would abort an entire multi-threaded Python process, but I was wrong. The documentation `/usr/share/doc/python-doc/html/library/thread.html` says:

> When the function terminates with an unhandled exception, a stack trace is printed and then the thread exits (but other threads continue to run).

Maybe there's no way to abort the whole process with unhandled exception. If I do want the whole process to be aborted, I should wrap each thread with a catch-all at the top level, and handle any exception by printing backtrace then calling `os._exit()`. Note it should be `os._exit()` rather than `sys.exit()`. The latter only throws an exception and aborts the current thread rather than the whole process.

This is a coarse but effective way to handle unexpected exception. An alternative could be like this: in the catch-all, end other threads synchronously i.e. wait until other threads end cleanly then exit the whole process. This needs a lot of effort to implement and does not worth it. An unexpected exception implies a bug in the program. We should focus on fixing the bug rather than trying to keep the buggy program from crashing. As is always said, fail early, fail loudly.
