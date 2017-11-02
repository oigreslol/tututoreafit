connect-memcache
================

Connect sessions with memcached

Example usage:

    app.use(express.cookieParser())
    app.use(express.session(
      store: new memcacheStore(client: new memcache.Client(11211, '127.0.0.1'))
      secret: 'abc123'
      key: 'sid'
      cookie:
        maxAge: 9999999999
    ))
