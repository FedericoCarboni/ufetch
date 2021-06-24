# Limitations
Hard coded maximum of 2GiB of data per request and response. On my machine after
~120MiB IE throws an `Out of memory` exception.
The response data cannot be handled in a streaming fashion

Resources:
 - https://web.archive.org/web/20071103070418/http://mgran.blogspot.com/2006/08/downloading-binary-streams-with.html
 - https://web.archive.org/web/20150411063302/http://miskun.com/javascript/internet-explorer-and-binary-files-data-access/
