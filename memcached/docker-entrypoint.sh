#!/bin/sh
echo "Executing 'memcached $@' ..."
exec memcached -I "${TAXII_CACHE_MAX_ITEM_SIZE}" -m "${TAXII_CACHE_MEM_SIZE}"