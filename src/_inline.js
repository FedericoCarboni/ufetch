export var ERR_NO_NEW1 = 'Class constructor ';
export var ERR_NO_NEW2 = " cannot be invoked without 'new'";
export var ERR_OUT_OF_BOUNDS = ' is out of bounds, max ';
export var ERR_XHR_NOT_FOUND = 'XMLHttpRequest is not available';
export var ERR_BINARY_NOT_SUPPORTED = 'Binary support is disabled in this build';
export var ERR_BODY_USED = 'Body has already been consumed';
export var ERR_INVALID_STATUS = 'Response status is not in range 200-599';

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
export var MAX_INT_32 = Math.pow(2, 31) - 1;

export var BODY_BLOB = 0;
export var BODY_ARRAY_BUFFER = 1;
export var BODY_BYTESTRING = 2;
export var BODY_UTF8 = 3;

export var URL_SCHEME_START_STATE = 1;
export var URL_SCHEME_STATE = 2;
export var URL_NO_SCHEME_STATE = 3;
export var URL_SPECIAL_RELATIVE_OR_AUTHORITY_STATE = 4;
export var URL_PATH_OR_AUTHORITY_STATE = 5;
export var URL_RELATIVE_STATE = 6;
export var URL_RELATIVE_SLASH_STATE = 7;
export var URL_SPECIAL_AUTHORITY_SLASHES_STATE = 8;
export var URL_SPECIAL_AUTHORITY_IGNORE_SLASHES_STATE = 9;
export var URL_AUTHORITY_STATE = 10;
export var URL_HOST_STATE = 11;
export var URL_HOSTNAME_STATE = 12;
export var URL_PORT_STATE = 13;
export var URL_FILE_STATE = 14;
export var URL_FILE_SLASH_STATE = 15;
export var URL_FILE_HOST_STATE = 16;
export var URL_PATH_START_STATE = 17;
export var URL_PATH_STATE = 18;
export var URL_CANNOT_BE_A_BASE_URL_PATH_STATE = 19;
export var URL_QUERY_STATE = 20;
export var URL_FRAGMENT_STATE = 21;
export var URL_FLAGS_SPECIAL = 1 << 0;
export var URL_FLAGS_CANNOT_BE_A_BASE = 1 << 1;
