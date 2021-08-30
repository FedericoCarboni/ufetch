# Fetch Polyfill
This fetch polyfill tries to go as far back as possible, simple plain text
requests should work even on IE 5 (though there are no automated tests),
binary requests (with a few limitations*) work on IE8 and above.

A Promise polyfill is not included.

This polyfill is still *WIP*.

# Limitations & Known Issues
JavaScript limitations:
 - no getter/setter support in older environments means that some behavior cannot be properly replicated
 - there are no real classes because there is no proper way to emulate `NewTarget` in ES3

Hard coded maximum of 2GiB of data per request and response. On my machine after
~120MiB IE throws an `Out of memory` exception.
The response data cannot be handled in a streaming fashion.

Handling the response is still *very* slow, even if I tried to optimize it IE is still
incredibly slow. I wasn't able to test the performance reliably, because IE
seemed to be very inconsistent; processing the response data on my machine
averaged ~26MiB/s but it may vary significantly.

To properly implement the spec, UTF-8 has to be parsed by JavaScript, which
is another performance hit.

Resources:
 - https://web.archive.org/web/20071103070418/http://mgran.blogspot.com/2006/08/downloading-binary-streams-with.html
 - https://web.archive.org/web/20150411063302/http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
