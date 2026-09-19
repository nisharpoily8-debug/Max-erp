/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "512e3d3d5e9f5142340fee6435a3ef9e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "af6457ed512c6fa4dcb69d9c2d5ae88d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "958a5a3f2f5731bae2fb4c459ec0eea4"
  }, {
    "url": "index.html",
    "revision": "139bb79206a93bd6f1ba218b5d666aa6"
  }, {
    "url": "icon.svg",
    "revision": "2a74b1ddd0fdcdff0f80f3886ddb69e9"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "4d4610601ffa2cb2a592dae458bd4eab"
  }, {
    "url": "assets/index-j-rXPGaN.js",
    "revision": null
  }, {
    "url": "assets/index-CLWjBDZk.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "4d4610601ffa2cb2a592dae458bd4eab"
  }, {
    "url": "icon.svg",
    "revision": "2a74b1ddd0fdcdff0f80f3886ddb69e9"
  }, {
    "url": "pwa-192x192.png",
    "revision": "958a5a3f2f5731bae2fb4c459ec0eea4"
  }, {
    "url": "pwa-512x512.png",
    "revision": "af6457ed512c6fa4dcb69d9c2d5ae88d"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "512e3d3d5e9f5142340fee6435a3ef9e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "9976ac7d41c6c175301150793983c7ca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
