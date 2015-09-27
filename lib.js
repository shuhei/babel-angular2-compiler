import { createGzip } from 'zlib';
import browserify from 'browserify';
import uglifyify from 'uglifyify';

import externals from './externals';

// Output libraries to stdout.
browserify()
  .require(externals)
  .transform(uglifyify)
  .bundle()
  .pipe(createGzip())
  .pipe(process.stdout);
