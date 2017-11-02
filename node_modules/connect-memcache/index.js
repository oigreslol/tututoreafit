/*!
 * connect-memcache
 * Based on plugin by TJ Holowaychuk <tj@vision-media.ca>,
 * copied w/o much success by Michał Thoma <michal@balor.pl>
 * Fixed by Max Degterev @suprMax <me@maxdegterev.name>
 * BSD Licensed
 */

var extend = function(result, source) {
  if (typeof result !== 'object' || typeof source !== 'object') return result;

  for (var key in source) {
    if (source.hasOwnProperty(key)) result[key] = source[key];
  }

  return result;
};
var noop = function() {};

var defaults = {
  host: '127.0.0.1',
  port: '11211',
  prefix: 'sess:',
  ttl: 60 * 60 * 24 * 29
};

/**
 * Module dependencies.
 */

var memcache = require('memcache');

/**
 * Return the `MemcacheStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */

module.exports = function(connect) {

  /**
   * Connect's Store.
   */

  var Store = connect.session.Store;

  /**
   * Initialize MemcacheStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  var MemcacheStore = function(options) {
    Store.call(this, options);
    options = extend(options || {}, defaults);

    this.prefix = options.prefix;
    this.ttl = options.ttl;
    this.client = options.client;

    if (!this.client) {
      this.client = new memcache.Client(options.port, options.host, options);
      this.client.connect();
    }
  };

  /**
   * Inherit from `Store`.
   */

  MemcacheStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  MemcacheStore.prototype.get = function(sid, fn) {
    var _this = this;
    sid = this.prefix + sid;

    this.client.get(sid, function(err, data) {
      if (err) return fn(err);
      if (!data) return fn();

      var sess;

      try {
        sess = JSON.parse(data + '');
      } catch (err) { fn(err); }

      if (sess && sess.__expires__ && sess.__expires__ > Date.now() + _this.ttl * 1000) {
        _this.client.set(sid, JSON.stringify(sess), noop, _this.ttl);
      }

      fn(null, sess);
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  MemcacheStore.prototype.set = function(sid, sess, fn) {
    sid = this.prefix + sid;
    try {
      var maxAge = sess.cookie.maxAge || sess.cookie.originalMaxAge;

      if (!sess.__expires__) sess.__expires__ = Date.now() + maxAge;
      sess = JSON.stringify(sess);

      this.client.set(sid, sess, function() {
        fn && fn.apply(this, arguments);
      }, this.ttl);
    } catch (err) { fn && fn(err); }
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */

  MemcacheStore.prototype.destroy = function(sid, fn) {
    sid = this.prefix + sid;
    this.client.delete(sid, fn);
  };

  return MemcacheStore;
};

/**
 * Library version.
 */

module.exports.version = '0.0.5';
