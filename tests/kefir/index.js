
import {ACTIVE, DEACTIVE} from '../consts'

export default [
  {
    title: 'invoke',
    it(Kefir) {
      var source = Kefir.sequentially(100, [
        {foo: function(){return 1}},
        {foo: function(){return 2}},
        {foo: function(){return 3}}
      ]);
      var result = source.invoke('foo');
      result.log();
    },
  },
  {
    title: 'pluck',
    it(Kefir) {
      var source = Kefir.sequentially(100, [{num: 1}, {num: 2}, {num: 3}]);
      var result = source.pluck('num');
      result.log();
    },
  },
  {
    title: 'mapTo',
    it(Kefir) {
      var source = Kefir.sequentially(100, [1, 2, 3]);
      var result = source.mapTo(5);
      result.log();
    },
  },
  {
    title: 'fromPromise',
    it(Kefir) {
      var myPromise = {
        then: function(onSuccess, onError) {
          var fulfill = function() {  onSuccess(1)  };
          setTimeout(fulfill, 100);
        }
      };

      var result = Kefir.fromPromise(myPromise);
      result.log();
    },
  },
  {
    title: 'constant',
    it(Kefir) {
      var property = Kefir.constant(1);
      property.log();
    },
  },
  {
    title: 'repeat',
    it(Kefir) {
      var result = Kefir.repeat(function(i) {
        if (i < 3) {
          return Kefir.sequentially(100, [i, i]);
        } else {
          return false;
        }
      });
      result.log();
    },
  },
  {
    title: 'fromBinder',
    it(Kefir) {
      var stream = Kefir.fromBinder(function(emitter) {
        console.log('!activation');
        var i = 0;
        var intervalId = setInterval(function() {
          emitter.emit(++i);
        }, 100);
        return function() {
          console.log('!deactivation');
          clearInterval(intervalId);
        }
      });
      stream.log();
      setTimeout(function() {
        stream.offLog(); // turn off logging to deactivate stream
      }, 350);
    },
  },
  {
    title: 'fromNodeCallback',
    it(Kefir) {
      var stream = Kefir.fromNodeCallback(function(callback) {
        // we use setTimeout here just to simulate some asynchronous activity
        setTimeout(function() {  callback(null, 1)  }, 100);
      });
      stream.log();
    },
  },
  {
    title: 'fromCallback',
    it(Kefir) {
      var stream = Kefir.fromCallback(function(callback) {
        // we use setTimeout here just to simulate some asynchronous activity
        setTimeout(function() {  callback(1)  }, 100);
      });
      stream.log();
    },
  },
  {
    title: 'sequentially',
    it(Kefir) {
      var stream = Kefir.sequentially(100, [1, 2, 3]);
      stream.log();
    },
  },
  {
    title: 'interval',
    it(Kefir) {
      var stream = Kefir.interval(100, 1);
      stream.log();
    },
  },
  {
    title: 'later',
    it(Kefir) {
      var stream = Kefir.later(100, 1);
      stream.log();
    },
  },
  {
    title: 'never',
    it(Kefir) {
      var stream = Kefir.never();
      stream.log();
    }
  },

  {
    title: 'emitter',
    it(Kefir) {
      var emitter = Kefir.emitter();
      emitter.log(); // log events to console (see log)
      emitter.emit(1);
      emitter.error('Oops!');
      emitter.end();
    },
  },

  {
    title: 'repeatedly',
    touches: [],
    it(Kefir) {
      var stream = Kefir.repeatedly(100, [1, 2, 3]).setName('stream');
      stream.log();
    },
    streams: {
      stream: {
        values: [ACTIVE,1,2,3,1,2,3,1,2,3,1,DEACTIVE],
      },
    }
  },

  {
    title: 'Map',
    touches: ['sequentially', 'map'],
    it(Kefir) {
      var source = Kefir.sequentially(100, [1, 2, 3]).setName('source');
      source._name = 'source'
      var result = source.map(function(x) {  return x + 1  });
      result._name = 'result'
      result.log();
    },
    streams: {
      source: {
        values: [ACTIVE,1,2,3,DEACTIVE],
      },
      result: {
        values: [ACTIVE,2,3,4,DEACTIVE],
      },
    },
  },

  {
    title: 'fromPoll',
    it(Kefir) {
      var start = new Date();
      var stream = Kefir.fromPoll(100, function(){ return new Date() - start });
      stream.log();
    },
  },

  {
    title: 'withInterval',
    it(Kefir) {
      var start = new Date();
      var stream = Kefir.withInterval(100, function(emitter) {
        var time = new Date() - start;
        if (time < 4000) {
          emitter.emit(time);   // emit a value
        } else {
          emitter.end();        // end the stream
        }
      });
      stream.log();
    },
  },

]

