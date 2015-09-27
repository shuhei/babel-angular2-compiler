import { Duplex } from 'stream';
import browserify from 'browserify';
import tmp from 'tmp';

tmp.setGracefulCleanup();

// Temp file for a hack to browserify a stream instead of a file.
// An idea borrowed from https://github.com/eugeneware/browserify-string
const emptyPath = tmp.fileSync({ postfix: '.js' }).name;

export default function (readable, options = {}) {
  return browserify(options)
    .add(emptyPath)
    .transform(fromStream(readable));
}

function fromStream(readable) {
  return (file) => {
    return new Duplex({
      write(chunk, encoding, cb) {
        // noop
        cb();
      },
      read(n) {
        this.push(readable.read(n));
      }
    });
  };
}
