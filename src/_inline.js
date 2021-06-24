export var ERR_NO_NEW1 = 'Class constructor ';
export var ERR_NO_NEW2 = " cannot be invoked without 'new'";
export var ERR_OUT_OF_BOUNDS = ' is out of bounds, max ';
export var ERR_XHR_NOT_FOUND = 'XMLHttpRequest is not available';
export var ERR_BINARY_NOT_SUPPORTED = 'Binary support is disabled in this build';

export var ERR_FAILED_TO_FETCH = 'Failed to fetch';

export var XHR_UNSENT = 0;
export var XHR_OPENED = 1;
export var XHR_HEADERS_RECEIVED = 2;
export var XHR_LOADING = 3;
export var XHR_DONE = 4;

export var HEADERS_STATE_NAME = 0;
export var HEADERS_STATE_VALUE = 1;

export var UNICODE_REPLACEMENT = 0xfffd;
export var MAX_CALL_STACK_POWER = 14;
export var MAX_CALL_STACK_SIZE = Math.pow(2, MAX_CALL_STACK_POWER);
export var MAX_UINT_32 = Math.pow(2, 32) - 1;

export var BODY_INTERNAL = 1 << 0;
export var BODY_BLOB = 1 << 1;
export var BODY_ARRAY_BUFFER = 1 << 2;
export var BODY_STRING = 1 << 3;
export var BODY_BYTESTRING = 1 << 4;
export var BODY_OTHER = 1 << 5;
