
var emitter = Kefir.emitter();
emitter.log(); // log events to console (see log)
emitter.emit(1);
emitter.error('Oops!');
emitter.end();
