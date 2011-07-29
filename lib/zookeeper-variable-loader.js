
/*!
 * zookeeper-variable-loader
 * Copyright(c) 2011 Applifier <opensource@applifier.com>
 * MIT Licensed
 */

/**
 * Library version.
 */

exports.version = '0.0.1';

var zooKeeper = null;
var ZK = require("zookeeper").ZooKeeper;

var path = "/variables";

var settings = {};
var watchers = {};

exports.getSettings = function() {
  return settings;
};

var init = exports.init = function(zoo, paths) {
  if (zoo == undefined) {
    throw new Error("You should give zookeeper client as parameter");
  }
  zooKeeper = zoo;
  initWatchers(path);
  if(paths) {
    if(paths.constructor == String) {
      initWatchers(paths);
    } else if(paths.constructor == Array) {
      paths.forEach(function(p){
        initWatchers(p);
      });
    }
  }
};

var initWatchers = exports.initWatchers = function(watchPath) {
  zooKeeper.aw_get_children(watchPath, function(){
      initWatchers(watchPath);
    },
    function(rc3, error3, children) {
    if (rc3 == 0) {
      for (var i = 0; i < children.length; i++) {
        var key = children[i];
        if(settings[key] == undefined) {
          initKey(watchPath, key);
        }
      }
    }
  });
};

var initKey = exports.initKey = function(watchPath, key) {
  if (zooKeeper == null) {
    throw new Error("You should init before using initKey");
  }
  zooKeeper.aw_get(watchPath + "/" + key,
    function (type, state, path) { // this is watcher
      initKey(watchPath, key);
    },
    function (rc, error, stat, value) {// this is response from aw_get
      if (rc == 0) {
        try {
          var data = JSON.parse(value);
          settings[key] = data;
          fireWatcher(key, data);
        } catch(e) {
          console.log(e);
        }
      }
    }
  );
};

var fireWatcher = exports.fireWatcher = function(key, data) {
  if (watchers[key] == undefined) {
    return;
  }
  for (var i = 0; i < watchers[key].length; i++) {
    var watcher = watchers[key][i];
    watcher(data);
  }
};

var getZooKeeper = exports.getZooKeeper = function() {
  return zooKeeper;
};

var addWatcher = exports.addWatcher = function(key, callback) {
  if (watchers[key] == undefined) {
    watchers[key] = [];
  }

  watchers[key].push(callback);
};

var removeWatcher = exports.removeWatcher = function(key, callback) {
  if (watchers[key] == undefined) {
    return false;
  }

  for (var i = 0; i < watchers[key].length; i++) {
    watcher = watchers[i];
    if (watcher == callback) {
      return true;
    }
  }

  return false;
};

var get = exports.get = function(key, defaultValue) {
  var value = settings[key];
  return value ? value : defaultValue;
};

var set = exports.set = function(key, value) {
  if (settings[key]) {
    zooKeeper.a_set(path + "/" + key, JSON.stringify(value), -1, function (rc, error, stat) {
    });
  } else {
    zooKeeper.a_create(path + "/" + key, JSON.stringify(value), ZK.ZOO_SEQUENCE | ZK.ZOO_EPHEMERAL, function (rc, error, path) {
    });
  }
};

