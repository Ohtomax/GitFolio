# Client performance

All seven page routes load with React.lazy and Suspense. Template artwork is a separate lazy module; preview cards mount it only when they approach the viewport. Skeletons reserve each card's aspect ratio during loading. The editor defers preview updates while typing, and query caches retain their existing owner isolation and freshness settings.

The Vite configuration loads the API's root environment only for the development proxy. Loading its `NODE_ENV=development` during a production build previously included React's development runtime. Production builds now use the production runtime while the local API keeps its own environment.

The uploaded logo originals remain in source. The UI and favicon use resized JPEG derivatives of the same artwork. The combined brand files are 16.6 kB, down from approximately 2.95 MB. No new artwork replaces the uploaded brand.

On November 18, 2026, the entry JavaScript decreased from 581.6 kB / 174.8 kB gzip to 354.2 kB / 107.6 kB gzip. These are local Vite build sizes, not a field-performance or Lighthouse score.

After a client build, run `npm run check:bundle`. It enforces 120 KiB gzip for entry JavaScript, 135 KiB for the complete sign-in JavaScript dependency graph, a 25 kB combined brand budget, lazy page entries, and exclusion of portfolio rendering from the sign-in dependency graph. The browser performance test additionally observes real requests to confirm that sign-in does not download the editor, template artwork, or portfolio fonts, and that artwork loads when the dashboard needs it.
