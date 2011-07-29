var settings = require('../lib/zookeeper-variable-loader');

var ZK = require ("zookeeper").ZooKeeper;
var zk = new ZK();
zk.init ({connect:"localhost:2181", timeout:200000, debug_level:ZK.ZOO_LOG_LEVEL_WARNING, host_order_deterministic:false});
zk.on (ZK.on_connected, function (zkk) {
    settings.init(zkk);

    settings.addWatcher('key', function(data){
      console.log(data);
    });
    var count = 0;
    setInterval(function(){
      settings.set('key', {c : ++settings.get('key', 0).c});
    }, 1000);
});