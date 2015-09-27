import browserify from 'browserify';

import externals from './externals';

// Output libraries to stdout.
browserify()
  .require(externals)
  .bundle()
  .pipe(process.stdout);
