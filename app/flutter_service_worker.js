'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "1c5912d36402cbdbd61fdc0745cdb055",
"assets/AssetManifest.bin.json": "4982ad0fdde2348a9faf0ca848a96028",
"assets/AssetManifest.json": "bc512d2c4dfdb93acaf883cddab0237a",
"assets/assets/bus_stations.json": "c69ea4d6bbbf19e291ae678dc356e28f",
"assets/assets/chomat_shmuel_polygon.json": "52febf9e39938fabd450ea0ac1b64619",
"assets/assets/icons/app_icon.jpg": "fba8f96529d118eafeaa4a38d60395c6",
"assets/assets/icons/app_icon.png": "49f506513a3c591bcd81aedecb7cace5",
"assets/assets/icons/app_logo.png": "be79a021774f5b390ed5b4b17df73ad4",
"assets/assets/icons/bayb48.png": "f3a3ee90b83476b040eb1f6837f02b63",
"assets/assets/icons/log.png": "f4f7dcf1b59590c6c246d19aa7c318a9",
"assets/assets/icons/open_app.png": "b9fab0e8a2d533ae63c029054b73e726",
"assets/assets/icons/open_app2.png": "82154db5d1b00a22bdc8eb43fab6e349",
"assets/assets/icons/stethoscope.svg": "a2b78a7027dd9e4561edfa29abe83f03",
"assets/assets/icons/tooth.svg": "ffda33cab9dd773447976077baa2c3fe",
"assets/assets/images/app_imag.png": "23a377ad1e239bb628e839d07572845b",
"assets/assets/images/app_image.png": "4523f8a2bcea7f38f2f7d3254c5bae23",
"assets/assets/images/edit.png": "e5b6f77c222775f7625d02ee4c76b47c",
"assets/assets/images/event.png": "b86c7d7dd952c4110d221b5053bed4fa",
"assets/assets/images/f.png": "e50b346c9da7c7a362af55be322c6e47",
"assets/assets/images/g_logo.png": "0f118259ce403274f407f5e982e681c3",
"assets/assets/images/home.png": "9be49a281893fb229f5ebb82950fd76a",
"assets/assets/images/lesson.png": "ec28079c3364ab31bceafb9367df9ae0",
"assets/assets/images/log.png": "3012eec2cf7b057e6922e832c9bea80d",
"assets/assets/images/log1.png": "f4f7dcf1b59590c6c246d19aa7c318a9",
"assets/assets/images/logout.png": "14e333c9bdde808b6c2f333c9d4eae19",
"assets/assets/images/open.png": "7b2ea2cd97ad72ee79733e9398c34387",
"assets/assets/images/prayer.png": "97099a24689e00363641d2ede6cecc5a",
"assets/assets/images/search.png": "b2b254fa69ea0eba8a197a8d81ec3a92",
"assets/assets/images/splash_logo.png": "f15abd638a99246c08fdaa12ac0bf301",
"assets/assets/images/waze_logo.png": "d8c114a205966349b29b144813a282fe",
"assets/assets/legal/app_terms.txt": "3438567ed7f43f6854c66628b7ad449b",
"assets/assets/legal/Privacy%2520policy.txt": "d26af18e58827e81df016820cb2f2d83",
"assets/assets/streets.json": "69630a9c348d61af993f71c3d72ac540",
"assets/FontManifest.json": "f7d690949106455fb4a760e5a39afb29",
"assets/fonts/Assistant-Bold.ttf": "07d4502c9dbbf0a37aed80a6e9b2379d",
"assets/fonts/Assistant-ExtraBold.ttf": "4863dd7d50726148a95059f352a622f2",
"assets/fonts/Assistant-Medium.ttf": "a68168ad5752c5ea1aa7aa34cff41511",
"assets/fonts/Assistant-Regular.ttf": "2ed4e0a6b226edc6bbe27c05efcb592d",
"assets/fonts/Assistant-SemiBold.ttf": "09642089fc1a88b46fbcceb46082ff90",
"assets/fonts/Comfortaa-Bold.ttf": "c58d668552f300091b90352ae749c897",
"assets/fonts/Comfortaa-Regular.ttf": "049bd15488cfff46b250247d3a9ff0fa",
"assets/fonts/Heebo-Bold.ttf": "8adf344f1fb76bc734ad04fd8b2319ad",
"assets/fonts/Heebo-ExtraBold.ttf": "98bb356b737b708c6e411cae14f93bda",
"assets/fonts/Heebo-Medium.ttf": "172ac844cd718bc0a7177d95278d393b",
"assets/fonts/Heebo-Regular.ttf": "14e1826669fc483e0a2e71f592302040",
"assets/fonts/Heebo-SemiBold.ttf": "fe4775e80d1830535102a4aff991265d",
"assets/fonts/MaterialIcons-Regular.otf": "97eb2a88b79614d3d3a7e25ef7adf632",
"assets/fonts/Rubik-Bold.ttf": "6f755d180caef859e79b956cbc98a115",
"assets/fonts/Rubik-ExtraBold.ttf": "857f003f083bdc2bfad69dbc61a8a883",
"assets/fonts/Rubik-Medium.ttf": "b50cf80a20b522e81d3191ccfc6fb109",
"assets/fonts/Rubik-Regular.ttf": "77e1892c02dc223f0f258e5038423318",
"assets/fonts/Rubik-SemiBold.ttf": "5f5e8cf22017b0d39ccc641fd11d8b8d",
"assets/NOTICES": "3153afae23088c14c8b53aebb81c87e6",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/packages/flutter_map/lib/assets/flutter_map_logo.png": "208d63cc917af9713fc9572bd5c09362",
"assets/packages/flutter_signin_button/assets/logos/2.0x/facebook_new.png": "dd8e500c6d946b0f7c24eb8b94b1ea8c",
"assets/packages/flutter_signin_button/assets/logos/2.0x/google_dark.png": "68d675bc88e8b2a9079fdfb632a974aa",
"assets/packages/flutter_signin_button/assets/logos/2.0x/google_light.png": "1f00e2bbc0c16b9e956bafeddebe7bf2",
"assets/packages/flutter_signin_button/assets/logos/3.0x/facebook_new.png": "689ce8e0056bb542425547325ce690ba",
"assets/packages/flutter_signin_button/assets/logos/3.0x/google_dark.png": "c75b35db06cb33eb7c52af696026d299",
"assets/packages/flutter_signin_button/assets/logos/3.0x/google_light.png": "3aeb09c8261211cfc16ac080a555c43c",
"assets/packages/flutter_signin_button/assets/logos/facebook_new.png": "93cb650d10a738a579b093556d4341be",
"assets/packages/flutter_signin_button/assets/logos/google_dark.png": "d18b748c2edbc5c4e3bc221a1ec64438",
"assets/packages/flutter_signin_button/assets/logos/google_light.png": "f71e2d0b0a2bc7d1d8ab757194a02cac",
"assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Brands-Regular-400.otf": "1fcba7a59e49001aa1b4409a25d425b0",
"assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Free-Regular-400.otf": "b2703f18eee8303425a5342dba6958db",
"assets/packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Free-Solid-900.otf": "5b8d20acec3e57711717f61417c1be44",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "140ccb7d34d0a55065fbd422b843add6",
"canvaskit/canvaskit.js.symbols": "58832fbed59e00d2190aa295c4d70360",
"canvaskit/canvaskit.wasm": "07b9f5853202304d3b0749d9306573cc",
"canvaskit/chromium/canvaskit.js": "5e27aae346eee469027c80af0751d53d",
"canvaskit/chromium/canvaskit.js.symbols": "193deaca1a1424049326d4a91ad1d88d",
"canvaskit/chromium/canvaskit.wasm": "24c77e750a7fa6d474198905249ff506",
"canvaskit/skwasm.js": "1ef3ea3a0fec4569e5d531da25f34095",
"canvaskit/skwasm.js.symbols": "0088242d10d7e7d6d2649d1fe1bda7c1",
"canvaskit/skwasm.wasm": "264db41426307cfc7fa44b95a7772109",
"canvaskit/skwasm_heavy.js": "413f5b2b2d9345f37de148e2544f584f",
"canvaskit/skwasm_heavy.js.symbols": "3c01ec03b5de6d62c34e17014d1decd3",
"canvaskit/skwasm_heavy.wasm": "8034ad26ba2485dab2fd49bdd786837b",
"favicon.png": "a41693dd6753567df21e84b58c77f336",
"flutter.js": "888483df48293866f9f41d3d9274a779",
"flutter_bootstrap.js": "a29da691d541405db148605f62c01542",
"icons/apple-touch-icon.png": "8442aff1e9033197aa02fcbf617acc3f",
"icons/Icon-192.png": "12b54e17c044dc435b780739edd2d86b",
"icons/Icon-512.png": "5c1229c85805c634eb1e5ee816c1f58c",
"icons/Icon-maskable-192.png": "24d77d5877e2c0071b95fa8fa80254d5",
"icons/Icon-maskable-512.png": "ac8b470926546f8bb23c38074f566bb7",
"index.html": "0c93cd4f1a2befa188fa1e162c00ede0",
"/": "0c93cd4f1a2befa188fa1e162c00ede0",
"main.dart.js": "61916a089188cdebaba07c8541c5d861",
"manifest.json": "7e6ce7970553374452d5322a6ff20f4a",
"version.json": "5ba4780edd65acd459a20804a95baa83"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
